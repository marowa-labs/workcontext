import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

interface SupportTicketData {
  user_id?: string;
  subject: string;
  message: string;
  priority: string;
  attachment_url?: string;
  browser_info?: string;
  os_info?: string;
  screen_size?: string;
  user_plan?: string;
  ip_address?: string;
  user_agent?: string;
}

export class SupportTicketService {
  /**
   * Create a new support ticket
   */
  static async createSupportTicket(data: SupportTicketData) {
    try {
      const ticket = await prisma.supportTicket.create({
        data: {
          user_id: data.user_id || null,
          subject: data.subject,
          message: data.message,
          priority: data.priority,
          attachment_url: data.attachment_url || null,
          browser_info: data.browser_info || null,
          os_info: data.os_info || null,
          screen_size: data.screen_size || null,
          user_plan: data.user_plan || null,
          status: "open",
        },
      });

      // Send notification to Discord webhook
      try {
        await this.sendToDiscordWebhook(ticket);
      } catch (webhookError) {
        logger.error(
          "Failed to send support ticket to Discord webhook:",
          webhookError
        );
        // Don't fail the ticket creation if webhook fails
      }

      return ticket;
    } catch (error) {
      logger.error("Error creating support ticket:", error);
      throw error;
    }
  }

  /**
   * Get all support tickets (with optional filters)
   */
  static async getSupportTickets(
    userId?: string,
    status?: string,
    priority?: string,
    limit?: number
  ) {
    try {
      const whereClause: any = {};

      if (userId) {
        whereClause.user_id = userId;
      }

      if (status) {
        whereClause.status = status;
      }

      if (priority) {
        whereClause.priority = priority;
      }

      const tickets = await prisma.supportTicket.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" },
        take: limit || 50,
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
      });

      return tickets;
    } catch (error) {
      logger.error("Error fetching support tickets:", error);
      throw error;
    }
  }

  /**
   * Get a specific support ticket by ID
   */
  static async getSupportTicketById(id: string) {
    try {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
      });

      return ticket;
    } catch (error) {
      logger.error("Error fetching support ticket by ID:", error);
      throw error;
    }
  }

  /**
   * Update a support ticket
   */
  static async updateSupportTicket(
    id: string,
    data: Partial<SupportTicketData> & { status?: string; admin_notes?: string }
  ) {
    try {
      const ticket = await prisma.supportTicket.update({
        where: { id },
        data: {
          subject: data.subject,
          message: data.message,
          priority: data.priority,
          attachment_url: data.attachment_url,
          status: data.status,
          admin_notes: data.admin_notes,
          browser_info: data.browser_info,
          os_info: data.os_info,
          screen_size: data.screen_size,
          user_plan: data.user_plan,
          updated_at: new Date(),
        },
      });

      return ticket;
    } catch (error) {
      logger.error("Error updating support ticket:", error);
      throw error;
    }
  }

  /**
   * Close a support ticket
   */
  static async closeSupportTicket(id: string, admin_notes?: string) {
    try {
      const ticket = await prisma.supportTicket.update({
        where: { id },
        data: {
          status: "closed",
          resolved_at: new Date(),
          admin_notes: admin_notes || undefined,
        },
      });

      return ticket;
    } catch (error) {
      logger.error("Error closing support ticket:", error);
      throw error;
    }
  }

  /**
   * Send support ticket notification to Discord webhook
   */
  static async sendToDiscordWebhook(ticket: any) {
    try {
      // Use the provided Discord webhook URL
      const webhookUrl = process.env.SUPPORT_TICKET_DISCORD_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.warn("SUPPORT_TICKET_DISCORD_WEBHOOK_URL not configured, skipping Discord notification");
        return;
      }

      // Priority-based color mapping
      const priorityColors: Record<string, number> = {
        normal: 8421504, // Gray
        high: 16766720, // Orange
        urgent: 16711680, // Red
      };

      const priorityEmojis: Record<string, string> = {
        normal: "🟡",
        high: "🟠",
        urgent: "🔴",
      };

      const subjectEmojis: Record<string, string> = {
        technical: "🔧",
        billing: "💳",
        feature: "✨",
        bug: "🐛",
        other: "❓",
      };

      // Format the ticket data for Discord
      const webhookData = {
        content: null,
        embeds: [
          {
            title: "🎫 New Support Ticket",
            color: priorityColors[ticket.priority] || 8421504,
            fields: [
              {
                name: "Subject",
                value: `${subjectEmojis[ticket.subject] || "❓"} ${this.formatSubject(ticket.subject)}`,
                inline: true,
              },
              {
                name: "Priority",
                value: `${priorityEmojis[ticket.priority] || "🟡"} ${this.formatPriority(ticket.priority)}`,
                inline: true,
              },
              {
                name: "Status",
                value: `🎫 ${ticket.status || "open"}`,
                inline: true,
              },
              {
                name: "Message",
                value: ticket.message || "No message provided",
                inline: false,
              },
              {
                name: "User Plan",
                value: ticket.user_plan || "Not specified",
                inline: true,
              },
              {
                name: "Submitted",
                value: new Date(ticket.created_at).toLocaleString(),
                inline: true,
              },
              {
                name: "Browser Info",
                value: ticket.browser_info || "Not available",
                inline: false,
              },
              {
                name: "OS Info",
                value: ticket.os_info || "Not available",
                inline: false,
              },
            ],
            timestamp: new Date(ticket.created_at).toISOString(),
            footer: {
              text: `Ticket ID: ${ticket.id}`,
            },
          },
        ],
      };

      // Send to Discord webhook
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookData),
      });

      if (!response.ok) {
        throw new Error(
          `Discord webhook request failed with status ${response.status}`
        );
      }

      logger.info("Support ticket sent to Discord webhook successfully", {
        ticketId: ticket.id,
      });
    } catch (error) {
      logger.error("Error sending support ticket to Discord webhook:", error);
      throw error;
    }
  }

  /**
   * Format subject for display
   */
  private static formatSubject(subject: string): string {
    const subjectMap: Record<string, string> = {
      technical: "Technical Issue",
      billing: "Billing Question",
      feature: "Feature Request",
      bug: "Bug Report",
      other: "Other",
    };
    return subjectMap[subject] || subject;
  }

  /**
   * Format priority for display
   */
  private static formatPriority(priority: string): string {
    const priorityMap: Record<string, string> = {
      normal: "Normal",
      high: "High",
      urgent: "Urgent",
    };
    return priorityMap[priority] || priority;
  }
}
