import prisma from "../lib/prisma";
import logger from "../monitoring/logger";

export class LabelService {
  /**
   * Get all labels for a workspace
   */
  static async getWorkspaceLabels(workspaceId: string) {
    try {
      return await prisma.workspaceLabel.findMany({
        where: { workspace_id: workspaceId },
        orderBy: { name: "asc" },
      });
    } catch (error) {
      logger.error("Error fetching workspace labels:", error);
      throw error;
    }
  }

  /**
   * Create a label for a workspace
   */
  static async createLabel(workspaceId: string, name: string, color?: string) {
    try {
      return await prisma.workspaceLabel.create({
        data: {
          workspace_id: workspaceId,
          name,
          color,
        },
      });
    } catch (error) {
      logger.error("Error creating workspace label:", error);
      throw error;
    }
  }

  /**
   * Update a label
   */
  static async updateLabel(
    labelId: string,
    data: { name?: string; color?: string },
  ) {
    try {
      return await prisma.workspaceLabel.update({
        where: { id: labelId },
        data,
      });
    } catch (error) {
      logger.error("Error updating workspace label:", error);
      throw error;
    }
  }

  /**
   * Delete a label
   */
  static async deleteLabel(labelId: string) {
    try {
      await prisma.workspaceLabel.delete({
        where: { id: labelId },
      });
      return { success: true };
    } catch (error) {
      logger.error("Error deleting workspace label:", error);
      throw error;
    }
  }

  /**
   * Add a label to a task
   */
  static async addLabelToTask(taskId: string, labelId: string) {
    try {
      return await prisma.workspaceTask.update({
        where: { id: taskId },
        data: {
          labels: {
            connect: { id: labelId },
          },
        },
        include: {
          labels: true,
        },
      });
    } catch (error) {
      logger.error("Error adding label to task:", error);
      throw error;
    }
  }

  /**
   * Remove a label from a task
   */
  static async removeLabelFromTask(taskId: string, labelId: string) {
    try {
      return await prisma.workspaceTask.update({
        where: { id: taskId },
        data: {
          labels: {
            disconnect: { id: labelId },
          },
        },
        include: {
          labels: true,
        },
      });
    } catch (error) {
      logger.error("Error removing label from task:", error);
      throw error;
    }
  }
}
