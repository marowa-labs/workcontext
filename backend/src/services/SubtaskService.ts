import prisma from "../lib/prisma";
import logger from "../monitoring/logger";

export class SubtaskService {
  /**
   * Get all subtasks for a task
   */
  static async getSubtasks(taskId: string) {
    try {
      return await prisma.workspaceSubtask.findMany({
        where: { task_id: taskId },
        orderBy: { order: "asc" },
      });
    } catch (error) {
      logger.error("Error fetching subtasks:", error);
      throw error;
    }
  }

  /**
   * Create a subtask
   */
  static async createSubtask(taskId: string, title: string) {
    try {
      // Get the highest order to append at the end
      const lastSubtask = await prisma.workspaceSubtask.findFirst({
        where: { task_id: taskId },
        orderBy: { order: "desc" },
      });

      const nextOrder = lastSubtask ? lastSubtask.order + 1 : 0;

      return await prisma.workspaceSubtask.create({
        data: {
          task_id: taskId,
          title,
          order: nextOrder,
        },
      });
    } catch (error) {
      logger.error("Error creating subtask:", error);
      throw error;
    }
  }

  /**
   * Update a subtask (toggle done, rename, reorder)
   */
  static async updateSubtask(
    subtaskId: string,
    data: { title?: string; is_done?: boolean; order?: number },
  ) {
    try {
      return await prisma.workspaceSubtask.update({
        where: { id: subtaskId },
        data,
      });
    } catch (error) {
      logger.error("Error updating subtask:", error);
      throw error;
    }
  }

  /**
   * Delete a subtask
   */
  static async deleteSubtask(subtaskId: string) {
    try {
      await prisma.workspaceSubtask.delete({
        where: { id: subtaskId },
      });
      return { success: true };
    } catch (error) {
      logger.error("Error deleting subtask:", error);
      throw error;
    }
  }
}
