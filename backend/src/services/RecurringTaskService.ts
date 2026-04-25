import { RRule, RRuleSet, rrulestr } from "rrule";
import prisma from "../lib/prisma";
import logger from "../monitoring/logger";

export interface RecurrenceConfig {
  pattern: string; // "daily", "weekly", "monthly", "yearly", or RRULE string
  endDate?: Date;
  maxOccurrences?: number;
  interval?: number; // e.g., every 2 days, every 3 weeks
  daysOfWeek?: number[]; // For weekly: [0=Sunday, 1=Monday, ...]
  dayOfMonth?: number; // For monthly
}

export class RecurringTaskService {
  /**
   * Convert simple pattern to RRULE string
   */
  static patternToRRule(
    pattern: string,
    startDate: Date,
    config?: Partial<RecurrenceConfig>,
  ): string {
    const interval = config?.interval || 1;

    switch (pattern.toLowerCase()) {
      case "daily":
        return new RRule({
          freq: RRule.DAILY,
          interval,
          dtstart: startDate,
          until: config?.endDate,
          count: config?.maxOccurrences,
        }).toString();

      case "weekly":
        return new RRule({
          freq: RRule.WEEKLY,
          interval,
          byweekday: config?.daysOfWeek || [startDate.getDay()],
          dtstart: startDate,
          until: config?.endDate,
          count: config?.maxOccurrences,
        }).toString();

      case "monthly":
        return new RRule({
          freq: RRule.MONTHLY,
          interval,
          bymonthday: config?.dayOfMonth || startDate.getDate(),
          dtstart: startDate,
          until: config?.endDate,
          count: config?.maxOccurrences,
        }).toString();

      case "yearly":
        return new RRule({
          freq: RRule.YEARLY,
          interval,
          dtstart: startDate,
          until: config?.endDate,
          count: config?.maxOccurrences,
        }).toString();

      default:
        // Assume it's already an RRULE string
        return pattern;
    }
  }

  /**
   * Validate RRULE pattern
   */
  static validateRRule(rruleString: string): boolean {
    try {
      rrulestr(rruleString);
      return true;
    } catch (error) {
      logger.error("Invalid RRULE pattern:", error);
      return false;
    }
  }

  /**
   * Get next N occurrences from a recurrence pattern
   */
  static getNextOccurrences(
    rruleString: string,
    startDate: Date,
    count: number = 10,
  ): Date[] {
    try {
      const rule = rrulestr(rruleString);
      return rule.all((date, i) => i < count);
    } catch (error) {
      logger.error("Error generating occurrences:", error);
      return [];
    }
  }

  /**
   * Get occurrences within a date range
   */
  static getOccurrencesInRange(
    rruleString: string,
    startDate: Date,
    endDate: Date,
  ): Date[] {
    try {
      const rule = rrulestr(rruleString);
      return rule.between(startDate, endDate, true);
    } catch (error) {
      logger.error("Error generating occurrences in range:", error);
      return [];
    }
  }

  /**
   * Generate task instances for a recurring task
   * @param parentTaskId - The ID of the parent recurring task
   * @param weeksAhead - How many weeks in the future to generate instances (default: 2)
   */
  static async generateTaskInstances(
    parentTaskId: string,
    weeksAhead: number = 2,
  ) {
    try {
      // Get the parent recurring task
      const parentTask = await prisma.workspaceTask.findUnique({
        where: { id: parentTaskId },
        include: {
          assignees: true,
          labels: true,
        },
      });

      if (
        !parentTask ||
        !parentTask.is_recurring ||
        !parentTask.recurrence_pattern
      ) {
        throw new Error("Task is not a valid recurring task");
      }

      if (!parentTask.due_date) {
        throw new Error("Recurring task must have a start due date");
      }

      // Calculate the range for generating instances
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + weeksAhead * 7);

      // Get existing instances to avoid duplicates
      const existingInstances = await prisma.workspaceTask.findMany({
        where: {
          parent_recurring_task_id: parentTaskId,
          due_date: {
            gte: now,
            lte: futureDate,
          },
        },
        select: { due_date: true },
      });

      const existingDueDates = new Set(
        existingInstances
          .map((i: { due_date: Date }) => i.due_date?.toISOString())
          .filter((d: string): d is string => d !== null && d !== undefined),
      );

      // Generate occurrences using RRULE
      const occurrences = this.getOccurrencesInRange(
        parentTask.recurrence_pattern,
        now,
        futureDate,
      );

      // Create task instances for each occurrence
      const createdInstances = [];
      for (const occurrenceDate of occurrences) {
        // Skip if instance already exists
        if (existingDueDates.has(occurrenceDate.toISOString())) {
          continue;
        }

        // Create the task instance
        const instance = await prisma.workspaceTask.create({
          data: {
            workspace_id: parentTask.workspace_id,
            creator_id: parentTask.creator_id,
            title: parentTask.title,
            description: parentTask.description,
            status: "todo",
            priority: parentTask.priority,
            due_date: occurrenceDate,
            parent_recurring_task_id: parentTaskId,
            is_recurring: false,
            original_due_date: occurrenceDate,
            assignees: {
              create: parentTask.assignees.map((a: { user_id: string }) => ({
                user_id: a.user_id,
              })),
            },
            labels: {
              connect: parentTask.labels.map((l: { id: string }) => ({
                id: l.id,
              })),
            },
          },
        });

        createdInstances.push(instance);
      }

      logger.info(
        `Generated ${createdInstances.length} instances for recurring task ${parentTaskId}`,
      );
      return createdInstances;
    } catch (error) {
      logger.error("Error generating task instances:", error);
      throw error;
    }
  }

  /**
   * Generate instances for all active recurring tasks in a workspace
   */
  static async generateInstancesForWorkspace(
    workspaceId: string,
    weeksAhead: number = 2,
  ) {
    try {
      // Get all active recurring tasks (parent tasks only)
      const recurringTasks = await prisma.workspaceTask.findMany({
        where: {
          workspace_id: workspaceId,
          is_recurring: true,
          parent_recurring_task_id: null, // Only parent tasks
        },
      });

      const results = [];
      for (const task of recurringTasks) {
        try {
          const instances = await this.generateTaskInstances(
            task.id,
            weeksAhead,
          );
          results.push({ taskId: task.id, instancesCreated: instances.length });
        } catch (err) {
          logger.error(
            `Failed to generate instances for task ${task.id}:`,
            err,
          );
          results.push({ taskId: task.id, error: err });
        }
      }

      return results;
    } catch (error) {
      logger.error("Error generating instances for workspace:", error);
      throw error;
    }
  }

  /**
   * Clean up old completed recurring task instances
   * @param daysOld - Delete completed instances older than this many days
   */
  static async cleanupOldInstances(daysOld: number = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.workspaceTask.deleteMany({
        where: {
          parent_recurring_task_id: { not: null }, // Only instances
          status: "done",
          updated_at: { lt: cutoffDate },
        },
      });

      logger.info(`Cleaned up ${result.count} old recurring task instances`);
      return result.count;
    } catch (error) {
      logger.error("Error cleaning up old instances:", error);
      throw error;
    }
  }

  /**
   * Get human-readable description of recurrence pattern
   */
  static getRecurrenceDescription(rruleString: string): string {
    try {
      const rule = rrulestr(rruleString);
      return rule.toText();
    } catch (error) {
      return "Custom recurrence pattern";
    }
  }
}

export default RecurringTaskService;
