"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
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
} from "lucide-react";
import NotificationService from "../../lib/utils/notificationService";
import { Button } from "../ui/button";

const NotificationBell: React.FC = () => {
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications">
        <Bell className="h-5 w-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-white z-50">
          <div className="p-4 border-b border-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-700">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800">
                  Mark all as read
                </Button>
              )}
            </div>
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 text-xs rounded-full ${filter === "all" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                All
              </button>
              <button
                onClick={() => setFilter("high")}
                className={`px-3 py-1 text-xs rounded-full ${filter === "high" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"}`}>
                High
              </button>
              <button
                onClick={() => setFilter("medium")}
                className={`px-3 py-1 text-xs rounded-full ${filter === "medium" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-700"}`}>
                Medium
              </button>
              <button
                onClick={() => setFilter("low")}
                className={`px-3 py-1 text-xs rounded-full ${filter === "low" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                Low
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
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

                  // Render sections based on filter
                  return sections.map(({ priority, notifications }) => {
                    // When filtered, only show the matching priority section
                    // When not filtered, show all sections
                    if (filter === "all" || filter === priority) {
                      return (
                        <div key={priority}>
                          <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-700">
                            {getPriorityLabel(priority as any)} (
                            {notifications.length})
                          </div>
                          {notifications.length > 0 ? (
                            <ul>
                              {notifications.map((notification) => {
                                const priorityLevel = getPriority(
                                  notification.type,
                                );
                                return (
                                  <li
                                    key={notification.id}
                                    className={`p-4 hover:bg-gray-50 border-l-4 ${getPriorityColor(priorityLevel)} ${!notification.read ? "bg-blue-50" : ""}`}>
                                    <div className="flex justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start">
                                          <div className="flex-shrink-0 mt-0.5 text-gray-700">
                                            {getIcon(notification.type)}
                                          </div>
                                          <div className="ml-3 flex-1">
                                            <p className="text-sm font-medium text-gray-700 truncate">
                                              {notification.title}
                                            </p>
                                            <p className="text-sm text-gray-700 mt-1">
                                              {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-700 mt-1">
                                              {formatDate(
                                                notification.created_at,
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex space-x-2 mt-2">
                                        {!notification.read && (
                                          <button
                                            onClick={() =>
                                              markAsRead(notification.id)
                                            }
                                            className="text-xs text-gray-700 hover:text-gray-700 flex items-center"
                                            aria-label="Mark as read">
                                            <Check className="h-3 w-3 mr-1" />
                                            Read
                                          </button>
                                        )}
                                        <button
                                          onClick={() =>
                                            snoozeNotification(
                                              notification.id,
                                              1,
                                            )
                                          }
                                          className="text-xs text-gray-700 hover:text-gray-700 flex items-center"
                                          aria-label="Snooze">
                                          <Snooze className="h-3 w-3 mr-1" />
                                          Snooze
                                        </button>
                                        <button
                                          onClick={() =>
                                            dismissNotification(notification.id)
                                          }
                                          className="text-xs text-gray-700 hover:text-gray-700 flex items-center"
                                          aria-label="Dismiss">
                                          <Archive className="h-3 w-3 mr-1" />
                                          Dismiss
                                        </button>
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <div className="p-4 text-center text-gray-700">
                              No{" "}
                              {getPriorityLabel(priority as any).toLowerCase()}{" "}
                              notifications
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  });
                })()}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white text-center">
            <Link
              href="/dashboard/notifications"
              className="text-sm text-blue-600 hover:text-blue-800">
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
