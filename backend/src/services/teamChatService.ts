import prisma from "../lib/prisma";
import logger from "../monitoring/logger";

export interface TeamChatFilter {
  workspaceId?: string;
  projectId?: string;
  parentId?: string;
}

export class TeamChatService {
  /**
   * Fetch messages with basic threading support
   */
  static async getMessages(filter: TeamChatFilter, limit = 50, offset = 0) {
    try {
      const messages = await prisma.teamChatMessage.findMany({
        where: {
          workspace_id: filter.workspaceId,
          project_id: filter.projectId,
          parent_id: filter.parentId || null,
        },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          _count: {
            select: { replies: true },
          },
        },
        orderBy: {
          created_at: "asc",
        },
        take: limit,
        skip: offset,
      });

      return messages;
    } catch (error) {
      logger.error("Error fetching chat messages:", error);
      throw error;
    }
  }

  /**
   * Send a new message
   */
  static async sendMessage(
    userId: string,
    content: string,
    filter: TeamChatFilter,
  ) {
    try {
      const message = await prisma.teamChatMessage.create({
        data: {
          user_id: userId,
          content,
          workspace_id: filter.workspaceId,
          project_id: filter.projectId,
          parent_id: filter.parentId,
        },
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

      // TODO: Trigger realtime notification or broadcast

      return message;
    } catch (error) {
      logger.error("Error sending chat message:", error);
      throw error;
    }
  }

  /**
   * Delete a message (owner only or admin)
   */
  static async deleteMessage(messageId: string, userId: string) {
    try {
      // Check ownership
      const message = await prisma.teamChatMessage.findUnique({
        where: { id: messageId },
      });

      if (!message || message.user_id !== userId) {
        throw new Error("Unauthorized or message not found");
      }

      await prisma.teamChatMessage.delete({
        where: { id: messageId },
      });

      return { success: true };
    } catch (error) {
      logger.error("Error deleting chat message:", error);
      throw error;
    }
  }
}

export default TeamChatService;
