import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

export class RecycleBinService {
  /**
   * Move an item to the recycle bin
   * @param userId The user ID
   * @param itemType The type of item (project, template, etc.)
   * @param itemId The ID of the item
   * @param itemData The serialized data of the item
   */
  static async moveToRecycleBin(
    userId: string,
    itemType: string,
    itemId: string,
    itemData: any
  ): Promise<void> {
    try {
      // Get user's retention period setting
      const retentionPeriod = await this.getUserRetentionPeriod(userId);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + retentionPeriod); // Auto-delete after retention period

      await prisma.recycledItem.create({
        data: {
          user_id: userId,
          item_type: itemType,
          item_id: itemId,
          item_data: itemData,
          expires_at: expiresAt,
        },
      });

      logger.info("Item moved to recycle bin", {
        userId,
        itemType,
        itemId,
        retentionPeriod,
      });
    } catch (error) {
      logger.error("Failed to move item to recycle bin", {
        error: (error as Error).message,
        userId,
        itemType,
        itemId,
      });
      throw error;
    }
  }

  /**
   * Get all recycled items for a user
   * @param userId The user ID
   * @param itemType Optional filter by item type
   */
  static async getUserRecycledItems(
    userId: string,
    itemType?: string
  ): Promise<any[]> {
    try {
      const whereClause: any = {
        user_id: userId,
        restored_at: null, // Only non-restored items
      };

      if (itemType) {
        whereClause.item_type = itemType;
      }

      const items = await prisma.recycledItem.findMany({
        where: whereClause,
        orderBy: {
          deleted_at: "desc",
        },
      });

      return items;
    } catch (error) {
      logger.error("Failed to fetch user recycled items", {
        error: (error as Error).message,
        userId,
        itemType,
      });
      throw error;
    }
  }

  /**
   * Restore an item from the recycle bin
   * @param userId The user ID
   * @param recycledItemId The ID of the recycled item
   */
  static async restoreItem(
    userId: string,
    recycledItemId: string
  ): Promise<any> {
    try {
      // First, get the recycled item to verify ownership
      const recycledItem = await prisma.recycledItem.findUnique({
        where: {
          id: recycledItemId,
          user_id: userId,
        },
      });

      if (!recycledItem) {
        throw new Error("Recycled item not found or access denied");
      }

      // Handle restoration based on item type
      if (recycledItem.item_type === "project" && recycledItem.item_data) {
        // Recreate the project in the projects table
        const itemData = recycledItem.item_data as any;

        await prisma.project.create({
          data: {
            id: recycledItem.item_id,
            user_id: userId,
            title:
              typeof itemData.title === "string"
                ? itemData.title
                : "Untitled Project",
            type:
              typeof itemData.type === "string" ? itemData.type : "document",
            citation_style:
              typeof itemData.citation_style === "string"
                ? itemData.citation_style
                : "apa",
            description:
              typeof itemData.description === "string"
                ? itemData.description
                : null,
            content: itemData.content || {},
            word_count:
              typeof itemData.word_count === "number" ? itemData.word_count : 0,
            due_date: itemData.due_date ? new Date(itemData.due_date) : null,
            status:
              typeof itemData.status === "string" ? itemData.status : "draft",
            created_at: itemData.created_at
              ? new Date(itemData.created_at)
              : new Date(),
            updated_at: new Date(),
          },
        });
      }
      // Add other item types as needed (templates, citations, etc.)

      // Mark the item as restored
      const updatedItem = await prisma.recycledItem.update({
        where: {
          id: recycledItemId,
        },
        data: {
          restored_at: new Date(),
        },
      });

      logger.info("Item restored from recycle bin", {
        userId,
        recycledItemId,
        itemType: recycledItem.item_type,
        itemId: recycledItem.item_id,
      });

      return {
        ...updatedItem,
        original_data: recycledItem.item_data,
      };
    } catch (error) {
      logger.error("Failed to restore item from recycle bin", {
        error: (error as Error).message,
        userId,
        recycledItemId,
      });
      throw error;
    }
  }

  /**
   * Permanently delete an item from the recycle bin
   * @param userId The user ID
   * @param recycledItemId The ID of the recycled item
   */
  static async permanentlyDeleteItem(
    userId: string,
    recycledItemId: string
  ): Promise<void> {
    try {
      // Verify ownership before deletion
      const recycledItem = await prisma.recycledItem.findUnique({
        where: {
          id: recycledItemId,
          user_id: userId,
        },
      });

      if (!recycledItem) {
        throw new Error("Recycled item not found or access denied");
      }

      // Delete the recycled item permanently
      await prisma.recycledItem.delete({
        where: {
          id: recycledItemId,
        },
      });

      logger.info("Item permanently deleted from recycle bin", {
        userId,
        recycledItemId,
        itemType: recycledItem.item_type,
        itemId: recycledItem.item_id,
      });
    } catch (error) {
      logger.error("Failed to permanently delete item from recycle bin", {
        error: (error as Error).message,
        userId,
        recycledItemId,
      });
      throw error;
    }
  }

  /**
   * Permanently delete all expired items
   */
  static async deleteExpiredItems(): Promise<number> {
    try {
      const now = new Date();
      const result = await prisma.recycledItem.deleteMany({
        where: {
          expires_at: {
            lt: now,
          },
          restored_at: null,
        },
      });

      logger.info("Deleted expired items from recycle bin", {
        count: result.count,
      });

      return result.count;
    } catch (error) {
      logger.error("Failed to delete expired items from recycle bin", {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get statistics for a user's recycle bin
   * @param userId The user ID
   */
  static async getRecycleBinStats(userId: string): Promise<{
    totalItems: number;
    itemsByType: Record<string, number>;
    expiredItems: number;
  }> {
    try {
      const items = await prisma.recycledItem.findMany({
        where: {
          user_id: userId,
          restored_at: null,
        },
        select: {
          item_type: true,
          expires_at: true,
        },
      });

      const now = new Date();
      let totalItems = 0;
      let expiredItems = 0;
      const itemsByType: Record<string, number> = {};

      for (const item of items) {
        totalItems++;
        itemsByType[item.item_type] = (itemsByType[item.item_type] || 0) + 1;

        if (item.expires_at < now) {
          expiredItems++;
        }
      }

      return {
        totalItems,
        itemsByType,
        expiredItems,
      };
    } catch (error) {
      logger.error("Failed to get recycle bin stats", {
        error: (error as Error).message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get user's retention period setting
   * @param userId The user ID
   * @returns The retention period in days
   */
  static async getUserRetentionPeriod(userId: string): Promise<number> {
    try {
      // Check if user has a custom retention period setting using Prisma client
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          retention_period: true,
        },
      });

      // Return user's retention period or default to 28 days
      if (user && user.retention_period) {
        return user.retention_period;
      }
      return 28;
    } catch (error) {
      logger.error("Failed to get user retention period", {
        error: (error as Error).message,
        userId,
      });
      // Return default retention period of 28 days
      return 28;
    }
  }

  /**
   * Set user's retention period setting
   * @param userId The user ID
   * @param retentionPeriod The retention period in days
   */
  static async setUserRetentionPeriod(
    userId: string,
    retentionPeriod: number
  ): Promise<void> {
    try {
      // Validate retention period
      if (retentionPeriod < 1 || retentionPeriod > 365) {
        throw new Error("Retention period must be between 1 and 365 days");
      }

      // Update user's retention period setting using Prisma client
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          retention_period: retentionPeriod,
        },
      });

      logger.info("User retention period updated", {
        userId,
        retentionPeriod,
      });
    } catch (error) {
      logger.error("Failed to set user retention period", {
        error: (error as Error).message,
        userId,
        retentionPeriod,
      });
      throw error;
    }
  }
}
