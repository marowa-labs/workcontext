"use client";

import { useState, useEffect, ReactNode } from "react";
import {
  Menu,
  X,
  Home,
  Folder,
  Settings,
  CreditCard,
  LogOut,
  Crown,
  Plus,
  ChevronDown,
  ChevronLeft,
  AlertCircle,
  Users,
  ChevronRight,
  Lock,
  Hash,
  Bell,
  LayoutDashboard,
  FolderKanban,
  HelpCircle,
  Trello,
  CalendarDays,
  GanttChart,
  BarChart2,
  MessageCircle,
  Activity,
  Loader2,
  Sparkles,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useUser from "../../lib/utils/useUser";
import useAuth from "../../lib/utils/useAuth";
import NotificationBell from "./NotificationBell";
import WorkspaceService, { Workspace } from "../../lib/utils/workspaceService";
import ProjectService from "../../lib/utils/projectService";
import SubscriptionService from "../../lib/utils/subscriptionService";
import { usePresence } from "../../lib/hooks/usePresence";
import { useTheme } from "../../contexts/ThemeContext";
import { ModeToggle } from "../ModeToggle";
import { GlobalTimerWidget } from "./team/GlobalTimerWidget";
import { SearchModal } from "./SearchModal";
import { QuickTaskModal } from "./QuickTaskModal";
import { AIChatDrawer } from "./AIChatDrawer";
import { FloatingAIButton } from "./FloatingAIButton";
import { SummarizeModal } from "./SummarizeModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { toast } from "../../hooks/use-toast";
import { cn } from "../../lib/utils";

interface DashboardLayoutProps {
  children?: ReactNode;
  activeTab?: string;
}

export default function DashboardLayout({
  children,
  activeTab,
}: DashboardLayoutProps) {
  const { settings } = useTheme();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Extract workspace ID from URL path if present
  const workspaceIdMatch = pathname.match(/\/dashboard\/workspace\/([^\/]+)/);
  const currentWorkspaceId = workspaceIdMatch
    ? workspaceIdMatch[1]
    : searchParams.get("id");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<string[]>([]);

  const toggleWorkspace = (workspaceId: string) => {
    setExpandedWorkspaces((prev) =>
      prev.includes(workspaceId)
        ? prev.filter((id) => id !== workspaceId)
        : [...prev, workspaceId],
    );
  };
  const [projectsCount, setProjectsCount] = useState(0);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);

  // Create Workspace Modal State
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] =
    useState(false);

  // Search Modal State
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Quick Task Modal State
  const [showQuickTaskModal, setShowQuickTaskModal] = useState(false);

  // AI Chat Drawer State
  const [showAIChat, setShowAIChat] = useState(false);

  // Inbox Pinned State
  const [isInboxPinned, setIsInboxPinned] = useState(false);

  // Summarize Modal State
  const [showSummarizeModal, setShowSummarizeModal] = useState(false);
  const [summarizeWorkspaceId, setSummarizeWorkspaceId] = useState<string | undefined>();

  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState("");
  const [newWorkspaceIcon, setNewWorkspaceIcon] = useState("Hash");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // Available Lucide icons for workspaces
  const availableIcons = [
    "Hash",
    "Briefcase",
    "Code",
    "Database",
    "Cpu",
    "Layers",
    "Globe",
    "Shield",
    "Zap",
    "Users",
    "Target",
    "Rocket",
    "FlaskConical",
    "Library",
    "Terminal",
    "Activity",
  ];

  const { data: user, loading, token } = useUser();
  const { signOut } = useAuth();

  // Filter workspaces where user has admin/owner permissions
  const adminWorkspaces = workspaces.filter(
    (ws) =>
      user &&
      (ws.owner_id === user.id ||
        ws.members?.some((m) => m.user_id === user.id && m.role === "admin")),
  );

  const primaryWorkspaceId =
    workspaces.length > 0 ? `workspace-${workspaces[0].id}` : "";
  usePresence(primaryWorkspaceId);

  // Only apply custom layout preferences if the user has enabled them for this layout
  const shouldApplyCustomLayout = settings.layoutDashboard !== false;

  // Determine active tab based on current route
  const getActiveTab = () => {
    // If activeTab prop is provided, use it (for backward compatibility)
    if (activeTab) return activeTab;

    const path = pathname;

    // More specific route matching to ensure correct tab highlighting
    if (path === "/dashboard") return "dashboard";
    if (path === "/guide") return "guide";
    if (path === "/ai") return "ai";
    if (path === "/projects" || path.startsWith("/projects/"))
      return "projects";
    if (path.startsWith("/dashboard/admin")) return "admin";
    if (path.startsWith("/settings/")) return "settings";
    if (path.startsWith("/billing/")) return "billing";
    if (path.startsWith("/help")) return "help";
    if (path.startsWith("/dashboard/workspace/")) return "workspace";

    // Default fallback
    return "dashboard";
  };

  // Recalculate active tab whenever location changes
  const currentActiveTab = getActiveTab();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Fetch workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      // Wait for both user AND token to be ready
      if (!user || !token) return;

      setLoadingWorkspaces(true);
      try {
        const data = await WorkspaceService.getWorkspaces();
        setWorkspaces(data || []);
      } catch (err) {
        console.error("Failed to fetch workspaces in sidebar:", err);
      } finally {
        setLoadingWorkspaces(false);
      }
    };

    fetchWorkspaces();
  }, [user, token]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast({
        title: "Required",
        description: "Workspace name is required",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingWorkspace(true);
    try {
      await WorkspaceService.createWorkspace({
        name: newWorkspaceName,
        description: newWorkspaceDesc,
        icon: newWorkspaceIcon,
      });

      toast({ title: "Success", description: "Workspace created!" });

      // Reload workspaces
      const data = await WorkspaceService.getWorkspaces();
      setWorkspaces(data || []);

      setShowCreateWorkspaceModal(false);
      // Reset form
      setNewWorkspaceName("");
      setNewWorkspaceDesc("");
      setNewWorkspaceIcon("Hash");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create workspace",
        variant: "destructive",
      });
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  // Fetch projects and subscription data
  useEffect(() => {
    const fetchSidebarData = async () => {
      if (!user || !token) return;

      setLoadingProjects(true);
      try {
        // Fetch projects count
        const projects = await ProjectService.getUserProjects(user.id);
        if (Array.isArray(projects)) {
          setProjectsCount(projects.length);
        } else if (projects && Array.isArray(projects.projects)) {
          setProjectsCount(projects.projects.length);
        }

        // Fetch subscription data
        const subService = new SubscriptionService();
        const subData = await subService.getUserPlan();
        setSubscriptionData(subData);
      } catch (err) {
        console.error("Failed to fetch sidebar data:", err);
        setApiError("Failed to load project/plan info");
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchSidebarData();
  }, [user, token]);

  // Keyboard shortcut: Ctrl+J to toggle AI Chat Drawer
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+J or Cmd+J (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === "j") {
        event.preventDefault();
        setShowAIChat((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        profileDropdownOpen &&
        target &&
        !target.closest(".profile-dropdown")
      ) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileDropdownOpen]);

  // Auth guard: Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      console.log("No user found in DashboardLayout, redirecting to login...");
      router.push("/login");
    }
  }, [user, loading, router]);

  // Listen for slash command events
  useEffect(() => {
    const handleOpenSearch = () => setShowSearchModal(true);
    const handleCreateProject = () => setShowCreateWorkspaceModal(true);
    const handleCreateQuickTask = () => setShowQuickTaskModal(true);
    const handleOpenAIChat = () => setShowAIChat(true);
    const handleSummarizeWorkspace = (e: any) => {
      setSummarizeWorkspaceId(e?.detail?.workspaceId);
      setShowSummarizeModal(true);
    };

    window.addEventListener("open-search", handleOpenSearch);
    window.addEventListener("create-project", handleCreateProject);
    window.addEventListener("create-quick-task", handleCreateQuickTask);
    window.addEventListener("open-ai-chat", handleOpenAIChat);
    window.addEventListener("summarize-workspace", handleSummarizeWorkspace);

    return () => {
      window.removeEventListener("open-search", handleOpenSearch);
      window.removeEventListener("create-project", handleCreateProject);
      window.removeEventListener("create-quick-task", handleCreateQuickTask);
      window.removeEventListener("open-ai-chat", handleOpenAIChat);
      window.removeEventListener("summarize-workspace", handleSummarizeWorkspace);
    };
  }, []);

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user is not authenticated, don't render the dashboard
  if (!user) {
    return null;
  }

  // Define navigation categories
  const privateItems = [
    { id: "guide", label: "How to Use", icon: HelpCircle, href: "/guide" },
    { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
    { id: "ai", label: "Notion AI", icon: Sparkles, href: "/ai" },
    { id: "projects", label: "My Spaces", icon: Folder, href: "/projects" },
  ];

  const bottomItems = [
    {
      id: "admin",
      label: "Admin",
      icon: Users,
      href: "/dashboard/admin",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/settings/profile",
    },
    {
      id: "billing",
      label: "Billing",
      icon: CreditCard,
      href: "/billing/subscription",
    },
  ].filter((item) => {
    if (item.id === "admin") {
      return adminWorkspaces.length > 0;
    }
    return true;
  });

  const userPlan = subscriptionData?.plan?.name || "Free Plan";

  const projectsUsed = projectsCount;
  // All plans now have unlimited projects
  const projectsLimit = Infinity;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  interface PlanBadgeColorMap {
    [key: string]: string;
  }

  type PlanType = "Student Pro" | "Researcher" | "Free Plan" | string;

  const getPlanBadgeColor = (plan: PlanType): string => {
    const planBadgeColors: PlanBadgeColorMap = {
      "Student Pro":
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      Researcher:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      "Free Plan":
        "bg-cw-light-gray text-gray-700 dark:bg-[#FFFAFA] dark:text-gray-700",
    };

    // Special badge for premium users
    if (
      plan &&
      (plan.includes("Student") ||
        plan.includes("Pro") ||
        plan.includes("Researcher"))
    ) {
      return "bg-gradient-to-r from-blue-500 to-purple-600 text-white";
    }

    return (
      planBadgeColors[plan] ||
      "bg-cw-light-gray text-gray-700 dark:bg-[#FFFAFA] dark:text-gray-700"
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get user's plan badge
  const getUserPlanBadge = () => {
    // Only show badge for premium plans
    if (!userPlan || userPlan === "Free Plan" || userPlan === "Free") {
      return null;
    }

    const planColor = getPlanBadgeColor(userPlan);
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planColor} shadow-sm`}>
        <Crown className="mr-1 h-3 w-3" />
        {userPlan}
      </span>
    );
  };

  // Determine transition classes based on animation settings
  const getTransitionClasses = () => {
    // Only apply custom animation settings if user has enabled it for this layout
    if (!shouldApplyCustomLayout) {
      return "transition-colors duration-200"; // Default transitions
    }

    if (settings.reduceMotion) {
      return "transition-none";
    } else if (settings.animations === false) {
      return "transition-none";
    }
    return "transition-colors duration-200"; // default
  };

  // Get sidebar position from settings
  const sidebarPosition = shouldApplyCustomLayout
    ? settings.sidebarPosition
    : "left"; // Default to left if not enabled

  // Update position classes to remove navbar padding
  const positionClasses = {
    sidebar: sidebarPosition === "right"
      ? "fixed inset-y-0 right-0 z-40 w-64 bg-card border-l border-border"
      : "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border",
    sidebarTransform: sidebarOpen
      ? (sidebarPosition === "right" ? "translate-x-0" : "translate-x-0")
      : (sidebarPosition === "right" ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"),
    mainContent: sidebarPosition === "right"
      ? `flex-1 min-h-screen transition-all duration-300 ${sidebarCollapsed ? "lg:mr-20" : "lg:mr-64"}`
      : `flex-1 min-h-screen transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`,
  };

  const transitionClasses = getTransitionClasses();

  return (
    <div className="min-h-screen bg-background text-foreground font-outfit">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`
          ${positionClasses.sidebar}
          transform transition-all duration-300 ease-in-out
          ${positionClasses.sidebarTransform}
          ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"}
        `}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header - Notion Style */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2 group">
                  {userPlan && userPlan !== "Free Plan" && userPlan !== "Free" && (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${userPlan.includes("Student") || userPlan.includes("Pro")
                      ? "bg-blue-600 text-white"
                      : "bg-purple-600 text-white"
                      }`}>
                      {userPlan.includes("Student") || userPlan.includes("Pro") ? "PRO" : "RESEARCHER"}
                    </span>
                  )}
                  {!sidebarCollapsed && (
                    <span className="font-bold text-foreground text-lg tracking-tight">
                      ScholarForge AI
                    </span>
                  )}
                </Link>

                {/* Collapse button */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className={`p-1.5 rounded-lg text-muted-foreground hover:bg-muted ${transitionClasses}`}
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {/* Navigation Sections */}
            <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
              {/* Private Section */}
              <div className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between px-3 mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                      <Lock className="w-3 h-3 mr-1.5" /> Private
                    </span>
                  </div>
                )}
                {privateItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`
                      flex items-center px-3 py-2 rounded-lg text-sm font-medium ${transitionClasses}
                      ${currentActiveTab === item.id
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }
                      ${sidebarCollapsed ? "justify-center" : ""}
                    `}>
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="ml-3 truncate">{item.label}</span>
                    )}
                  </Link>
                ))}
              </div>

              {/* Teamspaces Section */}
              <div className="space-y-1 pt-4 mt-2 border-t border-border">
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between px-3 mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center">
                      <Users className="w-3 h-3 mr-1.5" /> Teamspaces
                    </span>
                    <button
                      onClick={() => setShowCreateWorkspaceModal(true)}
                      className="text-muted-foreground hover:text-emerald-500 transition-colors cursor-pointer outline-none">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {loadingWorkspaces ? (
                  <div className="px-3 py-2 space-y-2 animate-pulse">
                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  </div>
                ) : workspaces.length > 0 ? (
                  workspaces.map((ws) => {
                    const isExpanded = expandedWorkspaces.includes(ws.id);
                    const isActive = currentWorkspaceId === ws.id;

                    return (
                      <div key={ws.id} className="mb-1">
                        <div
                          className={`
                            flex items-center px-3 py-2 rounded-lg text-sm font-medium ${transitionClasses} group
                            ${isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                            }
                            ${sidebarCollapsed ? "justify-center" : "justify-between"}
                          `}
                          onClick={() =>
                            !sidebarCollapsed && toggleWorkspace(ws.id)
                          }>
                          <div className="flex items-center flex-1 min-w-0">
                            {ws.icon && (LucideIcons as any)[ws.icon] ? (
                              (() => {
                                const IconNode = (LucideIcons as any)[ws.icon];
                                return (
                                  <IconNode
                                    className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-emerald-500" : "text-slate-400"}`}
                                  />
                                );
                              })()
                            ) : ws.icon ? (
                              <span className="w-4 h-4 flex-shrink-0 text-base leading-none">
                                {ws.icon}
                              </span>
                            ) : (
                              <Hash
                                className={`w-4 h-4 flex-shrink-0 ${isActive
                                  ? "text-emerald-500"
                                  : "text-slate-300"
                                  }`}
                              />
                            )}
                            {!sidebarCollapsed && (
                              <span className="ml-3 truncate">{ws.name}</span>
                            )}
                          </div>

                          {!sidebarCollapsed && (
                            <ChevronRight
                              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""
                                }`}
                            />
                          )}
                        </div>

                        {/* Sub-navigation items */}
                        {!sidebarCollapsed && isExpanded && (
                          <div className="mt-1 ml-4 space-y-1 border-l border-slate-200 pl-2">
                            <Link
                              href={`/dashboard/workspace/${ws.id}/overview`}
                              className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${transitionClasses}
                                ${pathname ===
                                  `/dashboard/workspace/${ws.id}/overview`
                                  ? "text-emerald-600 bg-emerald-50/50"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                }
                              `}>
                              <LayoutDashboard className="w-3.5 h-3.5 flex-shrink-0" />
                              Overview
                            </Link>
                            <Link
                              href={`/dashboard/workspace/${ws.id}/projects`}
                              className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${transitionClasses}
                                ${pathname.includes(
                                `/workspace/${ws.id}/projects`,
                              )
                                  ? "text-emerald-600 bg-emerald-50/50"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                }
                              `}>
                              <FolderKanban className="w-3.5 h-3.5 flex-shrink-0" />
                              Projects
                            </Link>
                            <Link
                              href={`/dashboard/workspace/${ws.id}/kanban`}
                              className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${transitionClasses}
                                ${pathname.includes(
                                `/workspace/${ws.id}/kanban`,
                              )
                                  ? "text-emerald-600 bg-emerald-50/50"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                }
                              `}>
                              <Trello className="w-3.5 h-3.5 flex-shrink-0" />
                              Kanban
                            </Link>
                            <Link
                              href={`/dashboard/workspace/${ws.id}/calendar`}
                              className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${transitionClasses}
                                ${pathname.includes(
                                `/workspace/${ws.id}/calendar`,
                              )
                                  ? "text-emerald-600 bg-emerald-50/50"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                }
                              `}>
                              <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                              Calendar
                            </Link>
                            <Link
                              href={`/dashboard/workspace/${ws.id}/timeline`}
                              className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${transitionClasses}
                                ${pathname.includes(
                                `/workspace/${ws.id}/timeline`,
                              )
                                  ? "text-emerald-600 bg-emerald-50/50"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                }
                              `}>
                              <GanttChart className="w-3.5 h-3.5 flex-shrink-0" />
                              Timeline
                            </Link>
                            <Link
                              href={`/dashboard/workspace/${ws.id}/analytics`}
                              className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${transitionClasses}
                                ${pathname.includes(
                                `/workspace/${ws.id}/analytics`,
                              )
                                  ? "text-emerald-600 bg-emerald-50/50"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                }
                              `}>
                              <BarChart2 className="w-3.5 h-3.5 flex-shrink-0" />
                              Analytics
                            </Link>
                            <Link
                              href={`/dashboard/workspace/${ws.id}/chat`}
                              className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${transitionClasses}
                                ${pathname.includes(`/workspace/${ws.id}/chat`)
                                  ? "text-emerald-600 bg-emerald-50/50"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                }
                              `}>
                              <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              Chat
                            </Link>
                            <Link
                              href={`/dashboard/workspace/${ws.id}/notifications`}
                              className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${transitionClasses}
                                ${pathname.includes(
                                `/workspace/${ws.id}/notifications`,
                              )
                                  ? "text-emerald-600 bg-emerald-50/50"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                }
                              `}>
                              <Bell className="w-3.5 h-3.5 flex-shrink-0" />
                              Notifications
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  !sidebarCollapsed && (
                    <p className="px-3 py-2 text-[10px] text-slate-400 italic">
                      No workspaces
                    </p>
                  )
                )}
              </div>

              {/* Utility Section */}
              <div className="space-y-1 pt-4 border-t border-border">
                {bottomItems.map((item) => {
                  if (item.id === "admin") {
                    const isAdminExpanded =
                      expandedWorkspaces.includes("admin-section");

                    return (
                      <div key={item.id}>
                        <div
                          onClick={() =>
                            !sidebarCollapsed &&
                            (workspaces.length === 0
                              ? router.push("/dashboard/admin")
                              : toggleWorkspace("admin-section"))
                          }
                          className={`
                            flex items-center px-3 py-2 rounded-lg text-sm font-medium ${transitionClasses} cursor-pointer
                            ${currentActiveTab === item.id
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }
                            ${sidebarCollapsed ? "justify-center" : "justify-between"}
                          `}>
                          <div className="flex items-center">
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!sidebarCollapsed && (
                              <span className="ml-3 truncate">
                                {item.label}
                              </span>
                            )}
                          </div>
                          {!sidebarCollapsed && (
                            <ChevronRight
                              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isAdminExpanded ? "rotate-90" : ""
                                }`}
                            />
                          )}
                        </div>

                        {/* Admin Sub-menu */}
                        {!sidebarCollapsed && isAdminExpanded && (
                          <div className="mt-1 ml-4 space-y-1 border-l border-slate-200 pl-2">
                            {adminWorkspaces.map((ws) => (
                              <div key={`admin-${ws.id}`}>
                                <div
                                  className="flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
                                  onClick={() =>
                                    toggleWorkspace(`admin-${ws.id}`)
                                  }>
                                  <div className="flex items-center gap-2 min-w-0">
                                    {ws.icon &&
                                      (LucideIcons as any)[ws.icon] ? (
                                      (() => {
                                        const IconNode = (LucideIcons as any)[
                                          ws.icon
                                        ];
                                        return (
                                          <IconNode className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                                        );
                                      })()
                                    ) : ws.icon ? (
                                      <span className="w-3.5 h-3.5 flex-shrink-0 text-sm leading-none">
                                        {ws.icon}
                                      </span>
                                    ) : (
                                      <Hash className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                                    )}
                                    <span className="truncate">{ws.name}</span>
                                  </div>
                                  <ChevronRight
                                    className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${expandedWorkspaces.includes(
                                      `admin-${ws.id}`,
                                    )
                                      ? "rotate-90"
                                      : ""
                                      }`}
                                  />
                                </div>

                                {expandedWorkspaces.includes(
                                  `admin-${ws.id}`,
                                ) && (
                                    <div className="ml-2 pl-2 border-l border-slate-200 mt-1 space-y-1">
                                      <Link
                                        href={`/dashboard/admin/${ws.id}/members`}
                                        className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${transitionClasses}
                                        ${pathname.includes(
                                          `/admin/${ws.id}/members`,
                                        )
                                            ? "text-emerald-600 bg-emerald-50/50"
                                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                          }
                                      `}>
                                        <Users className="w-3.5 h-3.5 flex-shrink-0" />
                                        Members
                                      </Link>
                                      <Link
                                        href={`/dashboard/admin/${ws.id}/activity-log`}
                                        className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${transitionClasses}
                                        ${pathname.includes(
                                          `/admin/${ws.id}/activity-log`,
                                        )
                                            ? "text-emerald-600 bg-emerald-50/50"
                                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                          }
                                      `}>
                                        <Activity className="w-3.5 h-3.5 flex-shrink-0" />
                                        Activity Log
                                      </Link>
                                      <Link
                                        href={`/dashboard/admin/${ws.id}/settings`}
                                        className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${transitionClasses}
                                        ${pathname.includes(
                                          `/admin/${ws.id}/settings`,
                                        )
                                            ? "text-emerald-600 bg-emerald-50/50"
                                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                          }
                                      `}>
                                        <Settings className="w-3.5 h-3.5 flex-shrink-0" />
                                        Settings
                                      </Link>
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`
                        flex items-center px-3 py-2 rounded-lg text-sm font-medium ${transitionClasses}
                        ${currentActiveTab === item.id
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }
                        ${sidebarCollapsed ? "justify-center" : ""}
                      `}>
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="ml-3 truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* User & Actions Section */}
            <div className="p-4 border-t border-border mt-auto space-y-3">
              {/* Mobile menu button (only on mobile) */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`lg:hidden w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted ${transitionClasses}`}>
                {sidebarOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
                {!sidebarCollapsed && <span className="text-sm">Menu</span>}
              </button>

              {/* Theme Toggle */}
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2`}>
                {!sidebarCollapsed && <span className="text-sm text-muted-foreground">Theme</span>}
                <ModeToggle />
              </div>

              {/* Notifications */}
              {workspaces.length > 0 && (
                <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2`}>
                  {!sidebarCollapsed && <span className="text-sm text-muted-foreground">Notifications</span>}
                  <NotificationBell
                    isPinned={isInboxPinned}
                    onPinChange={setIsInboxPinned}
                  />
                </div>
              )}

              {/* Profile Section */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted ${transitionClasses}`}>
                  <div
                    className={`
                    relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${userPlan === "Free Plan" || !userPlan
                        ? "bg-gradient-to-br from-gray-400 to-gray-600"
                        : userPlan.includes("Student") ||
                          userPlan.includes("Pro")
                          ? "bg-gradient-to-br from-blue-500 to-blue-700"
                          : "bg-gradient-to-br from-purple-500 to-purple-700"
                      }
                  `}>
                    <span className="text-white font-medium text-sm">
                      {user?.user_metadata?.full_name
                        ? user.user_metadata.full_name.charAt(0).toUpperCase()
                        : user?.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                    {userPlan &&
                      userPlan !== "Free Plan" &&
                      userPlan !== "Free" && (
                        <div
                          className={`
                        absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center
                        ${userPlan.includes("Student") ||
                              userPlan.includes("Pro")
                              ? "bg-blue-500 border border-white"
                              : "bg-purple-500 border border-white"
                            }
                      `}>
                          <Crown className="w-2 h-2 text-white" />
                        </div>
                      )}
                  </div>
                  {!sidebarCollapsed && (
                    <>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate">
                          {user?.user_metadata?.full_name || "User"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </>
                  )}
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 w-full bg-popover text-popover-foreground rounded-xl shadow-2xl border border-border py-2 z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div
                          className={`
                          relative w-10 h-10 rounded-full flex items-center justify-center
                          ${userPlan === "Free Plan" || !userPlan
                              ? "bg-gradient-to-br from-slate-600 to-slate-800"
                              : "bg-gradient-to-br from-emerald-500 to-emerald-700"
                            }
                        `}>
                          <span className="text-white font-medium">
                            {user?.user_metadata?.full_name
                              ? user.user_metadata.full_name
                                .charAt(0)
                                .toUpperCase()
                              : user?.email?.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium truncate">
                            {user?.user_metadata?.full_name || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-2">
                      <Link
                        href="/settings/profile"
                        className={`flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted ${transitionClasses}`}>
                        <Users className="w-4 h-4 mr-3" />
                        View Profile
                      </Link>

                      <button
                        onClick={handleSignOut}
                        className={`flex items-center w-full px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 ${transitionClasses}`}>
                        <LogOut className="w-4 h-4 mr-3" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Usage meter */}
            {!sidebarCollapsed && (
              <div className="p-4 border-t border-border">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-emerald-400 flex items-center">
                      <span>{getUserPlanBadge()}</span> {userPlan}
                    </span>
                    {projectsLimit !== Infinity && (
                      <span className="text-xs text-slate-400">
                        {projectsUsed}/{projectsLimit}
                      </span>
                    )}
                    {projectsLimit === Infinity && (
                      <span className="text-xs text-slate-400">
                        {projectsUsed}/∞
                      </span>
                    )}
                  </div>

                  {/* Always show unlimited projects message */}
                  <p className="text-xs text-slate-500 mb-3">
                    Unlimited projects
                  </p>

                  {/* Show loading indicator when projects are loading */}
                  {loadingProjects && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-600 flex items-center">
                        <span className="h-3 w-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-2"></span>
                        Loading data...
                      </p>
                    </div>
                  )}

                  {/* Show error message if there was an API error */}
                  {apiError && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {apiError}
                      </p>
                    </div>
                  )}

                  {/* Greeting message */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      {getGreeting()},{" "}
                      <span className="text-emerald-400 font-medium">
                        {user?.user_metadata?.full_name || "User"}
                      </span>
                      !
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content area - shrinks when AI chat is open or inbox is pinned */}
        <main
          className={cn(
            positionClasses.mainContent,
            "min-w-0 h-full flex flex-col transition-all duration-300",
            showAIChat && "lg:mr-[420px]",
            isInboxPinned && "lg:ml-[calc(16rem+22.5rem)]"
          )}
        >
          {children}
        </main>

        {/* AI Chat Side Panel - Desktop: pushes content, Mobile: modal */}
        {showAIChat && (
          <>
            {/* Desktop: Side panel */}
            <div className="hidden lg:block fixed right-0 top-0 bottom-0 w-[420px] z-40">
              <AIChatDrawer
                isOpen={showAIChat}
                onClose={() => setShowAIChat(false)}
                isPanel={true}
              />
            </div>
            {/* Mobile: Modal overlay */}
            <div className="lg:hidden">
              <AIChatDrawer
                isOpen={showAIChat}
                onClose={() => setShowAIChat(false)}
                isPanel={false}
              />
            </div>
          </>
        )}

        {/* Floating AI Button - Shows when drawer is closed */}
        <FloatingAIButton
          isOpen={showAIChat}
          onClick={() => setShowAIChat(true)}
          pathname={pathname}
        />

        {/* Pinned Inbox Sidebar - Between sidebar and main content */}
        {isInboxPinned && (
          <div className="hidden lg:block fixed left-64 top-0 bottom-0 w-[360px] bg-white border-r border-gray-200 shadow-sm z-30">
            <div className="h-full flex flex-col">
              {/* Inbox Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Inbox</h2>
                <button
                  onClick={() => setIsInboxPinned(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                  title="Unpin inbox">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v10M5 12h14M12 12l-4 8M12 12l4 8" />
                  </svg>
                </button>
              </div>
              <div className="p-4 text-center text-gray-500">
                Pinned Inbox Panel
              </div>
            </div>
          </div>
        )}
      </div>
      <GlobalTimerWidget />

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />

      {/* Quick Task Modal */}
      <QuickTaskModal
        isOpen={showQuickTaskModal}
        onClose={() => setShowQuickTaskModal(false)}
      />

      {/* Summarize Modal */}
      <SummarizeModal
        isOpen={showSummarizeModal}
        onClose={() => setShowSummarizeModal(false)}
        workspaceId={summarizeWorkspaceId}
      />

      {/* Create Workspace Modal */}
      <Dialog
        open={showCreateWorkspaceModal}
        onOpenChange={setShowCreateWorkspaceModal}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Plus className="w-5 h-5 text-emerald-500" />
              </div>
              Create New Workspace
            </DialogTitle>
            <DialogDescription>
              Collaborate with your team in a shared research space.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6 font-outfit">
            <div className="grid gap-2">
              <Label htmlFor="ws-name" className="text-sm font-semibold">
                Workspace Name
              </Label>
              <Input
                id="ws-name"
                placeholder="e.g. quantum-research-team"
                className="bg-background border-border focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Workspace Icon</Label>
              <div className="grid grid-cols-8 gap-2 p-3 bg-muted/30 rounded-xl border border-border">
                {availableIcons.map((iconName) => {
                  const IconNode = (LucideIcons as any)[iconName];
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setNewWorkspaceIcon(iconName)}
                      className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-emerald-500/10",
                        newWorkspaceIcon === iconName
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110"
                          : "text-muted-foreground hover:text-emerald-500",
                      )}>
                      {IconNode && <IconNode className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ws-desc" className="text-sm font-semibold">
                Description (Optional)
              </Label>
              <Textarea
                id="ws-desc"
                placeholder="What will this team focus on?"
                className="bg-background border-border min-h-[100px] resize-none focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                value={newWorkspaceDesc}
                onChange={(e) => setNewWorkspaceDesc(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              className="bg-muted hover:bg-muted/80 border-border text-sm font-semibold"
              onClick={() => setShowCreateWorkspaceModal(false)}
              disabled={isCreatingWorkspace}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 text-sm font-semibold px-6"
              onClick={handleCreateWorkspace}
              disabled={isCreatingWorkspace}>
              {isCreatingWorkspace ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
