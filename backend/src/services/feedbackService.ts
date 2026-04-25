import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";
import { EmailService } from "./emailService";
import fetch from "node-fetch";
import SecretsService from "./secrets-service";

interface UserFeedback {
  id: string;
  user_id: string | null;
  type: string;
  category: string | null;
  priority: string;
  title: string;
  description: string;
  status: string;
  attachment_urls: string[];
  browser_info: string | null;
  os_info: string | null;
  screen_size: string | null;
  user_plan: string | null;
  admin_notes: string | null;
  created_at: Date;
  updated_at: Date;
  resolved_at: Date | null;
}

interface FeedbackComment {
  id: string;
  feedback_id: string;
  user_id: string | null;
  content: string;
  is_internal: boolean;
  created_at: Date;
  updated_at: Date;
}

export class FeedbackService {
  // Check if user is admin
  static async isUserAdmin(userId: string): Promise<boolean> {
    try {
      // Check if user has admin role
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          user_role: true,
          email: true,
        },
      });

      // Check if user has admin role
      if (user && user.user_role === "admin") {
        return true;
      }

      // Check if user is in the feedback team
      if (
        user &&
        (user.user_role === "feedback" ||
          user.email.endsWith("@scholarforgeai.com"))
      ) {
        return true;
      }

      // Check specific admin user IDs from environment variables
      const adminUserIds = await SecretsService.getAdminUserIds();
      if (adminUserIds.includes(userId)) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Error checking admin status:", error);
      return false;
    }
  }

  // Create a new feedback item
  static async createFeedback(
    feedbackData: Omit<
      UserFeedback,
      "id" | "created_at" | "updated_at" | "resolved_at"
    >,
  ): Promise<UserFeedback> {
    try {
      const feedback = await prisma.userFeedback.create({
        data: {
          user_id: feedbackData.user_id || undefined,
          type: feedbackData.type,
          category: feedbackData.category || undefined,
          priority: feedbackData.priority,
          title: feedbackData.title,
          description: feedbackData.description,
          status: feedbackData.status,
          attachment_urls: feedbackData.attachment_urls,
          browser_info: feedbackData.browser_info || undefined,
          os_info: feedbackData.os_info || undefined,
          screen_size: feedbackData.screen_size || undefined,
          user_plan: feedbackData.user_plan || undefined,
          admin_notes: feedbackData.admin_notes || undefined,
        },
      });

      // Log the action
      await this.logFeedbackAction(
        feedback.user_id,
        "feedback_created",
        feedback.id,
        "UserFeedback",
        {
          type: feedback.type,
          category: feedback.category,
          priority: feedback.priority,
        },
      );

      // Notify administrators
      await this.notifyFeedbackTeam(
        "New User Feedback",
        `A new ${feedback.type} has been submitted: "${feedback.title}"`,
      );

      return feedback;
    } catch (error) {
      logger.error("Error creating feedback:", error);
      throw new Error("Failed to create feedback");
    }
  }

  // Get feedback items with optional filters
  static async getFeedbackItems(
    userId: string,
    filters?: {
      type?: string;
      category?: string;
      status?: string;
      priority?: string;
    },
    limit: number = 50,
  ): Promise<UserFeedback[]> {
    try {
      // Check if user is admin to determine what feedback they can see
      const isAdmin = await this.isUserAdmin(userId);

      const whereClause: any = {};

      if (filters) {
        if (filters.type) whereClause.type = filters.type;
        if (filters.category) whereClause.category = filters.category;
        if (filters.status) whereClause.status = filters.status;
        if (filters.priority) whereClause.priority = filters.priority;
      }

      // Non-admin users can only see their own feedback
      if (!isAdmin) {
        whereClause.user_id = userId;
      }

      return await prisma.userFeedback.findMany({
        where: whereClause,
        orderBy: {
          created_at: "desc",
        },
        take: limit,
      });
    } catch (error) {
      logger.error("Error fetching feedback items:", error);
      throw new Error("Failed to fetch feedback items");
    }
  }

  // Get feedback items for a specific user
  static async getUserFeedback(userId: string): Promise<UserFeedback[]> {
    try {
      return await prisma.userFeedback.findMany({
        where: {
          user_id: userId,
        },
        orderBy: {
          created_at: "desc",
        },
      });
    } catch (error) {
      logger.error("Error fetching user feedback:", error);
      throw new Error("Failed to fetch user feedback");
    }
  }

  // Get a specific feedback item by ID
  static async getFeedbackById(
    userId: string,
    feedbackId: string,
  ): Promise<UserFeedback | null> {
    try {
      const feedback = await prisma.userFeedback.findUnique({
        where: {
          id: feedbackId,
        },
      });

      if (!feedback) {
        return null;
      }

      // Check if user is authorized to view this feedback
      const isAdmin = await this.isUserAdmin(userId);
      if (!isAdmin && feedback.user_id !== userId) {
        throw new Error("Unauthorized access to feedback");
      }

      return feedback;
    } catch (error) {
      logger.error("Error fetching feedback by ID:", error);
      throw new Error("Failed to fetch feedback");
    }
  }

  // Update feedback status
  static async updateFeedbackStatus(
    userId: string,
    feedbackId: string,
    status: string,
    adminNotes?: string,
  ): Promise<UserFeedback> {
    try {
      // Check if user is admin
      const isAdmin = await this.isUserAdmin(userId);
      if (!isAdmin) {
        throw new Error("Only administrators can update feedback status");
      }

      const updateData: any = {
        status,
        admin_notes: adminNotes || undefined,
      };

      // If status is resolved or closed, set resolved_at
      if (status === "resolved" || status === "closed") {
        updateData.resolved_at = new Date();
      }

      const feedback = await prisma.userFeedback.update({
        where: {
          id: feedbackId,
        },
        data: updateData,
      });

      // Log the action
      await this.logFeedbackAction(
        userId,
        `feedback_${status}`,
        feedbackId,
        "UserFeedback",
        {
          status,
          adminNotes,
        },
      );

      // Notify the user if they provided an email
      if (feedback.user_id) {
        const user = await prisma.user.findUnique({
          where: {
            id: feedback.user_id,
          },
        });

        if (user) {
          let subject, message;
          if (status === "resolved") {
            subject = "Your Feedback Has Been Resolved";
            message = `Thank you for your feedback titled "${feedback.title}". We've addressed the issue and it has been resolved.`;
          } else if (status === "in_progress") {
            subject = "We're Working on Your Feedback";
            message = `We're currently working on your feedback titled "${feedback.title}". We'll update you when it's resolved.`;
          } else if (status === "closed") {
            subject = "Your Feedback Has Been Closed";
            message = `Your feedback titled "${feedback.title}" has been closed. If you have any further questions, please let us know.`;
          }

          if (subject && message) {
            await EmailService.sendNotificationEmail(
              user.email,
              user.full_name || "User",
              subject,
              message,
              "feedback",
            );
          }
        }
      }

      return feedback;
    } catch (error) {
      logger.error("Error updating feedback status:", error);
      throw new Error("Failed to update feedback status");
    }
  }

  // Add a comment to feedback
  static async addFeedbackComment(
    userId: string,
    feedbackId: string,
    commentData: Omit<
      FeedbackComment,
      "id" | "feedback_id" | "created_at" | "updated_at"
    >,
  ): Promise<FeedbackComment> {
    try {
      // Check if user can comment on this feedback
      const feedback = await prisma.userFeedback.findUnique({
        where: { id: feedbackId },
      });

      if (!feedback) {
        throw new Error("Feedback not found");
      }

      // Check if user is authorized to comment
      const isAdmin = await this.isUserAdmin(userId);
      if (!isAdmin && feedback.user_id !== userId) {
        throw new Error("Unauthorized to comment on this feedback");
      }

      const comment = await prisma.feedbackComment.create({
        data: {
          feedback_id: feedbackId,
          user_id: userId || undefined,
          content: commentData.content,
          is_internal: commentData.is_internal && isAdmin, // Only admins can create internal comments
        },
      });

      // Log the action
      await this.logFeedbackAction(
        userId,
        "feedback_comment_added",
        feedbackId,
        "FeedbackComment",
        {
          isInternal: commentData.is_internal,
        },
      );

      return comment;
    } catch (error) {
      logger.error("Error adding feedback comment:", error);
      throw new Error("Failed to add feedback comment");
    }
  }

  // Get comments for a feedback item
  static async getFeedbackComments(
    userId: string,
    feedbackId: string,
    includeInternal: boolean = false,
  ): Promise<FeedbackComment[]> {
    try {
      // Check if user can view comments on this feedback
      const feedback = await prisma.userFeedback.findUnique({
        where: { id: feedbackId },
      });

      if (!feedback) {
        throw new Error("Feedback not found");
      }

      // Check if user is authorized to view comments
      const isAdmin = await this.isUserAdmin(userId);
      if (!isAdmin && feedback.user_id !== userId) {
        throw new Error("Unauthorized to view comments on this feedback");
      }

      const whereClause: any = {
        feedback_id: feedbackId,
      };

      // If not including internal comments, filter them out
      // Non-admin users can never see internal comments
      if (!isAdmin || !includeInternal) {
        whereClause.is_internal = false;
      }

      return await prisma.feedbackComment.findMany({
        where: whereClause,
        orderBy: {
          created_at: "asc",
        },
        include: {
          user: {
            select: {
              full_name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error("Error fetching feedback comments:", error);
      throw new Error("Failed to fetch feedback comments");
    }
  }

  // Log feedback action for audit purposes
  static async logFeedbackAction(
    userId: string | null,
    action: string,
    resourceId: string | null,
    resourceType: string | null,
    details?: any,
  ): Promise<void> {
    try {
      // Create a dedicated feedback audit log entry
      await prisma.auditLog.create({
        data: {
          user_id: userId || undefined,
          action,
          resource_id: resourceId || undefined,
          resource_type: resourceType || undefined,
          details: details ? JSON.stringify(details) : undefined,
          ip_address: details?.ipAddress || undefined,
          user_agent: details?.userAgent || undefined,
        },
      });
    } catch (error) {
      logger.error("Error logging feedback action:", error);
      // Don't throw error as this is just for logging
    }
  }

  // Notify feedback team via Discord webhook
  static async notifyFeedbackTeam(
    subject: string,
    message: string,
  ): Promise<void> {
    try {
      // Discord webhook URL for feedback team notifications
      const webhookUrl = process.env.FEEDBACK_DISCORD_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.warn("FEEDBACK_DISCORD_WEBHOOK_URL not configured, skipping Discord notification");
        return;
      }

      // Create embed for Discord message
      const embed = {
        title: "📢 Feedback Team Notification",
        description: subject,
        color: 3447003, // Blue color
        fields: [
          {
            name: "📝 Message",
            value:
              message.length > 1024
                ? message.substring(0, 1021) + "..."
                : message,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: "ScholarForge AIFeedback System",
        },
      };

      // Send POST request to Discord webhook
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "<@&feedback-team> New feedback notification!",
          embeds: [embed],
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Discord webhook request failed with status ${response.status}`,
        );
      }

      logger.info("Feedback team notified via Discord webhook", {
        subject,
        message,
      });
    } catch (error) {
      logger.error("Error notifying feedback team via Discord webhook:", error);
      // Fallback to email notification if Discord fails
      try {
        const feedbackEmail = await SecretsService.getFeedbackEmail();
        await EmailService.sendNotificationEmail(
          feedbackEmail,
          "Feedback Team",
          subject,
          message,
          "feedback",
        );
      } catch (emailError) {
        logger.error("Error sending fallback email notification:", emailError);
      }
    }
  }

  // Get feedback statistics
  static async getFeedbackStats(userId: string): Promise<any> {
    try {
      // Check if user is admin
      const isAdmin = await this.isUserAdmin(userId);
      if (!isAdmin) {
        throw new Error("Only administrators can view feedback statistics");
      }

      const totalFeedback = await prisma.userFeedback.count();
      const openFeedback = await prisma.userFeedback.count({
        where: {
          status: "open",
        },
      });
      const inProgressFeedback = await prisma.userFeedback.count({
        where: {
          status: "in_progress",
        },
      });
      const resolvedFeedback = await prisma.userFeedback.count({
        where: {
          status: "resolved",
        },
      });
      const feedbackByType: any = await prisma.userFeedback.groupBy({
        by: ["type"],
        _count: {
          _all: true,
        },
      });
      const feedbackByCategory: any = await prisma.userFeedback.groupBy({
        by: ["category"],
        _count: {
          _all: true,
        },
        where: {
          category: {
            not: null,
          },
        },
      });

      return {
        total: totalFeedback,
        open: openFeedback,
        inProgress: inProgressFeedback,
        resolved: resolvedFeedback,
        byType: feedbackByType,
        byCategory: feedbackByCategory,
      };
    } catch (error) {
      logger.error("Error fetching feedback stats:", error);
      throw new Error("Failed to fetch feedback statistics");
    }
  }
}
