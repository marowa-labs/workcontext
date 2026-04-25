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

  // Account & billing settings
  account_billing_enabled?: boolean;
  account_billing_payment_success?: boolean;
  account_billing_payment_failed?: boolean;
  account_billing_subscription_renewed?: boolean;
  account_billing_subscription_expiring?: boolean;
  account_billing_security_alerts?: boolean;
  // Additional billing notification settings
  account_billing_subscription_created?: boolean;
  account_billing_subscription_updated?: boolean;
  account_billing_subscription_cancelled?: boolean;
  account_billing_subscription_resumed?: boolean;
  account_billing_subscription_expired?: boolean;
  account_billing_payment_refunded?: boolean;
  account_billing_invoice_available?: boolean;

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

  // Research updates settings
  research_updates_enabled?: boolean;
  research_updates_ai_suggestion?: boolean;
  research_updates_citation_reminder?: boolean;
  research_updates_research_update?: boolean;

  // Document management settings
  document_management_enabled?: boolean;
  document_management_backup_available?: boolean;
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

  // Account & billing settings
  account_billing_enabled: true,
  account_billing_payment_success: true,
  account_billing_payment_failed: true,
  account_billing_subscription_renewed: true,
  account_billing_subscription_expiring: true,
  account_billing_security_alerts: true,
  // Additional billing notification settings
  account_billing_subscription_created: true,
  account_billing_subscription_updated: true,
  account_billing_subscription_cancelled: true,
  account_billing_subscription_resumed: true,
  account_billing_subscription_expired: true,
  account_billing_payment_refunded: true,
  account_billing_invoice_available: true,

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

  // Research updates settings
  research_updates_enabled: true,
  research_updates_ai_suggestion: true,
  research_updates_citation_reminder: true,
  research_updates_research_update: true,

  // Document management settings
  document_management_enabled: true,
  document_management_backup_available: true,
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
      "account_billing_enabled",
      "account_billing_payment_success",
      "account_billing_payment_failed",
      "account_billing_subscription_renewed",
      "account_billing_subscription_expiring",
      "account_billing_security_alerts",
      // Additional billing notification settings
      "account_billing_subscription_created",
      "account_billing_subscription_updated",
      "account_billing_subscription_cancelled",
      "account_billing_subscription_resumed",
      "account_billing_subscription_expired",
      "account_billing_payment_refunded",
      "account_billing_invoice_available",
      "product_updates_enabled",
      "product_updates_new_features",
      "product_updates_tips",
      "product_updates_newsletter",
      "product_updates_special_offers",
      "writing_progress_enabled",
      "writing_progress_document_deadline",
      "writing_progress_writing_streak",
      "writing_progress_goal_achieved",
      "research_updates_enabled",
      "research_updates_ai_suggestion",
      "research_updates_citation_reminder",
      "research_updates_research_update",
      "document_management_enabled",
      "document_management_backup_available",
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

  // Get comprehensive billing notification settings
  static async getBillingNotificationSettings(userId: string) {
    try {
      const settings = await this.getUserNotificationSettings(userId);

      return {
        enabled: settings.account_billing_enabled,
        paymentSuccess: settings.account_billing_payment_success,
        paymentFailed: settings.account_billing_payment_failed,
        subscriptionRenewed: settings.account_billing_subscription_renewed,
        subscriptionExpiring: settings.account_billing_subscription_expiring,
        securityAlerts: settings.account_billing_security_alerts,
        // Additional billing notification settings
        subscriptionCreated: settings.account_billing_subscription_created,
        subscriptionUpdated: settings.account_billing_subscription_updated,
        subscriptionCancelled: settings.account_billing_subscription_cancelled,
        subscriptionResumed: settings.account_billing_subscription_resumed,
        subscriptionExpired: settings.account_billing_subscription_expired,
        paymentRefunded: settings.account_billing_payment_refunded,
        invoiceAvailable: settings.account_billing_invoice_available,
      };
    } catch (error) {
      logger.error("Error getting billing notification settings", {
        error,
        userId,
      });
      throw new Error(
        `Failed to get billing notification settings: ${(error as Error).message}`
      );
    }
  }

  // Update billing notification settings
  static async updateBillingNotificationSettings(
    userId: string,
    billingSettings: {
      enabled?: boolean;
      paymentSuccess?: boolean;
      paymentFailed?: boolean;
      subscriptionRenewed?: boolean;
      subscriptionExpiring?: boolean;
      securityAlerts?: boolean;
      // Additional billing notification settings
      subscriptionCreated?: boolean;
      subscriptionUpdated?: boolean;
      subscriptionCancelled?: boolean;
      subscriptionResumed?: boolean;
      subscriptionExpired?: boolean;
      paymentRefunded?: boolean;
      invoiceAvailable?: boolean;
    }
  ) {
    try {
      logger.info("Updating billing notification settings", {
        userId,
        billingSettings,
      });

      // Prepare settings data for update
      const settingsData: NotificationSettingsData = {};

      if (billingSettings.enabled !== undefined) {
        settingsData.account_billing_enabled = billingSettings.enabled;
      }

      if (billingSettings.paymentSuccess !== undefined) {
        settingsData.account_billing_payment_success =
          billingSettings.paymentSuccess;
      }

      if (billingSettings.paymentFailed !== undefined) {
        settingsData.account_billing_payment_failed =
          billingSettings.paymentFailed;
      }

      if (billingSettings.subscriptionRenewed !== undefined) {
        settingsData.account_billing_subscription_renewed =
          billingSettings.subscriptionRenewed;
      }

      if (billingSettings.subscriptionExpiring !== undefined) {
        settingsData.account_billing_subscription_expiring =
          billingSettings.subscriptionExpiring;
      }

      if (billingSettings.securityAlerts !== undefined) {
        settingsData.account_billing_security_alerts =
          billingSettings.securityAlerts;
      }

      // Additional billing notification settings
      if (billingSettings.subscriptionCreated !== undefined) {
        settingsData.account_billing_subscription_created =
          billingSettings.subscriptionCreated;
      }

      if (billingSettings.subscriptionUpdated !== undefined) {
        settingsData.account_billing_subscription_updated =
          billingSettings.subscriptionUpdated;
      }

      if (billingSettings.subscriptionCancelled !== undefined) {
        settingsData.account_billing_subscription_cancelled =
          billingSettings.subscriptionCancelled;
      }

      if (billingSettings.subscriptionResumed !== undefined) {
        settingsData.account_billing_subscription_resumed =
          billingSettings.subscriptionResumed;
      }

      if (billingSettings.subscriptionExpired !== undefined) {
        settingsData.account_billing_subscription_expired =
          billingSettings.subscriptionExpired;
      }

      if (billingSettings.paymentRefunded !== undefined) {
        settingsData.account_billing_payment_refunded =
          billingSettings.paymentRefunded;
      }

      if (billingSettings.invoiceAvailable !== undefined) {
        settingsData.account_billing_invoice_available =
          billingSettings.invoiceAvailable;
      }

      // Update the settings
      const settings = await this.updateUserNotificationSettings(
        userId,
        settingsData
      );

      logger.info("Billing notification settings updated successfully", {
        userId,
      });

      return {
        enabled: settings.account_billing_enabled,
        paymentSuccess: settings.account_billing_payment_success,
        paymentFailed: settings.account_billing_payment_failed,
        subscriptionRenewed: settings.account_billing_subscription_renewed,
        subscriptionExpiring: settings.account_billing_subscription_expiring,
        securityAlerts: settings.account_billing_security_alerts,
        // Additional billing notification settings
        subscriptionCreated: settings.account_billing_subscription_created,
        subscriptionUpdated: settings.account_billing_subscription_updated,
        subscriptionCancelled: settings.account_billing_subscription_cancelled,
        subscriptionResumed: settings.account_billing_subscription_resumed,
        subscriptionExpired: settings.account_billing_subscription_expired,
        paymentRefunded: settings.account_billing_payment_refunded,
        invoiceAvailable: settings.account_billing_invoice_available,
      };
    } catch (error) {
      logger.error("Error updating billing notification settings", {
        error,
        userId,
        billingSettings,
      });
      throw new Error(
        `Failed to update billing notification settings: ${(error as Error).message}`
      );
    }
  }

  // Enable all billing notifications
  static async enableAllBillingNotifications(userId: string) {
    try {
      const settings = await this.updateBillingNotificationSettings(userId, {
        enabled: true,
        paymentSuccess: true,
        paymentFailed: true,
        subscriptionRenewed: true,
        subscriptionExpiring: true,
        securityAlerts: true,
      });

      logger.info("All billing notifications enabled for user", { userId });
      return settings;
    } catch (error) {
      logger.error("Error enabling all billing notifications", {
        error,
        userId,
      });
      throw new Error(
        `Failed to enable all billing notifications: ${(error as Error).message}`
      );
    }
  }

  // Disable all billing notifications
  static async disableAllBillingNotifications(userId: string) {
    try {
      const settings = await this.updateBillingNotificationSettings(userId, {
        enabled: false,
        paymentSuccess: false,
        paymentFailed: false,
        subscriptionRenewed: false,
        subscriptionExpiring: false,
        securityAlerts: false,
      });

      logger.info("All billing notifications disabled for user", { userId });
      return settings;
    } catch (error) {
      logger.error("Error disabling all billing notifications", {
        error,
        userId,
      });
      throw new Error(
        `Failed to disable all billing notifications: ${(error as Error).message}`
      );
    }
  }
}
