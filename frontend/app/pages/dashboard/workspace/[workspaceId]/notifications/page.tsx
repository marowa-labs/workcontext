"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  X,
  Clock,
  Search,
  CheckSquare,
  Users,
  Zap,
  MessageSquare,
  FileText,
  AlertCircle,
  RefreshCw,
  BellOff,
} from "lucide-react";
import NotificationService, {
  Notification,
} from "../../../../../lib/utils/notificationService";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getIcon(type: string) {
  const cls = "w-4 h-4";
  if (["task_assigned", "task_completed", "task_overdue"].includes(type))
    return <CheckSquare className={cls} />;
  if (["comment", "mention", "comment_added"].includes(type))
    return <MessageSquare className={cls} />;
  if (
    [
      "new_collaborator",
      "collaboration_invite",
      "collaborator_request",
      "permission_change",
    ].includes(type)
  )
    return <Users className={cls} />;
  if (
    [
      "document_change",
      "document_shared",
      "document_version",
      "document_deadline",
    ].includes(type)
  )
    return <FileText className={cls} />;
  if (
    [
      "plagiarism_complete",
      "ai_suggestion",
      "ai_limit",
      "new_feature",
    ].includes(type)
  )
    return <Zap className={cls} />;
  if (["security_alert", "payment_failed"].includes(type))
    return <AlertCircle className={cls} />;
  return <Bell className={cls} />;
}

function getIconBg(type: string) {
  if (["task_assigned", "task_completed", "task_overdue"].includes(type))
    return "bg-emerald-100 text-emerald-600";
  if (["comment", "mention", "comment_added"].includes(type))
    return "bg-blue-100 text-blue-600";
  if (
    [
      "new_collaborator",
      "collaboration_invite",
      "collaborator_request",
      "permission_change",
    ].includes(type)
  )
    return "bg-violet-100 text-violet-600";
  if (
    [
      "document_change",
      "document_shared",
      "document_version",
      "document_deadline",
    ].includes(type)
  )
    return "bg-amber-100 text-amber-600";
  if (
    [
      "plagiarism_complete",
      "ai_suggestion",
      "ai_limit",
      "new_feature",
    ].includes(type)
  )
    return "bg-cyan-100 text-cyan-600";
  if (["security_alert", "payment_failed"].includes(type))
    return "bg-red-100 text-red-600";
  return "bg-slate-100 text-slate-500";
}

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "task_assigned", label: "Tasks" },
  { value: "comment", label: "Comments" },
  { value: "new_collaborator", label: "Collaboration" },
  { value: "document_shared", label: "Documents" },
];

// ─── Notification Card ─────────────────────────────────────────────────────────

function NotificationCard({
  n,
  selected,
  onSelect,
  onMarkRead,
  onDismiss,
  onSnooze,
}: {
  n: Notification;
  selected: boolean;
  onSelect: (id: string, v: boolean) => void;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string) => void;
}) {
  return (
    <div
      className={`group flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
        !n.read
          ? "border-primary/20 bg-primary/5 hover:bg-primary/10"
          : "border-border bg-card hover:bg-muted/40"
      } ${selected ? "ring-2 ring-primary/40" : ""}`}
      onClick={() => !n.read && onMarkRead(n.id)}>
      {/* Checkbox */}
      <div
        className="flex-shrink-0 mt-0.5"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(n.id, !selected);
        }}>
        <div
          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            selected
              ? "bg-primary border-primary"
              : "border-border group-hover:border-primary/50"
          }`}>
          {selected && (
            <svg
              className="w-2.5 h-2.5 text-primary-foreground"
              fill="currentColor"
              viewBox="0 0 12 12">
              <path
                d="M10 3L5 8.5 2 5.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Icon */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${getIconBg(n.type)}`}>
        {getIcon(n.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-semibold truncate ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
              {n.title}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
              {n.message}
            </p>
          </div>
          {/* Unread dot */}
          {!n.read && (
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground/60 mt-1.5">
          {timeAgo(n.created_at)}
        </p>
      </div>

      {/* Actions (visible on hover) */}
      <div
        className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}>
        {!n.read && (
          <button
            title="Mark as read"
            onClick={() => onMarkRead(n.id)}
            className="p-1.5 rounded-lg hover:bg-emerald-100 text-muted-foreground hover:text-emerald-600 transition-colors">
            <CheckCheck className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          title="Snooze 1h"
          onClick={() => onSnooze(n.id)}
          className="p-1.5 rounded-lg hover:bg-amber-100 text-muted-foreground hover:text-amber-600 transition-colors">
          <Clock className="w-3.5 h-3.5" />
        </button>
        <button
          title="Dismiss"
          onClick={() => onDismiss(n.id)}
          className="p-1.5 rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-500 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function WorkspaceNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      try {
        const filters: any = {};
        if (typeFilter !== "all") filters.type = typeFilter;
        if (readFilter === "unread") filters.read = false;
        if (readFilter === "read") filters.read = true;
        if (searchQuery) filters.search = searchQuery;

        const { notifications: ns, unreadCount: uc } =
          await NotificationService.getNotifications(50, 0, filters);
        setNotifications(ns);
        setUnreadCount(uc);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [typeFilter, readFilter, searchQuery],
  );

  // Load on mount and whenever filters change
  useEffect(() => {
    load();
  }, [load]);

  // Real-time: listen for new notifications
  useEffect(() => {
    NotificationService.connectWebSocket();
    const handler = (data: any) => {
      if (data?.notification) {
        setNotifications((prev) => [data.notification, ...prev]);
        setUnreadCount((c) => c + 1);
      }
    };
    const countHandler = (count: number) => setUnreadCount(count);
    NotificationService.on("notification", handler);
    NotificationService.on("notification_count", countHandler);
    return () => {
      NotificationService.off("notification", handler);
      NotificationService.off("notification_count", countHandler);
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await NotificationService.markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await NotificationService.markAllAsRead();
  };

  const handleDismiss = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await NotificationService.dismissNotification(id);
  };

  const handleSnooze = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await NotificationService.snoozeNotification(id, 1);
  };

  const handleSelect = (id: string, v: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      v ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  };

  const handleBulkMarkRead = async () => {
    const ids = [...selectedIds];
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) =>
      Math.max(
        0,
        c - notifications.filter((n) => ids.includes(n.id) && !n.read).length,
      ),
    );
    setSelectedIds(new Set());
    await NotificationService.bulkMarkAsRead(ids);
  };

  const handleBulkDismiss = async () => {
    const ids = [...selectedIds];
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
    setSelectedIds(new Set());
    await NotificationService.bulkDismiss(ids);
  };

  const allSelected =
    selectedIds.size === notifications.length && notifications.length > 0;

  return (
    <div className="p-6 min-h-screen bg-background max-w-6xl mx-auto flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center relative">
            <Bell className="w-5 h-5 text-violet-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
              Notifications
            </h1>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors">
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
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

        {/* Read filter */}
        <select
          value={readFilter}
          onChange={(e) => setReadFilter(e.target.value as any)}
          className="h-8 px-2 text-xs border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-muted-foreground">
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications…"
            className="h-8 pl-8 pr-3 text-xs w-full border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* ── Bulk toolbar ── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <span className="text-xs font-medium text-primary">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkMarkRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors">
              <CheckCheck className="w-3.5 h-3.5" />
              Mark read
            </button>
            <button
              onClick={handleBulkDismiss}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
              <X className="w-3.5 h-3.5" />
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Notification List ── */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <BellOff className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground font-medium">No notifications</p>
          <p className="text-muted-foreground/60 text-sm">
            {typeFilter !== "all" || readFilter !== "all" || searchQuery
              ? "Try adjusting your filters."
              : "You're all caught up! Notifications will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select all row */}
          <div className="flex items-center justify-between px-1 pb-1">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  allSelected ? "bg-primary border-primary" : "border-border"
                }`}>
                {allSelected && (
                  <svg
                    className="w-2.5 h-2.5 text-primary-foreground"
                    fill="currentColor"
                    viewBox="0 0 12 12">
                    <path
                      d="M10 3L5 8.5 2 5.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                )}
              </div>
              Select all
            </button>
            <span className="text-xs text-muted-foreground">
              {notifications.length} notification
              {notifications.length !== 1 ? "s" : ""}
            </span>
          </div>

          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              n={n}
              selected={selectedIds.has(n.id)}
              onSelect={handleSelect}
              onMarkRead={handleMarkRead}
              onDismiss={handleDismiss}
              onSnooze={handleSnooze}
            />
          ))}
        </div>
      )}
    </div>
  );
}
