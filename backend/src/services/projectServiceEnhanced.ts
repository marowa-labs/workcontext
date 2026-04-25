import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";
import { SubscriptionService } from "./subscriptionService";
import { ExportService } from "./exportService";
import { CitationService } from "./citationService";
import { createNotification } from "./notificationService";
import { RecycleBinService } from "./recycleBinService";
import { AIService } from "./aiService";
import { EmailService } from "./emailService";

interface ProjectCreationData {
  title: string;
  type: string;
  citation_style: string;
  description?: string;
  content?: any;
  word_count?: number;
  due_date?: Date;
  status?: string;
  template_id?: string;
  workspace_id?: string;
}

interface ProjectUpdateData {
  title?: string;
  type?: string;
  citation_style?: string;
  description?: string;
  content?: any;
  word_count?: number;
  due_date?: Date;
  status?: string;
  template_id?: string;
  share_settings?: {
    link_sharing_enabled?: boolean;
    link_permission?: string;
  };
}

interface ExportOptions {
  format:
    | "pdf"
    | "docx"
    | "txt"
    | "latex"
    | "rtf"
    | "xlsx"
    | "csv"
    | "png"
    | "zip"
    | "journal-pdf"
    | "journal-latex";
  includeCitations?: boolean;
  includeComments?: boolean;
  citationStyle?: "apa" | "mla" | "chicago";
}

// Add new interface for AI edits
interface AIEditOptions {
  text: string;
  action: string;
  context?: string;
  preferences?: any;
}

// Add new interface for AI edit history
interface AIEditHistory {
  id: string;
  project_id: string;
  user_id: string;
  action: string;
  original_text: string;
  edited_text: string;
  created_at: Date;
}

// Add interface for sharing options
interface ShareOptions {
  email: string;
  message?: string;
  citationStyle?: string;
}

export class ProjectServiceEnhanced {
  // Define valid project statuses and workflow
  private static readonly VALID_STATUSES = [
    "draft",
    "in-progress",
    "completed",
    "archived",
  ];

  // Define valid status transitions
  private static readonly VALID_TRANSITIONS: { [key: string]: string[] } = {
    draft: ["in-progress", "completed", "archived"],
    "in-progress": ["draft", "completed", "archived"],
    completed: ["in-progress", "draft", "archived"],
    archived: ["draft", "in-progress", "completed"],
  };

  // Validate if a status transition is allowed
  static isValidStatusTransition(
    currentStatus: string,
    newStatus: string,
  ): boolean {
    // If current status is not in our defined statuses, allow any transition
    if (!this.VALID_STATUSES.includes(currentStatus)) {
      return true;
    }

    // If new status is not in our defined statuses, reject transition
    if (!this.VALID_STATUSES.includes(newStatus)) {
      return false;
    }

    // Allow same status (no change)
    if (currentStatus === newStatus) {
      return true;
    }

    // Check if the transition is valid
    return this.VALID_TRANSITIONS[currentStatus].includes(newStatus);
  }

  // Validate if a status is valid
  static isValidStatus(status: string): boolean {
    return this.VALID_STATUSES.includes(status);
  }
  // Get all projects for a user
  static async getUserProjects(
    userId: string,
    includeArchived: boolean = false,
    archivedOnly: boolean = false,
    workspaceId?: string | null,
  ) {
    try {
      logger.info("Getting user projects", {
        userId,
        includeArchived,
        archivedOnly,
      });

      // Build where clause
      const whereClause: any = {
        user_id: userId,
      };

      // Handle different filtering options
      if (archivedOnly) {
        // Only return archived projects
        whereClause.status = "archived";
      } else if (!includeArchived) {
        // Exclude archived projects by default
        whereClause.status = {
          not: "archived",
        };
      }

      // Handle workspace filtering
      if (workspaceId === null) {
        // Only projects without a workspace (personal projects)
        whereClause.workspace_id = null;
      } else if (workspaceId === "not-null") {
        // Only projects with a workspace (workspace projects)
        whereClause.workspace_id = {
          isNot: null,
        };
      } else if (workspaceId !== undefined) {
        // Only projects in the specified workspace
        whereClause.workspace_id = workspaceId;
      }

      // Get projects using Prisma with workspace information
      const projects = await prisma.project.findMany({
        where: whereClause,
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              description: true,
              created_at: true,
              updated_at: true,
            },
          },
        },
        orderBy: {
          updated_at: "desc",
        },
      });

      // Get citation counts for all projects in a single query
      const projectIds = projects.map((project: any) => project.id);
      let citationCountMap: Record<string, number> = {};

      if (projectIds.length > 0) {
        try {
          // Use findMany and manual grouping instead of groupBy to avoid TypeScript issues
          const citations = await prisma.citation.findMany({
            where: {
              project_id: {
                in: projectIds,
              },
            },
            select: {
              project_id: true,
            },
          });

          // Manually count citations per project
          citationCountMap = citations.reduce(
            (acc: Record<string, number>, citation: any) => {
              acc[citation.project_id] = (acc[citation.project_id] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );
        } catch (error) {
          logger.warn("Error fetching citation counts", { error });
          // Continue with empty citationCountMap
        }
      }

      // Transform projects to match the expected response format and calculate progress
      // Execute all progress calculations in parallel to reduce connection time
      const progressPromises = projects.map((project: any) =>
        this.calculateProjectProgress(project),
      );

      const progressResults = await Promise.all(progressPromises);

      const transformedProjects = projects.map(
        (project: any, index: number) => ({
          ...project,
          workspace_id: project.workspace?.id || project.workspace_id || null,
          workspace: project.workspace || null,
          citations: {
            count: citationCountMap[project.id] || 0,
          },
          progress: progressResults[index],
        }),
      );

      logger.info("Successfully fetched user projects", {
        userId,
        count: transformedProjects.length,
      });

      return transformedProjects;
    } catch (error) {
      logger.error("Error fetching user projects", { error, userId });
      throw new Error(
        `Failed to fetch user projects: ${(error as Error).message}`,
      );
    }
  }

  // Calculate project progress percentage with enhanced logic
  static async calculateProjectProgress(project: any): Promise<number> {
    try {
      // Return 100% for completed projects
      if (project.status === "completed") return 100;
      if (project.status === "archived") return 0;

      // Use pre-fetched data when available, otherwise get from database
      // This reduces database queries when called from optimized methods
      let commentCount = 0;
      let citationCount = project.citations?.count || 0;
      let documentVersionCount = 0;
      let aiUsageCount = 0;
      let plagiarismReportCount = 0;

      // Only fetch additional data if not already provided
      if (!project._prefetched) {
        const [
          commentCountResult,
          documentVersionCountResult,
          aiUsageCountResult,
          plagiarismReportCountResult,
        ] = await Promise.all([
          prisma.comment.count({
            where: { project_id: project.id },
          }),
          prisma.documentVersion.count({
            where: { project_id: project.id },
          }),
          prisma.aIUsage.count({
            where: {
              user_id: project.user_id,
              created_at: {
                gte: project.created_at,
              },
            },
          }),
          Promise.resolve(0), // Plagiarism report table removed
        ]);

        commentCount = commentCountResult;
        documentVersionCount = documentVersionCountResult;
        aiUsageCount = aiUsageCountResult;
        plagiarismReportCount = plagiarismReportCountResult;
      }

      // Calculate progress based on multiple factors:
      let progress = 0;

      // 1. Word count factor (30% of total progress)
      const wordCountProgress = Math.min(100, (project.word_count || 0) / 50);
      progress += wordCountProgress * 0.3;

      // 2. Content structure factor (25% of total progress)
      // Based on having a title, description, and content
      let contentProgress = 0;
      if (project.title) contentProgress += 10;
      if (project.description) contentProgress += 15;
      if (project.content) contentProgress += 25;
      progress += contentProgress * 0.25;

      // 3. Research depth factor (20% of total progress)
      // Based on citations and comments
      const researchProgress = Math.min(
        100,
        citationCount * 5 + commentCount * 2,
      );
      progress += Math.min(researchProgress, 20);

      // 4. Writing activity factor (15% of total progress)
      // Based on document versions and AI usage
      const activityProgress = Math.min(
        100,
        documentVersionCount * 3 + aiUsageCount,
      );
      progress += Math.min(activityProgress * 0.15, 15);

      // 5. Quality assurance factor (10% of total progress)
      // Based on plagiarism reports (indicates review activity)
      const qualityProgress = Math.min(plagiarismReportCount * 10, 10);
      progress += qualityProgress;

      // Adjust progress based on project age
      const now = new Date();
      let ageInDays = 0;

      // Ensure project.created_at exists and convert to Date if needed
      if (project.created_at) {
        let createdDate: Date;
        if (project.created_at instanceof Date) {
          createdDate = project.created_at;
        } else if (
          typeof project.created_at === "string" ||
          typeof project.created_at === "number"
        ) {
          createdDate = new Date(project.created_at);
        } else {
          // If it's not a valid date format, skip age calculation
          createdDate = now; // Default to now to result in 0 age
        }

        // Only calculate if the date is valid
        if (!isNaN(createdDate.getTime())) {
          ageInDays = Math.floor(
            (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
          );
        }
      }

      // For older projects, only add minimal progress if they have no actual activity
      // This prevents old inactive projects from appearing to have significant progress
      if (ageInDays > 30 && progress === 0) {
        // Only add 1% progress for very old projects with no activity
        progress = 1;
      }

      // Ensure progress is between 0 and 100
      return Math.max(0, Math.min(100, Math.round(progress)));
    } catch (error) {
      // Reduce log volume for this frequent operation
      // Only log unique errors or limit frequency
      const errorMessage = (error as Error).message;
      if (Math.random() < 0.01) {
        // 1% sample rate for logging potential flood errors
        logger.error("Error calculating project progress (sampled)", {
          error: errorMessage,
          projectId: project.id,
        });
      }
      return 0;
    }
  }

  // Get a specific project by ID
  static async getProjectById(projectId: string, userId: string) {
    try {
      logger.info("Getting project by ID", { projectId, userId });

      // First, let's check if the project exists at all
      const projectExists = await prisma.project.findUnique({
        where: {
          id: projectId,
        },
        include: {
          share_settings: true, // Include share settings to check link sharing
        },
      });

      logger.info("Project exists check:", {
        projectId,
        exists: !!projectExists,
        ownerId: projectExists?.user_id,
      });

      // Check if user is the owner
      const isOwner = projectExists?.user_id === userId;
      logger.info("Owner check:", { isOwner, userId });

      // Check if user is a collaborator
      const collaboratorRecord = await prisma.CollaboratorPresence.findFirst({
        where: {
          project_id: projectId,
          user_id: userId,
        },
      });

      logger.info("Collaborator check:", {
        isCollaborator: !!collaboratorRecord,
        userId,
        projectId,
      });

      // Auto-join if link sharing is enabled and user is not already a member
      if (!isOwner && !collaboratorRecord && projectExists.share_settings) {
        const shareSettings = projectExists.share_settings as any;
        if (shareSettings.link_sharing_enabled === true) {
          logger.info("Auto-joining user via link sharing", {
            projectId,
            userId,
            permission: shareSettings.link_permission || "view",
          });

          await prisma.CollaboratorPresence.create({
            data: {
              project_id: projectId,
              user_id: userId,
              permission: shareSettings.link_permission || "view", // Use permission from share settings
              join_method: "link_editor", // Mark as link-based access
            },
          });

          // Re-fetch collaborator record to ensure consistency provided downstream logic relies on it?
          // Actually, the main query below will picked it up now.
        }
      }

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { user_id: userId },
            { collaborators: { some: { user_id: userId } } },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          collaborators: {
            include: {
              user: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                },
              },
            },
          },
          citations: {
            orderBy: {
              created_at: "desc",
            },
          },
          document_versions: {
            orderBy: {
              created_at: "desc",
            },
            take: 5, // Limit to last 5 versions
          },

          ai_chat_sessions: {
            orderBy: {
              created_at: "desc",
            },
            take: 5, // Limit to last 5 sessions
          },
          share_settings: true, // Include share settings for frontend
        },
      });

      if (!project) {
        logger.error("Project not found or access denied", {
          projectId,
          userId,
          isOwner,
          isCollaborator: !!collaboratorRecord,
        });
        throw new Error("Project not found or access denied");
      }

      // Transform the project data
      const transformedProject = {
        ...project,
        progress: await this.calculateProjectProgress(project),
        lastActivity: project.updated_at,
      };

      logger.info("Successfully fetched project", { projectId, userId });
      return transformedProject;
    } catch (error) {
      logger.error("Error fetching project by ID", {
        error,
        projectId,
        userId,
      });
      throw new Error(`Failed to fetch project: ${(error as Error).message}`);
    }
  }

  // Create a new project
  static async createProject(projectData: ProjectCreationData, userId: string) {
    try {
      logger.info("Creating new project", { projectData, userId });

      // Validate that the user exists before creating a project
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(
          "User not found. Cannot create project for non-existent user.",
        );
      }

      // Validate initial status if provided
      if (projectData.status && !this.isValidStatus(projectData.status)) {
        throw new Error(
          `Invalid project status '${
            projectData.status
          }'. Valid statuses are: ${this.VALID_STATUSES.join(", ")}`,
        );
      }

      let templateCitationStyle: string | undefined = undefined;
      let validatedTemplateId: string | null = null;
      let templateContent: any = null;

      // If a template_id is provided, fetch the template
      if (projectData.template_id) {
        const template = await prisma.documentTemplate.findUnique({
          where: { id: projectData.template_id },
        });

        if (template) {
          validatedTemplateId = template.id;
          templateCitationStyle = template.citation_style;
          templateContent = template.content;
        }
      } else if (projectData.type) {
        // If no template_id but type is provided, try to find a matching template by type
        const template = await prisma.documentTemplate.findFirst({
          where: { type: projectData.type },
        });

        if (template) {
          validatedTemplateId = template.id;
          templateCitationStyle = template.citation_style;
          templateContent = template.content;
        }
      }

      // Create project using Prisma
      const project = await prisma.project.create({
        data: {
          user_id: userId,
          title: projectData.title,
          type: projectData.type,
          citation_style:
            projectData.citation_style || templateCitationStyle || "apa",
          description: projectData.description,
          content: projectData.content ||
            templateContent || {
              type: "doc",
              content: [{ type: "paragraph" }],
            },
          word_count: projectData.word_count || 0,
          due_date: projectData.due_date,
          status: projectData.status || "draft",
          template_id: validatedTemplateId, // Associate the template with the project
          workspace_id: projectData.workspace_id, // Associate with workspace if provided
        },
      });

      // Send notification about project creation
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { full_name: true, email: true },
        });

        if (user) {
          await createNotification(
            userId,
            "document_change",
            "New Project Created",
            `You've successfully created a new project: ${project.title}`,
            {
              projectId: project.id,
              projectName: project.title,
              projectType: project.type,
            },
          );
        }
      } catch (notificationError) {
        logger.error("Error sending project creation notification", {
          error: notificationError,
          projectId: project.id,
          userId,
        });
      }

      logger.info("Project created successfully", {
        projectId: project.id,
        userId,
      });
      return project;
    } catch (error) {
      logger.error("Error creating project", { error, projectData, userId });
      throw new Error(`Failed to create project: ${(error as Error).message}`);
    }
  }

  // Update a project
  static async updateProject(
    projectId: string,
    updateData: ProjectUpdateData,
    userId: string,
  ) {
    try {
      logger.info("Updating project", { projectId, updateData, userId });

      // First, check if the project belongs to the user or if user is a collaborator
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { user_id: userId },
            { collaborators: { some: { user_id: userId } } },
          ],
        },
        include: {
          user: {
            select: { full_name: true, email: true },
          },
        },
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      // Validate status transition if status is being updated
      if (updateData.status && updateData.status !== project.status) {
        if (!this.isValidStatusTransition(project.status, updateData.status)) {
          throw new Error(
            `Invalid status transition from '${project.status}' to '${updateData.status}'`,
          );
        }
      }

      // Check permissions - only owner can update project metadata
      const isOwner = project.user_id === userId;
      if (!isOwner) {
        // Collaborators can only update content
        const allowedFields = ["content", "word_count"];
        const invalidFields = Object.keys(updateData).filter(
          (field) => !allowedFields.includes(field),
        );

        if (invalidFields.length > 0) {
          throw new Error(
            `Collaborators can only update content and word count. Invalid fields: ${invalidFields.join(
              ", ",
            )}`,
          );
        }
      }

      // Handle share settings update separately if present
      const { share_settings, ...prismaUpdateData } = updateData;

      if (share_settings) {
        await prisma.documentShareSettings.upsert({
          where: { project_id: projectId },
          create: {
            project_id: projectId,
            link_sharing_enabled: share_settings.link_sharing_enabled ?? false,
            link_permission: share_settings.link_permission ?? "view",
          },
          update: {
            link_sharing_enabled: share_settings.link_sharing_enabled,
            link_permission: share_settings.link_permission,
          },
        });
      }

      // Update project using Prisma
      const updatedProject = await prisma.project.update({
        where: {
          id: projectId,
        },
        data: prismaUpdateData,
      });

      // Send notification about project update
      try {
        // Only send notification for significant updates (title, status, due_date)
        if (updateData.title || updateData.status || updateData.due_date) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { full_name: true, email: true },
          });

          if (user) {
            await createNotification(
              project.user_id,
              "document_change",
              "Project Updated",
              `${user.full_name || user.email} updated the project: ${
                updatedProject.title || project.title
              }`,
              {
                projectId: updatedProject.id,
                projectName: updatedProject.title || project.title,
                updatedFields: Object.keys(updateData),
              },
            );
          }
        }
      } catch (notificationError) {
        logger.error("Error sending project update notification", {
          error: notificationError,
          projectId: updatedProject.id,
          userId,
        });
      }

      logger.info("Project updated successfully", { projectId, userId });
      return updatedProject;
    } catch (error) {
      logger.error("Error updating project", {
        error,
        projectId,
        updateData,
        userId,
      });
      throw new Error(`Failed to update project: ${(error as Error).message}`);
    }
  }

  // Delete a project
  static async deleteProject(projectId: string, userId: string) {
    try {
      logger.info("Deleting project", { projectId, userId });

      // First, check if the project belongs to the user
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          user_id: userId,
        },
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      // Allow all users to delete projects
      // const canDelete = await SubscriptionService.canPerformAction(
      //   userId,
      //   "create_project" // Using create_project as a proxy for delete access - this is correct
      // );

      // if (!canDelete.allowed) {
      //   throw new Error(
      //     canDelete.reason || "You cannot delete projects at this time."
      //   );
      // }

      // Move the project to the recycle bin instead of hard deleting
      // Create a clean copy of the project data to avoid serialization issues
      const projectData = {
        id: project.id,
        user_id: project.user_id,
        title: project.title,
        type: project.type,
        citation_style: project.citation_style,
        description: project.description,
        content: project.content,
        word_count: project.word_count,
        due_date: project.due_date,
        status: project.status,
        created_at: project.created_at,
        updated_at: project.updated_at,
      };

      await RecycleBinService.moveToRecycleBin(
        userId,
        "project",
        projectId,
        projectData,
      );

      // Delete AI chat messages first (due to foreign key constraint with sessions)
      // Do this outside the transaction to avoid complex nested queries
      try {
        await prisma.AIChatMessage.deleteMany({
          where: {
            session: {
              project_id: projectId,
            },
          },
        });
      } catch (error) {
        logger.warn("Failed to delete AI chat messages", {
          error,
          projectId,
          userId,
        });
        // Continue with deletion even if this fails
      }

      // Delete related records first to avoid foreign key constraint violations
      // Use a transaction to ensure all deletions happen atomically
      await prisma.$transaction([
        // Delete document versions first as they have a direct foreign key to Project
        prisma.DocumentVersion.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete citations
        prisma.Citation.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete comments
        prisma.Comment.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete plagiarism reports
        prisma.PlagiarismReport.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete AI chat sessions
        prisma.AIChatSession.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete AI generated images
        prisma.AIGeneratedImage.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete editor activities
        prisma.EditorActivity.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete collaboration activities
        prisma.CollaborationActivity.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete collaboration analytics
        prisma.CollaborationAnalytics.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete collaboration performance metrics
        prisma.CollaborationPerformanceMetric.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete project collaborators
        prisma.CollaboratorPresence.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete footnotes
        prisma.Footnote.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete offline documents
        prisma.OfflineDocument.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete collaboration chat participants first (due to foreign key constraint)
        prisma.CollaborationChatParticipant.deleteMany({
          where: {
            room: {
              project_id: projectId,
            },
          },
        }),

        // Delete collaboration chat reactions first (due to foreign key constraint with messages)
        prisma.CollaborationChatReaction.deleteMany({
          where: {
            message: {
              room: {
                project_id: projectId,
              },
            },
          },
        }),

        // Delete collaboration chat messages
        prisma.CollaborationChatMessage.deleteMany({
          where: {
            room: {
              project_id: projectId,
            },
          },
        }),

        // Delete collaboration chat rooms
        prisma.CollaborationChatRoom.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete exports
        prisma.Export.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete document share settings
        prisma.DocumentShareSettings.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete collaboration invites
        prisma.CollaborationInvite.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete collaboration sessions
        prisma.CollaborationSession.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete transcriptions
        prisma.Transcription.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete collaborator presence records
        prisma.CollaboratorPresence.deleteMany({
          where: { project_id: projectId },
        }),

        // Delete citation activities
        prisma.CitationActivity.deleteMany({
          where: { project_id: projectId },
        }),
      ]);

      // Delete the project
      await prisma.project.delete({
        where: { id: projectId },
      });

      logger.info("Project deleted successfully", { projectId, userId });
      return { message: "Project deleted successfully" };
    } catch (error) {
      logger.error("Error deleting project", { error, projectId, userId });
      throw new Error(`Failed to delete project: ${(error as Error).message}`);
    }
  }

  // Export a project
  static async exportProject(
    projectId: string,
    userId: string,
    options: ExportOptions,
  ) {
    try {
      logger.info("Exporting project", { projectId, userId, options });

      // First, check if the project belongs to the user or if user is a collaborator
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { user_id: userId },
            { collaborators: { some: { user_id: userId } } },
          ],
        },
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      // Check if user can export projects based on their subscription
      const canExport = await SubscriptionService.canPerformAction(
        userId,
        "create_project", // Using create_project as a proxy for export access
      );

      if (!canExport.allowed) {
        throw new Error(
          canExport.reason || "You cannot export projects at this time.",
        );
      }

      // Additionally check format-specific access based on subscription plan
      const hasFormatAccess = await this.checkExportFormatAccess(
        userId,
        options.format,
      );

      if (!hasFormatAccess) {
        throw new Error(
          `Export format ${options.format} is not available with your current subscription plan.`,
        );
      }

      // Export the project
      const result = await ExportService.exportProject(projectId, userId, {
        format: options.format,
        includeCitations: options.includeCitations,
        includeComments: options.includeComments,
        citationStyle: options.citationStyle,
      });

      logger.info("Project exported successfully", {
        projectId,
        userId,
        format: options.format,
      });
      return result;
    } catch (error) {
      logger.error("Error exporting project", {
        error,
        projectId,
        userId,
        options,
      });
      throw new Error(`Failed to export project: ${(error as Error).message}`);
    }
  }

  // Get project statistics
  static async getProjectStats(userId: string) {
    try {
      logger.info("Getting project statistics", { userId });

      // Add timeout to prevent hanging requests
      const statsPromise = this.getProjectStatsWithTimeout(userId);

      // Set a timeout of 30 seconds for the stats operation
      const stats = await Promise.race([
        statsPromise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Project statistics fetch timeout")),
            30000, // 30 seconds timeout
          ),
        ),
      ]);

      return stats;
    } catch (error) {
      logger.error("Error getting project statistics", { error, userId });

      // Handle timeout errors specifically
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new Error(
          "Project statistics fetch timed out. Please try again later.",
        );
      }

      throw new Error(
        `Failed to get project statistics: ${(error as Error).message}`,
      );
    }
  }

  // Helper method to get project stats with retry logic
  private static async getProjectStatsWithTimeout(
    userId: string,
    retryCount = 3,
  ): Promise<any> {
    try {
      // Get all projects for the user (excluding archived by default)
      // and fetch related data in a single query to reduce database connections
      const projects = await prisma.project.findMany({
        where: {
          user_id: userId,
          status: {
            not: "archived",
          },
        },
        select: {
          id: true,
          word_count: true,
          created_at: true,
          status: true,
          updated_at: true,
          title: true,
          description: true,
          content: true,
        },
      });

      // Calculate statistics
      const totalProjects = projects.length;

      // Calculate words written in the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const wordsThisWeek = projects
        .filter((project: any) => {
          const projectDate = new Date(project.created_at);
          return projectDate >= oneWeekAgo;
        })
        .reduce(
          (sum: number, project: any) => sum + (project.word_count || 0),
          0,
        );

      // Calculate average completion rate by computing progress for each project
      // Execute all progress calculations in parallel to reduce connection time
      let completionRate = 0;
      if (projects.length > 0) {
        const progressPromises = projects.map((project: any) =>
          this.calculateProjectProgress({
            ...project,
            _prefetched: true, // Mark as prefetched to avoid additional DB queries
          }),
        );

        const progressResults = await Promise.all(progressPromises);
        const totalProgress = progressResults.reduce(
          (sum: number, progress: number) => sum + progress,
          0,
        );
        completionRate = Math.round(totalProgress / projects.length);
      }

      const stats = {
        totalProjects,
        wordsThisWeek,
        completionRate,
      };

      logger.info("Project statistics retrieved successfully", {
        userId,
        stats,
      });
      return stats;
    } catch (error) {
      // Handle connection pool timeout errors with retry logic
      if (
        retryCount > 0 &&
        error instanceof Error &&
        (error.message?.includes("connection pool timeout") ||
          error.message?.includes("Timed out fetching a new connection") ||
          error.message?.includes("Database operation timeout") ||
          error.message?.includes("ERR_INSUFFICIENT_RESOURCES") ||
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("Network error"))
      ) {
        logger.warn(
          `Retrying getProjectStats for user ${userId}... (${retryCount} attempts left)`,
          { error: error.message },
        );
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, 2000 * (4 - retryCount)),
        );
        return this.getProjectStatsWithTimeout(userId, retryCount - 1);
      }

      throw error;
    }
  }

  // Get project citations
  static async getProjectCitations(projectId: string, userId: string) {
    try {
      logger.info("Getting project citations", { projectId, userId });

      // First, check if the project belongs to the user or if user is a collaborator
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { user_id: userId },
            { collaborators: { some: { user_id: userId } } },
          ],
        },
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      const citations = await CitationService.getProjectCitations(
        projectId,
        userId,
      );

      logger.info("Project citations retrieved successfully", {
        projectId,
        userId,
      });
      return citations;
    } catch (error) {
      logger.error("Error getting project citations", {
        error,
        projectId,
        userId,
      });
      throw new Error(
        `Failed to get project citations: ${(error as Error).message}`,
      );
    }
  }

  // Get project document versions
  static async getProjectDocumentVersions(projectId: string, userId: string) {
    try {
      logger.info("Getting project document versions", { projectId, userId });

      // First, check if the project belongs to the user or if user is a collaborator
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { user_id: userId },
            { collaborators: { some: { user_id: userId } } },
          ],
        },
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      // Fetch document versions directly from the database
      const versions = await prisma.documentVersion.findMany({
        where: {
          project_id: projectId,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      logger.info("Project document versions retrieved successfully", {
        projectId,
        userId,
      });
      return versions;
    } catch (error) {
      logger.error("Error getting project document versions", {
        error,
        projectId,
        userId,
      });
      throw new Error(
        `Failed to get project document versions: ${(error as Error).message}`,
      );
    }
  }

  // Restore a document version
  static async restoreDocumentVersion(
    projectId: string,
    versionId: string,
    userId: string,
  ) {
    try {
      logger.info("Restoring document version", {
        projectId,
        versionId,
        userId,
      });

      // First, check if the project belongs to the user or if user is a collaborator
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { user_id: userId },
            { collaborators: { some: { user_id: userId } } },
          ],
        },
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      // First, get the document version to restore
      const documentVersion = await prisma.documentVersion.findUnique({
        where: {
          id: versionId,
          project_id: projectId,
        },
      });

      if (!documentVersion) {
        throw new Error("Document version not found");
      }

      // Update the project with the content from the document version
      const result = await prisma.project.update({
        where: {
          id: projectId,
        },
        data: {
          content: documentVersion.content,
          updated_at: new Date(),
        },
      });

      logger.info("Document version restored successfully", {
        projectId,
        versionId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error("Error restoring document version", {
        error,
        projectId,
        versionId,
        userId,
      });
      throw new Error(
        `Failed to restore document version: ${(error as Error).message}`,
      );
    }
  }

  // Add method for applying AI edits to project content
  static async applyAIEdit(
    projectId: string,
    userId: string,
    editOptions: AIEditOptions,
  ): Promise<any> {
    try {
      logger.info("Applying AI edit to project", {
        projectId,
        userId,
        editOptions,
      });

      // First, check if the project belongs to the user or if user is a collaborator
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { user_id: userId },
            { collaborators: { some: { user_id: userId } } },
          ],
        },
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      // Check if user can perform AI actions based on their subscription
      const canPerformAI = await SubscriptionService.canPerformAction(
        userId,
        "ai_request",
      );

      if (!canPerformAI.allowed) {
        throw new Error(
          canPerformAI.reason || "You cannot perform AI actions at this time.",
        );
      }

      // Process the AI request
      const aiResult = await AIService.processAIRequest({
        action: editOptions.action,
        text: editOptions.text,
        context: editOptions.context,
        preferences: editOptions.preferences,
        userId: userId,
      });

      // Track AI usage
      await this.trackAIEditUsage(userId, editOptions.action);

      // Save AI edit to history
      await this.saveAIEditHistory(
        projectId,
        userId,
        editOptions.action,
        editOptions.text,
        aiResult.suggestion,
      );

      // Send notification
      await this.sendProjectNotification(
        userId,
        "ai_suggestion",
        "AI Edit Applied",
        `AI has successfully processed your ${editOptions.action} request for "${project.title}".`,
        {
          projectId,
          projectName: project.title,
          action: editOptions.action,
        },
      );

      logger.info("AI edit applied successfully", { projectId, userId });
      return aiResult;
    } catch (error) {
      logger.error("Error applying AI edit", {
        error,
        projectId,
        userId,
        editOptions,
      });
      throw new Error(`Failed to apply AI edit: ${(error as Error).message}`);
    }
  }

  // Add method for getting AI edit history for a project
  static async getAIEditHistory(
    projectId: string,
    userId: string,
  ): Promise<AIEditHistory[]> {
    try {
      logger.info("Getting AI edit history for project", { projectId, userId });

      // First, check if the project belongs to the user or if user is a collaborator
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { user_id: userId },
            { collaborators: { some: { user_id: userId } } },
          ],
        },
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      const history = await prisma.aIHistory.findMany({
        where: {
          user_id: userId,
          // We'll use the action field to identify AI edits related to projects
        },
        orderBy: {
          created_at: "desc",
        },
        take: 50, // Limit to last 50 edits
      });

      logger.info("AI edit history retrieved successfully", {
        projectId,
        userId,
      });
      return history.map((item: any) => ({
        id: item.id,
        project_id: projectId,
        user_id: item.user_id,
        action: item.action,
        original_text: item.original_text,
        edited_text: item.suggestion,
        created_at: item.created_at,
      }));
    } catch (error) {
      logger.error("Error getting AI edit history", {
        error,
        projectId,
        userId,
      });
      throw new Error(
        `Failed to get AI edit history: ${(error as Error).message}`,
      );
    }
  }

  // Add method for tracking AI edit usage
  static async trackAIEditUsage(userId: string, action: string): Promise<void> {
    try {
      // Get current month/year for usage tracking
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // Update AI usage record
      await prisma.aIUsage.upsert({
        where: {
          user_id_month_year: {
            user_id: userId,
            month,
            year,
          },
        },
        update: {
          request_count: { increment: 1 },
          feature_usage: {
            push: action,
          },
        },
        create: {
          user_id: userId,
          month,
          year,
          request_count: 1,
          feature_usage: [action],
        },
      });
    } catch (error) {
      logger.error("Error tracking AI edit usage", { error, userId, action });
      // Don't throw error as this is tracking only
    }
  }

  // Add method for saving AI edit history
  static async saveAIEditHistory(
    projectId: string,
    userId: string,
    action: string,
    originalText: string,
    editedText: string,
  ): Promise<void> {
    try {
      // Save to AI history
      await prisma.aIHistory.create({
        data: {
          user_id: userId,
          action: `project_${action}`,
          original_text: originalText,
          suggestion: editedText,
          is_favorite: false,
        },
      });
    } catch (error) {
      logger.error("Error saving AI edit history", {
        error,
        projectId,
        userId,
        action,
      });
      // Don't throw error as this is tracking only
    }
  }

  // Share a project via email
  static async shareProject(
    projectId: string,
    userId: string,
    options: ShareOptions,
  ) {
    try {
      logger.info("Sharing project via email", { projectId, userId, options });

      // First, check if the project belongs to the user
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          user_id: userId,
        },
        include: {
          user: {
            select: {
              full_name: true,
              email: true,
            },
          },
        },
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      // Check if user can share projects based on their subscription
      const canShare = await SubscriptionService.canPerformAction(
        userId,
        "create_project", // Using create_project as a proxy for share access
      );

      if (!canShare.allowed) {
        throw new Error(
          canShare.reason || "You cannot share projects at this time.",
        );
      }

      // Export project to specified format
      const exportResult = await ExportService.exportProject(
        projectId,
        userId,
        {
          format: "pdf",
          includeCitations: true,
          citationStyle:
            (options.citationStyle as "apa" | "mla" | "chicago") || "apa",
        },
      );

      // Send email with the exported file attached
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { full_name: true, email: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const projectName = project.title || "Untitled Project";
      const emailSubject = `${
        user.full_name || "A ScholarForge AIuser"
      } shared a project with you: ${projectName}`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 40px; text-align: center;">
          <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 40px 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
            <div style="margin-bottom: 30px;">
              <img src="[URL_TO_ScholarForge AI_LOGO]" alt="ScholarForge AILogo" style="width: 40px; height: 40px; margin-bottom: 5px;">
              <h1 style="color: #1e40af; font-size: 24px; margin: 10px 0;">Project Shared with You</h1>
            </div>
            
            <p style="color: #666666; font-size: 16px; line-height: 1.6;">
              Hello,
            </p>
            
            <p style="color: #666666; font-size: 16px; line-height: 1.6;">
              ${
                user.full_name || "A ScholarForge AIuser"
              } has shared the project "<strong>${projectName}</strong>" with you.
            </p>
            
            ${
              options.message
                ? `
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: left;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e40af;">Message from sender:</p>
              <p style="margin: 0; color: #666666;">${options.message}</p>
            </div>
            `
                : ""
            }
            
            <p style="color: #666666; font-size: 16px; line-height: 1.6;">
              The project is attached to this email as a PDF file.
            </p>
            
            <div style="margin: 30px 0;">
              <a href="http://app.scholarforgeai.com/dashboard" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Open ScholarForge AI
              </a>
            </div>
            
            <p style="color: #666666; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px;">
              If you have any questions, feel free to reach out to our support team.
            </p>

            <p style="color: #999999; font-size: 13px; margin-top: 40px; margin-bottom: 5px;">
              ScholarForge AITeam
            </p>
          </div>
        </div>
      `;

      // Send the email with the exported file attached
      const emailSent = await EmailService.sendProjectShareEmail(
        options.email,
        emailSubject,
        emailHtml,
        exportResult.buffer,
        exportResult.filename,
      );

      if (!emailSent) {
        throw new Error("Failed to send email with project attachment");
      }

      logger.info("Project shared successfully", {
        projectId,
        userId,
        recipient: options.email,
      });

      return {
        success: true,
        message: `Project successfully shared with ${options.email}`,
        exportResult,
      };
    } catch (error) {
      logger.error("Error sharing project", {
        error,
        projectId,
        userId,
        options,
      });
      throw new Error(`Failed to share project: ${(error as Error).message}`);
    }
  }

  // Helper function to send project notifications
  static async sendProjectNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any,
  ) {
    try {
      await createNotification(userId, type as any, title, message, data);
    } catch (error) {
      logger.error("Error sending project notification", {
        error,
        userId,
        type,
      });
      // Don't throw error as we don't want to fail the entire operation
    }
  }

  // Check if user has access to export format based on their subscription plan
  private static async checkExportFormatAccess(
    userId: string,
    format: string,
  ): Promise<boolean> {
    // Formats available to all users
    const basicFormats = ["pdf", "docx", "txt"];

    // Advanced formats require Researcher plan
    const advancedFormats = [
      "latex",
      "rtf",
      "xlsx",
      "csv",
      "png",
      "journal-pdf",
      "journal-latex",
    ];

    // Basic formats are available to all
    if (basicFormats.includes(format)) {
      return true;
    }

    // Advanced formats require Researcher plan
    if (advancedFormats.includes(format)) {
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      return subscription?.plan === "researcher";
    }

    return true; // Default to true for unknown formats
  }

  // Get projects where user is a collaborator (not the owner)
  static async getCollaborationProjects(userId: string) {
    try {
      logger.info("Getting collaboration projects for user", { userId });

      // Get projects where the user is a collaborator but not the owner
      const projects = await prisma.project.findMany({
        where: {
          collaborators: {
            some: {
              user_id: userId,
            },
          },
          user_id: {
            not: userId, // Exclude projects where user is the owner
          },
        },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          collaborators: {
            include: {
              user: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          updated_at: "desc",
        },
      });

      logger.info("Successfully fetched collaboration projects", {
        userId,
        count: projects.length,
      });

      return projects;
    } catch (error) {
      logger.error("Error fetching collaboration projects", { error, userId });
      throw new Error(
        `Failed to fetch collaboration projects: ${(error as Error).message}`,
      );
    }
  }
}
