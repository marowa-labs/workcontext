import { prisma } from "../lib/prisma";
import { EmailService } from "./emailService";
import logger from "../monitoring/logger";

export class SecurityNotificationService {
  /**
   * Send security alert email to user
   */
  static async sendSecurityAlert(
    userId: string,
    alertType:
      | "new_login"
      | "new_device"
      | "password_changed"
      | "email_changed",
    details: {
      device?: string;
      ip?: string;
      location?: string;
      timestamp?: Date;
    },
  ): Promise<boolean> {
    try {
      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, full_name: true },
      });

      if (!user || !user.email) {
        logger.warn("Cannot send security alert: user not found", { userId });
        return false;
      }

      // Check if user has enabled this notification
      const privacySettings = await prisma.userPrivacySettings.findUnique({
        where: { user_id: userId },
        select: {
          email_unusual_logins: true,
          notify_new_devices: true,
        },
      });

      // Check if the specific notification type is enabled
      if (alertType === "new_login" && !privacySettings?.email_unusual_logins) {
        logger.info("User has disabled unusual login notifications", {
          userId,
        });
        return false;
      }

      if (alertType === "new_device" && !privacySettings?.notify_new_devices) {
        logger.info("User has disabled new device notifications", { userId });
        return false;
      }

      // Prepare email content based on alert type
      let subject: string;
      let title: string;
      let message: string;

      const timestamp = details.timestamp || new Date();
      const timeStr = timestamp.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      switch (alertType) {
        case "new_login":
          subject = "New Login Detected - WorkContext";
          title = "New Login Detected";
          message = `A new login was detected on your account. If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.`;
          break;
        case "new_device":
          subject = "New Device Login - WorkContext";
          title = "New Device Login";
          message = `Your account was accessed from a new device. If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.`;
          break;
        case "password_changed":
          subject = "Password Changed - WorkContext";
          title = "Password Changed";
          message = `Your account password was changed. If you made this change, no action is needed. If you didn't make this change, please contact support immediately.`;
          break;
        case "email_changed":
          subject = "Email Address Changed - WorkContext";
          title = "Email Address Changed";
          message = `Your account email address was changed. If you made this change, no action is needed. If you didn't make this change, please contact support immediately.`;
          break;
      }

      // Build device info details
      const detailsList: { label: string; value: string }[] = [];
      if (details.device) detailsList.push({ label: "Device", value: details.device });
      if (details.ip) detailsList.push({ label: "IP Address", value: details.ip });
      if (details.location) detailsList.push({ label: "Location", value: details.location });
      detailsList.push({ label: "Time", value: timeStr });

      const success = await EmailService.sendSecurityAlertEmail(
        user.email,
        subject,
        title,
        message,
        detailsList,
        user.full_name || "",
      );

      if (success) {
        logger.info("Security alert email sent", { userId, alertType });
      } else {
        logger.error("Failed to send security alert email", {
          userId,
          alertType,
        });
      }

      return success;
    } catch (error) {
      logger.error("Error sending security alert:", {
        error,
        userId,
        alertType,
      });
      return false;
    }
  }

  /**
   * Send new device login notification
   */
  static async sendNewDeviceNotification(
    userId: string,
    deviceInfo: string,
    ipAddress: string,
    location: string | null,
  ): Promise<boolean> {
    return this.sendSecurityAlert(userId, "new_device", {
      device: deviceInfo,
      ip: ipAddress,
      location: location || undefined,
    });
  }

  /**
   * Send unusual login notification
   */
  static async sendUnusualLoginNotification(
    userId: string,
    deviceInfo: string,
    ipAddress: string,
    location: string | null,
  ): Promise<boolean> {
    return this.sendSecurityAlert(userId, "new_login", {
      device: deviceInfo,
      ip: ipAddress,
      location: location || undefined,
    });
  }

  /**
   * Send password changed notification
   */
  static async sendPasswordChangedNotification(
    userId: string,
  ): Promise<boolean> {
    return this.sendSecurityAlert(userId, "password_changed", {});
  }

  /**
   * Send email changed notification
   */
  static async sendEmailChangedNotification(
    userId: string,
    newEmail: string,
  ): Promise<boolean> {
    // Send to both old and new email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, full_name: true },
    });

    if (!user) return false;

    const result = await this.sendSecurityAlert(userId, "email_changed", {});

    // Also send to the new email if possible
    if (newEmail && newEmail !== user.email) {
      try {
        await EmailService.sendSecurityAlertEmail(
          newEmail,
          "Email Address Changed - WorkContext",
          "Email Address Updated",
          "Your account email address has been changed to this email address. If you made this change, no action is needed.",
          [],
          user.full_name || "",
        );
      } catch (error) {
        logger.error("Failed to send email change notification to new email", {
          error,
          newEmail,
        });
      }
    }

    return result;
  }
}
