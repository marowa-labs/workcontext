"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Globe,
  Lock,
  Users,
  Building2,
  Star,
  Clock,
  FileText,
  Bot,
  Archive,
  Trash2,
  Copy,
  Edit3,
  ExternalLink,
  Plus,
} from "lucide-react";
import { useUser } from "../../../lib/utils/useUser";
import ProjectService from "../../../lib/utils/projectService";
import WorkspaceService from "../../../lib/utils/workspaceService";
import { useToast } from "../../../hooks/use-toast";

const TABS = [
  { id: "teamspaces", label: "Teamspaces", icon: Building2 },
  { id: "recents", label: "Recents", icon: Clock },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "shared", label: "Shared", icon: Users },
  { id: "private", label: "Private", icon: Lock },
  { id: "agents", label: "Agents", icon: Bot },
];

export default function SpacesLibraryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [spaces, setSpaces] = useState([]);
  const [activeTab, setActiveTab] = useState("teamspaces");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const dropdownRef = useRef(null);
  const [renamingSpace, setRenamingSpace] = useState(null);

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
      const duplicated = await ProjectService.createProject({
        title: `${space.title} (Copy)`,
        description: space.description,
        type: space.type || "document",
        content: space.content,
        citation_style: space.citation_style,
        workspace_id: space.workspace_id,
      });
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-8 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Your Spaces</h1>
        <p className="text-sm text-muted-foreground">
          Manage your teamspaces, projects, and private work in one place.
        </p>
      </div>

      <div className="px-8">

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-border">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab.id
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-background text-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-8">
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center px-4 py-3 bg-muted border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
              <p className="text-muted-foreground">Loading spaces...</p>
            </div>
          ) : filteredSpaces.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No spaces found</div>
          ) : (
            filteredSpaces.map((space) => (
              <div key={space.id}>
                {/* Main Row */}
                <div className="flex items-center px-4 py-3 hover:bg-muted/50 border-b border-border group">
                  {/* Expand/Collapse */}
                  <button
                    onClick={() => toggleRow(space.id)}
                    className="w-8 flex items-center justify-center"
                  >
                    {expandedRows.has(space.id) ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Name */}
                  <div
                    className="flex-1 flex items-center gap-2 cursor-pointer"
                    onClick={() => handleSpaceClick(space)}
                  >
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-foreground">
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
                          className="px-2 py-1 text-sm border border-blue-500 rounded outline-none bg-background text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        space.name || space.title
                      )}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="w-48 text-sm text-muted-foreground truncate">
                    {space.description || "—"}
                  </div>

                  {/* Access */}
                  <div className="w-32">
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Globe className="w-3 h-3" />
                      {space.access || "Default"}
                    </span>
                  </div>

                  {/* Members */}
                  <div className="w-24 text-sm text-muted-foreground">
                    {space.members || 1}
                  </div>
                </div>

                {/* Expanded Content - Sub-spaces */}
                {expandedRows.has(space.id) && space.children?.length > 0 && (
                  <div className="bg-muted/30">
                    {space.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center px-4 py-2 pl-12 hover:bg-muted/50 border-b border-border"
                      >
                        <div className="flex-1 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {child.title}
                          </span>
                        </div>
                        <div className="w-48 text-sm text-muted-foreground truncate">
                          {child.description || "—"}
                        </div>
                        <div className="w-32">
                          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                            <Globe className="w-3 h-3" />
                            {child.access || "Default"}
                          </span>
                        </div>
                        <div className="w-24 text-sm text-muted-foreground">
                          {child.members || 1}
                        </div>
                        <div className="w-10"></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
