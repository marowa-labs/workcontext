// Simplified ProjectServiceEnhanced for productivity pivot
// Removed academic-specific features (citations, research, etc.)

import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

export class ProjectServiceEnhanced {
  // Get all projects for a user
  static async getUserProjects(
    userId: string,
    includeArchived: boolean = false,
    archivedOnly: boolean = false,
    workspaceId?: string | null
  ) {
    try {
      const where: any = {
        OR: [{ user_id: userId }, { collaborators: { some: { user_id: userId } } }],
      };

      if (archivedOnly) {
        where.status = "archived";
      } else if (!includeArchived) {
        where.status = { not: "archived" };
      }

      // Filter by workspace if provided
      if (workspaceId && workspaceId !== "not-null") {
        where.workspace_id = workspaceId === "null" ? null : workspaceId;
      } else if (workspaceId === "not-null") {
        where.workspace_id = { not: null };
      }

      const projects = await prisma.project.findMany({
        where,
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
          collaborators: {
            include: {
              user: {
                select: { id: true, full_name: true, email: true },
              },
            },
          },
          workspace: {
            select: { id: true, name: true },
          },
        },
        orderBy: { updated_at: "desc" },
      });

      return projects;
    } catch (error) {
      logger.error("=== ProjectServiceEnhanced.getUserProjects ERROR ===");
      logger.error("Error type:", typeof error);
      logger.error("Error message:", (error as Error).message);
      logger.error("Error stack:", (error as Error).stack);
      logger.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      throw new Error(`Error fetching user projects: ${(error as Error).message}`);
    }
  }

  // Get project by ID
  static async getProjectById(projectId: string, userId: string) {
    try {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [{ user_id: userId }, { collaborators: { some: { user_id: userId } } }],
        },
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
          collaborators: {
            include: {
              user: {
                select: { id: true, full_name: true, email: true },
              },
            },
          },
          workspace: true,
        },
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      return project;
    } catch (error) {
      logger.error("Error fetching project:", error);
      throw error;
    }
  }

  // Create a new project
  static async createProject(projectData: any, userId: string) {
    try {
      const project = await prisma.project.create({
        data: {
          ...projectData,
          user_id: userId,
          status: projectData.status || "active",
        },
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
          workspace: true,
        },
      });

      return project;
    } catch (error) {
      logger.error("Error creating project:", error);
      throw new Error(`Error creating project: ${(error as Error).message}`);
    }
  }

  // Update a project
  static async updateProject(projectId: string, updateData: any, userId: string) {
    try {
      // Verify ownership or membership
      const existing = await this.getProjectById(projectId, userId);
      if (!existing) {
        throw new Error("Project not found or access denied");
      }

      const project = await prisma.project.update({
        where: { id: projectId },
        data: updateData,
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
          workspace: true,
        },
      });

      return project;
    } catch (error) {
      logger.error("Error updating project:", error);
      throw new Error(`Error updating project: ${(error as Error).message}`);
    }
  }

  // Delete a project
  static async deleteProject(projectId: string, userId: string) {
    try {
      // Verify ownership
      const existing = await prisma.project.findFirst({
        where: { id: projectId, user_id: userId },
      });

      if (!existing) {
        throw new Error("Project not found or access denied");
      }

      await prisma.project.delete({
        where: { id: projectId },
      });

      return { success: true };
    } catch (error) {
      logger.error("Error deleting project:", error);
      throw new Error(`Error deleting project: ${(error as Error).message}`);
    }
  }

  // Get project stats
  static async getProjectStats(userId: string) {
    try {
      const totalProjects = await prisma.project.count({
        where: {
          OR: [{ user_id: userId }, { collaborators: { some: { user_id: userId } } }],
        },
      });

      const activeProjects = await prisma.project.count({
        where: {
          OR: [{ user_id: userId }, { collaborators: { some: { user_id: userId } } }],
          status: { not: "archived" },
        },
      });

      const archivedProjects = await prisma.project.count({
        where: {
          OR: [{ user_id: userId }, { collaborators: { some: { user_id: userId } } }],
          status: "archived",
        },
      });

      return {
        total: totalProjects,
        active: activeProjects,
        archived: archivedProjects,
      };
    } catch (error) {
      logger.error("Error fetching project stats:", error);
      throw new Error(`Error fetching stats: ${(error as Error).message}`);
    }
  }

  // Get collaboration projects
  static async getCollaborationProjects(userId: string) {
    try {
      const projects = await prisma.project.findMany({
        where: {
          collaborators: { some: { user_id: userId } },
          NOT: { user_id: userId },
        },
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
          workspace: true,
        },
        orderBy: { updated_at: "desc" },
      });

      return projects;
    } catch (error) {
      logger.error("Error fetching collaboration projects:", error);
      throw new Error(`Error fetching collaborations: ${(error as Error).message}`);
    }
  }

  // Get document versions (placeholder - versions stored in ProjectVersion table)
  static async getProjectDocumentVersions(projectId: string, userId: string) {
    try {
      // Verify access
      await this.getProjectById(projectId, userId);

      const versions = await prisma.documentVersion.findMany({
        where: { project_id: projectId },
        orderBy: { created_at: "desc" },
      });

      return versions;
    } catch (error) {
      logger.error("Error fetching document versions:", error);
      throw new Error(`Error fetching versions: ${(error as Error).message}`);
    }
  }

  // Restore document version
  static async restoreDocumentVersion(
    projectId: string,
    versionId: string,
    userId: string
  ) {
    try {
      // Verify access
      await this.getProjectById(projectId, userId);

      const version = await prisma.documentVersion.findFirst({
        where: { id: versionId, project_id: projectId },
      });

      if (!version) {
        throw new Error("Version not found");
      }

      // Update project with version content
      const project = await prisma.project.update({
        where: { id: projectId },
        data: {
          content: version.content,
          updated_at: new Date(),
        },
      });

      return project;
    } catch (error) {
      logger.error("Error restoring version:", error);
      throw new Error(`Error restoring version: ${(error as Error).message}`);
    }
  }

  // Apply AI edit (placeholder implementation)
  static async applyAIEdit(
    projectId: string,
    userId: string,
    editOptions: { text: string; action: string; context?: string; preferences?: any }
  ) {
    try {
      const project = await this.getProjectById(projectId, userId);

      // Log the AI edit
      logger.info(`AI edit applied to project ${projectId} by user ${userId}`, {
        action: editOptions.action,
        preferences: editOptions.preferences,
      });

      return { success: true, project };
    } catch (error) {
      logger.error("Error applying AI edit:", error);
      throw new Error(`Error applying AI edit: ${(error as Error).message}`);
    }
  }

  // Get AI edit history (placeholder)
  static async getAIEditHistory(projectId: string, userId: string) {
    try {
      await this.getProjectById(projectId, userId);
      // Return empty array for now - implement with actual AIEdit table if needed
      return [];
    } catch (error) {
      logger.error("Error fetching AI edit history:", error);
      throw new Error(`Error fetching history: ${(error as Error).message}`);
    }
  }

  // Get project citations (deprecated - returns empty for productivity pivot)
  static async getProjectCitations(projectId: string, userId: string) {
    try {
      await this.getProjectById(projectId, userId);
      // Academic feature removed - return empty array
      return [];
    } catch (error) {
      logger.error("Error fetching citations:", error);
      return [];
    }
  }

  // Calculate project progress (placeholder - simplified for productivity pivot)
  static calculateProjectProgress(project: any): number {
    // Simplified progress calculation based on content word count
    const content = project?.content;
    if (!content) return 0;

    // Basic heuristic: more content = higher progress
    const textContent = JSON.stringify(content);
    const wordCount = textContent.split(/\s+/).length;
    
    // Assume 1000 words = 100% for this simple calculation
    const progress = Math.min(100, Math.round((wordCount / 1000) * 100));
    return progress;
  }

  // Export project (simplified - academic options ignored for productivity pivot)
  static async exportProject(
    projectId: string,
    userId: string,
    options: {
      format: string;
      includeComments?: boolean;
      includeCitations?: boolean; // Deprecated - ignored
      citationStyle?: "apa" | "mla" | "chicago"; // Deprecated - ignored
    }
  ) {
    try {
      const project = await this.getProjectById(projectId, userId);

      // Create a JSON export (academic formats like LaTeX/Docx removed)
      const content = JSON.stringify({
        title: project.title,
        content: project.content,
        format: options.format,
        exportedAt: new Date().toISOString(),
      }, null, 2);

      const buffer = Buffer.from(content, "utf-8");

      return {
        title: project.title,
        content: project.content,
        format: options.format,
        exportedAt: new Date().toISOString(),
        mimeType: "application/json",
        filename: `${project.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_export.json`,
        fileSize: buffer.length,
        buffer: buffer,
      };
    } catch (error) {
      logger.error("Error exporting project:", error);
      throw new Error(`Error exporting project: ${(error as Error).message}`);
    }
  }
}
