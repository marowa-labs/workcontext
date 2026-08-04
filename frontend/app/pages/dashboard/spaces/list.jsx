"use client";

import { useState, useEffect } from "react";
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
  UserPlus,
  HeartHandshake,
  BookOpen,
  Share2,
  Zap,
  FileText as FileTextIcon,
  GitBranch,
  PenTool,
  Plug,
  ExternalLink as ExternalLinkIcon,
  RefreshCw,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useUser } from "../../../lib/utils/useUser";
import ProjectService from "../../../lib/utils/projectService";
import workspaceService from "../../../lib/utils/workspaceService";
import { useToast } from "../../../hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../components/ui/dropdown-menu";

const ACCESS_LABELS = {
  public: { label: "Public", color: "text-green-600 bg-green-100" },
  internal: { label: "Internal", color: "text-blue-600 bg-blue-100" },
  restricted: { label: "Restricted", color: "text-amber-600 bg-amber-100" },
  "view only": { label: "View Only", color: "text-gray-600 bg-gray-100" },
  private: { label: "Private", color: "text-purple-600 bg-purple-100" },
};

const getAccessBadge = (access) => {
  const key = (access || "internal").toLowerCase();
  const config = ACCESS_LABELS[key] || ACCESS_LABELS.internal;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${config.color}`}>
      {key === "public" ? <Globe className="w-3 h-3" /> :
       key === "private" ? <Lock className="w-3 h-3" /> :
       key === "view only" ? <Lock className="w-3 h-3" /> :
       key === "restricted" ? <Lock className="w-3 h-3" /> :
       <Users className="w-3 h-3" />}
      {config.label}
    </span>
  );
};

const TABS = [
  { id: "teamspaces", label: "Teamspaces", icon: Building2 },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "recents", label: "Recents", icon: Clock },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "shared", label: "Shared", icon: Users },
  { id: "private", label: "Private", icon: Lock },
  { id: "agents", label: "Agents", icon: Bot },
];

const TOOL_ICONS = {
  slack: Zap,
  notion: FileTextIcon,
  jira: GitBranch,
  github: GitBranch,
  github_app: GitBranch,
  figma: PenTool,
};

const TOOL_COLORS = {
  slack: "text-purple-600",
  notion: "text-blue-600",
  jira: "text-blue-500",
  github: "text-gray-600",
  github_app: "text-gray-600",
  figma: "text-pink-500",
};

const TOOL_BG_COLORS = {
  slack: "bg-purple-100",
  notion: "bg-blue-100",
  jira: "bg-blue-50",
  github: "bg-gray-100",
  github_app: "bg-gray-100",
  figma: "bg-pink-100",
};

const AVATAR_COLORS = [
  "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-amber-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
];

function MemberAvatars({ members = 0, memberNames = [], onAdd }) {
  const displayCount = Math.min(members, 3);
  const remaining = members - displayCount;

  return (
    <div className="flex items-center -space-x-2 group">
      {Array.from({ length: displayCount }).map((_, i) => {
        const initials = memberNames[i]
          ? memberNames[i].split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
          : `${i + 1}`;
        const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
        return (
          <div
            key={i}
            className={`relative w-7 h-7 rounded-full ${color} flex items-center justify-center text-white text-xs font-medium ring-2 ring-background cursor-default`}
            title={memberNames[i] || `Member ${i + 1}`}
          >
            {initials}
          </div>
        );
      })}
      {remaining > 0 && (
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium ring-2 ring-background">
          +{remaining}
        </div>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onAdd?.(); }}
        className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors opacity-0 group-hover:opacity-100 ml-1"
        title="Add member"
      >
        <UserPlus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function SpacesLibraryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [spaces, setSpaces] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [integrationContent, setIntegrationContent] = useState({});
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [activeTab, setActiveTab] = useState("teamspaces");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [renamingSpace, setRenamingSpace] = useState(null);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "", type: "teamspace" });
  const [showMembersPopover, setShowMembersPopover] = useState(null);

  const { data: user, token, loading: userLoading } = useUser();

  useEffect(() => {
    let isMounted = true;
    const loadWorkspaces = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const workspacesData = await workspaceService.getWorkspaces();
        const workspacesList = workspacesData?.data || workspacesData || [];

        const projectsData = await ProjectService.getUserProjects();
        const projectsList = projectsData?.data || projectsData || [];

        const now = new Date();
        const workspacesWithProjects = workspacesList.map((workspace) => {
          const workspaceProjects = projectsList.filter(
            (p) => p.workspace_id === workspace.id,
          );
          return {
            ...workspace,
            type: "teamspace",
            access: workspace.access || "internal",
            members: workspace.members?.length || 1,
            memberNames: workspace.members?.map((m) => m.user?.full_name || m.user?.email || m.email || "") || [],
            updated_at: workspace.updated_at || workspace.created_at || now.toISOString(),
            is_favorite: workspace.is_favorite || false,
            children: workspaceProjects.map((p) => ({
              ...p,
              type: "project",
              access: p.access || "internal",
              members: p.members || 1,
              memberNames: [],
            })),
          };
        });

        const privateProjects = projectsList.filter((p) => !p.workspace_id);
        if (privateProjects.length > 0) {
          workspacesWithProjects.push({
            id: "private",
            name: "Private",
            description: "Your personal projects",
            type: "private",
            access: "private",
            members: 1,
            memberNames: [user?.email || "You"],
            updated_at: now.toISOString(),
            is_favorite: false,
            children: privateProjects.map((p) => ({
              ...p,
              type: "project",
              access: "private",
              members: 1,
              memberNames: [],
            })),
          });
        }

        if (isMounted) setSpaces(workspacesWithProjects);
      } catch (err) {
        console.error("Error loading workspaces:", err);
        if (isMounted) setError("Failed to load workspaces. Please try again.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadWorkspaces();

    // Fetch connected integrations
    const loadIntegrations = async () => {
      try {
        setLoadingIntegrations(true);
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/integrations`, { headers });
        if (res.ok) {
          const data = await res.json();
          setIntegrations(data.connections || []);
          
          // Fetch tree content for each connected tool
          for (const conn of (data.connections || [])) {
            try {
              const treeRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/integrations/tree?connection_id=${conn.id}`,
                { headers }
              );
              if (treeRes.ok) {
                const treeData = await treeRes.json();
                setIntegrationContent((prev) => ({ ...prev, [conn.id]: treeData.tree || [] }));
              }
            } catch (err) {
              console.error(`Error loading tree for ${conn.tool_type}:`, err);
            }
          }
        }
      } catch (err) {
        console.error("Error loading integrations:", err);
      } finally {
        setLoadingIntegrations(false);
      }
    };
    loadIntegrations();

    return () => { isMounted = false; };
  }, [user, token]);

  if (userLoading) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  const getFilteredSpaces = () => {
    let filtered = spaces;

    switch (activeTab) {
      case "teamspaces":
        filtered = spaces.filter((s) => s.type === "teamspace");
        break;
      case "private":
        filtered = spaces.filter((s) => s.type === "private" || s.id === "private");
        break;
      case "shared":
        filtered = spaces.filter((s) => s.type === "shared");
        break;
      case "integrations":
        return integrations;
      case "recents":
        filtered = [...spaces]
          .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
          .slice(0, 10);
        break;
      case "favorites":
        filtered = spaces.filter((s) => s.is_favorite);
        break;
      case "agents":
        filtered = [];
        break;
      default:
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.name || "").toLowerCase().includes(q) ||
          (s.title || "").toLowerCase().includes(q) ||
          (s.description || "").toLowerCase().includes(q),
      );
    }

    return filtered;
  };

  const filteredSpaces = getFilteredSpaces();

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSpaceClick = (space) => {
    if (space.type === "teamspace" || space.type === "private") {
      toggleRow(space.id);
      return;
    }
    router.push(`/editor/${space.id}`);
  };

  const handleRenameSpace = (space) => {
    setRenamingSpace(space);
    setNewSpaceName(space.name || space.title || "");
  };

  const handleRenameSpaceConfirm = async () => {
    if (!renamingSpace || !newSpaceName.trim()) return;
    try {
      const isWorkspace = renamingSpace.name !== undefined;
      if (isWorkspace) {
        await workspaceService.updateWorkspace(renamingSpace.id, {
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
            ? { ...s, [isWorkspace ? "name" : "title"]: newSpaceName.trim() }
            : s,
        ),
      );
      setRenamingSpace(null);
      setNewSpaceName("");
      toast({ title: "Success", description: "Space renamed successfully!" });
    } catch {
      toast({ title: "Error", description: "Failed to rename space.", variant: "destructive" });
    }
  };

  const handleDuplicateSpace = async (space) => {
    try {
      const duplicated = await ProjectService.createProject({
        title: `${space.title || space.name} (Copy)`,
        description: space.description,
        type: space.type || "document",
        content: space.content,
        citation_style: space.citation_style,
        workspace_id: space.workspace_id,
      });
      setSpaces((prev) => [duplicated, ...prev]);
      toast({ title: "Success", description: "Space duplicated successfully!" });
    } catch {
      toast({ title: "Error", description: "Failed to duplicate space.", variant: "destructive" });
    }
  };

  const handleToggleFavorite = async (space) => {
    const newFav = !space.is_favorite;
    setSpaces((prev) =>
      prev.map((s) =>
        s.id === space.id ? { ...s, is_favorite: newFav } : s,
      ),
    );
    toast({
      title: newFav ? "Added to favorites" : "Removed from favorites",
      description: `"${space.name || space.title}" has been ${newFav ? "added to" : "removed from"} your favorites.`,
    });
  };

  const handleArchiveSpace = async (space) => {
    if (window.confirm(`Archive "${space.title || space.name}"?`)) {
      try {
        await ProjectService.updateProject(space.id, { status: "archived" });
        setSpaces((prev) => prev.filter((s) => s.id !== space.id));
        toast({ title: "Success", description: "Space archived!" });
      } catch {
        toast({ title: "Error", description: "Failed to archive space.", variant: "destructive" });
      }
    }
  };

  const handleDeleteSpace = async (space) => {
    if (window.confirm(`Delete "${space.title || space.name}" permanently?`)) {
      try {
        await ProjectService.deleteProject(space.id);
        setSpaces((prev) => prev.filter((s) => s.id !== space.id));
        toast({ title: "Success", description: "Space deleted!" });
      } catch {
        toast({ title: "Error", description: "Failed to delete space.", variant: "destructive" });
      }
    }
  };

  const handleCreateSpace = async () => {
    if (!createForm.name.trim()) return;
    try {
      if (createForm.type === "teamspace") {
        const ws = await workspaceService.createWorkspace({
          name: createForm.name.trim(),
          description: createForm.description.trim(),
        });
        setSpaces((prev) => [{
          ...ws,
          type: "teamspace",
          access: "internal",
          members: 1,
          memberNames: [user?.email || "You"],
          updated_at: new Date().toISOString(),
          is_favorite: false,
          children: [],
        }, ...prev]);
      } else {
        const project = await ProjectService.createProject({
          title: createForm.name.trim(),
          description: createForm.description.trim(),
        });
        setSpaces((prev) => {
          const privateSpace = prev.find((s) => s.id === "private");
          if (privateSpace) {
            return prev.map((s) =>
              s.id === "private"
                ? { ...s, children: [{ ...project, type: "project", access: "private", members: 1, memberNames: [] }, ...s.children] }
                : s,
            );
          }
          return [{
            id: "private",
            name: "Private",
            description: "Your personal projects",
            type: "private",
            access: "private",
            members: 1,
            memberNames: [user?.email || "You"],
            updated_at: new Date().toISOString(),
            is_favorite: false,
            children: [{ ...project, type: "project", access: "private", members: 1, memberNames: [] }],
          }, ...prev];
        });
      }
      setShowCreateModal(false);
      setCreateForm({ name: "", description: "", type: "teamspace" });
      toast({ title: "Success", description: "Space created successfully!" });
    } catch {
      toast({ title: "Error", description: "Failed to create space.", variant: "destructive" });
    }
  };

  const handleSyncIntegration = async (conn) => {
    try {
      setSyncingId(conn.id);
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/integrations/${conn.id}/sync`,
        { method: 'POST', headers }
      );
      
      // Poll until sync completes
      let done = false;
      let attempts = 0;
      while (!done && attempts < 150) {
        await new Promise((r) => setTimeout(r, 2000));
        attempts++;
        try {
          const statusRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/integrations/${conn.id}/status`,
            { headers }
          );
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const log = statusData?.connection?.sync_logs?.[0];
            if (log && (log.status === "completed" || log.status === "failed")) {
              done = true;
            }
          }
        } catch { /* keep polling */ }
      }

      // Re-fetch tree after sync finishes
      const treeRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/integrations/tree?connection_id=${conn.id}`,
        { headers }
      );
      if (treeRes.ok) {
        const treeData = await treeRes.json();
        setIntegrationContent((prev) => ({ ...prev, [conn.id]: treeData.tree || [] }));
      }
      
      toast({ title: "Synced", description: `${conn.tool_type} content updated.` });
    } catch {
      toast({ title: "Error", description: "Failed to sync content.", variant: "destructive" });
    } finally {
      setSyncingId(null);
    }
  };

  const handleLinkToProjects = (space) => {
    router.push(`/projects?workspace=${space.id}`);
  };

  const handleSyncNotebook = (space) => {
    toast({
      title: "Notebook Sync",
      description: `Documents in "${space.name || space.title}" will sync with your Notebook.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-8 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Your Spaces</h1>
        <p className="text-sm text-muted-foreground">
          Manage your teamspaces, projects, and private work in one place.
        </p>
      </div>

      <div className="px-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-border overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tab.id === "agents" ? 0 : (() => {
              switch (tab.id) {
                case "teamspaces": return spaces.filter((s) => s.type === "teamspace").length;
                case "integrations": return integrations.length;
        case "recents": return spaces.length;
                case "favorites": return spaces.filter((s) => s.is_favorite).length;
                case "shared": return spaces.filter((s) => s.type === "shared").length;
                case "private": return spaces.filter((s) => s.type === "private" || s.id === "private").length;
                default: return 0;
              }
            })();
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-foreground bg-muted border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {count > 0 && (
                  <span className="text-xs bg-muted-foreground/10 text-muted-foreground px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={activeTab === "agents" ? "Search agents..." : "Search spaces by name or keyword..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-background text-foreground"
              />
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Space
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="px-8">
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="flex items-center px-4 py-3 bg-muted border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="w-8" />
            <div className="flex-1">Name</div>
            <div className="w-48 hidden md:block">Description</div>
            <div className="w-32">Access</div>
            <div className="w-32">Members</div>
            <div className="w-10" />
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading spaces...</p>
            </div>
          ) : activeTab === "agents" ? (
            <div className="p-12 text-center text-muted-foreground">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-base font-medium mb-1">AI Agents</p>
              <p className="text-sm">
                AI agents assigned to your workflows will appear here.
              </p>
            </div>
          ) : activeTab === "integrations" ? (
            <div>
              {loadingIntegrations ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading connected tools...</p>
                </div>
              ) : filteredSpaces.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Plug className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-base font-medium mb-1">No connected tools</p>
                  <p className="text-sm mb-4">Connect Slack, Notion, Jira, GitHub, or Figma to see their content here.</p>
                  <button
                    onClick={() => router.push("/settings/integrations")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plug className="w-4 h-4" />
                    Connect Tools
                  </button>
                </div>
              ) : (
                filteredSpaces.map((conn) => {
                  const ToolIcon = TOOL_ICONS[conn.tool_type] || Plug;
                  const toolColor = TOOL_COLORS[conn.tool_type] || "text-muted-foreground";
                  const toolBg = TOOL_BG_COLORS[conn.tool_type] || "bg-muted";
                  const content = integrationContent[conn.id] || [];
                  const contentCount = content.length;
                  const toolName = conn.tool_type?.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Tool";
                  
                  return (
                    <div key={conn.id}>
                      <div className="flex items-center px-4 py-3 hover:bg-muted/50 border-b border-border group">
                        <button
                          onClick={() => toggleRow(conn.id)}
                          className="w-8 flex items-center justify-center"
                        >
                          {expandedRows.has(conn.id) ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>

                        <div className="flex-1 flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg ${toolBg} flex items-center justify-center shrink-0`}>
                            <ToolIcon className={`w-4 h-4 ${toolColor}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{toolName}</span>
                              <span className="text-xs text-muted-foreground">
                                {contentCount} {contentCount === 1 ? "item" : "items"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {conn.status === "active" ? "Connected & syncing" : conn.status || "Connected"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSyncIntegration(conn); }}
                            disabled={syncingId === conn.id}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors disabled:opacity-50"
                            title="Sync content"
                          >
                            {syncingId === conn.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push("/settings/integrations"); }}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                            title="Manage"
                          >
                            <ExternalLinkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {expandedRows.has(conn.id) && (
                        <div className="bg-muted/30">
                          {content.length === 0 ? (
                            <div className="px-4 py-6 pl-16 text-sm text-muted-foreground">
                              No content synced yet. Click the sync button to fetch content.
                            </div>
                          ) : (
                            content.map((node) => (
                              <TreeNode
                                key={node.id}
                                node={node}
                                depth={1}
                                expandedRows={expandedRows}
                                toggleRow={toggleRow}
                                toolColor={toolColor}
                                toolBg={toolBg}
                                ToolIcon={ToolIcon}
                              />
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : filteredSpaces.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {searchQuery ? (
                <>
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-base font-medium mb-1">No results found</p>
                  <p className="text-sm">Try a different search term.</p>
                </>
              ) : (
                <>
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-base font-medium mb-1">No spaces yet</p>
                  <p className="text-sm mb-4">Create your first space to get started.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Space
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredSpaces.map((space) => (
              <div key={space.id}>
                <div className="flex items-center px-4 py-3 hover:bg-muted/50 border-b border-border group">
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
                    className="flex-1 flex items-center gap-2 cursor-pointer min-w-0"
                    onClick={() => handleSpaceClick(space)}
                  >
                    <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
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
                          className="px-2 py-1 text-sm border border-blue-500 rounded outline-none bg-background text-foreground w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-sm font-medium text-foreground hover:text-blue-600 transition-colors">
                          {space.name || space.title}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(space);
                      }}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          space.is_favorite
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground hover:text-amber-400"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Description */}
                  <div className="w-48 text-sm text-muted-foreground truncate hidden md:block">
                    {space.description || "—"}
                  </div>

                  {/* Access */}
                  <div className="w-32">{getAccessBadge(space.access)}</div>

                  {/* Members */}
                  <div className="w-32">
                    <MemberAvatars
                      members={space.members || 1}
                      memberNames={space.memberNames || []}
                      onAdd={() => toast({ title: "Invite", description: `Invite members to "${space.name || space.title}"` })}
                    />
                  </div>

                  {/* Contextual Actions */}
                  <div className="w-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => handleRenameSpace(space)}>
                          <Edit3 className="w-4 h-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateSpace(space)}>
                          <Copy className="w-4 h-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleLinkToProjects(space)}>
                          <ExternalLink className="w-4 h-4" /> Link to Projects
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSyncNotebook(space)}>
                          <BookOpen className="w-4 h-4" /> Sync with Notebook
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast({ title: "Transfer Ownership", description: "Ownership transfer coming soon." })}>
                          <HeartHandshake className="w-4 h-4" /> Transfer Ownership
                        </DropdownMenuItem>
                        <hr className="my-1 border-border" />
                        <DropdownMenuItem onClick={() => handleArchiveSpace(space)} className="text-amber-600">
                          <Archive className="w-4 h-4" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteSpace(space)} className="text-red-600">
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Expanded children */}
                {expandedRows.has(space.id) && space.children?.length > 0 && (
                  <div className="bg-muted/30">
                    {space.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center px-4 py-2 pl-12 hover:bg-muted/50 border-b border-border"
                      >
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span
                            className="text-sm text-foreground hover:text-blue-600 cursor-pointer transition-colors truncate"
                            onClick={() => router.push(`/editor/${child.id}`)}
                          >
                            {child.title}
                          </span>
                        </div>
                        <div className="w-48 text-sm text-muted-foreground truncate hidden md:block">
                          {child.description || "—"}
                        </div>
                        <div className="w-32">{getAccessBadge(child.access)}</div>
                        <div className="w-32">
                          <MemberAvatars members={child.members || 1} memberNames={[]} onAdd={() => {}} />
                        </div>
                        <div className="w-10" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Space Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-background rounded-xl shadow-xl border border-border w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Create New Space</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="My Workspace"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-background text-foreground"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description (optional)</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="What is this space for?"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-background text-foreground resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCreateForm({ ...createForm, type: "teamspace" })}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      createForm.type === "teamspace"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Building2 className="w-4 h-4 mx-auto mb-1" />
                    Teamspace
                  </button>
                  <button
                    onClick={() => setCreateForm({ ...createForm, type: "private" })}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      createForm.type === "private"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Lock className="w-4 h-4 mx-auto mb-1" />
                    Private
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSpace}
                disabled={!createForm.name.trim()}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TreeNode({ node, depth = 0, expandedRows, toggleRow, toolColor, toolBg, ToolIcon }) {
  const router = useRouter();
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedRows.has(node.id);
  const indent = depth * 20;

  const getContentTypeIcon = (contentType) => {
    switch (contentType) {
      case "message": return Zap;
      case "page": return FileTextIcon;
      case "database": return FolderOpen;
      case "issue": return GitBranch;
      case "pr": return GitBranch;
      case "readme": return FileTextIcon;
      case "figma_file": return PenTool;
      case "repo": return FolderOpen;
      case "project": return FolderOpen;
      case "channel": return FolderOpen;
      default: return FileTextIcon;
    }
  };

  const ContentTypeIcon = getContentTypeIcon(node.content_type);

  return (
    <div>
      <div
        className="flex items-center px-4 py-2 hover:bg-muted/50 border-b border-border/50 group cursor-pointer"
        style={{ paddingLeft: `${indent + 16}px` }}
        onClick={() => {
          if (hasChildren) toggleRow(node.id);
          else if (node.content_url) window.open(node.content_url, "_blank");
        }}
      >
        {hasChildren ? (
          <button className="w-5 flex items-center justify-center shrink-0" onClick={(e) => { e.stopPropagation(); toggleRow(node.id); }}>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5 shrink-0" />
        )}

        <div className={`w-5 h-5 rounded ${toolBg} flex items-center justify-center shrink-0 mx-2`}>
          <ContentTypeIcon className={`w-3 h-3 ${toolColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-sm text-foreground hover:text-blue-600 transition-colors truncate block">
            {node.title || node.external_id || "Untitled"}
          </span>
          {node.snippet && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{node.snippet}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {node.content_url && (
            <button
              onClick={(e) => { e.stopPropagation(); window.open(node.content_url, "_blank"); }}
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
              title="Open in source"
            >
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedRows={expandedRows}
              toggleRow={toggleRow}
              toolColor={toolColor}
              toolBg={toolBg}
              ToolIcon={ToolIcon}
            />
          ))}
        </div>
      )}
    </div>
  );
}
