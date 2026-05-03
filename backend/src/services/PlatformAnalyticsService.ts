import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

export class PlatformAnalyticsService {
  /**
   * Aggregates platform-wide analytics
   */
  static async getPlatformAnalytics(range: string = "30d") {
    try {
      const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      // 1. Total counts
      const [
        totalUsers,
        totalWorkspaces,
        totalTasks,
        totalMessages,
        activeUsers,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.workspace.count(),
        prisma.workspaceTask.count(),
        prisma.aIChatMessage.count(),
        prisma.user.count({
          where: {
            updated_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      // 2. Daily growth (new in last 24h)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [newUsers, newWorkspaces, newTasks] = await Promise.all([
        prisma.user.count({ where: { created_at: { gte: yesterday } } }),
        prisma.workspace.count({ where: { created_at: { gte: yesterday } } }),
        prisma.workspaceTask.count({ where: { created_at: { gte: yesterday } } }),
      ]);

      // 3. Activity by day for chart
      const activityByDay = await this.getActivityByDay(days);

      // 4. Top workspaces by activity
      const topWorkspaces = await prisma.workspace.findMany({
        take: 5,
        orderBy: { updated_at: "desc" },
        include: {
          _count: {
            select: { tasks: true, members: true },
          },
        },
      });

      // 5. AI usage stats
      const aiUsage = await this.getAIUsageByDay(days);

      return {
        totalUsers,
        totalWorkspaces,
        totalTasks,
        totalMessages,
        activeUsers,
        dailyGrowth: {
          users: newUsers,
          workspaces: newWorkspaces,
          tasks: newTasks,
        },
        activityByDay,
        topWorkspaces: topWorkspaces.map((w: { id: string; name: string; _count: { tasks: number; members: number } }) => ({
          id: w.id,
          name: w.name,
          tasks: w._count.tasks,
          users: w._count.members,
        })),
        aiUsage: {
          totalRequests: await prisma.aIChatMessage.count(),
          byDay: aiUsage,
        },
      };
    } catch (error: any) {
      logger.error("Error fetching platform analytics:", error);
      throw error;
    }
  }

  private static async getActivityByDay(days: number) {
    const result: { day: string; count: number }[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [taskCount, messageCount] = await Promise.all([
        prisma.workspaceTask.count({
          where: {
            updated_at: { gte: date, lt: nextDate },
          },
        }),
        prisma.aIChatMessage.count({
          where: {
            created_at: { gte: date, lt: nextDate },
          },
        }),
      ]);

      // Only show last 7 days for the chart
      if (i < 7) {
        result.push({
          day: dayNames[date.getDay()],
          count: taskCount + messageCount,
        });
      }
    }

    return result;
  }

  private static async getAIUsageByDay(days: number) {
    const result: { day: string; count: number }[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.aIChatMessage.count({
        where: {
          created_at: { gte: date, lt: nextDate },
          role: "assistant",
        },
      });

      result.push({
        day: dayNames[date.getDay()],
        count,
      });
    }

    return result;
  }
}
