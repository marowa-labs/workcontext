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

      // 1. Total counts (absolute all-time — appropriate for overview cards)
      const [totalUsers, totalWorkspaces, totalTasks, totalMessages] =
        await Promise.all([
          prisma.user.count(),
          prisma.workspace.count(),
          prisma.workspaceTask.count(),
          prisma.aIChatMessage.count(),
        ]);

      // Active users within the selected range
      const activeUsers = await prisma.user.count({
        where: { updated_at: { gte: startDate } },
      });

      // 2. Daily growth (new in last 24h)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [newUsers, newWorkspaces, newTasks] = await Promise.all([
        prisma.user.count({ where: { created_at: { gte: yesterday } } }),
        prisma.workspace.count({ where: { created_at: { gte: yesterday } } }),
        prisma.workspaceTask.count({
          where: { created_at: { gte: yesterday } },
        }),
      ]);

      // 3. Activity by day for chart
      const activityByDay = await this.getActivityByDay(days);

      // 4. Top workspaces by activity within the range
      const topWorkspacesRaw = await prisma.workspace.findMany({
        take: 5,
        include: {
          _count: {
            select: {
              tasks: {
                where: { updated_at: { gte: startDate } },
              },
              members: true,
            },
          },
        },
      });

      // Sort by task count within the range, take top 5
      const topWorkspaces = topWorkspacesRaw
        .sort((a, b) => b._count.tasks - a._count.tasks)
        .slice(0, 5)
        .map(
          (w: {
            id: string;
            name: string;
            _count: { tasks: number; members: number };
          }) => ({
            id: w.id,
            name: w.name,
            tasks: w._count.tasks,
            users: w._count.members,
          }),
        );

      // 5. AI usage stats within range
      const aiUsage = await this.getAIUsageByDay(days);

      const rangeTotalMessages = await prisma.aIChatMessage.count({
        where: { created_at: { gte: startDate } },
      });

      // 6. Platform-wide completion rate scoped to range
      const rangeTotalTasks = await prisma.workspaceTask.count({
        where: { created_at: { gte: startDate } },
      });
      const rangeDoneTasks = await prisma.workspaceTask.count({
        where: { status: "done", created_at: { gte: startDate } },
      });
      const completionRate =
        rangeTotalTasks > 0
          ? Math.round((rangeDoneTasks / rangeTotalTasks) * 100)
          : 0;

      // 7. Average AI response time scoped to range
      const avgResponseResult = await prisma.aIPerformanceMetric.aggregate({
        where: { timestamp: { gte: startDate } },
        _avg: { response_time: true },
      });
      const avgResponseTime = avgResponseResult._avg.response_time
        ? `${avgResponseResult._avg.response_time.toFixed(1)}s`
        : "N/A";

      return {
        totalUsers,
        totalWorkspaces,
        totalTasks,
        totalMessages,
        activeUsers,
        completionRate,
        avgResponseTime,
        dailyGrowth: {
          users: newUsers,
          workspaces: newWorkspaces,
          tasks: newTasks,
        },
        activityByDay,
        topWorkspaces,
        aiUsage: {
          totalRequests: rangeTotalMessages,
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

    if (days <= 7) {
      // Show daily buckets for 7d
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const [taskCount, messageCount] = await Promise.all([
          prisma.workspaceTask.count({
            where: { updated_at: { gte: date, lt: nextDate } },
          }),
          prisma.aIChatMessage.count({
            where: { created_at: { gte: date, lt: nextDate } },
          }),
        ]);

        result.push({
          day: dayNames[date.getDay()],
          count: taskCount + messageCount,
        });
      }
    } else if (days <= 30) {
      // Show ~10 intervals (every 3 days) for 30d
      const interval = 3;
      for (let i = days - 1; i >= 0; i -= interval) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + interval);

        const [taskCount, messageCount] = await Promise.all([
          prisma.workspaceTask.count({
            where: { updated_at: { gte: date, lt: endDate } },
          }),
          prisma.aIChatMessage.count({
            where: { created_at: { gte: date, lt: endDate } },
          }),
        ]);

        result.push({
          day: `${date.getDate()}/${date.getMonth() + 1}`,
          count: taskCount + messageCount,
        });
      }
    } else {
      // Show weekly buckets for 90d (~13 weeks)
      for (let i = days - 1; i >= 0; i -= 7) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 7);

        const [taskCount, messageCount] = await Promise.all([
          prisma.workspaceTask.count({
            where: { updated_at: { gte: date, lt: endDate } },
          }),
          prisma.aIChatMessage.count({
            where: { created_at: { gte: date, lt: endDate } },
          }),
        ]);

        result.push({
          day: `${date.getDate()}/${date.getMonth() + 1}`,
          count: taskCount + messageCount,
        });
      }
    }

    return result;
  }

  private static async getAIUsageByDay(days: number) {
    const result: { day: string; count: number }[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    if (days <= 7) {
      for (let i = days - 1; i >= 0; i--) {
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
        result.push({ day: dayNames[date.getDay()], count });
      }
    } else if (days <= 30) {
      const interval = 3;
      for (let i = days - 1; i >= 0; i -= interval) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + interval);

        const count = await prisma.aIChatMessage.count({
          where: {
            created_at: { gte: date, lt: endDate },
            role: "assistant",
          },
        });
        result.push({
          day: `${date.getDate()}/${date.getMonth() + 1}`,
          count,
        });
      }
    } else {
      for (let i = days - 1; i >= 0; i -= 7) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 7);

        const count = await prisma.aIChatMessage.count({
          where: {
            created_at: { gte: date, lt: endDate },
            role: "assistant",
          },
        });
        result.push({
          day: `${date.getDate()}/${date.getMonth() + 1}`,
          count,
        });
      }
    }

    return result;
  }
}
