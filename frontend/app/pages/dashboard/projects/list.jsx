"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Settings,
  Filter,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Globe,
  Lock,
  Users,
  Building2,
  Star,
  Clock,
  Folder,
  FileText,
  Bot,
  Archive,
  Trash2,
  Copy,
  Edit3,
  ExternalLink,
  Check,
  X,
} from "lucide-react";
import { useUser } from "../../../lib/utils/useUser";
import ProjectService from "../../../lib/utils/projectService";
import WorkspaceService from "../../../lib/utils/workspaceService";
import { useToast } from "../../../hooks/use-toast";
import BillingService from "../../../lib/utils/billingService";
import CreateProjectModal from "../../../components/dashboard/CreateProjectModal";

const TABS = [
  { id: "teamspaces", label: "Teamspaces", icon: Building2 },
  { id: "recents", label: "Recents", icon: Clock },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "shared", label: "Shared", icon: Users },
  { id: "private", label: "Private", icon: Lock },
  { id: "ai-meeting", label: "AI Meeting Notes", icon: Bot },
  { id: "agents", label: "Agents", icon: Bot },
];

export default function SpacesLibraryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [spaces, setSpaces] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeTab, setActiveTab] = useState("teamspaces");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const dropdownRef = useRef(null);
  const [renamingSpace, setRenamingSpace] = useState(null);
  const [newSpaceName, setNewSpaceName] = useState("");

  const { data: user, loading: userLoading } = useUser();

  // Load workspaces and their projects
  useEffect(() => {
    let isMounted = true;

    const loadWorkspaces = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // Fetch all workspaces
        const workspacesData = await WorkspaceService.getWorkspaces();
        const workspacesList = workspacesData?.data || workspacesData || [];

        // Fetch all projects to associate with workspaces
        const projectsData = await ProjectService.getUserProjects();
        const projectsList = projectsData?.data || projectsData || [];

        // Group projects by workspace
        const workspacesWithProjects = workspacesList.map((workspace) => {
          const workspaceProjects = projectsList.filter(
            (p) => p.workspace_id === workspace.id,
          );
          return {
            ...workspace,
            type: "teamspace",
            access: workspace.access || "Default",
            members: workspace.members?.length || 1,
            children: workspaceProjects.map((p) => ({
              ...p,
              type: "project",
              access: p.access || "Default",
              members: p.members || 1,
            })),
          };
        });

        // Add private workspace for projects without workspace_id
        const privateProjects = projectsList.filter((p) => !p.workspace_id);
        if (privateProjects.length > 0) {
          workspacesWithProjects.push({
            id: "private",
            name: "Private",
            description: "Your personal projects",
            type: "private",
            access: "Private",
            members: 1,
            children: privateProjects.map((p) => ({
              ...p,
              type: "project",
              access: "Private",
              members: 1,
            })),
          });
        }

        if (isMounted) {
          setSpaces(workspacesWithProjects);
        }
      } catch (err) {
        console.error("Error loading workspaces:", err);
        if (isMounted) {
          setError("Failed to load workspaces. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadWorkspaces();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleProjectCreate = async (newProject) => {
    try {
      console.log("New project created:", newProject);
      setSpaces((prev) => [newProject, ...prev]);
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
      return newProject;
    } catch (error) {
      console.error("Failed to create project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleProjectClick = (project) => {
    console.log("Opening project:", project.id);
    // Use React Router navigation instead of window.location
    router.push(`/editor/${project.id}`);
  };

  const handleRenameProject = (project) => {
    setRenamingSpace(project);
    setNewSpaceName(project.title);
  };

  const handleRenameConfirm = async () => {
    if (!renamingSpace || !newSpaceName.trim()) return;

    try {
      await ProjectService.updateProject(renamingSpace.id, {
        title: newSpaceName.trim(),
      });

      setSpaces((prev) =>
        prev.map((p) =>
          p.id === renamingSpace.id ? { ...p, title: newSpaceName.trim() } : p,
        ),
      );

      setRenamingSpace(null);
      setNewSpaceName("");

      toast({
        title: "Success",
        description: "Project renamed successfully!",
      });
    } catch (error) {
      console.error("Failed to rename project:", error);
      toast({
        title: "Error",
        description: "Failed to rename project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateProject = async (project) => {
    try {
      toast({
        title: "Duplicating Project",
        description: `Creating a copy of "${project.title}"...`,
      });

      const duplicateData = {
        ...project,
        title: `${project.title} (Copy)`,
        id: undefined, // Remove ID to create a new project
      };

      const duplicatedProject =
        await ProjectService.createProject(duplicateData);
      setSpaces((prev) => [duplicatedProject, ...prev]);

      toast({
        title: "Success",
        description: "Project duplicated successfully!",
      });
    } catch (error) {
      console.error("Failed to duplicate project:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportProject = async (project) => {
    try {
      toast({
        title: "Export Started",
        description: `Exporting "${project.title}"... This may take a moment.`,
      });

      // Use the real export service to get the blob
      const blob = await ExportService.exportProjectBlob(project.id, {
        format: "pdf",
      });

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: `Project "${project.title}" has been exported successfully.`,
      });
    } catch (error) {
      console.error("Failed to export project:", error);
      toast({
        title: "Export Failed",
        description: `Failed to export "${project.title}". Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleArchiveProject = async (project) => {
    try {
      if (
        window.confirm(
          `Are you sure you want to archive "${project.title}"? You can restore it later from the archived projects view.`,
        )
      ) {
        await ProjectService.updateProject(project.id, {
          status: "archived",
        });

        setSpaces((prev) => prev.filter((p) => p.id !== project.id));

        toast({
          title: "Success",
          description: "Project archived successfully!",
        });
      }
    } catch (error) {
      console.error("Failed to archive project:", error);
      toast({
        title: "Error",
        description: "Failed to archive project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreProject = async (project) => {
    try {
      if (
        window.confirm(
          `Are you sure you want to restore "${project.title}"? It will be moved back to your active projects.`,
        )
      ) {
        await ProjectService.restoreProject(project.id);
        // Remove the restored project from the list (since we are likely in Archived view)
        setSpaces((prev) => prev.filter((p) => p.id !== project.id));

        toast({
          title: "Success",
          description: "Project restored successfully!",
        });
      }
    } catch (error) {
      console.error("Failed to restore project:", error);
      toast({
        title: "Error",
        description: "Failed to restore project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (project) => {
    try {
      if (
        window.confirm(
          "Are you sure you want to delete this project? This action cannot be undone.",
        )
      ) {
        await ProjectService.deleteProject(project.id);
        setSpaces((prev) => prev.filter((p) => p.id !== project.id));

        toast({
          title: "Success",
          description: "Project deleted successfully!",
        });
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProjectAction = async (action, project) => {
    console.log(`Project ${action}:`, project.id);

    try {
      switch (action) {
        case "open":
          handleProjectClick(project);
          break;
        case "rename":
          handleRenameProject(project);
          break;
        case "duplicate":
          handleDuplicateProject(project);
          break;
        case "export":
          handleExportProject(project);
          break;
        case "archive":
          handleArchiveProject(project);
          break;
        case "restore":
          handleRestoreProject(project);
          break;
        case "delete":
          handleDeleteProject(project);
          break;
        default:
          console.log("Unknown action:", action);
      }
    } catch (error) {
      console.error(`Failed to perform action ${action}:`, error);
      // Check if it's a network error
      let errorMessage = "Failed to perform action. Please try again later.";
      if (error.message && error.message.includes("fetch")) {
        errorMessage =
          "Unable to connect to the server. Please make sure the backend API is running.";
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Close dropdown when clicking outside - MUST be before any conditional returns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (userLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  // Get filtered spaces based on tab
  const getFilteredSpaces = () => {
    let filtered = spaces;

    // Apply tab filter
    switch (activeTab) {
      case "teamspaces":
        filtered = spaces.filter((s) => s.type === "teamspace");
        break;
      case "private":
        filtered = spaces.filter(
          (s) => s.type === "private" || s.id === "private",
        );
        break;
      case "shared":
        filtered = spaces.filter((s) => s.type === "shared");
        break;
      case "recents":
        filtered = [...spaces]
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, 10);
        break;
      case "favorites":
        filtered = spaces.filter((s) => s.is_favorite);
        break;
      case "archived":
        filtered = spaces.filter((s) => s.status === "archived");
        break;
      default:
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.title?.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query),
      );
    }

    // Apply archived filter
    if (!includeArchived && activeTab !== "archived") {
      filtered = filtered.filter((s) => s.status !== "archived");
    }

    return filtered;
  };

  const filteredSpaces = getFilteredSpaces();

  // Toggle row expansion
  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Space actions
  const handleSpaceClick = (space) => {
    // If it's a workspace, toggle expansion instead of navigating
    if (space.type === "teamspace" || space.type === "private") {
      toggleRow(space.id);
      return;
    }
    // If it's a project, navigate to editor
    router.push(`/editor/${space.id}`);
  };

  const handleRenameSpace = (space) => {
    setRenamingSpace(space);
    setNewSpaceName(space.name || space.title);
    setDropdownOpen(null);
  };

  const handleRenameSpaceConfirm = async () => {
    if (!renamingSpace || !newSpaceName.trim()) return;
    try {
      // Check if it's a workspace (has name property) or project (has title property)
      const isWorkspace = renamingSpace.name !== undefined;
      const updateField = isWorkspace ? "name" : "title";

      if (isWorkspace) {
        await WorkspaceService.updateWorkspace(renamingSpace.id, {
          name: newSpaceName.trim(),
        });
      } else {
        await ProjectService.updateProject(renamingSpace.id, {
          title: newSpaceName.trim(),
        });
      }

      setSpaces((prev) =>
        prev.map((s) =>
          s.id === renamingSpace.id
            ? { ...s, [updateField]: newSpaceName.trim() }
            : s,
        ),
      );
      setRenamingSpace(null);
      setNewSpaceName("");
      toast({ title: "Success", description: "Space renamed successfully!" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename space.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateSpace = async (space) => {
    try {
      const duplicateData = {
        ...space,
        title: `${space.title} (Copy)`,
        id: undefined,
      };
      const duplicated = await ProjectService.createProject(duplicateData);
      setSpaces((prev) => [duplicated, ...prev]);
      toast({
        title: "Success",
        description: "Space duplicated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate space.",
        variant: "destructive",
      });
    }
    setDropdownOpen(null);
  };

  const handleArchiveSpace = async (space) => {
    if (window.confirm(`Archive "${space.title}"?`)) {
      try {
        await ProjectService.updateProject(space.id, { status: "archived" });
        setSpaces((prev) => prev.filter((s) => s.id !== space.id));
        toast({ title: "Success", description: "Space archived!" });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to archive space.",
          variant: "destructive",
        });
      }
    }
    setDropdownOpen(null);
  };

  const handleDeleteSpace = async (space) => {
    if (window.confirm(`Delete "${space.title}" permanently?`)) {
      try {
        await ProjectService.deleteProject(space.id);
        setSpaces((prev) => prev.filter((s) => s.id !== space.id));
        toast({ title: "Success", description: "Space deleted!" });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete space.",
          variant: "destructive",
        });
      }
    }
    setDropdownOpen(null);
  };

  const handleCreateSpace = async (newSpace) => {
    try {
      setSpaces((prev) => [newSpace, ...prev]);
      toast({
        title: "Success",
        description: "New space created successfully!",
      });
      return newSpace;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create space.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Library</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New teamspace
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? "text-gray-900 bg-gray-100"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="View settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettings && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                    View settings
                  </div>
                  <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeArchived}
                      onChange={(e) => setIncludeArchived(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Include archived pages
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-8">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="w-8"></div>
            <div className="flex-1">Name</div>
            <div className="w-48">Description</div>
            <div className="w-32">Access</div>
            <div className="w-24">Members</div>
            <div className="w-10"></div>
          </div>

          {/* Table Body */}
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading spaces...</p>
            </div>
          ) : filteredSpaces.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No spaces found</div>
          ) : (
            filteredSpaces.map((space) => (
              <div key={space.id}>
                {/* Main Row */}
                <div className="flex items-center px-4 py-3 hover:bg-gray-50 border-b border-gray-100 group">
                  {/* Expand/Collapse */}
                  <button
                    onClick={() => toggleRow(space.id)}
                    className="w-8 flex items-center justify-center"
                  >
                    {expandedRows.has(space.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {/* Name */}
                  <div
                    className="flex-1 flex items-center gap-2 cursor-pointer"
                    onClick={() => handleSpaceClick(space)}
                  >
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {renamingSpace?.id === space.id ? (
                        <input
                          type="text"
                          value={newSpaceName}
                          onChange={(e) => setNewSpaceName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameSpaceConfirm();
                            if (e.key === "Escape") setRenamingSpace(null);
                          }}
                          onBlur={handleRenameSpaceConfirm}
                          autoFocus
                          className="px-2 py-1 text-sm border border-blue-500 rounded outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        space.name || space.title
                      )}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="w-48 text-sm text-gray-500 truncate">
                    {space.description || "—"}
                  </div>

                  {/* Access */}
                  <div className="w-32">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                      <Globe className="w-3 h-3" />
                      {space.access || "Default"}
                    </span>
                  </div>

                  {/* Members */}
                  <div className="w-24 text-sm text-gray-600">
                    {space.members || 1}
                  </div>

                  {/* Actions */}
                  <div
                    className="w-10 relative"
                    ref={dropdownOpen === space.id ? dropdownRef : null}
                  >
                    <button
                      onClick={() =>
                        setDropdownOpen(
                          dropdownOpen === space.id ? null : space.id,
                        )
                      }
                      className="p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {dropdownOpen === space.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <button
                          onClick={() => handleSpaceClick(space)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open
                        </button>
                        <button
                          onClick={() => handleRenameSpace(space)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit3 className="w-4 h-4" />
                          Rename
                        </button>
                        <button
                          onClick={() => handleDuplicateSpace(space)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => handleArchiveSpace(space)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Archive className="w-4 h-4" />
                          Archive
                        </button>
                        <button
                          onClick={() => handleDeleteSpace(space)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Content - Sub-spaces */}
                {expandedRows.has(space.id) && space.children?.length > 0 && (
                  <div className="bg-gray-50/50">
                    {space.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center px-4 py-2 pl-12 hover:bg-gray-50 border-b border-gray-100"
                      >
                        <div className="flex-1 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {child.title}
                          </span>
                        </div>
                        <div className="w-48 text-sm text-gray-500 truncate">
                          {child.description || "—"}
                        </div>
                        <div className="w-32">
                          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                            <Globe className="w-3 h-3" />
                            {child.access || "Default"}
                          </span>
                        </div>
                        <div className="w-24 text-sm text-gray-600">
                          {child.members || 1}
                        </div>
                        <div className="w-10"></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new sub-space button */}
                {expandedRows.has(space.id) && (
                  <div className="flex items-center px-4 py-2 pl-12 bg-gray-50/30 border-b border-gray-100">
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add new
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreate={handleCreateSpace}
      />
    </div>
  );
}
