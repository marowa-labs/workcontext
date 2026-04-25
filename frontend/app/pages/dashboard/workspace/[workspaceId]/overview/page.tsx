"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import {
  LayoutDashboard,
  CheckSquare,
  TrendingUp,
  FolderOpen,
  Users,
  Plus,
  ArrowRight,
  UserPlus,
  Kanban,
  Clock,
  Zap,
  Target,
} from "lucide-react";
import { ActivityFeed } from "../../../../../components/dashboard/team/ActivityFeed";
import WorkspaceService from "../../../../../lib/utils/workspaceService";
import { apiClient } from "../../../../../lib/utils/apiClient";
import { useUser } from "../../../../../lib/utils/useUser";
import CreateProjectModal from "../../../../../components/dashboard/CreateProjectModal";

interface OverviewData {
  workspace: any;
  analytics: any;
  metrics: any;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground leading-tight">
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ProjectProgressRow({ project }: { project: any }) {
  const progress = project.progress ?? 0;
  const statusColors: Record<string, string> = {
    "in-progress": "bg-blue-500",
    completed: "bg-emerald-500",
    planning: "bg-amber-500",
    draft: "bg-slate-400",
  };
  const barColor = statusColors[project.status] ?? "bg-slate-400";

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {project.title}
        </p>
        <p className="text-xs text-muted-foreground capitalize">
          {project.status}
        </p>
      </div>
      <div className="flex items-center gap-3 w-48">
        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground w-8 text-right">
          {progress}%
        </span>
      </div>
      <span className="text-xs text-muted-foreground w-16 text-right">
        {project.completedTasks}/{project.totalTasks} tasks
      </span>
    </div>
  );
}

export default function WorkspaceOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: user } = useUser();
  const workspaceId = params.workspaceId as string;

  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [workspace, analytics, metrics] = await Promise.all([
          WorkspaceService.getWorkspace(workspaceId),
          apiClient
            .get(`/api/workspaces/${workspaceId}/analytics`)
            .catch(() => null),
          apiClient
            .get(`/api/workspaces/${workspaceId}/metrics`)
            .catch(() => null),
        ]);
        setData({ workspace, analytics, metrics });
      } catch (err) {
        console.error("Failed to load workspace overview:", err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [workspaceId]);

  const handleProjectCreate = (project: any) => {
    // Refresh page data
    setData((prev) =>
      prev
        ? {
            ...prev,
            analytics: prev.analytics
              ? {
                  ...prev.analytics,
                  projectMetrics: [
                    {
                      id: project.id,
                      title: project.title,
                      status: project.status,
                      totalTasks: 0,
                      completedTasks: 0,
                      progress: 0,
                    },
                    ...(prev.analytics.projectMetrics ?? []),
                  ],
                }
              : prev.analytics,
          }
        : prev,
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const ws = data?.workspace;
  const analytics = data?.analytics;
  const metrics = data?.metrics;

  const totalTasks = analytics?.totalTasks ?? 0;
  const doneTasks = analytics?.doneTasks ?? 0;
  const completionRate = analytics?.completionRate ?? 0;
  const projectMetrics: any[] = analytics?.projectMetrics ?? [];
  const memberCount = ws?.members?.length ?? 0;
  const activeProjects = projectMetrics.filter(
    (p: any) => p.status === "in-progress",
  ).length;

  // Build activity feed from recent tasks
  const recentActivity: any[] = (metrics?.recentTasks ?? []).map((t: any) => ({
    id: t.id,
    type: "task",
    title: t.title,
    content: t.title,
    created_at: t.created_at,
    updated_at: t.updated_at,
    user: t.assignees?.[0]?.user ?? {
      full_name: "Workspace member",
      email: "",
    },
  }));

  return (
    <div className="p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {ws?.icon && (LucideIcons as any)[ws.icon] ? (
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              {(() => {
                const IconNode = (LucideIcons as any)[ws.icon];
                return <IconNode className="w-7 h-7 text-emerald-500" />;
              })()}
            </div>
          ) : ws?.icon ? (
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <span className="text-2xl">{ws.icon}</span>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <LayoutDashboard className="w-7 h-7 text-emerald-500" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 flex items-center gap-2">
              {ws?.name ?? "Workspace"} Overview
            </h1>
            {ws?.description && (
              <p className="text-sm text-muted-foreground">{ws.description}</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            New Project
          </button>
          <Link
            href={`/dashboard/admin/${workspaceId}/members`}
            className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            <UserPlus className="w-4 h-4" />
            Invite Member
          </Link>
          <Link
            href={`/dashboard/workspace/${workspaceId}/kanban`}
            className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            <Kanban className="w-4 h-4" />
            Kanban
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={CheckSquare}
          label="Total Tasks"
          value={totalTasks}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={Zap}
          label="Completed"
          value={doneTasks}
          sub={`${completionRate}% rate`}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={Target}
          label="Completion"
          value={`${completionRate}%`}
          color="bg-violet-50 text-violet-600"
        />
        <StatCard
          icon={FolderOpen}
          label="Active Projects"
          value={activeProjects}
          sub={`${projectMetrics.length} total`}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={Users}
          label="Members"
          value={memberCount}
          color="bg-pink-50 text-pink-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Progress — takes 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Project Progress
              </h2>
              <Link
                href={`/dashboard/workspace/${workspaceId}/projects`}
                className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {projectMetrics.length === 0 ? (
              <div className="text-center py-10">
                <FolderOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No projects yet.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-3 text-sm text-primary hover:underline flex items-center gap-1 mx-auto">
                  <Plus className="w-3.5 h-3.5" />
                  Create your first project
                </button>
              </div>
            ) : (
              <div>
                {projectMetrics.slice(0, 6).map((p: any) => (
                  <ProjectProgressRow key={p.id} project={p} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-blue-500" />
              Recent Activity
            </h2>
            <ActivityFeed activities={recentActivity} />
          </div>
        </div>

        {/* Right Column — 1/3 */}
        <div className="space-y-6">
          {/* Team Members */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-500" />
                Team
              </h2>
              <Link
                href={`/dashboard/admin/${workspaceId}/members`}
                className="text-xs text-primary hover:underline flex items-center gap-1">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {(ws?.members ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No members yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {ws.members.slice(0, 8).map((m: any) => {
                  const u = m.user;
                  const initials = u.full_name
                    ? u.full_name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : u.email[0].toUpperCase();
                  return (
                    <li key={m.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {u.full_name ?? u.email}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {m.role}
                        </p>
                      </div>
                    </li>
                  );
                })}
                {ws.members.length > 8 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    +{ws.members.length - 8} more members
                  </p>
                )}
              </ul>
            )}
          </div>

          {/* Quick Navigation */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Quick Navigation
            </h2>
            <div className="space-y-1">
              {[
                {
                  label: "Projects",
                  href: `/dashboard/workspace/${workspaceId}/projects`,
                  icon: FolderOpen,
                },
                {
                  label: "Kanban",
                  href: `/dashboard/workspace/${workspaceId}/kanban`,
                  icon: Kanban,
                },
                {
                  label: "Analytics",
                  href: `/dashboard/workspace/${workspaceId}/analytics`,
                  icon: TrendingUp,
                },
                {
                  label: "Members",
                  href: `/dashboard/admin/${workspaceId}/members`,
                  icon: Users,
                },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors group">
                  <link.icon className="w-4 h-4 group-hover:text-primary transition-colors" />
                  {link.label}
                  <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreate={handleProjectCreate}
        initialWorkspaceId={workspaceId}
      />
    </div>
  );
}
