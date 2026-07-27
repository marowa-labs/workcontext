import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

// Define the notification settings data structure
export interface NotificationSettingsData {
  // Project activity settings
  project_activity_enabled?: boolean;
  project_activity_comments?: boolean;
  project_activity_mentions?: boolean;
  project_activity_changes?: boolean;
  project_activity_shared?: boolean;

  // Collaboration settings
  collaboration_enabled?: boolean;
  collaboration_new_collaborator?: boolean;
  collaboration_permission_changes?: boolean;
  collaboration_comments_resolved?: boolean;
  collaboration_real_time?: boolean;

  // AI features settings
  ai_features_enabled?: boolean;
  ai_features_plagiarism_complete?: boolean;
  ai_features_ai_limit?: boolean;
  ai_features_new_features?: boolean;
  ai_features_weekly_summary?: boolean;

  // Product updates settings
  product_updates_enabled?: boolean;
  product_updates_new_features?: boolean;
  product_updates_tips?: boolean;
  product_updates_newsletter?: boolean;
  product_updates_special_offers?: boolean;

  // Writing progress settings
  writing_progress_enabled?: boolean;
  writing_progress_document_deadline?: boolean;
  writing_progress_writing_streak?: boolean;
  writing_progress_goal_achieved?: boolean;

  // Document management settings
  document_management_enabled?: boolean;
  document_management_template_update?: boolean;
  document_management_document_version?: boolean;

  // Collaboration request settings
  collaboration_request_enabled?: boolean;
  collaboration_request_collaborator_request?: boolean;

  // General settings
  frequency?: string;
  quiet_hours_enabled?: boolean;
  quiet_hours_start_time?: string;
  quiet_hours_end_time?: string;

  // Push notifications settings
  push_notifications_enabled?: boolean;
  push_notifications_mentions?: boolean;
  push_notifications_comments?: boolean;
  push_notifications_direct_messages?: boolean;
  push_notifications_marketing?: boolean;

  // SMS notifications settings
  sms_notifications_enabled?: boolean;
  sms_notifications_high_priority_only?: boolean;

  // In-app notifications settings
  in_app_notifications_enabled?: boolean;
  in_app_notifications_sound?: boolean;
  in_app_notifications_desktop?: boolean;
}

// Default notification settings
const DEFAULT_SETTINGS: NotificationSettingsData = {
  // Project activity settings
  project_activity_enabled: true,
  project_activity_comments: true,
  project_activity_mentions: true,
  project_activity_changes: true,
  project_activity_shared: false,

  // Collaboration settings
  collaboration_enabled: true,
  collaboration_new_collaborator: true,
  collaboration_permission_changes: true,
  collaboration_comments_resolved: true,
  collaboration_real_time: false,

  // AI features settings
  ai_features_enabled: true,
  ai_features_plagiarism_complete: true,
  ai_features_ai_limit: false,
  ai_features_new_features: true,
  ai_features_weekly_summary: false,

  // Product updates settings
  product_updates_enabled: true,
  product_updates_new_features: true,
  product_updates_tips: false,
  product_updates_newsletter: false,
  product_updates_special_offers: false,

  // Writing progress settings
  writing_progress_enabled: true,
  writing_progress_document_deadline: true,
  writing_progress_writing_streak: true,
  writing_progress_goal_achieved: true,

  // Document management settings
  document_management_enabled: true,
  document_management_template_update: true,
  document_management_document_version: true,

  // Collaboration request settings
  collaboration_request_enabled: true,
  collaboration_request_collaborator_request: true,

  // General settings
  frequency: "real-time",
  quiet_hours_enabled: false,
  quiet_hours_start_time: "22:00",
  quiet_hours_end_time: "08:00",

  // Push notifications settings
  push_notifications_enabled: true,
  push_notifications_mentions: true,
  push_notifications_comments: true,
  push_notifications_direct_messages: true,
  push_notifications_marketing: false,

  // SMS notifications settings
  sms_notifications_enabled: false,
  sms_notifications_high_priority_only: true,

  // In-app notifications settings
  in_app_notifications_enabled: true,
  in_app_notifications_sound: true,
  in_app_notifications_desktop: true,
};

export class NotificationSettingsService {
  // Get user's notification settings
  static async getUserNotificationSettings(userId: string) {
    try {
      logger.info("Getting user notification settings", { userId });

      // Check if user has notification settings
      let settings = await prisma.notificationSettings.findUnique({
        where: { user_id: userId },
      });

      // If no settings exist, create default settings
      if (!settings) {
        settings = await prisma.notificationSettings.create({
          data: {
            user_id: userId,
            ...DEFAULT_SETTINGS,
          },
        });
      }

      logger.info("User notification settings retrieved successfully", {
        userId,
      });
      return settings;
    } catch (error) {
      logger.error("Error getting user notification settings", {
        error,
        userId,
      });
      throw new Error(
        `Failed to get user notification settings: ${(error as Error).message}`
      );
    }
  }

  // Update user's notification settings
  static async updateUserNotificationSettings(
    userId: string,
    settingsData: NotificationSettingsData
  ) {
    try {
      logger.info("Updating user notification settings", {
        userId,
        settingsData,
      });

      // Validate the settings data
      const validatedSettings = this.validateSettings(settingsData);

      // Update or create notification settings for user
      const settings = await prisma.notificationSettings.upsert({
        where: { user_id: userId },
        update: validatedSettings,
        create: {
          user_id: userId,
          ...validatedSettings,
        },
      });

      logger.info("User notification settings updated successfully", {
        userId,
      });
      return settings;
    } catch (error) {
      logger.error("Error updating user notification settings", {
        error,
        userId,
        settingsData,
      });
      throw new Error(
        `Failed to update user notification settings: ${(error as Error).message}`
      );
    }
  }

  // Reset user's notification settings to defaults
  static async resetUserNotificationSettings(userId: string) {
    try {
      logger.info("Resetting user notification settings", { userId });

      // Delete existing settings
      await prisma.notificationSettings.deleteMany({
        where: { user_id: userId },
      });

      // Create new default settings
      const settings = await prisma.notificationSettings.create({
        data: {
          user_id: userId,
          ...DEFAULT_SETTINGS,
        },
      });

      logger.info("User notification settings reset successfully", { userId });
      return settings;
    } catch (error) {
      logger.error("Error resetting user notification settings", {
        error,
        userId,
      });
      throw new Error(
        `Failed to reset user notification settings: ${(error as Error).message}`
      );
    }
  }

  // Validate notification settings data
  private static validateSettings(
    settingsData: NotificationSettingsData
  ): NotificationSettingsData {
    const validatedSettings: NotificationSettingsData = {};

    // Validate boolean values
    const booleanFields = [
      "project_activity_enabled",
      "project_activity_comments",
      "project_activity_mentions",
      "project_activity_changes",
      "project_activity_shared",
      "collaboration_enabled",
      "collaboration_new_collaborator",
      "collaboration_permission_changes",
      "collaboration_comments_resolved",
      "collaboration_real_time",
      "ai_features_enabled",
      "ai_features_plagiarism_complete",
      "ai_features_ai_limit",
      "ai_features_new_features",
      "ai_features_weekly_summary",
      "product_updates_enabled",
      "product_updates_new_features",
      "product_updates_tips",
      "product_updates_newsletter",
      "product_updates_special_offers",
      "writing_progress_enabled",
      "writing_progress_document_deadline",
      "writing_progress_writing_streak",
      "writing_progress_goal_achieved",
      "document_management_enabled",
      "document_management_template_update",
      "document_management_document_version",
      "collaboration_request_enabled",
      "collaboration_request_collaborator_request",
      "quiet_hours_enabled",
      "push_notifications_enabled",
      "push_notifications_mentions",
      "push_notifications_comments",
      "push_notifications_direct_messages",
      "push_notifications_marketing",
      "sms_notifications_enabled",
      "sms_notifications_high_priority_only",
      "in_app_notifications_enabled",
      "in_app_notifications_sound",
      "in_app_notifications_desktop",
    ];

    for (const field of booleanFields) {
      if (field in settingsData) {
        const value = settingsData[field as keyof NotificationSettingsData];
        if (typeof value === "boolean") {
          (validatedSettings[
            field as keyof NotificationSettingsData
          ] as boolean) = value;
        } else if (value !== undefined) {
          // Convert string values to boolean
          const stringValue = String(value);
          (validatedSettings[
            field as keyof NotificationSettingsData
          ] as boolean) = stringValue === "true" || stringValue === "1";
        }
      }
    }

    // Validate string values
    const stringFields = [
      "frequency",
      "quiet_hours_start_time",
      "quiet_hours_end_time",
    ];

    for (const field of stringFields) {
      if (field in settingsData) {
        const value = settingsData[field as keyof NotificationSettingsData];
        if (typeof value === "string") {
          (validatedSettings[
            field as keyof NotificationSettingsData
          ] as string) = value;
        }
      }
    }

    // Validate time format for quiet hours
    if (validatedSettings.quiet_hours_start_time) {
      if (!this.isValidTimeFormat(validatedSettings.quiet_hours_start_time)) {
        throw new Error(
          "Invalid quiet hours start time format. Use HH:MM format."
        );
      }
    }

    if (validatedSettings.quiet_hours_end_time) {
      if (!this.isValidTimeFormat(validatedSettings.quiet_hours_end_time)) {
        throw new Error(
          "Invalid quiet hours end time format. Use HH:MM format."
        );
      }
    }

    return validatedSettings;
  }

  // Validate time format (HH:MM)
  private static isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

}
