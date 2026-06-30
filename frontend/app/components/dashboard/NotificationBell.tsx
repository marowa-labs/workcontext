"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import Link from "next/link";
import {
  Bell,
  Check,
  X,
  Search,
  AlertCircle,
  Info,
  CheckCircle,
  FileText,
  Users,
  Zap,
  CreditCard,
  MessageSquare,
  Clock as Snooze,
  Archive,
  Clock,
  CheckCheck,
  BellOff,
} from "lucide-react";
import NotificationService from "../../lib/utils/notificationService";
import { Button } from "../ui/button";

// ── Shared priority logic ─────────────────────────────────────────────────────
// Used by both NotificationBell and InboxPanel so priority grouping is consistent.

const HIGH_PRIORITY_TYPES = [
  "comment",
  "mention",
  "document_change",
  "document_shared",
  "new_collaborator",
  "permission_change",
  "comment_resolved",
  "real_time_edit",
  "plagiarism_complete",
  "ai_limit",
  "payment_failed",
  "subscription_expiring",
  "security_alert",
  "document_deadline",
  "ai_suggestion",
  "citation_reminder",
  "collaborator_request",
  "collaboration_invite",
  "collaboration_invite_accepted",
  "collaboration_invite_declined",
  "collaboration_removed",
  "comment_added",
  "document_exported",
  "writing_streak",
  "goal_achieved",
  "invoice_available",
];

const MEDIUM_PRIORITY_TYPES = [
  "new_feature",
  "weekly_summary",
  "payment_success",
  "subscription_renewed",
  "new_feature_announcement",
  "product_tip",
  "research_update",
  "template_update",
  "collaboration_session_started",
  "collaboration_session_ended",
  "subscription_created",
  "subscription_updated",
  "subscription_resumed",
  "payment_refunded",
  "backup_available",
  "document_version",
  "template_created",
  "template_updated",
  "template_deleted",
  "template_used",
  "template_shared",
  "template_downloaded",
  "template_reviewed",
  "template_review_updated",
  "template_review_deleted",
  "template_shared_with_you",
  "template_share_updated",
  "template_share_removed",
  "template_share_removed_for_you",
  "template_versioned",
  "template_restored",
  "template_version_deleted",
  "template_featured",
  "template_categorized",
  "template_uncategorized",
  "template_exported",
  "template_imported",
  "template_batch_exported",
  "template_batch_imported",
  "template_preview_generated",
  "template_preview_updated",
  "template_preview_deleted",
];

const LOW_PRIORITY_TYPES = ["newsletter", "special_offer"];

export function getNotificationPriority(
  type: string,
): "high" | "medium" | "low" {
  if (HIGH_PRIORITY_TYPES.includes(type)) return "high";
  if (MEDIUM_PRIORITY_TYPES.includes(type)) return "medium";
  if (LOW_PRIORITY_TYPES.includes(type)) return "low";
  return "low";
}

// ── NotificationBell Component ────────────────────────────────────────────────

interface NotificationBellProps {
  isPinned?: boolean;
  onPinChange?: (pinned: boolean) => void;
  sidebarCollapsed?: boolean;
  /** When true, renders inline instead of as a portal overlay */
  renderInline?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  isPinned: externalPinned,
  onPinChange,
  sidebarCollapsed = false,
  renderInline = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalPinned, setInternalPinned] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Use external pinned state if provided, otherwise use internal
  const isPinned =
    externalPinned !== undefined ? externalPinned : internalPinned;

  const handlePinToggle = () => {
    const newPinned = !isPinned;
    if (externalPinned === undefined) {
      setInternalPinned(newPinned);
    }
    onPinChange?.(newPinned);
  };

  const fetchNotifications = useCallback(
    async (limit: number, offset: number, filters?: any) => {
      setLoading(true);
      try {
        const result = await NotificationService.getNotifications(
          limit,
          offset,
          filters,
        );
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch notifications",
        );
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      // Refresh notifications to reflect the change
      const filters: any = {};
      if (filter !== "all") filters.priority = filter;
      if (searchQuery) filters.search = searchQuery;
      fetchNotifications(5, 0, filters);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark notification as read",
      );
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      // Refresh notifications to reflect the change
      const filters: any = {};
      if (filter !== "all") filters.priority = filter;
      if (searchQuery) filters.search = searchQuery;
      fetchNotifications(5, 0, filters);
      setUnreadCount(0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark all notifications as read",
      );
      console.error("Error marking all notifications as read:", err);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      await NotificationService.dismissNotification(notificationId);
      // Remove the notification from the local state
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to dismiss notification",
      );
      console.error("Error dismissing notification:", err);
    }
  };

  const snoozeNotification = async (
    notificationId: string,
    hours: number = 1,
  ) => {
    try {
      await NotificationService.snoozeNotification(notificationId, hours);
      // Remove the notification from the local state
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to snooze notification",
      );
      console.error("Error snoozing notification:", err);
    }
  };

  // Connect to WebSocket when component mounts
  useEffect(() => {
    // Connect to notification WebSocket
    void (async () => {
      await NotificationService.connectWebSocket();
    })();

    // Listen for real-time notifications
    const handleNotification = (notification: any) => {
      // Refresh notifications when a new one arrives
      const filters: any = {};
      if (filter !== "all") filters.priority = filter;
      if (searchQuery) filters.search = searchQuery;
      void fetchNotifications(5, 0, filters);
    };

    // Listen for real-time unread count updates
    const handleUnreadCount = (count: number) => {
      setUnreadCount(count);
    };

    // Add event listeners for notifications and count
    NotificationService.on("notification", handleNotification);
    NotificationService.on("notification_count", handleUnreadCount);

    // Initial fetch of unread count on mount
    void (async () => {
      try {
        const count = await NotificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        console.error("Failed to fetch initial unread count:", err);
      }
    })();

    // Cleanup function
    return () => {
      NotificationService.off("notification", handleNotification);
      NotificationService.off("notification_count", handleUnreadCount);
    };
  }, [fetchNotifications]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const filters: any = {};
      if (filter !== "all") filters.priority = filter;
      if (searchQuery) filters.search = searchQuery;
      fetchNotifications(5, 0, filters); // Fetch first 5 notifications with filters
    }
  }, [isOpen, filter, searchQuery, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get priority level for notification - uses shared logic
  const getPriority = getNotificationPriority;

  // Get icon for notification type
  const getIcon = (type: string) => {
    switch (type) {
      case "comment":
      case "mention":
      case "comment_added":
      case "comment_resolved":
        return <MessageSquare className="h-4 w-4" />;
      case "document_change":
      case "document_shared":
      case "document_version":
      case "document_deadline":
      case "document_exported":
      case "backup_available":
        return <FileText className="h-4 w-4" />;
      case "new_collaborator":
      case "permission_change":
      case "collaborator_request":
      case "collaboration_invite":
      case "collaboration_invite_accepted":
      case "collaboration_invite_declined":
      case "collaboration_removed":
        return <Users className="h-4 w-4" />;
      case "plagiarism_complete":
      case "ai_suggestion":
      case "ai_limit":
      case "new_feature":
      case "new_feature_announcement":
      case "product_tip":
      case "real_time_edit":
      case "editor_activity":
        return <Zap className="h-4 w-4" />;
      case "payment_success":
      case "payment_failed":
      case "subscription_renewed":
      case "subscription_expiring":
      case "subscription_created":
      case "subscription_updated":
      case "subscription_cancelled":
      case "subscription_resumed":
      case "subscription_expired":
      case "payment_refunded":
      case "invoice_available":
        return <CreditCard className="h-4 w-4" />;
      case "security_alert":
        return <AlertCircle className="h-4 w-4" />;
      case "writing_streak":
      case "goal_achieved":
      case "xp_earned":
        return <CheckCircle className="h-4 w-4" />;
      case "weekly_summary":
      case "research_update":
      case "citation_reminder":
      case "newsletter":
      case "special_offer":
        return <Info className="h-4 w-4" />;
      case "template_created":
      case "template_updated":
      case "template_deleted":
      case "template_used":
      case "template_shared":
      case "template_downloaded":
      case "template_reviewed":
      case "template_review_updated":
      case "template_review_deleted":
      case "template_shared_with_you":
      case "template_share_updated":
      case "template_share_removed":
      case "template_share_removed_for_you":
      case "template_versioned":
      case "template_restored":
      case "template_version_deleted":
      case "template_featured":
      case "template_categorized":
      case "template_uncategorized":
      case "template_exported":
      case "template_imported":
      case "template_batch_exported":
      case "template_batch_imported":
      case "template_preview_generated":
      case "template_preview_updated":
      case "template_preview_deleted":
      case "template_update":
        return <FileText className="h-4 w-4" />;
      case "collaboration_session_started":
      case "collaboration_session_ended":
        return <Users className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Get icon background color for notification type
  const getIconBg = (type: string) => {
    if (
      ["comment", "mention", "comment_added", "comment_resolved"].includes(type)
    )
      return "bg-blue-100 text-blue-600";
    if (
      [
        "document_change",
        "document_shared",
        "document_version",
        "document_deadline",
        "document_exported",
        "backup_available",
      ].includes(type)
    )
      return "bg-amber-100 text-amber-600";
    if (
      [
        "new_collaborator",
        "permission_change",
        "collaborator_request",
        "collaboration_invite",
        "collaboration_invite_accepted",
        "collaboration_invite_declined",
        "collaboration_removed",
      ].includes(type)
    )
      return "bg-violet-100 text-violet-600";
    if (
      [
        "plagiarism_complete",
        "ai_suggestion",
        "ai_limit",
        "new_feature",
        "new_feature_announcement",
        "product_tip",
        "real_time_edit",
        "editor_activity",
      ].includes(type)
    )
      return "bg-cyan-100 text-cyan-600";
    if (
      [
        "payment_success",
        "payment_failed",
        "subscription_renewed",
        "subscription_expiring",
        "subscription_created",
        "subscription_updated",
        "subscription_cancelled",
        "subscription_resumed",
        "subscription_expired",
        "payment_refunded",
        "invoice_available",
      ].includes(type)
    )
      return "bg-green-100 text-green-600";
    if (["security_alert"].includes(type)) return "bg-red-100 text-red-600";
    return "bg-slate-100 text-slate-500";
  };

  // Format time ago string
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

  // Get priority color
  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      case "medium":
        return "border-l-yellow-500";
      case "low":
        return "border-l-blue-500";
      default:
        return "border-l-gray-300";
    }
  };

  // Group notifications by priority
  const groupNotificationsByPriority = () => {
    const highPriority: typeof notifications = [];
    const mediumPriority: typeof notifications = [];
    const lowPriority: typeof notifications = [];

    if (filter === "all") {
      // When showing all, categorize all notifications by their actual priority
      notifications.forEach((notification) => {
        const priority = getPriority(notification.type);
        switch (priority) {
          case "high":
            highPriority.push(notification);
            break;
          case "medium":
            mediumPriority.push(notification);
            break;
          case "low":
            lowPriority.push(notification);
            break;
        }
      });
    } else {
      // When filtered by priority, put all notifications in the array that matches the filter
      // Since the backend already filters by priority, all notifications should match the filter
      notifications.forEach((notification) => {
        // Put notification in the array that matches the current filter
        switch (filter) {
          case "high":
            highPriority.push(notification);
            break;
          case "medium":
            mediumPriority.push(notification);
            break;
          case "low":
            lowPriority.push(notification);
            break;
        }
      });
    }

    return { highPriority, mediumPriority, lowPriority };
  };

  // Get priority label
  const getPriorityLabel = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "High Priority";
      case "medium":
        return "Medium Priority";
      case "low":
        return "Low Priority";
      default:
        return "Notifications";
    }
  };

  // Notification group component for inline inbox
  const NotificationGroup = ({
    label,
    notifications: groupNotifications,
    onMarkRead,
    onDismiss,
    onSnooze,
  }: {
    label: string;
    notifications: typeof notifications;
    onMarkRead: (id: string) => void;
    onDismiss: (id: string) => void;
    onSnooze: (id: string) => void;
  }) => {
    if (groupNotifications.length === 0) return null;
    return (
      <div className="border-b border-border">
        <div className="px-4 py-2 bg-muted/30">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label} ({groupNotifications.length})
          </span>
        </div>
        {groupNotifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer ${
              !n.read ? "bg-primary/5" : ""
            }`}
            onClick={() => !n.read && onMarkRead(n.id)}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${getIconBg(n.type)}`}
            >
              {getIcon(n.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p
                  className={`text-sm font-medium truncate ${
                    !n.read ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {n.title}
                </p>
                {!n.read && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {n.message}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {timeAgo(n.created_at)}
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!n.read && (
                <button
                  title="Mark as read"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead(n.id);
                  }}
                  className="p-1 rounded hover:bg-emerald-100 text-muted-foreground hover:text-emerald-600"
                >
                  <CheckCheck className="w-3 h-3" />
                </button>
              )}
              <button
                title="Snooze 1h"
                onClick={(e) => {
                  e.stopPropagation();
                  onSnooze(n.id);
                }}
                className="p-1 rounded hover:bg-amber-100 text-muted-foreground hover:text-amber-600"
              >
                <Clock className="w-3 h-3" />
              </button>
              <button
                title="Dismiss"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(n.id);
                }}
                className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render notification inbox content for inline (pinned) mode
  const renderInboxContent = () => {
    const { highPriority, mediumPriority, lowPriority } =
      groupNotificationsByPriority();

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:underline px-2 py-1"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border">
          {(["all", "high", "medium", "low"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-2 py-1 rounded capitalize ${
                filter === f
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BellOff className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <>
              {highPriority.length > 0 && (
                <NotificationGroup
                  label={getPriorityLabel("high")}
                  notifications={highPriority}
                  onMarkRead={markAsRead}
                  onDismiss={dismissNotification}
                  onSnooze={snoozeNotification}
                />
              )}
              {mediumPriority.length > 0 && (
                <NotificationGroup
                  label={getPriorityLabel("medium")}
                  notifications={mediumPriority}
                  onMarkRead={markAsRead}
                  onDismiss={dismissNotification}
                  onSnooze={snoozeNotification}
                />
              )}
              {lowPriority.length > 0 && (
                <NotificationGroup
                  label={getPriorityLabel("low")}
                  notifications={lowPriority}
                  onMarkRead={markAsRead}
                  onDismiss={dismissNotification}
                  onSnooze={snoozeNotification}
                />
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Bell Button - always visible */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
        )}
      </button>

      {/* Inline Inbox Panel (for pinned mode) */}
      {renderInline && isOpen && (
        <div className="w-full h-full bg-background flex flex-col">
          {renderInboxContent()}
        </div>
      )}

      {/* Full Screen Modal Overlay - Portal to render outside sidebar (non-pinned) */}
      {!renderInline &&
        !isPinned &&
        isOpen &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[100] flex pointer-events-none">
            {/* Backdrop - only covers area to the RIGHT of the inbox panel */}
            <div
              className={`absolute inset-0 bg-black/10 backdrop-blur-[2px] pointer-events-auto ${
                sidebarCollapsed
                  ? "lg:left-[calc(5rem+28rem)]"
                  : "lg:left-[calc(16rem+28rem)]"
              }`}
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Panel - Positioned next to sidebar on desktop */}
            <div
              className={`relative w-full max-w-[28rem] bg-background shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-300 z-10 pointer-events-auto ${
                sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Inbox</h2>
                <div className="flex items-center gap-1">
                  {/* Pin button */}
                  <button
                    onClick={handlePinToggle}
                    className={`p-2 hover:bg-muted rounded-lg transition-colors ${isPinned ? "text-blue-500 bg-blue-500/10" : "text-muted-foreground"}`}
                    aria-label="Pin inbox"
                    title={isPinned ? "Unpin inbox" : "Pin inbox"}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2v10M5 12h14M12 12l-4 8M12 12l4 8" />
                    </svg>
                  </button>

                  {/* Filter dropdown button */}
                  <div className="relative" ref={filterDropdownRef}>
                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className={`p-2 hover:bg-muted rounded-lg transition-colors ${showFilterDropdown ? "text-blue-500 bg-blue-500/10" : "text-muted-foreground"}`}
                      aria-label="Filter notifications"
                      title="Filter notifications"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                      </svg>
                    </button>

                    {/* Filter Dropdown Menu */}
                    {showFilterDropdown && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-background rounded-lg shadow-lg border border-border py-1 z-50">
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                          Filter
                        </div>
                        <button
                          onClick={() => {
                            setFilter("all");
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted ${filter === "all" ? "text-blue-600 bg-blue-500/10" : "text-foreground"}`}
                        >
                          <Check className="w-4 h-4" />
                          All notifications
                          {filter === "all" && (
                            <Check className="w-4 h-4 ml-auto" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setFilter("high");
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted ${filter === "high" ? "text-blue-600 bg-blue-500/10" : "text-foreground"}`}
                        >
                          <AlertCircle className="w-4 h-4" />
                          High priority
                          {filter === "high" && (
                            <Check className="w-4 h-4 ml-auto" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setFilter("medium");
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted ${filter === "medium" ? "text-blue-600 bg-blue-500/10" : "text-foreground"}`}
                        >
                          <Info className="w-4 h-4" />
                          Medium priority
                          {filter === "medium" && (
                            <Check className="w-4 h-4 ml-auto" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setFilter("low");
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted ${filter === "low" ? "text-blue-600 bg-blue-500/10" : "text-foreground"}`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Low priority
                          {filter === "low" && (
                            <Check className="w-4 h-4 ml-auto" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                    aria-label="Close inbox"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-muted border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-foreground"
                  />
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="p-4 text-center text-foreground">
                    Loading notifications...
                  </div>
                ) : error ? (
                  <div className="p-4 text-center text-red-500">
                    Error: {error}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-foreground">
                    No notifications
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {(() => {
                      const { highPriority, mediumPriority, lowPriority } =
                        groupNotificationsByPriority();
                      const sections = [
                        { priority: "high", notifications: highPriority },
                        { priority: "medium", notifications: mediumPriority },
                        { priority: "low", notifications: lowPriority },
                      ];

                      return sections.map(({ priority, notifications }) => {
                        if (filter !== "all" && priority !== filter) {
                          return null;
                        }

                        return (
                          <div key={priority} className="mb-4">
                            <h4 className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted">
                              {getPriorityLabel(
                                priority as "high" | "medium" | "low",
                              )}
                            </h4>
                            <ul className="divide-y divide-border">
                              {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                  <li
                                    key={notification.id}
                                    className={`p-4 hover:bg-muted transition-colors ${
                                      notification.read ? "opacity-75" : ""
                                    }`}
                                  >
                                    <div className="flex items-start space-x-3">
                                      <div
                                        className={`flex-shrink-0 mt-1 ${getPriorityColor(
                                          notification.priority,
                                        )}`}
                                      >
                                        {getIcon(notification.type)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                          {notification.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {notification.message}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                          <span className="text-xs text-muted-foreground">
                                            {formatDate(
                                              notification.created_at,
                                            )}
                                          </span>
                                          <div className="flex space-x-2">
                                            {!notification.read && (
                                              <button
                                                onClick={() =>
                                                  markAsRead(notification.id)
                                                }
                                                className="text-xs text-blue-600 hover:text-blue-700"
                                              >
                                                Mark as read
                                              </button>
                                            )}
                                            <button
                                              onClick={() =>
                                                snoozeNotification(
                                                  notification.id,
                                                )
                                              }
                                              className="text-xs text-muted-foreground hover:text-foreground flex items-center"
                                              aria-label="Snooze"
                                            >
                                              <Snooze className="h-3 w-3 mr-1" />
                                              Snooze
                                            </button>
                                            <button
                                              onClick={() =>
                                                dismissNotification(
                                                  notification.id,
                                                )
                                              }
                                              className="text-xs text-muted-foreground hover:text-foreground flex items-center"
                                              aria-label="Dismiss"
                                            >
                                              <Archive className="h-3 w-3 mr-1" />
                                              Dismiss
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </li>
                                ))
                              ) : (
                                <div className="p-4 text-center text-foreground">
                                  No{" "}
                                  {getPriorityLabel(
                                    priority as "high" | "medium" | "low",
                                  ).toLowerCase()}{" "}
                                  notifications
                                </div>
                              )}
                            </ul>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border text-center">
                <Link
                  href="/dashboard/notifications"
                  className="text-sm text-blue-600 hover:text-blue-700"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

/** Standalone inbox panel content — used in pinned sidebar */
export function InboxPanel({
  isPinned,
  onPinChange,
}: {
  isPinned?: boolean;
  onPinChange?: (pinned: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await NotificationService.getNotifications(50, 0, {});
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await NotificationService.markAsRead(id);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await NotificationService.markAllAsRead();
    fetchNotifications();
  };

  const dismissNotification = async (id: string) => {
    await NotificationService.dismissNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const snoozeNotification = async (id: string) => {
    await NotificationService.snoozeNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffH = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );
    if (diffH < 1) return "Just now";
    if (diffH < 24) return `${diffH}h ago`;
    return date.toLocaleDateString();
  };

  const getPriority = getNotificationPriority;

  const getIcon = (type: string) => {
    switch (type) {
      case "comment":
      case "mention":
      case "comment_added":
        return <MessageSquare className="h-4 w-4" />;
      case "document_change":
      case "document_shared":
        return <FileText className="h-4 w-4" />;
      case "new_collaborator":
      case "permission_change":
        return <Users className="h-4 w-4" />;
      case "payment_success":
      case "payment_failed":
        return <CreditCard className="h-4 w-4" />;
      case "security_alert":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "border-l-red-500";
    if (priority === "medium") return "border-l-amber-500";
    return "border-l-blue-500";
  };

  const getPriorityLabel = (p: string) => {
    if (p === "high") return "High Priority";
    if (p === "medium") return "Medium Priority";
    return "Low Priority";
  };

  const groupNotificationsByPriority = () => {
    const high: any[] = [],
      medium: any[] = [],
      low: any[] = [];
    notifications.forEach((n) => {
      const p = getPriority(n.type);
      if (p === "high") high.push(n);
      else if (p === "medium") medium.push(n);
      else low.push(n);
    });
    return { highPriority: high, mediumPriority: medium, lowPriority: low };
  };

  const { highPriority, mediumPriority, lowPriority } =
    groupNotificationsByPriority();

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Inbox</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-500 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={`p-2 hover:bg-muted rounded-lg transition-colors ${showFilterDropdown ? "text-blue-500" : "text-muted-foreground"}`}
            title="Filter"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {showFilterDropdown && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-background rounded-lg shadow-lg border border-border py-1 z-50">
              {(["all", "high", "medium", "low"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted ${filter === f ? "text-blue-500" : "text-foreground"}`}
                >
                  {f === "all"
                    ? "All"
                    : f === "high"
                      ? "High"
                      : f === "medium"
                        ? "Medium"
                        : "Low"}
                </button>
              ))}
            </div>
          )}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
              title="Mark all read"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {onPinChange && (
            <button
              onClick={() => onPinChange(!isPinned)}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
              title="Unpin inbox"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-foreground"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              { priority: "high" as const, items: highPriority },
              { priority: "medium" as const, items: mediumPriority },
              { priority: "low" as const, items: lowPriority },
            ]
              .filter(({ priority }) => filter === "all" || filter === priority)
              .map(({ priority, items }) => (
                <div key={priority}>
                  <h4 className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted rounded mb-2">
                    {getPriorityLabel(priority)}
                  </h4>
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      No {priority} priority
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {items
                        .filter(
                          (n) =>
                            !searchQuery ||
                            n.title
                              ?.toLowerCase()
                              .includes(searchQuery.toLowerCase()) ||
                            n.message
                              ?.toLowerCase()
                              .includes(searchQuery.toLowerCase()),
                        )
                        .map((n) => (
                          <li
                            key={n.id}
                            className={`p-3 rounded-lg hover:bg-muted transition-colors border-l-2 ${getPriorityColor(n.priority)} ${n.read ? "opacity-60" : ""}`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
                                {getIcon(n.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {n.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {n.message}
                                </p>
                                <div className="flex items-center justify-between mt-1.5">
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatDate(n.created_at)}
                                  </span>
                                  <div className="flex gap-1">
                                    {!n.read && (
                                      <button
                                        onClick={() => markAsRead(n.id)}
                                        className="text-[10px] text-blue-500 hover:text-blue-600"
                                      >
                                        Read
                                      </button>
                                    )}
                                    <button
                                      onClick={() => snoozeNotification(n.id)}
                                      className="text-[10px] text-muted-foreground hover:text-foreground"
                                    >
                                      <Snooze className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => dismissNotification(n.id)}
                                      className="text-[10px] text-muted-foreground hover:text-foreground"
                                    >
                                      <Archive className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border text-center shrink-0">
        <Link
          href="/dashboard/notifications"
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}

export default NotificationBell;
