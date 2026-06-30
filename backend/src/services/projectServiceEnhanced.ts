// Simplified ProjectServiceEnhanced for productivity pivot
// Removed academic-specific features (citations, research, etc.)

import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";
import {
  extractStructuredContent,
  generateDocx,
  generatePdf,
  generateTxt,
} from "./exportHelper";

export class ProjectServiceEnhanced {
  // Get all projects for a user
  static async getUserProjects(
    userId: string,
    includeArchived: boolean = false,
    archivedOnly: boolean = false,
    workspaceId?: string | null,
  ) {
    try {
      const where: any = {
        OR: [
          { user_id: userId },
          { collaborators: { some: { user_id: userId } } },
        ],
      };

      if (archivedOnly) {
        where.status = "archived";
      } else if (!includeArchived) {
        where.status = { not: "archived" };
      }

      if (workspaceId === null) {
        where.workspace_id = null;
      } else if (workspaceId && workspaceId !== "not-null") {
        where.workspace_id = workspaceId;
      } else if (workspaceId === "not-null") {
        where.workspace_id = { not: null };
      }

      const projects = await prisma.project.findMany({
        where,
        include: {
          user: { select: { id: true, full_name: true, email: true } },
          collaborators: {
            include: {
              user: { select: { id: true, full_name: true, email: true } },
            },
          },
          workspace: { select: { id: true, name: true } },
        },
        orderBy: { updated_at: "desc" },
      });

      return projects;
    } catch (error) {
      logger.error("Error fetching user projects:", error);
      throw new Error(
        `Error fetching user projects: ${(error as Error).message}`,
      );
    }
  }

  // Get project by ID
  static async getProjectById(projectId: string, userId?: string) {
    try {
      const whereClause: any = { id: projectId };

      if (userId) {
        whereClause.OR = [
          { user_id: userId },
          { collaborators: { some: { user_id: userId } } },
        ];
      } else {
        whereClause.share_settings = { link_sharing_enabled: true };
      }

      const project = await prisma.project.findFirst({
        where: whereClause,
        include: {
          user: { select: { id: true, full_name: true, email: true } },
          collaborators: {
            include: {
              user: { select: { id: true, full_name: true, email: true } },
            },
          },
          workspace: true,
          share_settings: true,
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
          user: { select: { id: true, full_name: true, email: true } },
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
  static async updateProject(
    projectId: string,
    updateData: any,
    userId: string,
  ) {
    try {
      const existing = await this.getProjectById(projectId, userId);
      if (!existing) {
        throw new Error("Project not found or access denied");
      }

      const { share_settings, ...restData } = updateData;
      const prismaData: any = { ...restData };

      if (share_settings) {
        const currentProject = await prisma.project.findUnique({
          where: { id: projectId },
          select: { share_settings: true },
        });

        if (currentProject?.share_settings) {
          prismaData.share_settings = { update: share_settings };
        } else {
          prismaData.share_settings = { create: share_settings };
        }
      }

      const project = await prisma.project.update({
        where: { id: projectId },
        data: prismaData,
        include: {
          user: { select: { id: true, full_name: true, email: true } },
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
      const existing = await prisma.project.findFirst({
        where: { id: projectId, user_id: userId },
      });

      if (!existing) {
        throw new Error("Project not found or access denied");
      }

      await prisma.project.delete({ where: { id: projectId } });
      return { success: true };
    } catch (error) {
      logger.error("Error deleting project:", error);
      throw new Error(`Error deleting project: ${(error as Error).message}`);
    }
  }

  // Get project stats
  static async getProjectStats(userId: string) {
    try {
      const baseWhere = {
        OR: [
          { user_id: userId },
          { collaborators: { some: { user_id: userId } } },
        ],
      };

      const [totalProjects, activeProjects, archivedProjects] =
        await Promise.all([
          prisma.project.count({ where: baseWhere }),
          prisma.project.count({
            where: { ...baseWhere, status: { not: "archived" } },
          }),
          prisma.project.count({ where: { ...baseWhere, status: "archived" } }),
        ]);

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
          user: { select: { id: true, full_name: true, email: true } },
          workspace: true,
        },
        orderBy: { updated_at: "desc" },
      });

      return projects;
    } catch (error) {
      logger.error("Error fetching collaboration projects:", error);
      throw new Error(
        `Error fetching collaborations: ${(error as Error).message}`,
      );
    }
  }

  // Get document versions
  static async getProjectDocumentVersions(projectId: string, userId: string) {
    try {
      await this.getProjectById(projectId, userId);
      return prisma.documentVersion.findMany({
        where: { project_id: projectId },
        orderBy: { created_at: "desc" },
      });
    } catch (error) {
      logger.error("Error fetching document versions:", error);
      throw new Error(`Error fetching versions: ${(error as Error).message}`);
    }
  }

  // Restore document version
  static async restoreDocumentVersion(
    projectId: string,
    versionId: string,
    userId: string,
  ) {
    try {
      await this.getProjectById(projectId, userId);

      const version = await prisma.documentVersion.findFirst({
        where: { id: versionId, project_id: projectId },
      });

      if (!version) {
        throw new Error("Version not found");
      }

      return prisma.project.update({
        where: { id: projectId },
        data: { content: version.content, updated_at: new Date() },
      });
    } catch (error) {
      logger.error("Error restoring version:", error);
      throw new Error(`Error restoring version: ${(error as Error).message}`);
    }
  }

  // Calculate project progress
  static calculateProjectProgress(project: any): number {
    const content = project?.content;
    if (!content) return 0;
    const textContent = JSON.stringify(content);
    const wordCount = textContent.split(/\s+/).length;
    return Math.min(100, Math.round((wordCount / 1000) * 100));
  }

  // Export project — supports PDF, DOCX, and TXT with formatting preserved
  static async exportProject(
    projectId: string,
    userId: string,
    options: {
      format: string;
      includeComments?: boolean;
      includeCitations?: boolean;
      citationStyle?: "apa" | "mla" | "chicago";
    },
  ) {
    try {
      const project = await this.getProjectById(projectId, userId);
      const title = project.title || "Untitled";
      const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const format = options.format || "pdf";

      // Extract structured content with formatting preserved
      const structuredContent = extractStructuredContent(project.content);

      let mimeType: string;
      let filename: string;
      let buffer: Buffer;

      switch (format) {
        case "txt":
          mimeType = "text/plain";
          filename = `${safeTitle}.txt`;
          buffer = Buffer.from(generateTxt(title, structuredContent), "utf-8");
          break;

        case "docx":
          mimeType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          filename = `${safeTitle}.docx`;
          buffer = await generateDocx(title, structuredContent);
          break;

        case "pdf":
        default:
          mimeType = "application/pdf";
          filename = `${safeTitle}.pdf`;
          buffer = await generatePdf(title, structuredContent);
          break;
      }

       return { mimeType, filename, fileSize: buffer.length, buffer };
     } catch (error) {
       logger.error("Error exporting project:", error);
       throw new Error(`Error exporting project: ${(error as Error).message}`);
     }
   }

   // Apply AI edit to project content
   static async applyAIEdit(
     projectId: string,
     userId: string,
     options: {
       text: string;
       action: string;
       context?: string;
       preferences?: any;
     },
   ) {
     try {
       // Verify project access
       await this.getProjectById(projectId, userId);

       // For now, return a mock response
       // In a real implementation, this would call an AI service
       return {
         original: options.text,
         edited: options.text, // Placeholder
         action: options.action,
         success: true,
       };
     } catch (error) {
       logger.error("Error applying AI edit:", error);
       throw new Error(`Error applying AI edit: ${(error as Error).message}`);
     }
   }

   // Get AI edit history for project
   static async getAIEditHistory(projectId: string, userId: string) {
     try {
       // Verify project access
       await this.getProjectById(projectId, userId);

       // Return empty array for now
       return [];
     } catch (error) {
       logger.error("Error fetching AI edit history:", error);
       throw new Error(`Error fetching AI edit history: ${(error as Error).message}`);
     }
   }

   // Get project citations
   static async getProjectCitations(projectId: string, userId: string) {
     try {
       // Verify project access
       await this.getProjectById(projectId, userId);

       // Return empty array for now
       return [];
     } catch (error) {
       logger.error("Error fetching project citations:", error);
       throw new Error(`Error fetching project citations: ${(error as Error).message}`);
     }
   }
 }
