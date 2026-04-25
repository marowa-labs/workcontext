import { prisma } from "../lib/prisma";

export class UserService {
  // Get user by ID
  static async getUserById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) throw new Error("User not found");

      return user;
    } catch (error) {
      throw new Error(`Error fetching user: ${(error as Error).message}`);
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, profileData: Partial<any>) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: profileData,
      });
    } catch (error) {
      throw new Error(
        `Error updating user profile: ${(error as Error).message}`,
      );
    }
  }

  // Get user's subscription info
  static async getUserSubscription(userId: string) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      // If no subscription found, return default free plan
      if (!subscription) {
        return {
          user_id: userId,
          plan: "free",
          status: "active",
          created_at: new Date().toISOString(),
        };
      }

      return subscription;
    } catch (error) {
      // Return default free plan on error
      return {
        user_id: userId,
        plan: "free",
        status: "active",
        created_at: new Date().toISOString(),
      };
    }
  }

  // Get user's AI usage
  static async getUserAIUsage(userId: string) {
    try {
      return await prisma.aIUsage.findMany({
        where: { user_id: userId },
      });
    } catch (error) {
      throw new Error(`Error fetching AI usage: ${(error as Error).message}`);
    }
  }

  // Track AI usage
  static async trackAIUsage(
    userId: string,
    feature: string,
    tokensUsed: number,
    cost: number,
  ) {
    try {
      // Get current month and year
      const now = new Date();
      const month = now.getMonth() + 1; // 1-12
      const year = now.getFullYear();

      // Upsert AI usage record for this month
      return await prisma.aIUsage.upsert({
        where: {
          user_id_month_year: {
            user_id: userId,
            month,
            year,
          },
        },
        update: {
          request_count: { increment: 1 },
          total_tokens_used: { increment: tokensUsed },
          total_cost_estimate: { increment: cost },
        },
        create: {
          user_id: userId,
          month,
          year,
          request_count: 1,
          total_tokens_used: tokensUsed,
          total_cost_estimate: cost,
        },
      });
    } catch (error) {
      throw new Error(`Error tracking AI usage: ${(error as Error).message}`);
    }
  }

  // Get user's projects count
  static async getUserProjectsCount(userId: string) {
    try {
      return await prisma.project.count({
        where: { user_id: userId },
      });
    } catch (error) {
      throw new Error(
        `Error counting user projects: ${(error as Error).message}`,
      );
    }
  }
}
