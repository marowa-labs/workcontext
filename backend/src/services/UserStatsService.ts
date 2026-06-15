import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

export class UserStatsService {
  /**
   * Aggregates user-specific KPIs and stats
   */
  static async getUserStats(userId: string, range: string = "month") {
    try {
      const days = range === "week" ? 7 : range === "all" ? 365 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      // 1. Task statistics (time-filtered)
      const [tasksCreatedInRange, tasksCompletedInRange] = await Promise.all([
        prisma.workspaceTask.count({
          where: {
            creator_id: userId,
            created_at: { gte: startDate },
          },
        }),
        prisma.workspaceTask.count({
          where: {
            creator_id: userId,
            status: "done",
            updated_at: { gte: startDate },
          },
        }),
      ]);

      // All-time totals for streak/progress context
      const totalUserTasks = await prisma.workspaceTask.count({
        where: { creator_id: userId },
      });
      const totalCompletedTasks = await prisma.workspaceTask.count({
        where: { creator_id: userId, status: "done" },
      });

      // Completion rate scoped to time range
      const rangeCompletionRate =
        tasksCreatedInRange > 0
          ? Math.round((tasksCompletedInRange / tasksCreatedInRange) * 100)
          : 0;

      // 2. Workspace and message counts (time-filtered where applicable)
      const [totalWorkspaces, totalMessages, aiInteractions] =
        await Promise.all([
          prisma.workspaceMember.count({
            where: {
              user_id: userId,
              joined_at: { gte: startDate },
            },
          }),
          prisma.aIChatMessage.count({
            where: {
              user_id: userId,
              created_at: { gte: startDate },
            },
          }),
          prisma.aIChatMessage.count({
            where: {
              user_id: userId,
              role: "user",
              created_at: { gte: startDate },
            },
          }),
        ]);

      // 3. Calculate streak
      const { currentStreak, longestStreak } =
        await this.calculateStreak(userId);

      // 4. Weekly activity data (adapts to range)
      const weeklyActivity = await this.getWeeklyActivity(userId, days);

      // 5. Calculate productivity score (0-100) using time-filtered values
      const productivity = this.calculateProductivity({
        tasksCompleted: tasksCompletedInRange,
        completionRate: rangeCompletionRate,
        currentStreak,
        aiInteractions,
      });

      // 5b. Calculate productivity percentile among all users
      const productivityPercentile = await this.calculateProductivityPercentile(
        userId,
        productivity,
      );

      // 6. Achievements
      const achievements = await this.getAchievements(
        userId,
        totalCompletedTasks,
        currentStreak,
        aiInteractions,
      );

      // 7. Recent milestones
      const recentMilestones = await this.getRecentMilestones(userId, 5);

      // 8. Time spent from real TaskTimeEntry data
      const timeEntries = await prisma.taskTimeEntry.findMany({
        where: {
          user_id: userId,
          duration: { not: null },
          start_time: { gte: startDate },
        },
        select: { duration: true },
      });
      const timeSpent = timeEntries.reduce(
        (sum: number, entry: { duration: number | null }) =>
          sum + (entry.duration || 0),
        0,
      );

      return {
        tasksCompleted: tasksCompletedInRange,
        tasksCreated: tasksCreatedInRange,
        completionRate: rangeCompletionRate,
        currentStreak,
        longestStreak,
        totalWorkspaces,
        totalMessages,
        aiInteractions,
        timeSpent,
        productivity,
        productivityPercentile,
        weeklyActivity,
        achievements,
        recentMilestones,
      };
    } catch (error: any) {
      logger.error("Error fetching user stats:", error);
      throw error;
    }
  }

  private static async calculateStreak(
    userId: string,
  ): Promise<{ currentStreak: number; longestStreak: number }> {
    // Get all completed tasks ordered by date
    const completedTasks = await prisma.workspaceTask.findMany({
      where: {
        creator_id: userId,
        status: "done",
      },
      orderBy: { updated_at: "desc" },
      select: { updated_at: true },
    });

    if (completedTasks.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const dates = completedTasks.map(
      (t: { updated_at: Date }) => t.updated_at.toISOString().split("T")[0],
    );
    const uniqueDates = [...new Set(dates)];

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Check if active today or yesterday
    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1] as string);
        const currDate = new Date(uniqueDates[i] as string);
        const diffDays = Math.floor(
          (prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000),
        );

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1] as string);
      const currDate = new Date(uniqueDates[i] as string);
      const diffDays = Math.floor(
        (prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000),
      );

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    return { currentStreak, longestStreak };
  }

  private static async getWeeklyActivity(userId: string, days: number = 7) {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result: { day: string; tasks: number; hours: number }[] = [];

    if (days <= 7) {
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const tasks = await prisma.workspaceTask.count({
          where: {
            creator_id: userId,
            status: "done",
            updated_at: { gte: date, lt: nextDate },
          },
        });

        const timeEntries = await prisma.taskTimeEntry.findMany({
          where: {
            user_id: userId,
            start_time: { gte: date, lt: nextDate },
            duration: { not: null },
          },
          select: { duration: true },
        });
        const totalMinutes = timeEntries.reduce(
          (sum: number, entry: { duration: number | null }) =>
            sum + (entry.duration || 0),
          0,
        );

        result.push({
          day: dayNames[date.getDay()],
          tasks,
          hours: Math.round((totalMinutes / 60) * 10) / 10,
        });
      }
    } else if (days <= 30) {
      const interval = 3;
      for (let i = days - 1; i >= 0; i -= interval) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + interval);

        const tasks = await prisma.workspaceTask.count({
          where: {
            creator_id: userId,
            status: "done",
            updated_at: { gte: date, lt: endDate },
          },
        });

        const timeEntries = await prisma.taskTimeEntry.findMany({
          where: {
            user_id: userId,
            start_time: { gte: date, lt: endDate },
            duration: { not: null },
          },
          select: { duration: true },
        });
        const totalMinutes = timeEntries.reduce(
          (sum: number, entry: { duration: number | null }) =>
            sum + (entry.duration || 0),
          0,
        );

        result.push({
          day: `${date.getDate()}/${date.getMonth() + 1}`,
          tasks,
          hours: Math.round((totalMinutes / 60) * 10) / 10,
        });
      }
    } else {
      for (let i = days - 1; i >= 0; i -= 7) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 7);

        const tasks = await prisma.workspaceTask.count({
          where: {
            creator_id: userId,
            status: "done",
            updated_at: { gte: date, lt: endDate },
          },
        });

        const timeEntries = await prisma.taskTimeEntry.findMany({
          where: {
            user_id: userId,
            start_time: { gte: date, lt: endDate },
            duration: { not: null },
          },
          select: { duration: true },
        });
        const totalMinutes = timeEntries.reduce(
          (sum: number, entry: { duration: number | null }) =>
            sum + (entry.duration || 0),
          0,
        );

        result.push({
          day: `${date.getDate()}/${date.getMonth() + 1}`,
          tasks,
          hours: Math.round((totalMinutes / 60) * 10) / 10,
        });
      }
    }

    return result;
  }

  private static calculateProductivity(metrics: {
    tasksCompleted: number;
    completionRate: number;
    currentStreak: number;
    aiInteractions: number;
  }): number {
    // Weighted scoring algorithm
    const taskScore = Math.min(metrics.tasksCompleted * 2, 40);
    const rateScore = metrics.completionRate * 0.3;
    const streakScore = Math.min(metrics.currentStreak * 3, 30);
    const aiScore = Math.min(metrics.aiInteractions * 0.1, 10);

    const total = Math.round(taskScore + rateScore + streakScore + aiScore);
    return Math.min(total, 100);
  }

  private static async calculateProductivityPercentile(
    userId: string,
    userProductivity: number,
  ): Promise<number> {
    try {
      // Get total user count for percentile calculation
      const totalUsers = await prisma.user.count();
      if (totalUsers <= 1) return 100;

      // Count users who have completed fewer tasks as a productivity proxy
      const userTaskCount = await prisma.workspaceTask.count({
        where: { creator_id: userId, status: "done" },
      });

      const usersWithFewerTasks = await prisma.user.count({
        where: {
          id: { not: userId },
          OR: [
            // Users who haven't created any tasks
            { created_tasks: { none: {} } },
          ],
        },
      });

      // Count users who have tasks but fewer completed ones
      // We use a raw query approach: count users whose done task count < userTaskCount
      const userTaskCounts = await prisma.workspaceTask.groupBy({
        by: ["creator_id"],
        where: { status: "done" },
        _count: { id: true },
      });

      const usersBelow = userTaskCounts.filter(
        (u: { creator_id: string; _count: { id: number } }) =>
          u.creator_id !== userId && u._count.id < userTaskCount,
      ).length;

      // Users with no tasks at all + users with fewer completed tasks
      const totalBelow = usersWithFewerTasks + usersBelow;
      const percentile = Math.round((totalBelow / (totalUsers - 1)) * 100);

      return Math.max(1, Math.min(99, percentile));
    } catch {
      return 50; // fallback
    }
  }

  private static async getAchievements(
    userId: string,
    tasksCompleted: number,
    streak: number,
    aiInteractions: number,
  ) {
    const achievements: {
      id: string;
      name: string;
      description: string;
      icon: string;
      unlockedAt: string;
    }[] = [];

    // Look up the actual date when each threshold was crossed by finding the Nth completed task
    if (tasksCompleted >= 100) {
      const hundredthTask = await prisma.workspaceTask.findFirst({
        where: { creator_id: userId, status: "done" },
        orderBy: { updated_at: "asc" },
        skip: 99,
        select: { updated_at: true },
      });
      achievements.push({
        id: "task-master",
        name: "Task Master",
        description: "Complete 100 tasks",
        icon: "trophy",
        unlockedAt:
          hundredthTask?.updated_at?.toISOString() || new Date().toISOString(),
      });
    }

    // For streak achievements, use the most recent completed task date
    if (streak >= 7) {
      const lastCompletedTask = await prisma.workspaceTask.findFirst({
        where: { creator_id: userId, status: "done" },
        orderBy: { updated_at: "desc" },
        select: { updated_at: true },
      });
      achievements.push({
        id: "streak-keeper",
        name: "Streak Keeper",
        description: "7-day streak achieved",
        icon: "flame",
        unlockedAt:
          lastCompletedTask?.updated_at?.toISOString() ||
          new Date().toISOString(),
      });
    }

    if (aiInteractions >= 500) {
      const fiveHundredthMessage = await prisma.aIChatMessage.findFirst({
        where: { user_id: userId, role: "user" },
        orderBy: { created_at: "asc" },
        skip: 499,
        select: { created_at: true },
      });
      achievements.push({
        id: "ai-explorer",
        name: "AI Explorer",
        description: "Use AI assistant 500 times",
        icon: "zap",
        unlockedAt:
          fiveHundredthMessage?.created_at?.toISOString() ||
          new Date().toISOString(),
      });
    }

    return achievements;
  }

  private static async getRecentMilestones(userId: string, limit: number) {
    const milestones: {
      id: string;
      title: string;
      date: string;
      type: "task" | "streak" | "workspace" | "ai";
    }[] = [];

    // Recent completed tasks
    const recentTasks = await prisma.workspaceTask.findMany({
      where: {
        creator_id: userId,
        status: "done",
      },
      orderBy: { updated_at: "desc" },
      take: limit,
      select: { id: true, title: true, updated_at: true },
    });

    recentTasks.forEach(
      (task: { id: string; title: string; updated_at: Date }) => {
        milestones.push({
          id: `task-${task.id}`,
          title: `Completed: ${task.title.substring(0, 30)}${task.title.length > 30 ? "..." : ""}`,
          date: task.updated_at.toISOString(),
          type: "task",
        });
      },
    );

    // Sort by date and take top 5
    return milestones
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }
}
