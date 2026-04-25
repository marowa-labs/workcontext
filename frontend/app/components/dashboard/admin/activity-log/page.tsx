"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Activity,
  CheckSquare,
  MessageSquare,
  Users,
  FolderOpen,
  RefreshCw,
  Search,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { apiClient } from "../../../../lib/utils/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityActor {
  id: string;
  full_name: string | null;
  email: string;
}

interface ActivityEvent {
  id: string;
  type: "task" | "comment" | "member" | "project";
  action: string;
  actor: ActivityActor;
  target: { id: string; label: string; meta: string };
  timestamp: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d > 365 ? "numeric" : undefined,
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function isSameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function getInitials(actor: ActivityActor) {
  return actor.full_name
    ? actor.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : actor.email[0].toUpperCase();
}

// ─── Event config ─────────────────────────────────────────────────────────────

const EVENT_CONFIG = {
  task: {
    icon: <CheckSquare className="w-3.5 h-3.5" />,
    iconBg: "bg-emerald-100 text-emerald-600",
    color: "border-l-emerald-400",
    verb: (action: string) => action,
  },
  comment: {
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    iconBg: "bg-blue-100 text-blue-600",
    color: "border-l-blue-400",
    verb: (action: string) => action,
  },
  member: {
    icon: <Users className="w-3.5 h-3.5" />,
    iconBg: "bg-violet-100 text-violet-600",
    color: "border-l-violet-400",
    verb: (action: string) => action,
  },
  project: {
    icon: <FolderOpen className="w-3.5 h-3.5" />,
    iconBg: "bg-amber-100 text-amber-600",
    color: "border-l-amber-400",
    verb: (action: string) => action,
  },
} as const;

const TYPE_FILTERS = [
  { value: "all", label: "All Activity" },
  { value: "task", label: "Tasks" },
  { value: "comment", label: "Comments" },
  { value: "member", label: "Members" },
  { value: "project", label: "Projects" },
];

// ─── Event Row ────────────────────────────────────────────────────────────────

function EventRow({ event }: { event: ActivityEvent }) {
  const cfg = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.task;
  const actorName = event.actor?.full_name ?? event.actor?.email ?? "Unknown";
  const initials = event.actor ? getInitials(event.actor) : "?";

  return (
    <div
      className={`flex items-start gap-3 px-5 py-4 hover:bg-muted/30 transition-colors border-l-2 ${cfg.color}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-xs font-bold flex items-center justify-center">
        {initials}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">
          <span className="font-semibold">{actorName}</span>{" "}
          <span className="text-muted-foreground">
            {cfg.verb(event.action)}
          </span>{" "}
          <span className="font-medium truncate">{event.target.label}</span>
        </p>
        {event.target.meta && (
          <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
            {event.target.meta}
          </p>
        )}
      </div>

      {/* Right: type chip + time */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        <span
          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.iconBg}`}>
          {cfg.icon}
          {event.type}
        </span>
        <span className="text-[11px] text-muted-foreground/60">
          {timeAgo(event.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default function WorkspaceActivityLogPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);

  const load = useCallback(
    async (reset = false, showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);
      else if (reset) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(reset ? 0 : offset),
        });
        if (typeFilter !== "all") params.set("type", typeFilter);

        const data = await apiClient.get(
          `/api/workspaces/${workspaceId}/activity?${params}`,
        );
        const newEvents: ActivityEvent[] = data.events ?? [];

        setEvents((prev) => (reset ? newEvents : [...prev, ...newEvents]));
        setTotal(data.total ?? 0);
        if (reset) setOffset(PAGE_SIZE);
        else setOffset((o) => o + PAGE_SIZE);
      } catch (err) {
        console.error("Failed to load activity log:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [workspaceId, typeFilter, offset],
  );

  // Load on mount + filter change
  useEffect(() => {
    setOffset(0);
    setEvents([]);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, typeFilter]);

  // Client-side search filter
  const filtered = searchQuery
    ? events.filter(
        (e) =>
          e.actor?.full_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          e.actor?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.target.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.target.meta?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : events;

  const hasMore = events.length < total && !searchQuery;

  // Group events by day for date separators
  const grouped: { date: string; items: ActivityEvent[] }[] = [];
  filtered.forEach((e) => {
    const last = grouped[grouped.length - 1];
    if (last && isSameDay(last.date, e.timestamp)) {
      last.items.push(e);
    } else {
      grouped.push({ date: e.timestamp, items: [e] });
    }
  });

  return (
    <div className="p-8 bg-background min-h-screen w-full flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Activity className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
              Activity Log
            </h1>
            <p className="text-xs text-muted-foreground">
              {total} event{total !== 1 ? "s" : ""} · all workspace actions
            </p>
          </div>
        </div>
        <button
          onClick={() => load(true, true)}
          disabled={isRefreshing}
          className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors">
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type tabs */}
        <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                typeFilter === f.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by person, task, project…"
            className="h-8 pl-8 pr-3 text-xs w-full border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* ── Event List ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Activity className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium text-sm">
              No activity yet
            </p>
            <p className="text-muted-foreground/60 text-xs">
              {typeFilter !== "all" || searchQuery
                ? "Try adjusting your filters."
                : "Workspace actions will appear here as your team gets to work."}
            </p>
          </div>
        ) : (
          <>
            {grouped.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 px-5 py-2.5 bg-muted/30 border-b border-border/60">
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest flex-shrink-0">
                    {formatDate(group.date)}
                  </span>
                  <div className="h-px flex-1 bg-border/60" />
                </div>

                {/* Events in this day group */}
                <div className="divide-y divide-border/40">
                  {group.items.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center p-4 border-t border-border/40">
                <button
                  onClick={() => load(false)}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground">
                  {isLoadingMore ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  {isLoadingMore
                    ? "Loading…"
                    : `Load more (${total - events.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
