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
  | "payment_success"
  | "payment_failed"
  | "subscription_renewed"
  | "subscription_expiring"
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
  | "backup_available"
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
  // Billing notification types
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_resumed"
  | "subscription_expired"
  | "payment_refunded"
  | "invoice_available"
  // Task specific notification types
  | "task_overdue"
  | "task_due_soon"
  | "task_assigned";

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

  // Account/Billing notifications - available to all users
  payment_success: null,
  payment_failed: null,
  subscription_renewed: null,
  subscription_expiring: null,
  security_alert: null,
  subscription_created: null,
  subscription_updated: null,
  subscription_cancelled: null,
  subscription_resumed: null,
  subscription_expired: null,
  payment_refunded: null,
  invoice_available: null,

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

  // Research notifications - require research features
  citation_reminder: null, // Available to all users
  research_update: "research_updates_enabled",

  // Document management notifications - available to all users
  backup_available: null,
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
};

// Helper function to check if user can receive a notification based on their subscription
async function canUserReceiveNotification(
  userId: string,
  type: NotificationType,
): Promise<boolean> {
  try {
    // Get the required feature for this notification type
    const requiredFeature = notificationTypeToSubscriptionFeature[type];

    // If no feature is required, user can receive the notification
    if (!requiredFeature) {
      return true;
    }

    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });

    const planId = subscription?.plan || "free";

    // For each required feature, check if the user's plan includes it
    // This performs granular checking by using the actual plan definitions from subscriptionService

    // Import plan definitions
    const { plans } = await import("./subscriptionService");

    // Get the plan details
    const planDetails = plans[planId as keyof typeof plans];

    // If we can't find the plan details, fall back to basic check
    if (!planDetails) {
      // Fallback to the original simplified logic
      switch (requiredFeature) {
        // Collaboration features
        case "collaboration_real_time":
        case "collaboration_new_collaborator":
        case "collaboration_permission_changes":
        case "collaboration_comments_resolved":
          // These features require at least Student plan
          return planId === "student" || planId === "researcher";

        // Research features
        case "research_updates_enabled":
          // Research updates require at least Student plan
          return planId === "student" || planId === "researcher";

        // Collaboration request features
        case "collaboration_request_collaborator_request":
          // Collaboration requests require at least Student plan
          return planId === "student" || planId === "researcher";

        // AI features are available in all plans but with limits
        case "ai_features_plagiarism_complete":
        case "ai_features_ai_limit":
          return true;

        // Default case - if we don't know the feature, allow the notification
        default:
          return true;
      }
    }

    // Check if the specific feature is enabled for this plan
    // Map notification types to plan features
    const featureMap: Record<string, string> = {
      collaboration_real_time: "collaboration.realTime",
      collaboration_new_collaborator: "collaboration.newCollaborator",
      collaboration_permission_changes: "collaboration.permissionChanges",
      collaboration_comments_resolved: "collaboration.commentsResolved",
      research_updates_enabled: "research.updates",
      collaboration_request_collaborator_request:
        "collaboration.requestCollaborator",
      ai_features_plagiarism_complete: "ai.plagiarismComplete",
      ai_features_ai_limit: "ai.limit",
    };

    // Get the feature path for this notification type
    const featurePath = featureMap[requiredFeature];

    // If we have a direct mapping, check if the feature is available
    if (featurePath) {
      // Navigate through the plan features object
      const pathParts = featurePath.split(".");
      let current: any = planDetails.features;

      for (const part of pathParts) {
        if (
          current &&
          typeof current === "object" &&
          current.hasOwnProperty(part)
        ) {
          current = current[part];
        } else {
          current = undefined;
          break;
        }
      }

      // If we found the feature and it's not zero (which means disabled/limited)
      if (current !== undefined && current !== 0) {
        return true;
      }

      // If the feature is explicitly set to 0, it's disabled
      if (current === 0) {
        return false;
      }
    }

    // Check for feature categories
    const featureCategory = requiredFeature.split("_")[0]; // e.g., "collaboration" from "collaboration_real_time"

    // Check if this category is available based on plan tier
    switch (featureCategory) {
      case "collaboration":
        // Collaboration features require at least Student plan
        return (
          planId === "student" ||
          planId === "researcher" ||
          planId === "onetime"
        );

      case "research":
        // Research features require at least Student plan
        return (
          planId === "student" ||
          planId === "researcher" ||
          planId === "onetime"
        );

      case "ai":
        // AI features are available in all plans but with different limits
        return true;

      default:
        // For unknown categories, allow the notification
        return true;
    }
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
        ],
        medium: [
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
        ],
        low: [
          "newsletter",
          "special_offer",
          "writing_streak",
          "goal_achieved",
          "invoice_available",
        ],
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
  const typeToSettingMap: Record<string, string> = {
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
    payment_success: "account_billing_payment_success",
    payment_failed: "account_billing_payment_failed",
    subscription_renewed: "account_billing_subscription_renewed",
    subscription_expiring: "account_billing_subscription_expiring",
    security_alert: "account_billing_security_alerts",
    new_feature_announcement: "product_updates_new_features",
    product_tip: "product_updates_tips",
    newsletter: "product_updates_newsletter",
    special_offer: "product_updates_special_offers",
    document_deadline: "writing_progress_document_deadline",
    writing_streak: "writing_progress_writing_streak",
    goal_achieved: "writing_progress_goal_achieved",
    ai_suggestion: "research_updates_ai_suggestion",
    citation_reminder: "research_updates_citation_reminder",
    backup_available: "document_management_backup_available",
    collaborator_request: "collaboration_request_collaborator_request",
    document_version: "document_management_document_version",
    research_update: "research_updates_research_update",
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
    // Billing notification types
    subscription_created: "account_billing_subscription_renewed",
    subscription_updated: "account_billing_subscription_renewed",
    subscription_cancelled: "account_billing_subscription_expiring",
    subscription_resumed: "account_billing_subscription_renewed",
    subscription_expired: "account_billing_subscription_expiring",
    payment_refunded: "account_billing_payment_success",
    invoice_available: "account_billing_payment_success",
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

// Create billing notification
export async function createBillingNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData,
) {
  try {
    // Create the notification using the main notification function
    const notification = await createNotification(
      userId,
      type,
      title,
      message,
      data,
    );

    // If notification was created successfully, return it
    if (notification) {
      console.log(`Billing notification created for user ${userId}: ${type}`);
      return notification;
    }

    return null;
  } catch (error) {
    console.error("Error creating billing notification:", error);
    throw error;
  }
}

// Send subscription created notification
export async function sendSubscriptionCreatedNotification(
  userId: string,
  planName: string,
  amount: number,
  billingPeriod: string,
) {
  const title = "Subscription Created";
  const message = `Your ${planName} subscription has been successfully created. You will be charged $${amount.toFixed(2)} ${billingPeriod === "year" ? "annually" : "monthly"}.`;

  return await createBillingNotification(
    userId,
    "subscription_created",
    title,
    message,
    { planName, amount, billingPeriod },
  );
}

// Send subscription updated notification
export async function sendSubscriptionUpdatedNotification(
  userId: string,
  oldPlanName: string,
  newPlanName: string,
  amount: number,
) {
  const title = "Subscription Updated";
  const message = `Your subscription has been updated from ${oldPlanName} to ${newPlanName}. You will be charged $${amount.toFixed(2)} for the remainder of your billing cycle.`;

  return await createBillingNotification(
    userId,
    "subscription_updated",
    title,
    message,
    { oldPlanName, newPlanName, amount },
  );
}

// Send subscription cancelled notification
export async function sendSubscriptionCancelledNotification(
  userId: string,
  planName: string,
  endDate: string,
) {
  const title = "Subscription Cancelled";
  const message = `Your ${planName} subscription has been cancelled. You will retain access until ${new Date(endDate).toLocaleDateString()}.`;

  return await createBillingNotification(
    userId,
    "subscription_cancelled",
    title,
    message,
    { planName, endDate },
  );
}

// Send subscription renewed notification
export async function sendSubscriptionRenewedNotification(
  userId: string,
  planName: string,
  amount: number,
  nextBillingDate: string,
) {
  const title = "Subscription Renewed";
  const message = `Your ${planName} subscription has been successfully renewed. You have been charged $${amount.toFixed(2)}. Your next billing date is ${new Date(nextBillingDate).toLocaleDateString()}.`;

  return await createBillingNotification(
    userId,
    "subscription_renewed",
    title,
    message,
    { planName, amount, nextBillingDate },
  );
}

// Send subscription expiring notification
export async function sendSubscriptionExpiringNotification(
  userId: string,
  planName: string,
  expirationDate: string,
  amount: number,
) {
  const title = "Subscription Expiring Soon";
  const message = `Your ${planName} subscription is expiring on ${new Date(expirationDate).toLocaleDateString()}. You will be charged $${amount.toFixed(2)} to renew your subscription.`;

  return await createBillingNotification(
    userId,
    "subscription_expiring",
    title,
    message,
    { planName, expirationDate, amount },
  );
}

// Send payment success notification
export async function sendPaymentSuccessNotification(
  userId: string,
  amount: number,
  planName: string,
  transactionId: string,
) {
  const title = "Payment Successful";
  const message = `Your payment of $${amount.toFixed(2)} for ${planName} has been processed successfully. Transaction ID: ${transactionId}`;

  return await createBillingNotification(
    userId,
    "payment_success",
    title,
    message,
    { amount, planName, transactionId },
  );
}

// Send payment failed notification
export async function sendPaymentFailedNotification(
  userId: string,
  amount: number,
  planName: string,
  errorMessage: string,
) {
  const title = "Payment Failed";
  const message = `Your payment of $${amount.toFixed(2)} for ${planName} has failed. Error: ${errorMessage}. Please update your payment method.`;

  return await createBillingNotification(
    userId,
    "payment_failed",
    title,
    message,
    { amount, planName, errorMessage },
  );
}

// Send payment refunded notification
export async function sendPaymentRefundedNotification(
  userId: string,
  amount: number,
  planName: string,
  transactionId: string,
) {
  const title = "Payment Refunded";
  const message = `Your payment of $${amount.toFixed(2)} for ${planName} has been refunded. Transaction ID: ${transactionId}. The refund should appear in your account within 5-10 business days.`;

  return await createBillingNotification(
    userId,
    "payment_refunded",
    title,
    message,
    { amount, planName, transactionId },
  );
}

// Send invoice available notification
export async function sendInvoiceAvailableNotification(
  userId: string,
  invoiceId: string,
  amount: number,
  dueDate: string,
  downloadUrl: string,
) {
  const title = "Invoice Available";
  const message = `Your invoice #${invoiceId} for $${amount.toFixed(2)} is now available. Due date: ${new Date(dueDate).toLocaleDateString()}.`;

  return await createBillingNotification(
    userId,
    "invoice_available",
    title,
    message,
    { invoiceId, amount, dueDate, downloadUrl },
  );
}
