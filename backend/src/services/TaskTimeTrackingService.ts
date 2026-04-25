import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

interface TimeEntryData {
  start_time: Date;
  end_time?: Date;
  duration?: number; // in minutes
  description?: string;
}

export class TaskTimeTrackingService {
  /**
   * Start a time tracking session for a task
   */
  static async startTimer(
    taskId: string,
    userId: string,
    description?: string,
  ) {
    try {
      // Check if user has an active timer
      const activeTimer = await this.getActiveTimer(userId);
      if (activeTimer) {
        throw new Error(
          "You already have an active timer running. Stop it before starting a new one.",
        );
      }

      // Create new time entry with start time
      const entry = await prisma.taskTimeEntry.create({
        data: {
          task_id: taskId,
          user_id: userId,
          start_time: new Date(),
          description,
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
      });

      return entry;
    } catch (error) {
      logger.error("Error starting timer:", error);
      throw error;
    }
  }

  /**
   * Stop an active timer
   */
  static async stopTimer(entryId: string) {
    try {
      const entry = await prisma.taskTimeEntry.findUnique({
        where: { id: entryId },
      });

      if (!entry) {
        throw new Error("Time entry not found");
      }

      if (entry.end_time) {
        throw new Error("Timer already stopped");
      }

      const endTime = new Date();
      const duration = Math.floor(
        (endTime.getTime() - entry.start_time.getTime()) / 60000,
      ); // Convert to minutes

      const updated = await prisma.taskTimeEntry.update({
        where: { id: entryId },
        data: {
          end_time: endTime,
          duration,
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
      });

      return updated;
    } catch (error) {
      logger.error("Error stopping timer:", error);
      throw error;
    }
  }

  /**
   * Log a manual time entry
   */
  static async logTime(taskId: string, userId: string, data: TimeEntryData) {
    try {
      if (!data.start_time) {
        throw new Error("Start time is required");
      }

      let duration = data.duration;

      // Calculate duration if end_time is provided but duration is not
      if (data.end_time && !duration) {
        duration = Math.floor(
          (data.end_time.getTime() - data.start_time.getTime()) / 60000,
        );
      }

      const entry = await prisma.taskTimeEntry.create({
        data: {
          task_id: taskId,
          user_id: userId,
          start_time: data.start_time,
          end_time: data.end_time,
          duration,
          description: data.description,
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
      });

      return entry;
    } catch (error) {
      logger.error("Error logging time:", error);
      throw error;
    }
  }

  /**
   * Get all time entries for a task
   */
  static async getTaskTimeEntries(taskId: string) {
    try {
      const entries = await prisma.taskTimeEntry.findMany({
        where: { task_id: taskId },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: { start_time: "desc" },
      });

      return entries;
    } catch (error) {
      logger.error("Error fetching task time entries:", error);
      throw error;
    }
  }

  /**
   * Get user's active timer (timer that hasn't been stopped yet)
   */
  static async getActiveTimer(userId: string) {
    try {
      const activeTimer = await prisma.taskTimeEntry.findFirst({
        where: {
          user_id: userId,
          end_time: null,
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              workspace_id: true,
            },
          },
        },
        orderBy: { start_time: "desc" },
      });

      return activeTimer;
    } catch (error) {
      logger.error("Error getting active timer:", error);
      throw error;
    }
  }

  /**
   * Calculate total time spent on a task
   */
  static async getTotalTimeSpent(taskId: string) {
    try {
      const entries = await prisma.taskTimeEntry.findMany({
        where: {
          task_id: taskId,
          end_time: { not: null }, // Only count completed time entries
        },
        select: { duration: true },
      });

      const totalMinutes = entries.reduce(
        (sum: number, entry: { duration: number | null }) =>
          sum + (entry.duration || 0),
        0,
      );

      return {
        totalMinutes,
        totalHours: (totalMinutes / 60).toFixed(2),
      };
    } catch (error) {
      logger.error("Error calculating total time spent:", error);
      throw error;
    }
  }

  /**
   * Get time tracking summary for a project
   */
  static async getProjectTimeStats(projectId: string) {
    try {
      // Get all tasks for the project
      const tasks = await prisma.workspaceTask.findMany({
        where: { project_id: projectId },
        select: { id: true },
      });

      const taskIds = tasks.map((t: { id: string }) => t.id);

      // Get all time entries for these tasks
      const entries = await prisma.taskTimeEntry.findMany({
        where: {
          task_id: { in: taskIds },
          end_time: { not: null },
        },
        select: {
          duration: true,
          user_id: true,
        },
      });

      const totalMinutes = entries.reduce(
        (sum: number, entry: { duration: number | null }) =>
          sum + (entry.duration || 0),
        0,
      );

      // Calculate time by user
      const timeByUser: Record<string, number> = {};
      entries.forEach((entry: { user_id: string; duration: number | null }) => {
        if (!timeByUser[entry.user_id]) {
          timeByUser[entry.user_id] = 0;
        }
        timeByUser[entry.user_id] += entry.duration || 0;
      });

      return {
        totalMinutes,
        totalHours: (totalMinutes / 60).toFixed(2),
        taskCount: tasks.length,
        entryCount: entries.length,
        timeByUser,
      };
    } catch (error) {
      logger.error("Error getting project time stats:", error);
      throw error;
    }
  }

  /**
   * Delete a time entry
   */
  static async deleteTimeEntry(entryId: string, userId: string) {
    try {
      const entry = await prisma.taskTimeEntry.findUnique({
        where: { id: entryId },
      });

      if (!entry) {
        throw new Error("Time entry not found");
      }

      if (entry.user_id !== userId) {
        throw new Error("You can only delete your own time entries");
      }

      await prisma.taskTimeEntry.delete({
        where: { id: entryId },
      });

      return { success: true };
    } catch (error) {
      logger.error("Error deleting time entry:", error);
      throw error;
    }
  }

  /**
   * Update a time entry
   */
  static async updateTimeEntry(
    entryId: string,
    userId: string,
    data: Partial<TimeEntryData>,
  ) {
    try {
      const entry = await prisma.taskTimeEntry.findUnique({
        where: { id: entryId },
      });

      if (!entry) {
        throw new Error("Time entry not found");
      }

      if (entry.user_id !== userId) {
        throw new Error("You can only update your own time entries");
      }

      // Recalculate duration if start/end time changed
      let duration = data.duration;
      const startTime = data.start_time || entry.start_time;
      const endTime = data.end_time || entry.end_time;

      if (startTime && endTime && !duration) {
        duration = Math.floor(
          (endTime.getTime() - startTime.getTime()) / 60000,
        );
      }

      const updated = await prisma.taskTimeEntry.update({
        where: { id: entryId },
        data: {
          start_time: data.start_time,
          end_time: data.end_time,
          duration,
          description: data.description,
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
      });

      return updated;
    } catch (error) {
      logger.error("Error updating time entry:", error);
      throw error;
    }
  }
}
