import prisma from "../lib/prisma";
import logger from "../monitoring/logger";

export interface ViewFilters {
  priority?: string;
  assigneeIds?: string[];
  labelIds?: string[];
  dateStatus?: string;
  searchQuery?: string;
}

export class WorkspaceViewService {
  /**
   * Get all saved views for a workspace
   */
  static async getViews(workspaceId: string) {
    try {
      return await prisma.workspaceView.findMany({
        where: { workspace_id: workspaceId },
        orderBy: { created_at: "asc" },
      });
    } catch (error) {
      logger.error("Error fetching workspace views:", error);
      throw error;
    }
  }

  /**
   * Create a new saved view
   */
  static async createView(
    workspaceId: string,
    name: string,
    filters: ViewFilters,
  ) {
    try {
      return await prisma.workspaceView.create({
        data: {
          workspace_id: workspaceId,
          name,
          filters: filters as any,
        },
      });
    } catch (error) {
      logger.error("Error creating workspace view:", error);
      throw error;
    }
  }

  /**
   * Delete a saved view
   */
  static async deleteView(viewId: string) {
    try {
      return await prisma.workspaceView.delete({
        where: { id: viewId },
      });
    } catch (error) {
      logger.error("Error deleting workspace view:", error);
      throw error;
    }
  }

  /**
   * Update a saved view
   */
  static async updateView(
    viewId: string,
    name?: string,
    filters?: ViewFilters,
  ) {
    try {
      const data: any = {};
      if (name) data.name = name;
      if (filters) data.filters = filters;

      return await prisma.workspaceView.update({
        where: { id: viewId },
        data,
      });
    } catch (error) {
      logger.error("Error updating workspace view:", error);
      throw error;
    }
  }
}
