"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { arrayMove } from "@dnd-kit/sortable";
import { SortableTask } from "./team/SortableTask";
import { TaskDetailsModal } from "./team/TaskDetailsModal";
import { BulkActionToolbar } from "./team/BulkActionToolbar";
import { ListView } from "./team/ListView";
import { CalendarView } from "./team/CalendarView";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Loader2, Search, Filter, X } from "lucide-react";
import WorkspaceTaskService, {
  WorkspaceTask,
  WorkspaceView,
  ViewFilters,
} from "../../lib/utils/workspaceTaskService";
import WorkspaceService from "../../lib/utils/workspaceService";
import NotificationService from "../../lib/utils/notificationService";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Check,
  Calendar as CalendarIcon,
  Save,
  Trash2 as TrashIcon,
  ChevronDown,
  LayoutGrid,
  List,
  Keyboard,
} from "lucide-react";
import { isToday, isPast, isFuture, startOfToday } from "date-fns";
import {
  useKeyboardShortcuts,
  ShortcutHandler,
} from "../../hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelper } from "./KeyboardShortcutsHelper";
import { useRecentTasks } from "../../hooks/useRecentTasks";
import { RecentTasksDropdown } from "./RecentTasksDropdown";
import TaskTemplateCards from "./tasks/TaskTemplateCards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Library } from "lucide-react";

interface KanbanBoardProps {
  workspaceId: string;
}

const COLUMNS = [
  { id: "todo", label: "To Do", color: "bg-slate-400" },
  { id: "in-progress", label: "In Progress", color: "bg-blue-500" },
  { id: "review", label: "Review", color: "bg-yellow-500" },
  { id: "done", label: "Done", color: "bg-green-500" },
];

export function KanbanBoard({ workspaceId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<WorkspaceTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<WorkspaceTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [labelFilter, setLabelFilter] = useState<string[]>([]);
  const [dateStatusFilter, setDateStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all"); // NEW: Project filter
  const [savedViews, setSavedViews] = useState<WorkspaceView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [workspaceLabels, setWorkspaceLabels] = useState<any[]>([]);
  const [workspaceProjects, setWorkspaceProjects] = useState<any[]>([]); // NEW: Workspace projects
  const [boardView, setBoardView] = useState<"kanban" | "list" | "calendar">(
    "kanban",
  );
  const { recentTasks, addRecentTask } = useRecentTasks();
  const [showShortcutsHelper, setShowShortcutsHelper] = useState(false);
  const [members, setMembers] = useState<
    { id: string; full_name: string | null; email: string }[]
  >([]);

  // Task Template States
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [templates, setTemplates] = useState<WorkspaceTask[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    loadTasks();
    loadMembers();
    loadLabels();
    loadViews();
    loadProjects(); // NEW: Load workspace projects

    // Ensure WebSocket is connected for real-time updates
    NotificationService.connectWebSocket();

    // Real-time Kanban Sync
    const channelName = `workspace:${workspaceId}`;
    const handleSyncEvent = (event: any) => {
      console.log("Kanban Sync Event:", event);
      const { type, task, taskId: deletedTaskId } = event;

      if (type === "TASK_CREATED") {
        setTasks((prev) => {
          // Prevent duplicates if the user who created it also receives the event
          if (prev.some((t) => t.id === task.id)) return prev;
          return [task, ...prev];
        });
      } else if (type === "TASK_UPDATED") {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, ...task } : t)),
        );
      } else if (type === "TASK_DELETED") {
        setTasks((prev) => prev.filter((t) => t.id !== deletedTaskId));
      }
    };

    NotificationService.on(`channel:${channelName}`, handleSyncEvent);
    NotificationService.subscribeToChannels([channelName]);

    return () => {
      NotificationService.off(`channel:${channelName}`, handleSyncEvent);
      // We don't necessarily want to unsubscribe if other components use it,
      // but for now, it's safer.
      NotificationService.unsubscribeFromChannels([channelName]);
    };
  }, [workspaceId]);

  const loadLabels = async () => {
    try {
      const data = await WorkspaceTaskService.getWorkspaceLabels(workspaceId);
      setWorkspaceLabels(data);
    } catch (err) {
      console.error("Failed to load labels:", err);
    }
  };

  const loadViews = async () => {
    try {
      const data = await WorkspaceTaskService.getViews(workspaceId);
      setSavedViews(data);
    } catch (err) {
      console.error("Failed to load views:", err);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await WorkspaceTaskService.getTasks(workspaceId);
      setTasks(data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const data = await WorkspaceTaskService.getWorkspaceMembers(workspaceId);
      setMembers(data);
    } catch (err) {
      console.error("Failed to load workspace members:", err);
    }
  };

  const loadProjects = async () => {
    try {
      const workspace = await WorkspaceService.getWorkspace(workspaceId);
      setWorkspaceProjects((workspace as any).projects || []);
    } catch (err) {
      console.error("Failed to load workspace projects:", err);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;

      const matchesAssignee =
        assigneeFilter === "all" ||
        task.assignees.some((a) => a.user.id === assigneeFilter);

      const matchesLabels =
        labelFilter.length === 0 ||
        labelFilter.every((labelId) =>
          task.labels?.some((l) => l.id === labelId),
        );

      const matchesDateStatus = () => {
        if (dateStatusFilter === "all") return true;
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        const today = startOfToday();

        if (dateStatusFilter === "overdue") {
          return isPast(dueDate) && !isToday(dueDate) && task.status !== "done";
        }
        if (dateStatusFilter === "today") {
          return isToday(dueDate);
        }
        if (dateStatusFilter === "upcoming") {
          return isFuture(dueDate);
        }
        return true;
      };

      const matchesProject =
        projectFilter === "all" || task.project_id === projectFilter;

      return (
        matchesSearch &&
        matchesPriority &&
        matchesAssignee &&
        matchesLabels &&
        matchesDateStatus() &&
        matchesProject // NEW: Project filter
      );
    });
  }, [
    tasks,
    searchQuery,
    priorityFilter,
    assigneeFilter,
    labelFilter,
    dateStatusFilter,
    projectFilter, // NEW: Add to dependencies
  ]);

  const onDragStart = (event: any) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const onDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id;
    const overId = over.id;

    // Find the active task and the target (over) item
    const activeTaskData = tasks.find((t) => t.id === taskId);
    if (!activeTaskData) {
      setActiveTask(null);
      return;
    }

    // Check if dropped over a column or another task
    const overColumn = COLUMNS.find((c) => c.id === overId);
    const overTask = tasks.find((t) => t.id === overId);

    let newStatus = activeTaskData.status;
    let needsReorder = false;

    // Determine the new status
    if (overColumn) {
      newStatus = overColumn.id;
    } else if (overTask) {
      newStatus = overTask.status;
    }

    // Case 1: Moving to a different column
    if (newStatus !== activeTaskData.status) {
      // Update status locally
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus! } : t)),
      );

      // Update backend
      try {
        await WorkspaceTaskService.updateTask(taskId, { status: newStatus });
      } catch (err) {
        console.error("Failed to update task status:", err);
        loadTasks(); // Revert
      }
    }
    // Case 2: Reordering within the same column
    else if (overTask && taskId !== overId) {
      setTasks((prevTasks) => {
        // Get tasks in the same column
        const columnTasks = prevTasks.filter((t) => t.status === newStatus);
        const otherTasks = prevTasks.filter((t) => t.status !== newStatus);

        // Find indices
        const oldIndex = columnTasks.findIndex((t) => t.id === taskId);
        const newIndex = columnTasks.findIndex((t) => t.id === overId);

        if (oldIndex === -1 || newIndex === -1) return prevTasks;

        // Reorder using arrayMove
        const reorderedColumnTasks = arrayMove(columnTasks, oldIndex, newIndex);

        // Combine with other tasks
        return [...otherTasks, ...reorderedColumnTasks];
      });
    }

    setActiveTask(null);
  };

  const handleCreateTask = async () => {
    const title = prompt("Task Title:");
    if (!title) return;

    try {
      const newTask = await WorkspaceTaskService.createTask(workspaceId, {
        title,
        status: "todo",
      });
      setTasks((prev) => [newTask, ...prev]);
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await WorkspaceTaskService.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleSaveView = async () => {
    const name = prompt("Enter a name for this view:");
    if (!name) return;

    const filters: ViewFilters = {
      priority: priorityFilter,
      assigneeIds: assigneeFilter === "all" ? undefined : [assigneeFilter],
      labelIds: labelFilter,
      dateStatus: dateStatusFilter,
      searchQuery: searchQuery,
    };

    try {
      const newView = await WorkspaceTaskService.createView(
        workspaceId,
        name,
        filters,
      );
      setSavedViews((prev) => [...prev, newView]);
      setActiveViewId(newView.id);
    } catch (err) {
      console.error("Failed to save view:", err);
    }
  };

  // Keyboard Shortcuts
  const shortcuts: ShortcutHandler[] = [
    {
      key: "n",
      handler: () => handleCreateTask(),
      description: "Create new task",
      category: "Tasks",
    },
    {
      key: "?",
      handler: () => setShowShortcutsHelper(!showShortcutsHelper),
      description: "Show keyboard shortcuts",
      category: "Help",
    },
    {
      key: "Escape",
      handler: () => {
        setIsModalOpen(false);
        setShowShortcutsHelper(false);
      },
      description: "Close modals",
      category: "Navigation",
    },
    {
      key: "k",
      ctrlKey: true,
      handler: () => {
        const searchInput = document.querySelector(
          'input[placeholder*="Search"]',
        ) as HTMLInputElement;
        searchInput?.focus();
      },
      description: "Focus search",
      category: "Navigation",
    },
    {
      key: "b",
      handler: () => setBoardView("kanban"),
      description: "Switch to board view",
      category: "Views",
    },
    {
      key: "l",
      handler: () => setBoardView("list"),
      description: "Switch to list view",
      category: "Views",
    },
    {
      key: "c",
      handler: () => setBoardView("calendar"),
      description: "Switch to calendar view",
      category: "Views",
    },
  ];

  useKeyboardShortcuts(shortcuts, { enabled: true });

  const handleApplyView = (view: WorkspaceView) => {
    const f = view.filters;
    setPriorityFilter(f.priority || "all");
    setAssigneeFilter(f.assigneeIds?.[0] || "all");
    setLabelFilter(f.labelIds || []);
    setDateStatusFilter(f.dateStatus || "all");
    setSearchQuery(f.searchQuery || "");
    setActiveViewId(view.id);
  };

  const handleDeleteView = async (id: string) => {
    try {
      await WorkspaceTaskService.deleteView(workspaceId, id);
      setSavedViews((prev) => prev.filter((v) => v.id !== id));
      if (activeViewId === id) setActiveViewId(null);
    } catch (err) {
      console.error("Failed to delete view:", err);
    }
  };

  const handleTaskClick = (task: WorkspaceTask) => {
    setSelectedTask(task);
    setIsModalOpen(true);
    addRecentTask(task); // Track in history
  };

  const handleRecentTaskSelect = async (taskId: string) => {
    // Check if task is already in current list
    const existingTask = tasks.find((t) => t.id === taskId);
    if (existingTask) {
      handleTaskClick(existingTask);
      return;
    }

    // If not, fetch it
    try {
      const task = await WorkspaceTaskService.getTask(taskId);
      handleTaskClick(task);
    } catch (error) {
      console.error("Failed to load recent task", error);
      // Maybe remove from history if not found?
    }
  };

  const handleToggleSelection = (id: string, selected: boolean) => {
    setSelectedTaskIds((prev) =>
      selected ? [...prev, id] : prev.filter((taskId) => taskId !== id),
    );
  };

  const handleOpenLibrary = async () => {
    setIsLibraryOpen(true);
    setTemplatesLoading(true);
    try {
      const data = await WorkspaceTaskService.getTemplates(workspaceId);
      setTemplates(data);
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleCreateFromTemplate = async (template: any) => {
    try {
      const newTask = await WorkspaceTaskService.createFromTemplate(
        template.id,
      );
      setTasks((prev) => [newTask, ...prev]);
      setIsLibraryOpen(false);
      NotificationService.broadcast(`workspace:${workspaceId}`, {
        type: "TASK_CREATED",
        task: newTask,
      });
    } catch (err) {
      console.error("Failed to create task from template:", err);
    }
  };

  const handleBulkMove = async (status: string) => {
    if (selectedTaskIds.length === 0) return;

    // Update locally for instant feedback
    setTasks((prev) =>
      prev.map((t) => (selectedTaskIds.includes(t.id) ? { ...t, status } : t)),
    );

    try {
      await WorkspaceTaskService.bulkUpdateTasks(workspaceId, selectedTaskIds, {
        status,
      });
      setSelectedTaskIds([]);
    } catch (err) {
      console.error("Failed to bulk move tasks:", err);
      loadTasks(); // Revert
    }
  };

  const handleBulkUpdatePriority = async (priority: string) => {
    if (selectedTaskIds.length === 0) return;

    // Update locally
    setTasks((prev) =>
      prev.map((t) =>
        selectedTaskIds.includes(t.id)
          ? { ...t, priority: priority as any }
          : t,
      ),
    );

    try {
      await WorkspaceTaskService.bulkUpdateTasks(workspaceId, selectedTaskIds, {
        priority,
      });
      setSelectedTaskIds([]);
    } catch (err) {
      console.error("Failed to bulk update priority:", err);
      loadTasks(); // Revert
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedTaskIds.length} tasks?`,
      )
    )
      return;

    // Update locally
    setTasks((prev) => prev.filter((t) => !selectedTaskIds.includes(t.id)));

    try {
      await WorkspaceTaskService.bulkDeleteTasks(workspaceId, selectedTaskIds);
      setSelectedTaskIds([]);
    } catch (err) {
      console.error("Failed to bulk delete tasks:", err);
      loadTasks(); // Revert
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-muted p-1 rounded-xl border border-border shadow-sm">
            <Button
              variant={boardView === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setBoardView("kanban")}
              className={`h-8 px-3 rounded-lg transition-all font-outfit ${
                boardView === "kanban"
                  ? "bg-background text-teal-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              <LayoutGrid className="w-4 h-4 mr-2" />
              Kanban
            </Button>
            <Button
              variant={boardView === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setBoardView("list")}
              className={`h-8 px-3 rounded-lg transition-all font-outfit ${
                boardView === "list"
                  ? "bg-background text-teal-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
            <Button
              variant={boardView === "calendar" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setBoardView("calendar")}
              className={`h-8 px-3 rounded-lg transition-all font-outfit ${
                boardView === "calendar"
                  ? "bg-background text-teal-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendar
            </Button>
          </div>
          <div className="h-6 w-px bg-border mx-2" />
          <h3 className="text-lg font-semibold text-foreground font-outfit">
            Tasks
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <RecentTasksDropdown
            recentTasks={recentTasks}
            onSelectTask={handleRecentTaskSelect}
          />

          <Button
            size="sm"
            onClick={handleCreateTask}
            className="h-10 px-4 bg-teal-500 text-white hover:bg-teal-600 shadow-md transition-all font-outfit">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenLibrary}
            className="h-10 px-4 border-teal-500/20 text-teal-600 hover:bg-teal-50 shadow-sm transition-all font-outfit">
            <Library className="w-4 h-4 mr-2" />
            From Template
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcutsHelper(true)}
            className="h-10 px-3 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            title="Keyboard Shortcuts (Shift + /)">
            <Keyboard className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 border-border bg-background/50 backdrop-blur-sm shadow-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500 transition-all font-outfit"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Saved Views Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 border-border bg-background shadow-sm flex items-center gap-2 font-outfit text-foreground hover:bg-muted">
                <Save className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Views</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[200px] p-0 bg-popover/50 backdrop-blur-sm shadow-sm border-border"
              align="end">
              <Command>
                <CommandInput
                  placeholder="Search views..."
                  className="font-outfit"
                />
                <CommandList>
                  <CommandEmpty>No views found.</CommandEmpty>
                  <CommandGroup heading="Saved Views">
                    {savedViews.map((view) => (
                      <CommandItem
                        key={view.id}
                        onSelect={() => handleApplyView(view)}
                        className="flex items-center justify-between font-outfit">
                        <span className="truncate">{view.name}</span>
                        {activeViewId === view.id && (
                          <Check className="w-3.5 h-3.5 text-teal-600" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteView(view.id);
                          }}>
                          <TrashIcon className="w-3 h-3" />
                        </Button>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleSaveView}
                      className="text-teal-600 font-medium font-outfit">
                      <Plus className="w-3.5 h-3.5 mr-2" />
                      Save Current View
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] h-10 border-border bg-background shadow-sm font-outfit">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <SelectValue placeholder="Priority" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-popover shadow-sm border-border font-outfit">
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
            </SelectContent>
          </Select>

          {/* Assignee Filter */}
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[150px] h-10 border-border bg-background shadow-sm font-outfit">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent className="bg-popover shadow-sm border-border font-outfit">
              <SelectItem value="all">All Assignees</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.full_name || member.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Project Filter */}
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[170px] h-10 border-border bg-background shadow-sm font-outfit">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <SelectValue placeholder="Project" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-popover shadow-sm border-border font-outfit max-h-[300px]">
              <SelectItem value="all">All Projects</SelectItem>
              {workspaceProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Labels Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 border-border bg-background shadow-sm flex items-center gap-2 font-outfit text-foreground hover:bg-muted">
                <Badge
                  variant="secondary"
                  className="h-4 w-4 p-0 rounded-full bg-muted">
                  {labelFilter.length}
                </Badge>
                Labels
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[200px] p-0 bg-popover/50 backdrop-blur-sm shadow-sm border-border"
              align="start">
              <Command>
                <CommandInput
                  placeholder="Search labels..."
                  className="font-outfit"
                />
                <CommandList>
                  <CommandEmpty>No labels found.</CommandEmpty>
                  <CommandGroup>
                    {workspaceLabels.map((label) => (
                      <CommandItem
                        key={label.id}
                        onSelect={() => {
                          setLabelFilter((prev) =>
                            prev.includes(label.id)
                              ? prev.filter((id) => id !== label.id)
                              : [...prev, label.id],
                          );
                        }}
                        className="flex items-center gap-2 font-outfit">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="flex-1 truncate">{label.name}</span>
                        {labelFilter.includes(label.id) && (
                          <Check className="w-3.5 h-3.5 text-teal-600" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Date Status Filter */}
          <Select value={dateStatusFilter} onValueChange={setDateStatusFilter}>
            <SelectTrigger className="w-[140px] h-10 border-border bg-background shadow-sm font-outfit">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <SelectValue placeholder="Due Date" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-popover shadow-sm border-border font-outfit">
              <SelectItem value="all">All dates</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="today">Due Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery ||
            priorityFilter !== "all" ||
            assigneeFilter !== "all" ||
            projectFilter !== "all" || // NEW: Include project filter
            labelFilter.length > 0 ||
            dateStatusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setPriorityFilter("all");
                setAssigneeFilter("all");
                setProjectFilter("all"); // NEW: Reset project filter
                setLabelFilter([]);
                setDateStatusFilter("all");
                setActiveViewId(null);
              }}
              className="h-10 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all font-outfit">
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {boardView === "kanban" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}>
          <div className="grid grid-cols-4 gap-4 min-h-[400px]">
            {COLUMNS.map((column) => (
              <div
                key={column.id}
                className="flex flex-col bg-muted/50 rounded-2xl border border-border/50 p-4 shadow-inner">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        column.id === "todo"
                          ? "bg-slate-400"
                          : column.id === "in-progress"
                            ? "bg-blue-500"
                            : column.id === "review"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                      }`}></div>
                    {column.label}
                  </h4>
                  <span className="text-[10px] font-bold bg-background text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                    {filteredTasks.filter((t) => t.status === column.id).length}
                  </span>
                </div>

                <div className="flex-1 space-y-3">
                  <SortableContext
                    items={filteredTasks
                      .filter((t) => t.status === column.id)
                      .map((t) => t.id)}
                    strategy={verticalListSortingStrategy}>
                    {filteredTasks
                      .filter((t) => t.status === column.id)
                      .map((task) => (
                        <SortableTask
                          key={task.id}
                          task={task}
                          onDelete={() => handleDeleteTask(task.id)}
                          onClick={handleTaskClick}
                          isSelected={selectedTaskIds.includes(task.id)}
                          onToggleSelection={handleToggleSelection}
                        />
                      ))}
                  </SortableContext>

                  {/* Invisible drop zone for empty columns */}
                  <div id={column.id} className="h-10 opacity-0" />
                </div>
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="bg-card p-4 rounded-xl border-2 border-primary shadow-2xl opacity-100 cursor-grabbing scale-105 transition-transform">
                <p className="text-sm font-bold text-foreground">
                  {activeTask.title}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {boardView === "list" && (
        <ListView
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          selectedTaskIds={selectedTaskIds}
          onToggleSelection={handleToggleSelection}
        />
      )}

      {boardView === "calendar" && (
        <CalendarView
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          selectedTaskIds={selectedTaskIds}
          onToggleSelection={handleToggleSelection}
        />
      )}

      {/* Keyboard Shortcuts Helper */}
      <KeyboardShortcutsHelper
        isOpen={showShortcutsHelper}
        onClose={() => setShowShortcutsHelper(false)}
        shortcuts={shortcuts}
      />

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onUpdate={(updatedTask) => {
          setTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
          );
          loadTasks();
        }}
        onDelete={handleDeleteTask}
        workspaceId={workspaceId}
      />

      <BulkActionToolbar
        selectedCount={selectedTaskIds.length}
        onClearSelection={() => setSelectedTaskIds([])}
        onMoveTasks={handleBulkMove}
        onUpdatePriority={handleBulkUpdatePriority}
        onDeleteTasks={handleBulkDelete}
      />

      {/* Task Template Library Modal */}
      <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Library className="w-6 h-6 text-teal-600" />
              Task Template Library
            </DialogTitle>
            <DialogDescription>
              Choose a blueprint to instantly instantiate a tasks with
              predefined subtasks and labels.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <TaskTemplateCards
              templates={templates as any}
              onSelect={handleCreateFromTemplate}
              isLoading={templatesLoading}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
