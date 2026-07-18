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

      // Build device info string
      const deviceInfo = [
        details.device && `Device: ${details.device}`,
        details.ip && `IP Address: ${details.ip}`,
        details.location && `Location: ${details.location}`,
        `Time: ${timeStr}`,
      ]
        .filter(Boolean)
        .join("<br>");

      // Send email
      const emailBody = `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); max-width: 600px; margin: 0 auto;">
            <div style="margin-bottom: 30px; text-align: center;">
              <img src="https://image2url.com/images/1764774582648-980c2e10-52a6-4e57-b84d-d63c81250e2f.png" alt="WorkContext Logo" style="width: 120px; height: auto; margin-bottom: 10px;">
              <h1 style="color: #dc2626; font-size: 24px; margin: 10px 0;">${title}</h1>
            </div>

            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 500;">
                ⚠️ Security Alert
              </p>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hello ${user.full_name || "there"},
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              ${message}
            </p>

            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px; font-weight: 500;">Login Details:</p>
              <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.8;">
                ${deviceInfo}
              </p>
            </div>

            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="color: #1e40af; font-size: 14px; margin: 0; font-weight: 500;">
                🔒 If this wasn't you:
              </p>
              <ul style="color: #374151; font-size: 14px; margin: 10px 0 0; padding-left: 20px;">
                <li>Change your password immediately</li>
                <li>Review your active sessions</li>
                <li>Enable two-factor authentication</li>
                <li>Contact support if you need help</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || "http://workcontext.vercel.app"}/dashboard/settings/account" 
                 style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Review Account Security
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
              You can manage your security notification preferences in your account settings.
            </p>

            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
              &copy; ${new Date().getFullYear()} WorkContext. All rights reserved.
            </p>
          </div>
        </div>
      `;

      const success = await EmailService.sendCustomEmail(
        user.email,
        subject,
        emailBody,
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
        const emailBody = `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1e40af; font-size: 24px; margin: 0 0 20px;">Email Address Updated</h1>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Hello ${user.full_name || "there"},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Your account email address has been changed to this email address. If you made this change, no action is needed.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                If you didn't make this change, please contact support immediately.
              </p>
            </div>
          </div>
        `;

        await EmailService.sendCustomEmail(
          newEmail,
          "Email Address Changed - WorkContext",
          emailBody,
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
