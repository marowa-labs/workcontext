import { prisma } from "../lib/prisma";
import { EmailService } from "./emailService";
import { UserService } from "./userService";
import { getNotificationServer } from "../lib/notificationServer";
import { PushNotificationService } from "./pushNotificationService";
import { NotificationSettingsService } from "./notificationSettingsService";

// Define notification types
export type NotificationType =
  | "comment"
  | "mention"
  | "document_change"
  | "document_shared"
  | "new_collaborator"
  | "permission_change"
  | "comment_resolved"
  | "real_time_edit"
  | "plagiarism_complete"
  | "ai_limit"
  | "new_feature"
  | "weekly_summary"
  | "security_alert"
  | "new_feature_announcement"
  | "product_tip"
  | "newsletter"
  | "special_offer"
  // New notification types
  | "document_deadline"
  | "writing_streak"
  | "goal_achieved"
  | "ai_suggestion"
  | "citation_reminder"
  | "collaborator_request"
  | "document_version"
  | "research_update"
  | "template_update"
  // Template notification types
  | "template_created"
  | "template_updated"
  | "template_deleted"
  | "template_used"
  | "template_shared"
  | "template_downloaded"
  | "template_reviewed"
  | "template_review_updated"
  | "template_review_deleted"
  | "template_shared_with_you"
  | "template_share_updated"
  | "template_share_removed"
  | "template_share_removed_for_you"
  | "template_versioned"
  | "template_restored"
  | "template_version_deleted"
  | "template_featured"
  | "template_categorized"
  | "template_uncategorized"
  | "template_exported"
  | "template_imported"
  | "template_batch_exported"
  | "template_batch_imported"
  | "template_preview_generated"
  | "template_preview_updated"
  | "template_preview_deleted"
  // Collaboration notification types
  | "collaboration_invite"
  | "collaboration_invite_accepted"
  | "collaboration_invite_declined"
  | "collaboration_removed"
  | "collaboration_session_started"
  | "collaboration_session_ended"
  // Editor notification types
  | "editor_activity"
  | "comment_added"
  | "document_exported"
  // XP notification types
  | "xp_earned"
  // Task specific notification types
  | "task_overdue"
  | "task_due_soon"
  | "task_assigned"
  | "task_status_changed"
  | "task_priority_changed"
  | "task_deleted"
  | "task_created"
  | "task_completed"
  // Editor / workspace activity notification types
  | "editor_active"
  | "document_edited"
  | "document_exported"
  | "document_imported"
  // Generic workspace activity
  | "workspace_activity";

// Define notification data structure
export interface NotificationData {
  projectId?: string;
  projectName?: string;
  collaboratorName?: string;
  documentTitle?: string;
  amount?: number;
  currency?: string;
  planName?: string;
  expirationDate?: string;
  transactionId?: string;
  invoiceId?: string;
  downloadUrl?: string;
  [key: string]: any;
}

// Mapping of notification types to subscription features
const notificationTypeToSubscriptionFeature: Record<
  NotificationType,
  string | null
> = {
  // Collaboration notifications - require collaboration features
  comment: "collaboration_comments_resolved",
  mention: "collaboration_real_time",
  document_change: "collaboration_real_time",
  document_shared: "collaboration_new_collaborator",
  new_collaborator: "collaboration_new_collaborator",
  permission_change: "collaboration_permission_changes",
  comment_resolved: "collaboration_comments_resolved",
  real_time_edit: "collaboration_real_time",
  collaboration_invite: "collaboration_new_collaborator",
  collaboration_invite_accepted: "collaboration_new_collaborator",
  collaboration_invite_declined: "collaboration_new_collaborator",
  collaboration_removed: "collaboration_new_collaborator",
  collaboration_session_started: "collaboration_real_time",
  collaboration_session_ended: "collaboration_real_time",
  editor_activity: "collaboration_real_time",
  comment_added: "collaboration_comments_resolved",

  // AI notifications - require AI features
  plagiarism_complete: "ai_features_plagiarism_complete",
  ai_limit: "ai_features_ai_limit",
  ai_suggestion: "ai_features_new_features",

  // Account notifications - available to all users
  security_alert: null,

  // Product update notifications - available to all users
  new_feature: null,
  weekly_summary: null,
  new_feature_announcement: null,
  product_tip: null,
  newsletter: null,
  special_offer: null,

  // Writing progress notifications - available to all users
  document_deadline: null,
  writing_streak: null,
  goal_achieved: null,
  xp_earned: null, // XP notifications - available to all users

  // Research notifications
  citation_reminder: null,
  research_update: null,

  // Document management notifications - available to all users
  document_version: null,
  document_exported: null,
  template_update: null,
  template_created: null,
  template_updated: null,
  template_deleted: null,
  template_used: null,
  template_shared: null,
  template_downloaded: null,
  template_reviewed: null,
  template_review_updated: null,
  template_review_deleted: null,
  template_shared_with_you: null,
  template_share_updated: null,
  template_share_removed: null,
  template_share_removed_for_you: null,
  template_versioned: null,
  template_restored: null,
  template_version_deleted: null,
  template_featured: null,
  template_categorized: null,
  template_uncategorized: null,
  template_exported: null,
  template_imported: null,
  template_batch_exported: null,
  template_batch_imported: null,
  template_preview_generated: null,
  template_preview_updated: null,
  template_preview_deleted: null,

  // Other notifications
  collaborator_request: "collaboration_request_collaborator_request",
  task_assigned: "task_assigned_task_assigned",
  task_overdue: "task_overdue_task_overdue",
  task_due_soon: "task_due_soon_task_due_soon",
  task_status_changed: null,
  task_priority_changed: null,
  task_deleted: null,
  task_created: null,
  task_completed: null,
  editor_active: null,
  document_edited: null,
  document_imported: null,
  workspace_activity: null,
};

// Helper function to check if user can receive a notification based on their subscription
async function canUserReceiveNotification(
  userId: string,
  type: NotificationType,
): Promise<boolean> {
  try {
    // Get the required feature for this notification type
    const requiredFeature = notificationTypeToSubscriptionFeature[type];

    return true;
  } catch (error) {
    console.error("Error checking subscription for notification:", error);
    // If there's an error, we'll allow the notification to avoid blocking important messages
    return true;
  }
}

// Helper function to send AI notifications
async function sendAINotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData,
) {
  try {
    // AI notifications can be handled through in-app notifications or email
    // Create in-app notification
    await prisma.notification.create({
      data: {
        user_id: userId,
        type: type,
        title: title,
        message: message,
        data: data || null,
        read: false,
        created_at: new Date().toISOString(),
      },
    });

    // Special handling based on notification type
    switch (type) {
      case "ai_limit":
        // For AI limit notifications, send immediate email
        await sendEmailNotification(userId, type, title, message, data);
        break;
      case "ai_suggestion":
        // For AI suggestions, only create in-app notification unless it's important
        if (data && data.importance === "high") {
          await sendEmailNotification(userId, type, title, message, data);
        }
        break;
      case "plagiarism_complete":
        // For plagiarism complete notifications, send email
        await sendEmailNotification(userId, type, title, message, data);
        break;
      default:
        // For other AI notifications, just create in-app notification
        break;
    }
  } catch (error) {
    console.error("Error sending AI notification:", error);
    // Don't throw error as we don't want to fail the entire notification creation
  }
}

// Create a new notification
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData,
) {
  try {
    // Check if user can receive this notification based on their subscription
    const canReceive = await canUserReceiveNotification(userId, type);
    if (!canReceive) {
      console.log(
        `User ${userId} cannot receive ${type} notification due to subscription limitations`,
      );
      return null;
    }

    // Check if user has notification settings
    let settings = await prisma.notificationSettings.findUnique({
      where: { user_id: userId },
    });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          user_id: userId,
        },
      });
    }

    // Check if user wants this type of notification
    if (!shouldSendNotification(settings, type)) {
      return null;
    }

    // Check quiet hours
    if (settings.quiet_hours_enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      if (
        isTimeInRange(
          currentTime,
          settings.quiet_hours_start_time,
          settings.quiet_hours_end_time,
        )
      ) {
        // Quiet hours - don't send notification now
        return null;
      }
    }

    // Create the notification in database
    const notification = await prisma.notification.create({
      data: {
        user_id: userId,
        type,
        title,
        message,
        data: data || undefined,
      },
    });

    // Send email notification if enabled
    if (settings.in_app_notifications_enabled !== false) {
      await sendEmailNotification(userId, type, title, message, data);
    }

    // Send push notification if enabled
    if (settings.push_notifications_enabled !== false) {
      await sendPushNotification(userId, type, title, message, data);
    }

    // Send SMS notification if enabled and user has a phone number
    if (settings.sms_notifications_enabled !== false) {
      await sendSMSNotification(userId, type, title, message, data);
    }

    // Send real-time notification if user is connected
    try {
      const notificationServer = getNotificationServer();
      await notificationServer.sendNotificationToUser(userId, {
        id: notification.id,
        type,
        title,
        message,
        data,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error sending real-time notification:", error);
    }

    // Send AI-specific notifications
    if (type.startsWith("ai_")) {
      await sendAINotification(userId, type, title, message, data);
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

// Get notifications for a user
export async function getUserNotifications(
  userId: string,
  limit: number = 20,
  offset: number = 0,
  filters?: {
    type?: string;
    priority?: "high" | "medium" | "low";
    search?: string;
    read?: boolean;
  },
) {
  try {
    // Build where clause based on filters
    const where: any = { user_id: userId };

    // Apply type filter
    if (filters?.type) {
      where.type = filters.type;
    }

    // Apply read status filter
    if (filters?.read !== undefined) {
      where.read = filters.read;
    }

    // Apply search filter
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { message: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Apply priority filter
    if (filters?.priority) {
      // Map priority to notification types
      const priorityTypes = {
        high: [
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
        ],
        medium: [
          "new_feature",
          "weekly_summary",
          "new_feature_announcement",
          "product_tip",
          "research_update",
          "template_update",
          "collaboration_session_started",
          "collaboration_session_ended",
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
        ],
        low: ["newsletter", "special_offer"],
      };

      where.type = {
        in: priorityTypes[filters.priority],
      };
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: limit,
      skip: offset,
    });

    return notifications;
  } catch (error) {
    console.error("Error getting user notifications:", error);
    throw error;
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const notifications = await prisma.notification.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true },
    });

    return notifications;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  try {
    const notification = await prisma.notification.delete({
      where: { id: notificationId },
    });

    return notification;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}

// Dismiss notification
export async function dismissNotification(notificationId: string) {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { dismissed: true },
    });

    return notification;
  } catch (error) {
    console.error("Error dismissing notification:", error);
    throw error;
  }
}

// Snooze notification
export async function snoozeNotification(
  notificationId: string,
  snoozeUntil: Date,
) {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { snoozed_until: snoozeUntil },
    });

    return notification;
  } catch (error) {
    console.error("Error snoozing notification:", error);
    throw error;
  }
}

// Get unread notification count for a user
export async function getUnreadNotificationCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: { user_id: userId, read: false, dismissed: false },
    });

    return count;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    throw error;
  }
}

// Helper function to determine if notification should be sent based on settings
function shouldSendNotification(
  settings: any,
  type: NotificationType,
): boolean {
  // Map notification types to settings fields
  const typeToSettingMap: Record<string, string | null> = {
    comment: "project_activity_comments",
    mention: "project_activity_mentions",
    document_change: "project_activity_changes",
    document_shared: "project_activity_shared",
    new_collaborator: "collaboration_new_collaborator",
    permission_change: "collaboration_permission_changes",
    comment_resolved: "collaboration_comments_resolved",
    real_time_edit: "collaboration_real_time",
    plagiarism_complete: "ai_features_plagiarism_complete",
    ai_limit: "ai_features_ai_limit",
    new_feature: "product_updates_new_features",
    weekly_summary: "product_updates_weekly_summary",
    security_alert: null,
    new_feature_announcement: "product_updates_new_features",
    product_tip: "product_updates_tips",
    newsletter: "product_updates_newsletter",
    special_offer: "product_updates_special_offers",
    document_deadline: "writing_progress_document_deadline",
    writing_streak: "writing_progress_writing_streak",
    goal_achieved: "writing_progress_goal_achieved",
    ai_suggestion: null,
    citation_reminder: null,

    collaborator_request: "collaboration_request_collaborator_request",
    document_version: "document_management_document_version",
    research_update: null,
    template_update: "document_management_template_update",
    collaboration_invite: "collaboration_request_collaborator_request",
    collaboration_invite_accepted: "collaboration_new_collaborator",
    collaboration_invite_declined: "collaboration_request_collaborator_request",
    collaboration_removed: "collaboration_new_collaborator",
    collaboration_session_started: "collaboration_real_time",
    collaboration_session_ended: "collaboration_real_time",
    comment_added: "project_activity_comments",
    document_exported: "document_management_document_version",
    // Template notification types
    template_created: "document_management_template_update",
    template_updated: "document_management_template_update",
    template_deleted: "document_management_template_update",
    template_used: "document_management_template_update",
    template_shared: "document_management_template_update",
    template_downloaded: "document_management_template_update",
    template_reviewed: "document_management_template_update",
    template_review_updated: "document_management_template_update",
    template_review_deleted: "document_management_template_update",
    template_shared_with_you: "document_management_template_update",
    template_share_updated: "document_management_template_update",
    template_share_removed: "document_management_template_update",
    template_share_removed_for_you: "document_management_template_update",
    template_versioned: "document_management_template_update",
    template_restored: "document_management_template_update",
    template_version_deleted: "document_management_template_update",
    template_featured: "document_management_template_update",
    template_categorized: "document_management_template_update",
    template_uncategorized: "document_management_template_update",
    template_exported: "document_management_template_update",
    template_imported: "document_management_template_update",
    template_batch_exported: "document_management_template_update",
    template_batch_imported: "document_management_template_update",
    template_preview_generated: "document_management_template_update",
    template_preview_updated: "document_management_template_update",
    template_preview_deleted: "document_management_template_update",
    // Task notification types
    task_assigned: "project_activity_changes",
    task_status_changed: "project_activity_changes",
    task_priority_changed: "project_activity_changes",
    task_deleted: "project_activity_changes",
    task_created: "project_activity_changes",
    task_completed: "project_activity_changes",
    task_overdue: "project_activity_changes",
    task_due_soon: "project_activity_changes",
    // Editor / workspace activity
    editor_active: "collaboration_real_time",
    document_edited: "collaboration_real_time",
    workspace_activity: "project_activity_changes",
  };

  // Get the setting field name for this notification type
  const settingField = typeToSettingMap[type];

  // If no mapping exists, default to sending the notification
  if (!settingField) {
    return true;
  }

  // Return the setting value, defaulting to true if not found
  return settings[settingField] !== false;
}

// Helper function to check if time is in range
function isTimeInRange(
  currentTime: string,
  startTime: string,
  endTime: string,
): boolean {
  // Convert times to minutes since midnight
  const currentMinutes = timeToMinutes(currentTime);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // Handle overnight ranges (e.g., 22:00 to 08:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  // Handle normal ranges (e.g., 08:00 to 22:00)
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// Helper function to convert time string to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Helper function to send email notification
async function sendEmailNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData,
) {
  try {
    // Get user email
    const user = await UserService.getUserById(userId);
    if (!user?.email) {
      return;
    }

    // Don't send email for certain notification types
    const noEmailTypes: NotificationType[] = [
      "real_time_edit",
      "comment_resolved",
      "collaboration_session_started",
      "collaboration_session_ended",
    ];

    if (noEmailTypes.includes(type)) {
      return;
    }

    // Send email
    await EmailService.sendNotificationEmail(
      user.email,
      user.full_name || "",
      title,
      message,
      type,
    );
    console.log(
      `Email notification sent to user ${userId}: ${title} - ${message}`,
    );
  } catch (error) {
    console.error("Error sending email notification:", error);
    // Don't throw error as we don't want to fail the entire notification creation
  }
}

// Helper function to send SMS notification
async function sendSMSNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData,
) {
  try {
    // Get user phone number
    const user = await UserService.getUserById(userId);
    if (!user?.phone_number) {
      return;
    }

    // Don't send SMS for certain notification types
    const noSMSTypes: NotificationType[] = [
      "real_time_edit",
      "comment_resolved",
      "collaboration_session_started",
      "collaboration_session_ended",
    ];

    if (noSMSTypes.includes(type)) {
      return;
    }
  } catch (error) {
    console.error("Error sending SMS notification:", error);
    // Don't throw error as we don't want to fail the entire notification creation
  }
}

// Helper function to send push notification
async function sendPushNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData,
) {
  try {
    // Convert all data values to strings for the push notification
    const stringData: Record<string, string> = {
      type,
    };

    if (data) {
      Object.keys(data).forEach((key) => {
        // @ts-ignore
        stringData[key] = String(data[key]);
      });
    }

    // Send push notification using PushNotificationService
    await PushNotificationService.sendToUser(
      userId,
      title,
      message,
      stringData,
    );
  } catch (error) {
    console.error("Error sending push notification:", error);
    // Don't throw error as we don't want to fail the entire notification creation
  }
}

// Get user notification settings
export async function getUserNotificationSettings(userId: string) {
  return await NotificationSettingsService.getUserNotificationSettings(userId);
}

// Update user notification settings
export async function updateUserNotificationSettings(
  userId: string,
  settingsData: any,
) {
  return await NotificationSettingsService.updateUserNotificationSettings(
    userId,
    settingsData,
  );
}


