"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Brain,
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ListTodo,
  Clock,
  Upload,
  Sparkles,
  Search,
  Filter,
  Pin,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  Calendar,
  User,
  Link2,
  MessageSquare,
  Loader2,
  BarChart3,
  Eye,
  Edit3,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { toast } from "../../../hooks/use-toast";
import { supabase } from "../../../lib/supabase/client";

// ============================================================
// Types
// ============================================================

interface User {
  id: string;
  full_name: string | null;
  email: string;
}

interface Decision {
  id: string;
  type: "decision" | "action_item" | "blocker" | "insight";
  title: string;
  description: string;
  assignee: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  source_url: string | null;
  source_tool: string | null;
  created_at: string;
  user: User;
  project: { id: string; title: string } | null;
  transcript: { id: string; title: string; source: string } | null;
}

interface Transcript {
  id: string;
  title: string;
  source: string;
  content: string;
  summary: string | null;
  duration_min: number | null;
  participants: string[];
  meeting_date: string | null;
  created_at: string;
  user: User;
  decisions: Decision[];
}

interface ActivityItem {
  id: string;
  type: string;
  action: string;
  entityType: string;
  entityId: string;
  entityTitle: string | null;
  description: string | null;
  metadata: any;
  user: User | null;
  project: { id: string; title: string } | null;
  createdAt: string;
}

interface Summary {
  id: string;
  title: string;
  summary_type: string;
  content: string;
  source_refs: any;
  generated_at: string;
  is_pinned: boolean;
  user: User;
}

interface DecisionStats {
  total: number;
  overdue: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

interface ActivityStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  byEntityType: Record<string, number>;
}

type TabId = "decisions" | "activity" | "transcripts" | "summaries";

// ============================================================
// Helper Components
// ============================================================

const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> =
  {
    decision: {
      icon: CheckCircle2,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
      label: "Decision",
    },
    action_item: {
      icon: ListTodo,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
      label: "Action Item",
    },
    blocker: {
      icon: AlertTriangle,
      color: "text-red-500 bg-red-50 dark:bg-red-900/20",
      label: "Blocker",
    },
    insight: {
      icon: Lightbulb,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
      label: "Insight",
    },
  };

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const SOURCE_ICONS: Record<string, string> = {
  zoom: "🎥",
  otter: "🦦",
  teams: "💼",
  manual: "📝",
  external: "🔗",
};

function timeAgo(date: string) {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString();
}

function ActionIcon({ action }: { action: string }) {
  switch (action) {
    case "created":
      return <Plus className="w-3 h-3" />;
    case "updated":
      return <Edit3 className="w-3 h-3" />;
    case "completed":
      return <CheckCircle2 className="w-3 h-3" />;
    case "decided":
      return <Brain className="w-3 h-3" />;
    case "synced":
      return <Activity className="w-3 h-3" />;
    case "commented":
      return <MessageSquare className="w-3 h-3" />;
    default:
      return <Eye className="w-3 h-3" />;
  }
}

// ============================================================
// Tab Components
// ============================================================

function DecisionsTab({ workspaceId }: { workspaceId: string }) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState<DecisionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;
      if (!token) return;

      const params = new URLSearchParams({ workspace_id: workspaceId });
      if (filterType) params.set("type", filterType);
      if (filterStatus) params.set("status", filterStatus);
      if (search) params.set("search", search);

      const [decisionsRes, statsRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/memory/decisions?${params}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/memory/decisions/stats/overview?workspace_id=${workspaceId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      ]);

      if (decisionsRes.ok) {
        const data = await decisionsRes.json();
        setDecisions(data.decisions);
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch decisions:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, filterType, filterStatus, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;
      await authFetch(`/api/memory/decisions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
      toast({ title: "Status updated" });
    } catch (error) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;
      await authFetch(`/api/memory/decisions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setDecisions((prev) => prev.filter((d) => d.id !== id));
      toast({ title: "Deleted" });
    } catch (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-red-500">{stats.overdue}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Decisions</p>
            <p className="text-2xl font-bold">{stats.byType.decision || 0}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Action Items</p>
            <p className="text-2xl font-bold">
              {stats.byType.action_item || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search decisions, action items..."
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterType}
          onChange={(e: any) => setFilterType(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          <option value="decision">Decisions</option>
          <option value="action_item">Action Items</option>
          <option value="blocker">Blockers</option>
          <option value="insight">Insights</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e: any) => setFilterStatus(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> New
        </Button>
      </div>

      {/* Decision List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : decisions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No decisions yet</p>
          <p className="text-sm">
            Create one or analyze meeting transcripts to extract them
            automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map((d) => {
            const config = TYPE_CONFIG[d.type] || TYPE_CONFIG.decision;
            const Icon = config.icon;
            return (
              <div
                key={d.id}
                className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm">{d.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status] || STATUS_COLORS.open}`}
                      >
                        {d.status.replace("_", " ")}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[d.priority] || PRIORITY_COLORS.medium}`}
                      >
                        {d.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {d.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {d.assignee && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {d.assignee}
                        </span>
                      )}
                      {d.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{" "}
                          {new Date(d.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {d.transcript && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {d.transcript.title}
                        </span>
                      )}
                      {d.project && (
                        <span className="flex items-center gap-1">
                          <Link2 className="w-3 h-3" /> {d.project.title}
                        </span>
                      )}
                      <span>{timeAgo(d.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <select
                      value={d.status}
                      onChange={(e: any) =>
                        handleStatusChange(d.id, e.target.value)
                      }
                      className="rounded border bg-background px-2 py-1 text-xs"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Decision Modal */}
      {showCreateModal && (
        <CreateDecisionModal
          workspaceId={workspaceId}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function CreateDecisionModal({
  workspaceId,
  onClose,
  onCreated,
}: {
  workspaceId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    type: "decision",
    title: "",
    description: "",
    assignee: "",
    priority: "medium",
    due_date: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.description) {
      toast({
        title: "Title and description are required",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;
      const res = await authFetch("/api/memory/decisions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          ...form,
          assignee: form.assignee || undefined,
          due_date: form.due_date || undefined,
        }),
      });
      if (res.ok) {
        toast({ title: "Created successfully" });
        onCreated();
      } else {
        toast({ title: "Failed to create", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to create", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border shadow-xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-semibold">New Decision / Action Item</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Type</label>
            <select
              value={form.type}
              onChange={(e: any) =>
                setForm((f) => ({ ...f, type: e.target.value }))
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm mt-1"
            >
              <option value="decision">Decision</option>
              <option value="action_item">Action Item</option>
              <option value="blocker">Blocker</option>
              <option value="insight">Insight</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Priority</label>
            <select
              value={form.priority}
              onChange={(e: any) =>
                setForm((f) => ({ ...f, priority: e.target.value }))
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm mt-1"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Title</label>
          <Input
            value={form.title}
            onChange={(e: any) =>
              setForm((f) => ({ ...f, title: e.target.value }))
            }
            placeholder="What was decided / what needs to be done"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e: any) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Details and context..."
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm mt-1 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Assignee</label>
            <Input
              value={form.assignee}
              onChange={(e: any) =>
                setForm((f) => ({ ...f, assignee: e.target.value }))
              }
              placeholder="Person responsible"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Due Date</label>
            <Input
              type="date"
              value={form.due_date}
              onChange={(e: any) =>
                setForm((f) => ({ ...f, due_date: e.target.value }))
              }
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActivityTab({ workspaceId }: { workspaceId: string }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const token = (await supabase.auth.getSession()).data.session
          ?.access_token;
        const params = new URLSearchParams({
          workspace_id: workspaceId,
          limit: "100",
        });
        if (filterType) params.set("entity_type", filterType);

        const res = await authFetch(`/api/memory/activity?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.items);
        }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [workspaceId, filterType]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {[
          "",
          "project",
          "task",
          "decision",
          "document",
          "integration",
          "meeting",
        ].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            {t || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No activity yet</p>
          <p className="text-sm">
            Activity from your workspace and connected tools will appear here.
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-1">
            {items.map((item) => {
              const actionColor =
                item.action === "completed"
                  ? "bg-emerald-500"
                  : item.action === "created"
                    ? "bg-blue-500"
                    : item.action === "decided"
                      ? "bg-purple-500"
                      : "bg-muted-foreground";
              return (
                <div key={item.id} className="relative pl-10 py-3">
                  <div
                    className={`absolute left-2.5 top-4 w-3 h-3 rounded-full ${actionColor} ring-2 ring-background`}
                  />
                  <div className="rounded-xl border bg-card p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-2">
                      <ActionIcon action={item.action} />
                      <span className="font-medium text-sm">
                        {item.user?.full_name || item.user?.email || "System"}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {item.action}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {item.entityType}
                      </span>
                      {item.entityTitle && (
                        <span className="font-medium text-sm truncate max-w-[200px]">
                          {item.entityTitle}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    )}
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TranscriptsTab({ workspaceId }: { workspaceId: string }) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const fetchTranscripts = async () => {
      try {
        const token = (await supabase.auth.getSession()).data.session
          ?.access_token;
        const res = await authFetch(
          `/api/memory/transcripts?workspace_id=${workspaceId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setTranscripts(data.transcripts);
        }
      } catch (error) {
        console.error("Failed to fetch transcripts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTranscripts();
  }, [workspaceId]);

  const handleAnalyze = async (id: string) => {
    setAnalyzing(id);
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;
      const res = await authFetch(`/api/memory/transcripts/${id}/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({
          title: "Analysis complete",
          description: "Decisions and action items extracted.",
        });
        // Refresh the list
        const listRes = await authFetch(
          `/api/memory/transcripts?workspace_id=${workspaceId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (listRes.ok) {
          const data = await listRes.json();
          setTranscripts(data.transcripts);
        }
      }
    } catch {
      toast({ title: "Analysis failed", variant: "destructive" });
    } finally {
      setAnalyzing(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowUpload(true)} size="sm">
          <Upload className="w-4 h-4 mr-1" /> Upload Transcript
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : transcripts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No transcripts yet</p>
          <p className="text-sm">
            Upload meeting transcripts to extract decisions and action items
            automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transcripts.map((t) => (
            <div key={t.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {SOURCE_ICONS[t.source] || "📝"}
                    </span>
                    <h3 className="font-medium">{t.title}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground capitalize">
                      {t.source}
                    </span>
                  </div>
                  {t.summary && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                      {t.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {t.duration_min && <span>{t.duration_min} min</span>}
                    {t.participants.length > 0 && (
                      <span>{t.participants.length} participants</span>
                    )}
                    {t.meeting_date && (
                      <span>
                        {new Date(t.meeting_date).toLocaleDateString()}
                      </span>
                    )}
                    <span>{t.decisions.length} decisions extracted</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAnalyze(t.id)}
                  disabled={analyzing === t.id}
                >
                  {analyzing === t.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1" />
                  )}
                  {t.decisions.length > 0 ? "Re-analyze" : "Analyze"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadTranscriptModal
          workspaceId={workspaceId}
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false);
            setLoading(true);
            // Refresh
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) {
                fetch(
                  `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/memory/transcripts?workspace_id=${workspaceId}`,
                  {
                    headers: {
                      Authorization: `Bearer ${session.access_token}`,
                    },
                  },
                )
                  .then((r) => r.json())
                  .then((d) => {
                    setTranscripts(d.transcripts);
                    setLoading(false);
                  });
              }
            });
          }}
        />
      )}
    </div>
  );
}

function UploadTranscriptModal({
  workspaceId,
  onClose,
  onUploaded,
}: {
  workspaceId: string;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    source: "manual",
    content: "",
    participants: "",
    duration_min: "",
    meeting_date: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.content) {
      toast({
        title: "Title and content are required",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;
      const res = await authFetch("/api/memory/transcripts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          title: form.title,
          source: form.source,
          content: form.content,
          participants: form.participants
            ? form.participants.split(",").map((p) => p.trim())
            : [],
          duration_min: form.duration_min
            ? parseInt(form.duration_min)
            : undefined,
          meeting_date: form.meeting_date || undefined,
        }),
      });
      if (res.ok) {
        toast({ title: "Transcript uploaded" });
        onUploaded();
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border shadow-xl max-w-lg w-full p-6 space-y-4">
        <h2 className="text-lg font-semibold">Upload Meeting Transcript</h2>
        <div>
          <label className="text-sm font-medium">Title</label>
          <Input
            value={form.title}
            onChange={(e: any) =>
              setForm((f) => ({ ...f, title: e.target.value }))
            }
            placeholder="Meeting title"
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Source</label>
            <select
              value={form.source}
              onChange={(e: any) =>
                setForm((f) => ({ ...f, source: e.target.value }))
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm mt-1"
            >
              <option value="manual">Manual</option>
              <option value="zoom">Zoom</option>
              <option value="otter">Otter.ai</option>
              <option value="teams">Microsoft Teams</option>
              <option value="external">External</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Duration (min)</label>
            <Input
              type="number"
              value={form.duration_min}
              onChange={(e: any) =>
                setForm((f) => ({ ...f, duration_min: e.target.value }))
              }
              placeholder="60"
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">
            Participants (comma-separated)
          </label>
          <Input
            value={form.participants}
            onChange={(e: any) =>
              setForm((f) => ({ ...f, participants: e.target.value }))
            }
            placeholder="Alice, Bob, Charlie"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Transcript Content</label>
          <textarea
            value={form.content}
            onChange={(e: any) =>
              setForm((f) => ({ ...f, content: e.target.value }))
            }
            placeholder="Paste the full meeting transcript here..."
            rows={8}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm mt-1 resize-none font-mono"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummariesTab({ workspaceId }: { workspaceId: string }) {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("daily");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const token = (await supabase.auth.getSession()).data.session
          ?.access_token;
        const res = await authFetch(
          `/api/memory/summaries?workspace_id=${workspaceId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setSummaries(data.summaries);
        }
      } catch (error) {
        console.error("Failed to fetch summaries:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummaries();
  }, [workspaceId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;
      const res = await authFetch("/api/memory/summaries/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          summary_type: selectedType,
        }),
      });
      if (res.ok) {
        const summary = await res.json();
        setSummaries((prev) => [summary, ...prev]);
        toast({ title: "Summary generated" });
      }
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handlePin = async (id: string) => {
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;
      await authFetch(`/api/memory/summaries/${id}/pin`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummaries((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_pinned: !s.is_pinned } : s)),
      );
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;
      await authFetch(`/api/memory/summaries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummaries((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Deleted" });
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={selectedType}
          onChange={(e: any) => setSelectedType(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="daily">Daily Summary</option>
          <option value="weekly">Weekly Summary</option>
          <option value="project">Project Summary</option>
          <option value="meeting">Meeting Summary</option>
          <option value="custom">Custom Summary</option>
        </select>
        <Button onClick={handleGenerate} disabled={generating} size="sm">
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Sparkles className="w-4 h-4 mr-1" />
          )}
          Generate
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : summaries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No summaries yet</p>
          <p className="text-sm">
            Generate your first summary to get insights from your workspace.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {summaries.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border bg-card overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30"
                onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
              >
                <div className="flex items-center gap-3">
                  {s.is_pinned && <Pin className="w-4 h-4 text-amber-500" />}
                  <div>
                    <h3 className="font-medium text-sm">{s.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {s.summary_type} &middot; {timeAgo(s.generated_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e: any) => {
                      e.stopPropagation();
                      handlePin(s.id);
                    }}
                    className="p-1.5 rounded hover:bg-muted"
                  >
                    <Pin
                      className={`w-3 h-3 ${s.is_pinned ? "text-amber-500" : "text-muted-foreground"}`}
                    />
                  </button>
                  <button
                    onClick={(e: any) => {
                      e.stopPropagation();
                      handleDelete(s.id);
                    }}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {expandedId === s.id ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              {expandedId === s.id && (
                <div className="px-4 pb-4 border-t">
                  <div className="prose prose-sm dark:prose-invert max-w-none pt-3 whitespace-pre-wrap text-sm">
                    {s.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Authenticated Fetch Helper
// ============================================================

async function authFetch(url: string, options: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// ============================================================
// Main Page
// ============================================================

export default function MemoryPage() {
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("decisions");
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const token = (await supabase.auth.getSession()).data.session
          ?.access_token;
        if (!token) return;

        const res = await authFetch("/api/workspaces?limit=1", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setWorkspaceId(data[0].id);
          } else if (data.workspaces && data.workspaces.length > 0) {
            setWorkspaceId(data.workspaces[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load workspace:", error);
      } finally {
        setLoadingWorkspace(false);
      }
    };
    loadWorkspace();
  }, []);

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: "decisions", label: "Decisions & Actions", icon: Brain },
    { id: "activity", label: "Activity Feed", icon: Activity },
    { id: "transcripts", label: "Transcripts", icon: FileText },
    { id: "summaries", label: "Summaries", icon: BarChart3 },
  ];

  if (loadingWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No workspace found</p>
        <p className="text-sm">
          Create a workspace to start using the Memory Layer.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6" />
          Memory Layer
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your team&apos;s collective knowledge — decisions, activity, meeting
          insights, and summaries.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "decisions" && <DecisionsTab workspaceId={workspaceId} />}
      {activeTab === "activity" && <ActivityTab workspaceId={workspaceId} />}
      {activeTab === "transcripts" && (
        <TranscriptsTab workspaceId={workspaceId} />
      )}
      {activeTab === "summaries" && <SummariesTab workspaceId={workspaceId} />}
    </div>
  );
}
