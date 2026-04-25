import logger from "../monitoring/logger";
import { prisma } from "../lib/prisma";

export class PushNotificationService {
  // Register a push notification token for a user in the database
  static async registerToken(userId: string, token: string): Promise<void> {
    try {
      // Store token in database
      await prisma.pushNotificationToken.upsert({
        where: {
          user_id_token: {
            user_id: userId,
            token: token,
          },
        },
        update: {
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          token: token,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      logger.info(`Push notification token registered for user ${userId}`);
    } catch (error) {
      logger.error("Error registering push notification token:", error);
      throw error;
    }
  }

  // Unregister a push notification token for a user from the database
  static async unregisterToken(userId: string, token: string): Promise<void> {
    try {
      await prisma.pushNotificationToken.deleteMany({
        where: {
          user_id: userId,
          token: token,
        },
      });

      logger.info(`Push notification token unregistered for user ${userId}`);
    } catch (error) {
      logger.error("Error unregistering push notification token:", error);
      throw error;
    }
  }

  // Get all push notification tokens for a user
  static async getUserTokens(userId: string): Promise<string[]> {
    try {
      const tokens = await prisma.pushNotificationToken.findMany({
        where: {
          user_id: userId,
        },
        select: {
          token: true,
        },
      });

      return tokens.map((t: { token: string }) => t.token);
    } catch (error) {
      logger.error("Error getting user push notification tokens:", error);
      return [];
    }
  }

  static async getPushNotificationTokensForUser(
    userId: string
  ): Promise<string[]> {
    try {
      const tokens = await prisma.pushNotificationToken.findMany({
        where: { user_id: userId },
        select: { token: true },
      });
      return tokens.map((t: { token: string }) => t.token);
    } catch (error) {
      console.error("Error getting push notification tokens:", error);
      return [];
    }
  }

  // Send push notification to a user (simulated)
  static async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> {
    try {
      const tokens = await this.getUserTokens(userId);
      if (tokens.length === 0) {
        logger.info(`No push notification tokens found for user ${userId}`);
        return;
      }

      // Simulate push notification
      logger.info(
        `Simulating push notification to user ${userId}: ${title} - ${body}`
      );
    } catch (error) {
      logger.error("Error sending push notification:", error);
      throw error;
    }
  }

  // Send push notification to multiple users
  static async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> {
    for (const userId of userIds) {
      await this.sendToUser(userId, title, body, data);
    }
  }

  // Broadcast push notification to all users (simulated)
  static async broadcast(
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> {
    try {
      // Simulate broadcast
      logger.info(`Simulating broadcast push notification: ${title} - ${body}`);
    } catch (error) {
      logger.error("Error broadcasting push notification:", error);
      throw error;
    }
  }

  static async cleanUpExpiredTokens(): Promise<void> {
    try {
      // First, get all tokens with their creation timestamps
      const allTokensRecords = await prisma.pushNotificationToken.findMany({
        select: { id: true, token: true, created_at: true },
      });

      // Filter expired tokens (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const expiredTokens = allTokensRecords.filter(
        (record: { token: string; created_at: Date }) => {
          // Check if token was created more than 30 days ago
          return record.created_at < thirtyDaysAgo;
        }
      );

      if (expiredTokens.length > 0) {
        const expiredIds = expiredTokens.map(
          (record: { id: string }) => record.id
        );
        await prisma.pushNotificationToken.deleteMany({
          where: { id: { in: expiredIds } },
        });
        console.log(
          `Cleaned up ${expiredTokens.length} expired push notification tokens`
        );
      }
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
    }
  }
}

export default PushNotificationService;
