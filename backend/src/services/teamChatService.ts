import { randomUUID } from "crypto";
import prisma from "../lib/prisma";
import { getSupabaseAdminClient } from "../lib/supabase/client";
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
      const supabase = await getSupabaseAdminClient();
      if (!supabase) {
        throw new Error("Supabase admin client not available");
      }

      // Use Supabase admin client so server-side inserts and relation selects bypass RLS
      const id = randomUUID();
      const { data, error } = await supabase
        .from("TeamChatMessage")
        .insert({
          id,
          user_id: userId,
          content,
          workspace_id: filter.workspaceId || null,
          project_id: filter.projectId || null,
          parent_id: filter.parentId || null,
        })
        .select(
          "id, content, workspace_id, project_id, parent_id, created_at, user:User(id, full_name, email)",
        )
        .single();

      if (error) throw error;

      // Broadcast via Supabase Realtime for instant delivery to other clients
      const channelName = filter.workspaceId
        ? `team-chat-${filter.workspaceId}`
        : `team-chat-${filter.projectId}`;
      const broadcastChannel = supabase.channel(channelName);
      broadcastChannel.send({
        type: "broadcast",
        event: "new_message",
        payload: data,
      });

      return data;
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
      // Check ownership via Prisma (Supabase doesn't support complex queries easily)
      const message = await prisma.teamChatMessage.findUnique({
        where: { id: messageId },
      });

      if (!message || message.user_id !== userId) {
        throw new Error("Unauthorized or message not found");
      }

      // Use Supabase client for delete so real-time subscription fires
      const supabase = await getSupabaseAdminClient();
      if (!supabase) {
        throw new Error("Supabase admin client not available");
      }

      const { error } = await supabase
        .from("TeamChatMessage")
        .delete()
        .eq("id", messageId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      logger.error("Error deleting chat message:", error);
      throw error;
    }
  }
}

export default TeamChatService;
