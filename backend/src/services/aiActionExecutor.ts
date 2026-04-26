// AI Action Executor Service
// Executes actions based on parsed user intents

import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";
import { OpenAIService } from "./openaiService";
import {
  ActionDefinition,
  ActionResult,
  AIActionContext,
  ParsedIntent,
  ACTION_DEFINITIONS,
} from "./aiActionTypes";
import { randomUUID } from "crypto";

export class AIActionExecutor {
  private static prisma = prisma;

  /**
   * Execute a parsed intent
   */
  static async executeAction(
    intent: ParsedIntent,
    context: AIActionContext,
    skipConfirmation: boolean = false
  ): Promise<ActionResult> {
    const startTime = Date.now();
    
    try {
      // Get action definition
      const actionDef = ACTION_DEFINITIONS[intent.actionType];
      if (!actionDef) {
        return {
          success: false,
          error: `Unknown action type: ${intent.actionType}`,
          message: `I don't know how to ${intent.actionType.replace(/_/g, ' ')}.`,
          affectedEntities: [],
        };
      }

      // Check if confirmation is needed
      if (actionDef.requiresConfirmation && !skipConfirmation) {
        // Create pending action record
        const actionRecord = await this.createActionRecord(intent, context, "pending");
        
        return {
          success: true,
          data: { actionId: actionRecord.id, requiresConfirmation: true },
          message: `Please confirm: ${this.buildConfirmationMessage(intent)}`,
          affectedEntities: [],
        };
      }

      // Execute the action
      const result = await this.performAction(intent, context);
      
      // Record the action
      const duration = Date.now() - startTime;
      await this.completeActionRecord(intent, context, result, duration);

      return result;
    } catch (error: any) {
      logger.error("Action execution error:", error);
      
      await this.failActionRecord(intent, context, error.message);
      
      return {
        success: false,
        error: error.message,
        message: `I couldn't complete that action: ${error.message}`,
        affectedEntities: [],
      };
    }
  }

  /**
   * Confirm and execute a pending action
   */
  static async confirmAndExecute(
    actionId: string,
    confirmedBy: string
  ): Promise<ActionResult> {
    try {
      // Get the pending action
      const action = await this.prisma.aIAction.findUnique({
        where: { id: actionId },
      });

      if (!action) {
        return {
          success: false,
          error: "Action not found",
          message: "I couldn't find that action to confirm.",
          affectedEntities: [],
        };
      }

      if (action.status !== "pending") {
        return {
          success: false,
          error: `Action is ${action.status}`,
          message: `This action has already been ${action.status}.`,
          affectedEntities: [],
        };
      }

      // Update to confirmed
      await this.prisma.aIAction.update({
        where: { id: actionId },
        data: {
          status: "confirmed",
          confirmed_at: new Date(),
          confirmed_by: confirmedBy,
        },
      });

      // Reconstruct the intent
      const intent: ParsedIntent = {
        actionType: action.action_type,
        actionCategory: action.action_category as any,
        targetEntity: action.target_entity as any,
        parameters: action.parsed_params as any,
        confidence: 1,
        requiresConfirmation: false,
        suggestedResponse: "",
      };

      const context: AIActionContext = {
        userId: action.user_id,
        sessionId: action.session_id || undefined,
        pageContext: action.page_context || undefined,
      };

      // Execute
      const startTime = Date.now();
      const result = await this.performAction(intent, context);
      const duration = Date.now() - startTime;

      // Update action record
      await this.prisma.aIAction.update({
        where: { id: actionId },
        data: {
          status: result.success ? "completed" : "failed",
          executed_at: new Date(),
          completed_at: result.success ? new Date() : null,
          failed_at: result.success ? null : new Date(),
          error_message: result.error || null,
          result_data: result.data || null,
          execution_duration_ms: duration,
        },
      });

      return result;
    } catch (error: any) {
      logger.error("Confirm and execute error:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to execute the confirmed action.",
        affectedEntities: [],
      };
    }
  }

  /**
   * Cancel a pending action
   */
  static async cancelAction(actionId: string): Promise<ActionResult> {
    try {
      await this.prisma.aIAction.update({
        where: { id: actionId },
        data: {
          status: "cancelled",
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: "Action cancelled.",
        affectedEntities: [],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: "Failed to cancel the action.",
        affectedEntities: [],
      };
    }
  }

  /**
   * Get pending actions for a user
   */
  static async getPendingActions(userId: string) {
    return await this.prisma.aIAction.findMany({
      where: {
        user_id: userId,
        status: "pending",
      },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Get action history for a user
   */
  static async getActionHistory(userId: string, limit: number = 50) {
    return await this.prisma.aIAction.findMany({
      where: {
        user_id: userId,
        status: { in: ["completed", "failed", "cancelled"] },
      },
      orderBy: { created_at: "desc" },
      take: limit,
    });
  }

  // ====================
  // Action Implementations
  // ====================

  private static async performAction(
    intent: ParsedIntent,
    context: AIActionContext
  ): Promise<ActionResult> {
    const { actionType, parameters } = intent;

    switch (actionType) {
      // Workspace Actions
      case "create_workspace":
        return this.createWorkspace(parameters, context);
      case "update_workspace":
        return this.updateWorkspace(parameters, context);
      case "delete_workspace":
        return this.deleteWorkspace(parameters, context);
      case "invite_workspace_member":
        return this.inviteWorkspaceMember(parameters, context);

      // Project Actions
      case "create_project":
        return this.createProject(parameters, context);
      case "update_project":
        return this.updateProject(parameters, context);
      case "delete_project":
        return this.deleteProject(parameters, context);
      case "archive_project":
        return this.archiveProject(parameters, context);

      // Task Actions
      case "create_task":
        return this.createTask(parameters, context);
      case "update_task":
        return this.updateTask(parameters, context);
      case "delete_task":
        return this.deleteTask(parameters, context);
      case "complete_task":
        return this.completeTask(parameters, context);
      case "create_subtask":
        return this.createSubtask(parameters, context);

      // Label Actions
      case "create_label":
        return this.createLabel(parameters, context);
      case "assign_label":
        return this.assignLabel(parameters, context);

      // View Actions
      case "create_view":
        return this.createView(parameters, context);

      // Read Actions
      case "list_workspaces":
        return this.listWorkspaces(context);
      case "list_projects":
        return this.listProjects(parameters, context);
      case "list_tasks":
        return this.listTasks(parameters, context);
      case "get_project_details":
        return this.getProjectDetails(parameters, context);

      // Navigation Actions (these return instructions for frontend)
      case "navigate_to_page":
        return this.navigateToPage(parameters);
      case "open_project":
        return this.openProject(parameters, context);

      // Document Actions
      case "edit_document":
        return this.editDocument(parameters, context);
      case "summarize_document":
        return this.summarizeDocument(parameters, context);

      // Notification Actions
      case "mark_notifications_read":
        return this.markNotificationsRead(parameters, context);

      // Multi-step Actions
      case "create_project_with_tasks":
        return this.createProjectWithTasks(parameters, context);

      default:
        return {
          success: false,
          error: `Action ${actionType} not implemented`,
          message: `I can't ${actionType.replace(/_/g, ' ')} yet, but I'm learning!`,
          affectedEntities: [],
        };
    }
  }

  // ====================
  // Workspace Actions
  // ====================

  private static async createWorkspace(params: any, context: AIActionContext): Promise<ActionResult> {
    const workspace = await this.prisma.workspace.create({
      data: {
        name: params.name,
        description: params.description,
        icon: params.icon || "📁",
        owner_id: context.userId,
      },
    });

    return {
      success: true,
      data: workspace,
      message: `Created workspace "${workspace.name}" successfully!`,
      affectedEntities: [{ type: "workspace", id: workspace.id, name: workspace.name }],
    };
  }

  private static async updateWorkspace(params: any, context: AIActionContext): Promise<ActionResult> {
    const workspace = await this.prisma.workspace.update({
      where: { id: params.workspaceId },
      data: {
        name: params.name,
        description: params.description,
        icon: params.icon,
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      data: workspace,
      message: `Updated workspace "${workspace.name}" successfully!`,
      affectedEntities: [{ type: "workspace", id: workspace.id, name: workspace.name }],
    };
  }

  private static async deleteWorkspace(params: any, context: AIActionContext): Promise<ActionResult> {
    // Get workspace info before deletion for the message
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: params.workspaceId },
    });

    await this.prisma.workspace.delete({
      where: { id: params.workspaceId },
    });

    return {
      success: true,
      data: { deletedId: params.workspaceId },
      message: `Deleted workspace "${workspace?.name || params.workspaceId}" and all its contents.`,
      affectedEntities: [{ type: "workspace", id: params.workspaceId, name: workspace?.name }],
    };
  }

  private static async inviteWorkspaceMember(params: any, context: AIActionContext): Promise<ActionResult> {
    // Check if workspace exists and user has permission
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: params.workspaceId,
        owner_id: context.userId,
      },
    });

    if (!workspace) {
      return {
        success: false,
        error: "Workspace not found or not authorized",
        message: "I couldn't find that workspace or you don't have permission to invite members.",
        affectedEntities: [],
      };
    }

    // Create invitation
    const invitation = await this.prisma.workspaceInvitation.create({
      data: {
        workspace_id: params.workspaceId,
        email: params.email,
        role: params.role || "viewer",
        invited_by: context.userId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      success: true,
      data: invitation,
      message: `Invited ${params.email} to join "${workspace.name}" as a ${params.role || "viewer"}.`,
      affectedEntities: [
        { type: "workspace", id: workspace.id, name: workspace.name },
        { type: "member", name: params.email },
      ],
    };
  }

  // ====================
  // Project Actions
  // ====================

  private static async createProject(params: any, context: AIActionContext): Promise<ActionResult> {
    const project = await this.prisma.project.create({
      data: {
        title: params.title,
        type: params.type || "other",
        description: params.description,
        user_id: context.userId,
        workspace_id: params.workspaceId || null,
        template_id: params.templateId || null,
        content: { type: "doc", content: [{ type: "paragraph" }] },
        status: "draft",
        word_count: 0,
      },
    });

    return {
      success: true,
      data: project,
      message: `Created project "${project.title}" successfully!`,
      affectedEntities: [{ type: "project", id: project.id, name: project.title }],
    };
  }

  private static async updateProject(params: any, context: AIActionContext): Promise<ActionResult> {
    const updateData: any = {
      updated_at: new Date(),
    };

    if (params.title) updateData.title = params.title;
    if (params.description) updateData.description = params.description;
    if (params.status) updateData.status = params.status;
    if (params.content) updateData.content = params.content;

    const project = await this.prisma.project.update({
      where: { id: params.projectId },
      data: updateData,
    });

    return {
      success: true,
      data: project,
      message: `Updated project "${project.title}" successfully!`,
      affectedEntities: [{ type: "project", id: project.id, name: project.title }],
    };
  }

  private static async deleteProject(params: any, context: AIActionContext): Promise<ActionResult> {
    const project = await this.prisma.project.findUnique({
      where: { id: params.projectId },
    });

    await this.prisma.project.delete({
      where: { id: params.projectId },
    });

    return {
      success: true,
      data: { deletedId: params.projectId },
      message: `Deleted project "${project?.title || params.projectId}" permanently.`,
      affectedEntities: [{ type: "project", id: params.projectId, name: project?.title }],
    };
  }

  private static async archiveProject(params: any, context: AIActionContext): Promise<ActionResult> {
    const project = await this.prisma.project.update({
      where: { id: params.projectId },
      data: {
        status: "archived",
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      data: project,
      message: `Archived project "${project.title}".`,
      affectedEntities: [{ type: "project", id: project.id, name: project.title }],
    };
  }

  // ====================
  // Task Actions
  // ====================

  private static async createTask(params: any, context: AIActionContext): Promise<ActionResult> {
    const task = await this.prisma.workspaceTask.create({
      data: {
        workspace_id: params.workspaceId,
        creator_id: context.userId,
        title: params.title,
        description: params.description,
        priority: params.priority || "medium",
        status: "todo",
        due_date: params.dueDate ? new Date(params.dueDate) : null,
        project_id: params.projectId || null,
      },
    });

    // Add assignees if specified
    if (params.assigneeEmails && params.assigneeEmails.length > 0) {
      for (const email of params.assigneeEmails) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (user) {
          await this.prisma.taskAssignee.create({
            data: {
              task_id: task.id,
              user_id: user.id,
            },
          });
        }
      }
    }

    return {
      success: true,
      data: task,
      message: `Created task "${task.title}" successfully!`,
      affectedEntities: [{ type: "task", id: task.id, name: task.title }],
    };
  }

  private static async updateTask(params: any, context: AIActionContext): Promise<ActionResult> {
    const updateData: any = {
      updated_at: new Date(),
    };

    if (params.title) updateData.title = params.title;
    if (params.description) updateData.description = params.description;
    if (params.status) updateData.status = params.status;
    if (params.priority) updateData.priority = params.priority;
    if (params.dueDate) updateData.due_date = new Date(params.dueDate);

    const task = await this.prisma.workspaceTask.update({
      where: { id: params.taskId },
      data: updateData,
    });

    return {
      success: true,
      data: task,
      message: `Updated task "${task.title}" successfully!`,
      affectedEntities: [{ type: "task", id: task.id, name: task.title }],
    };
  }

  private static async deleteTask(params: any, context: AIActionContext): Promise<ActionResult> {
    const task = await this.prisma.workspaceTask.findUnique({
      where: { id: params.taskId },
    });

    await this.prisma.workspaceTask.delete({
      where: { id: params.taskId },
    });

    return {
      success: true,
      data: { deletedId: params.taskId },
      message: `Deleted task "${task?.title || params.taskId}".`,
      affectedEntities: [{ type: "task", id: params.taskId, name: task?.title }],
    };
  }

  private static async completeTask(params: any, context: AIActionContext): Promise<ActionResult> {
    const task = await this.prisma.workspaceTask.update({
      where: { id: params.taskId },
      data: {
        status: "done",
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      data: task,
      message: `Marked task "${task.title}" as complete!`,
      affectedEntities: [{ type: "task", id: task.id, name: task.title }],
    };
  }

  private static async createSubtask(params: any, context: AIActionContext): Promise<ActionResult> {
    const subtask = await this.prisma.workspaceSubtask.create({
      data: {
        task_id: params.taskId,
        title: params.title,
        is_done: false,
        order: 0,
      },
    });

    return {
      success: true,
      data: subtask,
      message: `Added subtask "${subtask.title}".`,
      affectedEntities: [{ type: "task", id: subtask.id, name: subtask.title }],
    };
  }

  // ====================
  // Label & View Actions
  // ====================

  private static async createLabel(params: any, context: AIActionContext): Promise<ActionResult> {
    const label = await this.prisma.workspaceLabel.create({
      data: {
        workspace_id: params.workspaceId,
        name: params.name,
        color: params.color || "#3B82F6",
      },
    });

    return {
      success: true,
      data: label,
      message: `Created label "${label.name}".`,
      affectedEntities: [{ type: "label", id: label.id, name: label.name }],
    };
  }

  private static async assignLabel(params: any, context: AIActionContext): Promise<ActionResult> {
    await this.prisma.workspaceTask.update({
      where: { id: params.taskId },
      data: {
        labels: {
          connect: { id: params.labelId },
        },
      },
    });

    return {
      success: true,
      message: "Label assigned successfully!",
      affectedEntities: [
        { type: "task", id: params.taskId },
        { type: "label", id: params.labelId },
      ],
    };
  }

  private static async createView(params: any, context: AIActionContext): Promise<ActionResult> {
    const view = await this.prisma.workspaceView.create({
      data: {
        workspace_id: params.workspaceId,
        name: params.name,
        filters: params.filters || {},
      },
    });

    return {
      success: true,
      data: view,
      message: `Created view "${view.name}".`,
      affectedEntities: [{ type: "view", id: view.id, name: view.name }],
    };
  }

  // ====================
  // Read/Query Actions
  // ====================

  private static async listWorkspaces(context: AIActionContext): Promise<ActionResult> {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        OR: [
          { owner_id: context.userId },
          { members: { some: { user_id: context.userId } } },
        ],
      },
      include: {
        _count: {
          select: { projects: true, members: true },
        },
      },
    });

    return {
      success: true,
      data: { workspaces, count: workspaces.length },
      message: `Found ${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''}.`,
      affectedEntities: workspaces.map((w: any) => ({ type: "workspace" as const, id: w.id, name: w.name })),
    };
  }

  private static async listProjects(params: any, context: AIActionContext): Promise<ActionResult> {
    const where: any = { user_id: context.userId };
    
    if (params.workspaceId) {
      where.workspace_id = params.workspaceId;
    }
    
    if (!params.archived) {
      where.status = { not: "archived" };
    }

    const projects = await this.prisma.project.findMany({
      where,
      orderBy: { updated_at: "desc" },
    });

    return {
      success: true,
      data: { projects, count: projects.length },
      message: `Found ${projects.length} project${projects.length !== 1 ? 's' : ''}.`,
      affectedEntities: projects.map((p: any) => ({ type: "project" as const, id: p.id, name: p.title })),
    };
  }

  private static async listTasks(params: any, context: AIActionContext): Promise<ActionResult> {
    const where: any = { workspace_id: params.workspaceId };
    
    if (params.status) where.status = params.status;
    if (params.priority) where.priority = params.priority;

    const tasks = await this.prisma.workspaceTask.findMany({
      where,
      include: {
        assignees: {
          include: {
            user: { select: { id: true, full_name: true, email: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return {
      success: true,
      data: { tasks, count: tasks.length },
      message: `Found ${tasks.length} task${tasks.length !== 1 ? 's' : ''}.`,
      affectedEntities: tasks.map((t: any) => ({ type: "task" as const, id: t.id, name: t.title })),
    };
  }

  private static async getProjectDetails(params: any, context: AIActionContext): Promise<ActionResult> {
    const project = await this.prisma.project.findUnique({
      where: { id: params.projectId },
      include: {
        workspace: true,
        tasks: true,
        document_versions: { orderBy: { created_at: "desc" }, take: 5 },
      },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found",
        message: "I couldn't find that project.",
        affectedEntities: [],
      };
    }

    return {
      success: true,
      data: project,
      message: `Here are the details for "${project.title}".`,
      affectedEntities: [{ type: "project", id: project.id, name: project.title }],
    };
  }

  // ====================
  // Navigation Actions
  // ====================

  private static async navigateToPage(params: any): Promise<ActionResult> {
    return {
      success: true,
      data: {
        navigation: {
          page: params.page,
          params: params.params || {},
        },
      },
      message: `Taking you to the ${params.page} page.`,
      affectedEntities: [],
    };
  }

  private static async openProject(params: any, context: AIActionContext): Promise<ActionResult> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: params.projectId,
        user_id: context.userId,
      },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found",
        message: "I couldn't find that project to open.",
        affectedEntities: [],
      };
    }

    return {
      success: true,
      data: {
        navigation: {
          page: "editor",
          params: { projectId: project.id },
        },
        project,
      },
      message: `Opening "${project.title}" in the editor.`,
      affectedEntities: [{ type: "project", id: project.id, name: project.title }],
    };
  }

  // ====================
  // Document Actions
  // ====================

  private static async editDocument(params: any, context: AIActionContext): Promise<ActionResult> {
    // Get the project
    const project = await this.prisma.project.findUnique({
      where: { id: params.projectId },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found",
        message: "I couldn't find that document.",
        affectedEntities: [],
      };
    }

    // Use AI to generate the edit
    const currentContent = JSON.stringify(project.content);
    const prompt = `Edit the following document based on this instruction: "${params.instruction}"

Current document content (JSON):
${currentContent}

Provide the updated content in the same JSON format. Only return the JSON, no other text.`;

    const result = await OpenAIService.sendCompletion(prompt, "gpt-4o-mini", 4000, 0.3);

    // Try to parse the result
    let newContent;
    try {
      newContent = JSON.parse(result.content);
    } catch {
      // If parsing fails, wrap it as content
      newContent = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: result.content }] }] };
    }

    // Update the project
    const updatedProject = await this.prisma.project.update({
      where: { id: params.projectId },
      data: {
        content: newContent,
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      data: { project: updatedProject, edit: result.content },
      message: `I've edited the document based on your instructions.`,
      affectedEntities: [{ type: "project", id: project.id, name: project.title }],
    };
  }

  private static async summarizeDocument(params: any, context: AIActionContext): Promise<ActionResult> {
    const project = await this.prisma.project.findUnique({
      where: { id: params.projectId },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found",
        message: "I couldn't find that document.",
        affectedEntities: [],
      };
    }

    // Extract text content from the project
    const content = JSON.stringify(project.content);
    
    const style = params.style || "brief";
    const stylePrompts: Record<string, string> = {
      brief: "Provide a brief 2-3 sentence summary.",
      detailed: "Provide a detailed summary with key points.",
      bullet_points: "Summarize in bullet points.",
      executive: "Provide an executive summary suitable for decision-makers.",
    };

    const prompt = `Summarize the following document. ${stylePrompts[style]}

Document content:
${content}

Summary:`;

    const result = await OpenAIService.sendCompletion(prompt, "gpt-4o-mini", 1500, 0.3);

    return {
      success: true,
      data: { summary: result.content, style },
      message: `Here's a ${style} summary of "${project.title}":`,
      affectedEntities: [{ type: "project", id: project.id, name: project.title }],
    };
  }

  // ====================
  // Notification Actions
  // ====================

  private static async markNotificationsRead(params: any, context: AIActionContext): Promise<ActionResult> {
    const where: any = { user_id: context.userId, read: false };
    
    if (params.notificationIds && params.notificationIds.length > 0) {
      where.id = { in: params.notificationIds };
    }

    const result = await this.prisma.notification.updateMany({
      where,
      data: { read: true, updated_at: new Date() },
    });

    return {
      success: true,
      data: { markedRead: result.count },
      message: `Marked ${result.count} notification${result.count !== 1 ? 's' : ''} as read.`,
      affectedEntities: [],
    };
  }

  // ====================
  // Multi-step Actions
  // ====================

  private static async createProjectWithTasks(params: any, context: AIActionContext): Promise<ActionResult> {
    // Create project first
    const project = await this.prisma.project.create({
      data: {
        title: params.title,
        type: params.type || "other",
        user_id: context.userId,
        workspace_id: params.workspaceId || null,
        content: { type: "doc", content: [{ type: "paragraph" }] },
        status: "draft",
        word_count: 0,
      },
    });

    // Create tasks if workspace is provided
    const createdTasks = [];
    if (params.workspaceId && params.tasks && params.tasks.length > 0) {
      for (const taskTitle of params.tasks) {
        const task = await this.prisma.workspaceTask.create({
          data: {
            workspace_id: params.workspaceId,
            project_id: project.id,
            creator_id: context.userId,
            title: taskTitle,
            status: "todo",
            priority: "medium",
          },
        });
        createdTasks.push(task);
      }
    }

    return {
      success: true,
      data: { project, tasks: createdTasks },
      message: `Created project "${project.title}" with ${createdTasks.length} task${createdTasks.length !== 1 ? 's' : ''}.`,
      affectedEntities: [
        { type: "project", id: project.id, name: project.title },
        ...createdTasks.map((t: any) => ({ type: "task" as const, id: t.id, name: t.title })),
      ],
    };
  }

  // ====================
  // Helper Methods
  // ====================

  private static async createActionRecord(
    intent: ParsedIntent,
    context: AIActionContext,
    status: string
  ) {
    return await this.prisma.aIAction.create({
      data: {
        id: randomUUID(),
        user_id: context.userId,
        action_type: intent.actionType,
        action_category: intent.actionCategory,
        target_entity: intent.targetEntity,
        target_id: intent.parameters.id || intent.parameters.projectId || intent.parameters.workspaceId || null,
        status,
        user_intent: "", // Will be set by caller
        parsed_params: intent.parameters,
        confirmation_required: intent.requiresConfirmation,
        page_context: context.pageContext,
        session_id: context.sessionId || null,
      },
    });
  }

  private static async completeActionRecord(
    intent: ParsedIntent,
    context: AIActionContext,
    result: ActionResult,
    duration: number
  ) {
    // This is called after performAction, so we create a record for completed actions
    await this.prisma.aIAction.create({
      data: {
        id: randomUUID(),
        user_id: context.userId,
        action_type: intent.actionType,
        action_category: intent.actionCategory,
        target_entity: intent.targetEntity,
        status: result.success ? "completed" : "failed",
        user_intent: "",
        parsed_params: intent.parameters,
        confirmation_required: intent.requiresConfirmation,
        executed_at: new Date(),
        completed_at: result.success ? new Date() : null,
        failed_at: result.success ? null : new Date(),
        error_message: result.error || null,
        result_data: result.data || null,
        execution_duration_ms: duration,
        page_context: context.pageContext,
        session_id: context.sessionId || null,
      },
    });
  }

  private static async failActionRecord(
    intent: ParsedIntent,
    context: AIActionContext,
    errorMessage: string
  ) {
    await this.prisma.aIAction.create({
      data: {
        id: randomUUID(),
        user_id: context.userId,
        action_type: intent.actionType,
        action_category: intent.actionCategory,
        target_entity: intent.targetEntity,
        status: "failed",
        user_intent: "",
        parsed_params: intent.parameters,
        failed_at: new Date(),
        error_message: errorMessage,
        page_context: context.pageContext,
        session_id: context.sessionId || null,
      },
    });
  }

  private static buildConfirmationMessage(intent: ParsedIntent): string {
    const messages: Record<string, string> = {
      create_workspace: "create this workspace",
      update_workspace: "update this workspace",
      delete_workspace: "delete this workspace (this cannot be undone)",
      create_project: "create this project",
      update_project: "update this project",
      delete_project: "delete this project (this cannot be undone)",
      create_task: "create this task",
      delete_task: "delete this task",
      invite_workspace_member: "invite this member",
      edit_document: "edit this document",
    };

    return messages[intent.actionType] || `proceed with ${intent.actionType.replace(/_/g, " ")}`;
  }
}

export default AIActionExecutor;
