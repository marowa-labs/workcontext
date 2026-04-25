import { prisma } from "../lib/prisma";

export class ProjectService {
  // Get all projects for a user
  static async getUserProjects(userId: string) {
    try {
      const projects = await prisma.project.findMany({
        where: { user_id: userId },
        include: {
          user: {
            select: { full_name: true, email: true },
          },
          _count: {
            select: { citations: true },
          },
        },
        orderBy: { updated_at: "desc" },
      });

      // Map to match the previous structure where 'collaborators' referred to the owner (user)
      return projects.map((project: any) => ({
        ...project,
        collaborators: project.user,
        citations: [{ count: project._count?.citations || 0 }],
      }));
    } catch (error) {
      throw new Error(
        `Error fetching user projects: ${(error as Error).message}`,
      );
    }
  }

  // Get recent projects for a user (limit 5)
  static async getRecentProjects(userId: string, limit: number = 5) {
    try {
      const projects = await prisma.project.findMany({
        where: { user_id: userId },
        include: {
          user: {
            select: { full_name: true, email: true },
          },
        },
        orderBy: { updated_at: "desc" },
        take: limit,
      });

      return projects.map((project: any) => ({
        ...project,
        collaborators: project.user,
      }));
    } catch (error) {
      throw new Error(
        `Error fetching recent projects: ${(error as Error).message}`,
      );
    }
  }

  // Get a specific project by ID
  static async getProjectById(projectId: string) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          collaborators: {
            include: {
              user: {
                select: { full_name: true, email: true },
              },
            },
          },
          citations: true,
        },
      });

      if (!project) throw new Error("Project not found");

      return project;
    } catch (error) {
      throw new Error(`Error fetching project: ${(error as Error).message}`);
    }
  }

  // Create a new project
  static async createProject(projectData: any) {
    try {
      return await prisma.project.create({
        data: projectData,
      });
    } catch (error) {
      throw new Error(`Error creating project: ${(error as Error).message}`);
    }
  }

  // Update a project
  static async updateProject(projectId: string, updateData: Partial<any>) {
    try {
      return await prisma.project.update({
        where: { id: projectId },
        data: updateData,
      });
    } catch (error) {
      throw new Error(`Error updating project: ${(error as Error).message}`);
    }
  }

  // Delete a project
  static async deleteProject(projectId: string) {
    try {
      await prisma.project.delete({
        where: { id: projectId },
      });
      return true;
    } catch (error) {
      throw new Error(`Error deleting project: ${(error as Error).message}`);
    }
  }

  // Add a collaborator to a project
  static async addCollaborator(
    projectId: string,
    userId: string,
    permission: string = "view",
  ) {
    try {
      return await prisma.collaboratorPresence.create({
        data: {
          project_id: projectId,
          user_id: userId,
          permission,
        },
      });
    } catch (error) {
      throw new Error(`Error adding collaborator: ${(error as Error).message}`);
    }
  }

  // Remove a collaborator from a project
  static async removeCollaborator(projectId: string, userId: string) {
    try {
      await prisma.collaboratorPresence.delete({
        where: {
          project_id_user_id: {
            project_id: projectId,
            user_id: userId,
          },
        },
      });
      return true;
    } catch (error) {
      throw new Error(
        `Error removing collaborator: ${(error as Error).message}`,
      );
    }
  }

  // Add a citation to a project
  static async addCitation(projectId: string, citationData: any) {
    try {
      return await prisma.citation.create({
        data: {
          project_id: projectId,
          ...citationData,
        },
      });
    } catch (error) {
      throw new Error(`Error adding citation: ${(error as Error).message}`);
    }
  }

  // Get all citations for a project
  static async getProjectCitations(projectId: string) {
    try {
      return await prisma.citation.findMany({
        where: { project_id: projectId },
        orderBy: { created_at: "desc" },
      });
    } catch (error) {
      throw new Error(`Error fetching citations: ${(error as Error).message}`);
    }
  }
}
