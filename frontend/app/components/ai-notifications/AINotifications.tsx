"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Zap,
  AlertCircle,
  CheckCircle,
  BarChart3,
  DollarSign,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import NotificationService from "../../lib/utils/notificationService";

interface AINotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

const AINotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<AINotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "unread" | "ai_limit" | "ai_suggestion"
  >("all");

  // Fetch AI-related notifications
  const fetchAINotifications = async () => {
    try {
      setLoading(true);
      const result = await NotificationService.getNotifications(
        50, // limit
        0, // offset
      );

      // Filter for AI-related notifications
      const aiNotifications = result.notifications.filter(
        (notification) =>
          notification.type.startsWith("ai_") ||
          ["ai_limit", "ai_suggestion"].includes(notification.type),
      );

      setNotifications(aiNotifications);
    } catch (err) {
      setError("Failed to fetch AI notifications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAINotifications();
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

  // Get icon for notification type
  const getIcon = (type: string) => {
    switch (type) {
      case "ai_limit":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "ai_suggestion":
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case "ai_usage":
        return <BarChart3 className="h-4 w-4 text-blue-500" />;
      case "ai_cost":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case "ai_performance":
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case "ai_chat":
        return <MessageSquare className="h-4 w-4 text-indigo-500" />;
      default:
        return <Bell className="h-4 w-4 text-black" />;
    }
  };

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.read;
    return notification.type === filter;
  });

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications(
        notifications.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification,
        ),
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(
        notifications.map((notification) => ({ ...notification, read: true })),
      );
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-white rounded-xl shadow-sm border border-white border-white">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black text-black">
            AI Notifications
          </h2>
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-1 text-sm border border-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-white border-white text-black">
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="ai_limit">AI Limits</option>
              <option value="ai_suggestion">AI Suggestions</option>
            </select>
            {filteredNotifications.some((n) => !n.read) && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-1 text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300">
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-black mx-auto mb-3" />
            <p className="text-black dark:text-black">
              No AI notifications at this time
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.read
                    ? "bg-gray-50 border-white dark:bg-white border-white"
                    : "bg-purple-50 border-purple-200 dark:bg-purple-900/20 border-white-800"
                }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-black text-black">
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            New
                          </span>
                        )}
                        <span className="text-xs text-black dark:text-black">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-black dark:text-black">
                      {notification.message}
                    </p>
                    {notification.data && (
                      <div className="mt-2 text-xs text-black dark:text-black">
                        {Object.entries(notification.data).map(
                          ([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span>{" "}
                              {String(value)}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="ml-2 flex-shrink-0 text-black hover:text-black dark:text-black dark:hover:text-black"
                      title="Mark as read">
                      <CheckCircle className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AINotifications;
