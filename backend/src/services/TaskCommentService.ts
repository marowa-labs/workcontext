import prisma from "../lib/prisma";
import logger from "../monitoring/logger";

export class TaskCommentService {
  /**
   * Get all comments for a task
   */
  static async getComments(taskId: string) {
    try {
      return await prisma.taskComment.findMany({
        where: { task_id: taskId },
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
        },
        orderBy: { created_at: "asc" },
      });
    } catch (error) {
      logger.error("Error fetching task comments:", error);
      throw error;
    }
  }

  /**
   * Add a comment to a task
   */
  /**
   * Add a comment to a task
   */
  static async addComment(taskId: string, userId: string, content: string) {
    try {
      // 1. Fetch task details for notifications
      const task = await prisma.workspaceTask.findUnique({
        where: { id: taskId },
        include: {
          assignees: true,
          workspace: { select: { name: true } },
        },
      });

      if (!task) throw new Error("Task not found");

      // 2. Create the comment
      const comment = await prisma.taskComment.create({
        data: {
          task_id: taskId,
          user_id: userId,
          content,
        },
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
        },
      });

      // 3. Send Notifications
      const recipients = new Set<string>();

      // Add assignees (excluding commenter)
      task.assignees.forEach((assignee: any) => {
        if (assignee.user_id !== userId) {
          recipients.add(assignee.user_id);
        }
      });

      // Add creator (excluding commenter)
      if (task.creator_id !== userId) {
        recipients.add(task.creator_id);
      }

      const commenterName = comment.user.full_name || comment.user.email;
      const workspaceName = task.workspace?.name || "Workspace";

      // Send to all unique recipients
      for (const recipientId of recipients) {
        // Import dynamically to avoid circular dependencies if any
        const { createNotification } = require("./notificationService");

        await createNotification(
          recipientId,
          "comment",
          "New Comment on Task",
          `${commenterName} commented on "${task.title}" in ${workspaceName}`,
          {
            taskId: task.id,
            workspaceId: task.workspace_id,
            commentId: comment.id,
          },
        );
      }

      // 4. Broadcast real-time event
      try {
        const { getNotificationServer } = require("../lib/notificationServer");
        const ns = getNotificationServer();
        ns.broadcastToChannel(`workspace:${task.workspace_id}`, {
          type: "TASK_COMMENT_ADDED",
          taskId: task.id,
          comment,
        });
      } catch (err) {
        logger.error("Failed to broadcast TASK_COMMENT_ADDED event:", err);
      }

      return comment;
    } catch (error) {
      logger.error("Error adding task comment:", error);
      throw error;
    }
  }

  /**
   * Delete a task comment
   */
  static async deleteComment(commentId: string, userId: string) {
    try {
      const comment = await prisma.taskComment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        throw new Error("Comment not found");
      }

      if (comment.user_id !== userId) {
        throw new Error("Unauthorized to delete this comment");
      }

      await prisma.taskComment.delete({
        where: { id: commentId },
      });

      return { success: true };
    } catch (error) {
      logger.error("Error deleting task comment:", error);
      throw error;
    }
  }
}

export default TaskCommentService;
