"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, Plus, X, Flag } from "lucide-react";
import { CalendarView } from "../../../../../components/dashboard/team/CalendarView";
import { WorkspaceTask } from "../../../../../lib/utils/workspaceTaskService";
import WorkspaceTaskService from "../../../../../lib/utils/workspaceTaskService";
import { format } from "date-fns";

const PRIORITY_COLORS: Record<string, string> = {
  high: "text-red-500",
  medium: "text-amber-500",
  low: "text-slate-400",
};

const STATUS_BADGE: Record<string, string> = {
  todo: "bg-slate-100 text-slate-600",
  "in-progress": "bg-blue-100 text-blue-700",
  "in-review": "bg-violet-100 text-violet-700",
  done: "bg-emerald-100 text-emerald-700",
};

export default function WorkspaceCalendarPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<WorkspaceTask | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Quick-add state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">(
    "medium",
  );
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!workspaceId) return;
      setIsLoading(true);
      try {
        const data = await WorkspaceTaskService.getTasks(workspaceId);
        setTasks(data);
      } catch (err) {
        console.error("Failed to load tasks:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [workspaceId]);

  const handleTaskClick = (task: WorkspaceTask) => {
    setSelectedTask(task);
  };

  const handleToggleSelection = (id: string, selected: boolean) => {
    setSelectedTaskIds((prev) =>
      selected ? [...prev, id] : prev.filter((x) => x !== id),
    );
  };

  const handleQuickAdd = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const created = await WorkspaceTaskService.createTask(workspaceId, {
        title: newTitle.trim(),
        status: "todo",
        priority: newPriority,
        due_date: newDueDate ? new Date(newDueDate).toISOString() : undefined,
      });
      setTasks((prev) => [...prev, created]);
      setNewTitle("");
      setNewDueDate(format(new Date(), "yyyy-MM-dd"));
      setNewPriority("medium");
      setShowQuickAdd(false);
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const updated = await WorkspaceTaskService.updateTask(taskId, {
        status: newStatus,
      });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: updated.status } : t,
        ),
      );
      setSelectedTask((prev) =>
        prev?.id === taskId ? { ...prev, status: updated.status } : prev,
      );
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  // Tasks with due dates
  const tasksWithDates = tasks.filter((t) => t.due_date);
  const tasksWithoutDates = tasks.filter((t) => !t.due_date);

  return (
    <div className="p-6 bg-background min-h-screen flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <CalendarDays className="w-7 h-7 text-violet-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 flex items-center gap-2">
              Calendar
            </h1>
            <p className="text-xs text-muted-foreground">
              {tasksWithDates.length} scheduled &bull;{" "}
              {tasksWithoutDates.length} unscheduled
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowQuickAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Quick Add Panel */}
      {showQuickAdd && (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-end gap-3 shadow-md animate-in slide-in-from-top-2">
          <div className="flex-1 min-w-48">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Task title
            </label>
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Due date
            </label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Priority
            </label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickAdd}
              disabled={!newTitle.trim() || isCreating}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {isCreating ? "Adding…" : "Add"}
            </button>
            <button
              onClick={() => setShowQuickAdd(false)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-6 flex-1">
        {/* Calendar — takes most space */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="bg-card border border-border rounded-2xl h-[600px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading tasks…</p>
              </div>
            </div>
          ) : (
            <CalendarView
              tasks={tasks}
              onTaskClick={handleTaskClick}
              selectedTaskIds={selectedTaskIds}
              onToggleSelection={handleToggleSelection}
            />
          )}
        </div>

        {/* Right Sidebar: Unscheduled tasks */}
        <div className="w-64 flex-shrink-0 space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">
                Unscheduled
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tasksWithoutDates.length} tasks without due dates
              </p>
            </div>
            <div className="p-2 max-h-96 overflow-y-auto space-y-1">
              {tasksWithoutDates.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  All tasks are scheduled 🎉
                </p>
              ) : (
                tasksWithoutDates.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors group">
                    <div className="flex items-start gap-2">
                      <Flag
                        className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                          PRIORITY_COLORS[task.priority] ?? "text-slate-400"
                        }`}
                      />
                      <span className="text-xs text-foreground truncate flex-1 group-hover:text-primary">
                        {task.title}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Drawer */}
      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={() => setSelectedTask(null)}>
          <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
          <div
            className="relative w-full max-w-md bg-background border-l border-border h-full overflow-y-auto shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-foreground leading-tight">
                {selectedTask.title}
              </h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Meta badges */}
            <div className="flex flex-wrap gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  STATUS_BADGE[selectedTask.status] ??
                  "bg-slate-100 text-slate-600"
                }`}>
                {selectedTask.status}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 bg-slate-50 ${PRIORITY_COLORS[selectedTask.priority]}`}>
                <Flag className="w-3 h-3" />
                {selectedTask.priority}
              </span>
              {selectedTask.due_date && (
                <span className="text-xs px-2 py-1 rounded-full bg-violet-50 text-violet-700 font-medium">
                  Due: {format(new Date(selectedTask.due_date), "MMM d, yyyy")}
                </span>
              )}
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Description
                </h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {selectedTask.description}
                </p>
              </div>
            )}

            {/* Status changer */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Change Status
              </h3>
              <div className="flex flex-wrap gap-2">
                {["todo", "in-progress", "in-review", "done"].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(selectedTask.id, s)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${
                      selectedTask.status === s
                        ? "ring-2 ring-primary border-primary"
                        : "border-border hover:border-primary/50"
                    } ${STATUS_BADGE[s] ?? ""}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignees */}
            {selectedTask.assignees?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Assignees
                </h3>
                <div className="space-y-1.5">
                  {selectedTask.assignees.map((a) => {
                    const u = a.user;
                    const initials = u.full_name
                      ? u.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : u.email[0].toUpperCase();
                    return (
                      <div key={u.id} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          {initials}
                        </div>
                        <span className="text-sm text-foreground">
                          {u.full_name ?? u.email}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subtasks */}
            {selectedTask.subtasks?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Subtasks (
                  {selectedTask.subtasks.filter((s) => s.is_done).length}/
                  {selectedTask.subtasks.length})
                </h3>
                <div className="space-y-1">
                  {selectedTask.subtasks.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-2 text-sm">
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          sub.is_done
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-slate-300"
                        }`}>
                        {sub.is_done && (
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            viewBox="0 0 10 10"
                            fill="none">
                            <path
                              d="M2 5l2.5 2.5L8 3"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className={
                          sub.is_done
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }>
                        {sub.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Created info */}
            <div className="text-xs text-muted-foreground pt-2 border-t border-border">
              Created by{" "}
              <span className="font-medium">
                {selectedTask.creator?.full_name ??
                  selectedTask.creator?.email ??
                  "Unknown"}
              </span>{" "}
              on {format(new Date(selectedTask.created_at), "MMM d, yyyy")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
