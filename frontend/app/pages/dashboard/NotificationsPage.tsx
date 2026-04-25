"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Check,
  X,
  MessageSquare,
  FileText,
  Users,
  Zap,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";

import NotificationService from "../../lib/utils/notificationService";
import { Button } from "../../components/ui/button";

const NotificationsPage: React.FC = () => {
  // Notifications functionality removed as per blueprint alignment
  const notifications: any[] = [];
  const unreadCount = 0;
  const loading = false;
  const error = null;
  const fetchNotifications = (...args: any[]) => {};
  const markAsRead = (...args: any[]) => {};
  const markAllAsRead = (...args: any[]) => {};

  // Fetch notifications on component mount and listen for real-time updates
  useEffect(() => {
    // Notifications functionality removed as per blueprint alignment
    // Fetch initial notifications
    fetchNotifications(50, 0); // Fetch first 50 notifications
  }, [fetchNotifications]);

  // Get priority level for notification
  const getPriority = (type: string): "high" | "medium" | "low" => {
    const highPriorityTypes = [
      "payment_failed",
      "security_alert",
      "subscription_expiring",
      "ai_limit",
      "document_deadline",
    ];

    const mediumPriorityTypes = [
      "comment",
      "mention",
      "new_collaborator",
      "permission_change",
      "plagiarism_complete",
      "payment_success",
      "subscription_renewed",
      "new_feature",
      "writing_streak",
      "goal_achieved",
    ];

    if (highPriorityTypes.includes(type)) return "high";
    if (mediumPriorityTypes.includes(type)) return "medium";
    return "low";
  };

  // Get icon for notification type
  const getIcon = (type: string) => {
    switch (type) {
      case "comment":
      case "mention":
        return <MessageSquare className="h-4 w-4" />;
      case "document_change":
      case "document_shared":
      case "document_version":
      case "document_deadline":
        return <FileText className="h-4 w-4" />;
      case "new_collaborator":
      case "permission_change":
      case "collaborator_request":
        return <Users className="h-4 w-4" />;
      case "plagiarism_complete":
      case "ai_suggestion":
      case "ai_limit":
      case "new_feature":
        return <Zap className="h-4 w-4" />;
      case "payment_success":
      case "payment_failed":
      case "subscription_renewed":
      case "subscription_expiring":
        return <CreditCard className="h-4 w-4" />;
      case "security_alert":
        return <AlertCircle className="h-4 w-4" />;
      case "writing_streak":
      case "goal_achieved":
        return <CheckCircle className="h-4 w-4" />;
      case "weekly_summary":
      case "research_update":
        return <Info className="h-4 w-4" />;
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Notifications</h1>
            <p className="text-black mt-1">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "No unread notifications"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-white">
        {loading ? (
          <div className="p-8 text-center">
            <div className="flex justify-center">
              <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="mt-4 text-black">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-black">
              Error loading notifications
            </h3>
            <p className="mt-2 text-black">{error}</p>
            <Button onClick={() => fetchNotifications(50, 0)} className="mt-4">
              Try again
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell className="h-6 w-6 text-black" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-black">
              No notifications
            </h3>
            <p className="mt-2 text-black">
              You don't have any notifications yet. We'll let you know when
              something important happens.
            </p>
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

              return sections.map(({ priority, notifications }) =>
                notifications.length > 0 ? (
                  <div key={priority}>
                    <div className="px-6 py-3 bg-gray-50 text-xs font-medium text-black">
                      {getPriorityLabel(priority as any)} (
                      {notifications.length})
                    </div>
                    <ul>
                      {notifications.map((notification) => {
                        const priorityLevel = getPriority(notification.type);
                        return (
                          <li
                            key={notification.id}
                            className={`p-6 hover:bg-gray-50 border-l-4 ${getPriorityColor(priorityLevel)} ${!notification.read ? "bg-blue-50" : ""}`}>
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mt-0.5 text-black">
                                {getIcon(notification.type)}
                              </div>
                              <div className="ml-3 flex-1 min-w-0">
                                <div className="flex items-center">
                                  <p className="text-sm font-medium text-black">
                                    {notification.title}
                                  </p>
                                  {!notification.read && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      New
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-black">
                                  {notification.message}
                                </p>
                                <p className="mt-2 text-xs text-black">
                                  {formatDate(notification.created_at)}
                                </p>
                              </div>
                              <div className="ml-4 flex-shrink-0 flex space-x-2">
                                {!notification.read && (
                                  <Button
                                    onClick={() => markAsRead(notification.id)}
                                    variant="ghost"
                                    size="sm">
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null,
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
