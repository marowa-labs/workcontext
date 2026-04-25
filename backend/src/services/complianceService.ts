import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

export class ComplianceService {
  // Get audit logs for a user
  static async getAuditLogs(userId: string, limit: number = 50) {
    try {
      return await prisma.auditLog.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: limit,
      });
    } catch (error) {
      logger.error("Error fetching audit logs:", error);
      throw new Error("Failed to fetch audit logs");
    }
  }

  // Create an audit log entry
  static async createAuditLog(data: {
    user_id: string;
    action: string;
    resource: string;
    resource_id?: string;
    ip_address?: string;
    device_info?: string;
    payload?: any;
  }) {
    try {
      // Check if user has audit logs enabled
      const settings = await prisma.userPrivacySettings.findUnique({
        where: { user_id: data.user_id },
        select: { audit_logs_enabled: true },
      });

      if (settings?.audit_logs_enabled === false) {
        return null;
      }

      return await prisma.auditLog.create({
        data,
      });
    } catch (error) {
      logger.error("Error creating audit log:", error);
      // We don't throw here to avoid breaking the main flow if logging fails
      return null;
    }
  }

  // Export all user data (GDPR Right to Portability)
  static async exportUserData(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          privacy_settings: true,
          projects: {
            include: {
              research_sources: true,
              research_topics: true,
            },
          },
          ai_chat_sessions: {
            include: {
              messages: true,
            },
          },
          backups: true,
          notifications: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Log the export action
      await this.createAuditLog({
        user_id: userId,
        action: "DATA_EXPORT",
        resource: "USER_DATA",
      });

      return user;
    } catch (error) {
      logger.error("Error exporting user data:", error);
      throw new Error("Failed to export user data");
    }
  }

  // Request account deletion (GDPR Right to Be Forgotten)
  static async requestAccountDeletion(userId: string) {
    try {
      // In a real app, this might just mark as deleted or start a 30-day countdown
      // For this demo/implementation, we'll log the request
      await this.createAuditLog({
        user_id: userId,
        action: "ACCOUNT_DELETION_REQUEST",
        resource: "USER_ACCOUNT",
      });

      // Update privacy settings to reflect the request if needed
      return {
        success: true,
        message:
          "Account deletion request received and is being processed within 30 days.",
      };
    } catch (error) {
      logger.error("Error requesting account deletion:", error);
      throw new Error("Failed to process account deletion request");
    }
  }
}
