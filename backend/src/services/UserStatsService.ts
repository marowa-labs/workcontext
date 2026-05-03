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

      // 1. Task statistics
      const [tasksCreated, tasksCompleted] = await Promise.all([
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

      const totalUserTasks = await prisma.workspaceTask.count({
        where: { creator_id: userId },
      });
      // Since updated_by doesn't exist, count done tasks created by user
      const totalCompletedTasks = await prisma.workspaceTask.count({
        where: { creator_id: userId, status: "done" },
      });

      const completionRate = totalUserTasks > 0
        ? Math.round((totalCompletedTasks / totalUserTasks) * 100)
        : 0;

      // 2. Workspace and message counts
      const [totalWorkspaces, totalMessages, aiInteractions] = await Promise.all([
        prisma.workspaceMember.count({ where: { user_id: userId } }),
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
      const { currentStreak, longestStreak } = await this.calculateStreak(userId);

      // 4. Weekly activity data
      const weeklyActivity = await this.getWeeklyActivity(userId);

      // 5. Calculate productivity score (0-100)
      const productivity = this.calculateProductivity({
        tasksCompleted,
        completionRate,
        currentStreak,
        aiInteractions,
      });

      // 6. Achievements (mock for now - could be stored in DB)
      const achievements = this.getAchievements(totalCompletedTasks, currentStreak, aiInteractions);

      // 7. Recent milestones
      const recentMilestones = await this.getRecentMilestones(userId, 5);

      // 8. Time spent estimation (based on activity)
      const timeSpent = Math.round(
        (tasksCreated * 15 + tasksCompleted * 10 + aiInteractions * 2) // rough estimate in minutes
      );

      return {
        tasksCompleted: totalCompletedTasks,
        tasksCreated: totalUserTasks,
        completionRate,
        currentStreak,
        longestStreak,
        totalWorkspaces,
        totalMessages,
        aiInteractions,
        timeSpent,
        productivity,
        weeklyActivity,
        achievements,
        recentMilestones,
      };
    } catch (error: any) {
      logger.error("Error fetching user stats:", error);
      throw error;
    }
  }

  private static async calculateStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
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

    const dates = completedTasks.map((t: { updated_at: Date }) =>
      t.updated_at.toISOString().split("T")[0]
    );
    const uniqueDates = [...new Set(dates)];

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Check if active today or yesterday
    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1] as string);
        const currDate = new Date(uniqueDates[i] as string);
        const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));

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
      const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    return { currentStreak, longestStreak };
  }

  private static async getWeeklyActivity(userId: string) {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result: { day: string; tasks: number; hours: number }[] = [];

    for (let i = 6; i >= 0; i--) {
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

      // Estimate hours based on task activity
      const hours = Math.round((tasks * 0.5 + Math.random() * 2) * 10) / 10;

      result.push({
        day: dayNames[date.getDay()],
        tasks,
        hours,
      });
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

  private static getAchievements(
    tasksCompleted: number,
    streak: number,
    aiInteractions: number
  ) {
    const achievements: {
      id: string;
      name: string;
      description: string;
      icon: string;
      unlockedAt: string;
    }[] = [];

    if (tasksCompleted >= 100) {
      achievements.push({
        id: "task-master",
        name: "Task Master",
        description: "Complete 100 tasks",
        icon: "trophy",
        unlockedAt: new Date().toISOString(),
      });
    }

    if (streak >= 7) {
      achievements.push({
        id: "streak-keeper",
        name: "Streak Keeper",
        description: "7-day streak achieved",
        icon: "flame",
        unlockedAt: new Date().toISOString(),
      });
    }

    if (aiInteractions >= 500) {
      achievements.push({
        id: "ai-explorer",
        name: "AI Explorer",
        description: "Use AI assistant 500 times",
        icon: "zap",
        unlockedAt: new Date().toISOString(),
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

    recentTasks.forEach((task: { id: string; title: string; updated_at: Date }) => {
      milestones.push({
        id: `task-${task.id}`,
        title: `Completed: ${task.title.substring(0, 30)}${task.title.length > 30 ? "..." : ""}`,
        date: task.updated_at.toISOString(),
        type: "task",
      });
    });

    // Sort by date and take top 5
    return milestones
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }
}
