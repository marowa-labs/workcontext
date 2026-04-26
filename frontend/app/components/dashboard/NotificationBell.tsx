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
} from "lucide-react";
import NotificationService from "../../lib/utils/notificationService";
import { Button } from "../ui/button";

interface NotificationBellProps {
  isPinned?: boolean;
  onPinChange?: (pinned: boolean) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  isPinned: externalPinned,
  onPinChange,
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
  const isPinned = externalPinned !== undefined ? externalPinned : internalPinned;

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

  // Get priority level for notification - matches backend priority mapping
  const getPriority = (type: string): "high" | "medium" | "low" => {
    const highPriorityTypes = [
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
      "subscription_cancelled",
      "subscription_expired",
      "writing_streak",
      "goal_achieved",
      "invoice_available",
    ];

    const mediumPriorityTypes = [
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

    // Low priority notification types (explicitly defined for clarity)
    const lowPriorityTypes = ["newsletter", "special_offer"];

    if (highPriorityTypes.includes(type)) return "high";
    if (mediumPriorityTypes.includes(type)) return "medium";
    if (lowPriorityTypes.includes(type)) return "low";
    // All other notification types are considered low priority by default
    return "low";
  };

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

  return (
    <>
      {/* Bell Button - always visible */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {/* Full Screen Modal Overlay - Portal to render outside sidebar */}
      {isOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex pointer-events-none">
          {/* Backdrop - only covers area to the RIGHT of the inbox panel */}
          <div
            className="absolute inset-0 bg-black/10 backdrop-blur-[2px] lg:left-[calc(16rem+28rem)] pointer-events-auto"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Panel - Positioned next to sidebar on desktop */}
          <div className="relative w-full max-w-[28rem] bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-300 lg:ml-64 z-10 pointer-events-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Inbox</h2>
              <div className="flex items-center gap-1">
                {/* Pin button */}
                <button
                  onClick={handlePinToggle}
                  className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${isPinned ? "text-blue-500 bg-blue-50" : "text-gray-500"}`}
                  aria-label="Pin inbox"
                  title={isPinned ? "Unpin inbox" : "Pin inbox"}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v10M5 12h14M12 12l-4 8M12 12l4 8" />
                  </svg>
                </button>

                {/* Filter dropdown button */}
                <div className="relative" ref={filterDropdownRef}>
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${showFilterDropdown ? "text-blue-500 bg-blue-50" : "text-gray-500"}`}
                    aria-label="Filter notifications"
                    title="Filter notifications"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  </button>

                  {/* Filter Dropdown Menu */}
                  {showFilterDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                        Filter
                      </div>
                      <button
                        onClick={() => { setFilter("all"); setShowFilterDropdown(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${filter === "all" ? "text-blue-600 bg-blue-50" : "text-gray-700"}`}
                      >
                        <Check className="w-4 h-4" />
                        All notifications
                        {filter === "all" && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                      <button
                        onClick={() => { setFilter("high"); setShowFilterDropdown(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${filter === "high" ? "text-blue-600 bg-blue-50" : "text-gray-700"}`}
                      >
                        <AlertCircle className="w-4 h-4" />
                        High priority
                        {filter === "high" && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                      <button
                        onClick={() => { setFilter("medium"); setShowFilterDropdown(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${filter === "medium" ? "text-blue-600 bg-blue-50" : "text-gray-700"}`}
                      >
                        <Info className="w-4 h-4" />
                        Medium priority
                        {filter === "medium" && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                      <button
                        onClick={() => { setFilter("low"); setShowFilterDropdown(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${filter === "low" ? "text-blue-600 bg-blue-50" : "text-gray-700"}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Low priority
                        {filter === "low" && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Close button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                  aria-label="Close inbox"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="p-4 text-center text-gray-700">
                  Loading notifications...
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">Error: {error}</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-700">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
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
                          <h4 className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                            {getPriorityLabel(priority as "high" | "medium" | "low")}
                          </h4>
                          <ul className="divide-y divide-gray-100">
                            {notifications.length > 0 ? (
                              notifications.map((notification) => (
                                <li
                                  key={notification.id}
                                  className={`p-4 hover:bg-gray-50 transition-colors ${notification.read ? "opacity-75" : ""
                                    }`}>
                                  <div className="flex items-start space-x-3">
                                    <div
                                      className={`flex-shrink-0 mt-1 ${getPriorityColor(
                                        notification.priority,
                                      )}`}>
                                      {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {notification.title}
                                      </p>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {notification.message}
                                      </p>
                                      <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-gray-500">
                                          {formatDate(notification.created_at)}
                                        </span>
                                        <div className="flex space-x-2">
                                          {!notification.read && (
                                            <button
                                              onClick={() =>
                                                markAsRead(notification.id)
                                              }
                                              className="text-xs text-blue-600 hover:text-blue-800">
                                              Mark as read
                                            </button>
                                          )}
                                          <button
                                            onClick={() =>
                                              snoozeNotification(notification.id)
                                            }
                                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                                            aria-label="Snooze">
                                            <Snooze className="h-3 w-3 mr-1" />
                                            Snooze
                                          </button>
                                          <button
                                            onClick={() =>
                                              dismissNotification(notification.id)
                                            }
                                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                                            aria-label="Dismiss">
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
                              <div className="p-4 text-center text-gray-700">
                                No{" "}
                                {getPriorityLabel(priority as "high" | "medium" | "low").toLowerCase()}{" "}
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

            <div className="p-4 border-t border-gray-100 text-center">
              <Link
                href="/dashboard/notifications"
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default NotificationBell;
