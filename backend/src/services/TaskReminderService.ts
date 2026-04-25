import { prisma } from "../lib/prisma";
import { createNotification } from "./notificationService";
import logger from "../monitoring/logger";

export class TaskReminderService {
  /**
   * Scans for tasks that are overdue or due within the next 24 hours
   * and sends notifications to their assignees.
   */
  static async checkDueDates() {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // 1. Find tasks that are due within 24 hours (due soon)
      const dueSoonTasks = await prisma.workspaceTask.findMany({
        where: {
          due_date: {
            gt: now,
            lte: tomorrow,
          },
          status: {
            not: "done",
          },
        },
        include: {
          assignees: true,
          workspace: true,
        },
      });

      for (const task of dueSoonTasks) {
        for (const assignee of task.assignees) {
          // Check if we already notified this assignee within the last 24h
          const alreadyNotified =
            assignee.last_notified_soon_at &&
            new Date(assignee.last_notified_soon_at) > oneDayAgo;

          if (!alreadyNotified) {
            await createNotification(
              assignee.user_id,
              "task_due_soon",
              "Task Due Soon",
              `Task "${task.title}" in workspace ${task.workspace.name} is due in less than 24 hours.`,
              {
                taskId: task.id,
                workspaceId: task.workspace_id,
              },
            );

            // Update last_notified_soon_at
            await prisma.taskAssignee.update({
              where: { id: assignee.id },
              data: { last_notified_soon_at: now },
            });
          }
        }
      }

      // 2. Find tasks that are overdue
      const overdueTasks = await prisma.workspaceTask.findMany({
        where: {
          due_date: {
            lt: now,
          },
          status: {
            not: "done",
          },
        },
        include: {
          assignees: true,
          workspace: true,
        },
      });

      for (const task of overdueTasks) {
        for (const assignee of task.assignees) {
          // Check if we already notified this assignee for overdue within the last 24h
          const alreadyNotified =
            assignee.last_notified_overdue_at &&
            new Date(assignee.last_notified_overdue_at) > oneDayAgo;

          if (!alreadyNotified) {
            await createNotification(
              assignee.user_id,
              "task_overdue",
              "Task Overdue",
              `Task "${task.title}" in workspace ${task.workspace.name} is overdue!`,
              {
                taskId: task.id,
                workspaceId: task.workspace_id,
              },
            );

            // Update last_notified_overdue_at
            await prisma.taskAssignee.update({
              where: { id: assignee.id },
              data: { last_notified_overdue_at: now },
            });
          }
        }
      }

      logger.info(
        `TaskReminderService: Processed ${dueSoonTasks.length} tasks due soon and ${overdueTasks.length} overdue tasks.`,
      );
    } catch (error) {
      logger.error("Error in TaskReminderService.checkDueDates:", error);
    }
  }
}
