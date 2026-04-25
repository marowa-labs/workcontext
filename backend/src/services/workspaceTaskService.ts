import prisma from "../lib/prisma";
import logger from "../monitoring/logger";
import { createNotification } from "./notificationService";
import { getNotificationServer } from "../lib/notificationServer";
import RecurringTaskService from "./RecurringTaskService";

export interface TaskData {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: Date;
  assignee_ids?: string[]; // Multiple Assignees

  // Recurrence fields
  is_recurring?: boolean;
  recurrence_pattern?: string; // "daily", "weekly", "monthly", "yearly", or RRULE string
  recurrence_end_date?: Date;
  recurrence_max_occurrences?: number;

  // Project linking
  project_id?: string; // Optional: link task to a research project

  // Template fields
  is_template?: boolean;
  template_name?: string;
  template_category?: string;

  // Custom Field values
  custom_field_values?: Record<string, any>; // field_id -> value
}

export class WorkspaceTaskService {
  /**
   * Get all tasks for a workspace
   */
  static async getTasks(
    workspaceId: string,
    includeTemplates: boolean = false,
  ) {
    try {
      return await prisma.workspaceTask.findMany({
        where: {
          workspace_id: workspaceId,
          is_template: includeTemplates ? undefined : false,
        },
        include: {
          assignees: {
            include: {
              user: {
                select: { id: true, full_name: true, email: true },
              },
            },
          },
          creator: {
            select: { id: true, full_name: true, email: true },
          },
          subtasks: {
            orderBy: { order: "asc" },
          },
          labels: true,
          attachments: true,
          comments: {
            select: { id: true },
          },
          dependencies: {
            include: {
              depends_on: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  project_id: true,
                  project: {
                    select: { title: true },
                  },
                },
              },
            },
          },
          blocked_by: {
            include: {
              task: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  project_id: true,
                  project: {
                    select: { title: true },
                  },
                },
              },
            },
          },
          project: {
            select: { title: true },
          },
        },
        orderBy: { updated_at: "desc" },
      });
    } catch (error) {
      logger.error("Error fetching workspace tasks:", error);
      throw error;
    }
  }

  /**
   * Get a single task by ID
   */
  static async getTaskById(taskId: string) {
    try {
      return await prisma.workspaceTask.findUnique({
        where: { id: taskId },
        include: {
          assignees: {
            include: {
              user: {
                select: { id: true, full_name: true, email: true },
              },
            },
          },
          creator: {
            select: { id: true, full_name: true, email: true },
          },
          subtasks: {
            orderBy: { order: "asc" },
          },
          labels: true,
          attachments: true,
          comments: {
            select: { id: true },
          },
          dependencies: {
            include: {
              depends_on: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  project_id: true,
                },
              },
            },
          },
          blocked_by: {
            include: {
              task: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  project_id: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      logger.error("Error fetching task by ID:", error);
      throw error;
    }
  }

  /**
   * Get all templates for a workspace
   */
  static async getTemplates(workspaceId: string) {
    try {
      return await prisma.workspaceTask.findMany({
        where: {
          workspace_id: workspaceId,
          is_template: true,
        },
        include: {
          subtasks: { orderBy: { order: "asc" } },
          labels: true,
        },
        orderBy: { template_name: "asc" },
      });
    } catch (error) {
      logger.error("Error fetching workspace templates:", error);
      throw error;
    }
  }

  /**
   * Save a task as a template
   */
  static async saveAsTemplate(
    taskId: string,
    templateName: string,
    category?: string,
  ) {
    try {
      const originalTask = await prisma.workspaceTask.findUnique({
        where: { id: taskId },
        include: {
          subtasks: true,
          labels: true,
        },
      });

      if (!originalTask) throw new Error("Task not found");

      const result = await prisma.$transaction(async (tx: any) => {
        const template = await tx.workspaceTask.create({
          data: {
            workspace_id: originalTask.workspace_id,
            creator_id: originalTask.creator_id,
            title: originalTask.title,
            description: originalTask.description,
            priority: originalTask.priority,
            is_template: true,
            template_name: templateName,
            template_category: category || "General",
            estimated_hours: originalTask.estimated_hours,
            project_id: originalTask.project_id,
          },
        });

        if (originalTask.subtasks.length > 0) {
          await tx.workspaceSubtask.createMany({
            data: originalTask.subtasks.map((sub: any) => ({
              task_id: template.id,
              title: sub.title,
              is_done: false,
              order: sub.order,
            })),
          });
        }

        if (originalTask.labels.length > 0) {
          await tx.workspaceTask.update({
            where: { id: template.id },
            data: {
              labels: {
                connect: originalTask.labels.map((l: any) => ({ id: l.id })),
              },
            },
          });
        }

        return template;
      });

      // Broadcast real-time event
      try {
        const ns = getNotificationServer();
        ns.broadcastToChannel(`workspace:${originalTask.workspace_id}`, {
          type: "TASK_CREATED",
          task: result,
        });
      } catch (err) {
        logger.error("Failed to broadcast TASK_CREATED event (template):", err);
      }

      return result;
    } catch (error) {
      logger.error("Error saving task as template:", error);
      throw error;
    }
  }

  /**
   * Create a task from a template
   */
  static async createFromTemplate(
    templateId: string,
    userId: string,
    overrides: Partial<TaskData> = {},
  ) {
    try {
      // Reuse clone logic but explicitly from a template
      const template = await prisma.workspaceTask.findUnique({
        where: { id: templateId, is_template: true },
        include: { subtasks: true, labels: true },
      });

      if (!template) throw new Error("Template not found");

      const newTask = await prisma.$transaction(async (tx: any) => {
        const task = await tx.workspaceTask.create({
          data: {
            workspace_id: template.workspace_id,
            creator_id: userId,
            title: overrides.title || template.title,
            description: overrides.description || template.description,
            priority: overrides.priority || template.priority,
            status: overrides.status || "todo",
            due_date: overrides.due_date || null,
            estimated_hours: template.estimated_hours,
            project_id: overrides.project_id || template.project_id,
            is_template: false,
          },
        });

        if (template.subtasks.length > 0) {
          await tx.workspaceSubtask.createMany({
            data: template.subtasks.map((sub: any) => ({
              task_id: task.id,
              title: sub.title,
              is_done: false,
              order: sub.order,
            })),
          });
        }

        if (template.labels.length > 0) {
          await tx.workspaceTask.update({
            where: { id: task.id },
            data: {
              labels: {
                connect: template.labels.map((l: any) => ({ id: l.id })),
              },
            },
          });
        }

        return task;
      });

      const fullTask = await this.getTaskById(newTask.id);

      // Broadcast real-time event
      if (fullTask) {
        try {
          const ns = getNotificationServer();
          ns.broadcastToChannel(`workspace:${fullTask.workspace_id}`, {
            type: "TASK_CREATED",
            task: fullTask,
          });
        } catch (err) {
          logger.error(
            "Failed to broadcast TASK_CREATED event (from template):",
            err,
          );
        }
      }

      return fullTask;
    } catch (error) {
      logger.error("Error creating task from template:", error);
      throw error;
    }
  }

  /**
   * Clone a task
   */
  static async cloneTask(taskId: string, userId: string) {
    try {
      // 1. Fetch original task with all relations
      const originalTask = await prisma.workspaceTask.findUnique({
        where: { id: taskId },
        include: {
          subtasks: true,
          assignees: true,
          labels: true,
          attachments: true,
        },
      });

      if (!originalTask) {
        throw new Error("Task not found");
      }

      // 2. Prepare new task data
      const newTaskData = {
        workspace_id: originalTask.workspace_id,
        creator_id: userId,
        title: `${originalTask.title} (Copy)`,
        description: originalTask.description,
        priority: originalTask.priority,
        status: "TODO", // Reset status
        due_date: originalTask.due_date, // Keep due date? Optional: clear it
        estimated_hours: originalTask.estimated_hours,
        project_id: originalTask.project_id,

        // Recurrence settings
        is_recurring: originalTask.is_recurring,
        recurrence_pattern: originalTask.recurrence_pattern,
        recurrence_end_date: originalTask.recurrence_end_date,
        recurrence_max_occurrences: originalTask.recurrence_max_occurrences,
      };

      // 3. Create the task transactionally with relations
      const clonedTask = await prisma.$transaction(async (tx: any) => {
        // Create base task
        const newTask = await tx.workspaceTask.create({
          data: newTaskData,
        });

        // Clone Subtasks
        if (originalTask.subtasks.length > 0) {
          await tx.workspaceSubtask.createMany({
            data: originalTask.subtasks.map((sub: any) => ({
              task_id: newTask.id,
              title: sub.title,
              is_done: false, // Reset subtask status
              order: sub.order,
            })),
          });
        }

        // Clone Assignees
        if (originalTask.assignees.length > 0) {
          await tx.taskAssignee.createMany({
            data: originalTask.assignees.map((assignee: any) => ({
              task_id: newTask.id,
              user_id: assignee.user_id,
            })),
          });
        }

        // Clone Labels
        if (originalTask.labels.length > 0) {
          // Many-to-many relationship often handled differently in Prisma
          // Assuming explicit connect or join table.
          // If 'labels' is a relation, need to connect.
          // However based on 'include: { labels: true }' it might be M-N implicit
          // Let's check schema. Assuming implicit M-N for now:
          await tx.workspaceTask.update({
            where: { id: newTask.id },
            data: {
              labels: {
                connect: originalTask.labels.map((l: any) => ({ id: l.id })),
              },
            },
          });
        }

        // Clone Attachments (References)
        if (originalTask.attachments.length > 0) {
          await tx.taskAttachment.createMany({
            data: originalTask.attachments.map((att: any) => ({
              id: undefined, // Let DB generate new ID
              task_id: newTask.id,
              name: att.name,
              file_url: att.file_url,
              file_type: att.file_type,
              file_size: att.file_size,
              uploaded_by: userId, // Set cloner as uploader of reference
            })),
          });
        }

        return newTask;
      });

      // 4. Return full task details (re-fetch to match getTaskById format)
      return await this.getTaskById(clonedTask.id);
    } catch (error) {
      logger.error("Error cloning task:", error);
      throw error;
    }
  }

  /**
   * Get recent activity (tasks) for a workspace
   */
  static async getRecentActivity(workspaceId: string, limit: number = 10) {
    try {
      return await prisma.workspaceTask.findMany({
        where: {
          workspace_id: workspaceId,
          is_template: false,
        },
        include: {
          assignees: {
            include: {
              user: {
                select: { id: true, full_name: true, email: true },
              },
            },
          },
          creator: {
            select: { id: true, full_name: true, email: true },
          },
          subtasks: {
            orderBy: { order: "asc" },
          },
          labels: true,
          attachments: true,
          comments: {
            select: { id: true },
          },
          dependencies: {
            include: {
              depends_on: {
                select: { id: true, title: true, status: true },
              },
            },
          },
          blocked_by: {
            include: {
              task: {
                select: { id: true, title: true, status: true },
              },
            },
          },
        },
        orderBy: { updated_at: "desc" },
        take: limit,
      });
    } catch (error) {
      logger.error("Error fetching workspace recent activity:", error);
      throw error;
    }
  }

  /**
   * Create a task
   */
  static async createTask(
    workspaceId: string,
    creatorId: string,
    data: TaskData,
  ) {
    try {
      // If creating a recurring task, convert simple pattern to RRULE
      let rrulePattern = data.recurrence_pattern;
      if (data.is_recurring && data.recurrence_pattern && data.due_date) {
        rrulePattern = RecurringTaskService.patternToRRule(
          data.recurrence_pattern,
          data.due_date,
          {
            endDate: data.recurrence_end_date,
            maxOccurrences: data.recurrence_max_occurrences,
          },
        );
      }

      const task = await prisma.workspaceTask.create({
        data: {
          workspace_id: workspaceId,
          creator_id: creatorId,
          title: data.title,
          description: data.description,
          status: data.status || "todo",
          priority: data.priority || "medium",
          due_date: data.due_date,
          project_id: data.project_id, // Link to project if provided
          is_recurring: data.is_recurring || false,
          recurrence_pattern: rrulePattern,
          recurrence_end_date: data.recurrence_end_date,
          recurrence_max_occurrences: data.recurrence_max_occurrences,
          assignees: data.assignee_ids
            ? {
                create: data.assignee_ids.map((userId) => ({
                  user: { connect: { id: userId } },
                })),
              }
            : undefined,
        },
        include: {
          assignees: {
            include: { user: true },
          },
          creator: true,
          workspace: true,
          subtasks: true,
          labels: true,
          attachments: true,
          comments: true,
        },
      });

      // Generate initial instances for recurring tasks
      if (task.is_recurring) {
        try {
          await RecurringTaskService.generateTaskInstances(task.id);
          logger.info(
            `Generated initial instances for recurring task ${task.id}`,
          );
        } catch (err) {
          logger.error(
            `Failed to generate instances for new recurring task:`,
            err,
          );
        }
      }

      // Send notifications to assignees
      if (data.assignee_ids && data.assignee_ids.length > 0) {
        for (const userId of data.assignee_ids) {
          // Don't notify the creator if they assigned themselves
          if (userId === creatorId) continue;

          await createNotification(
            userId,
            "task_assigned",
            "New Task Assigned",
            `You have been assigned to task "${task.title}" in workspace "${(task as any).workspace.name}".`,
            {
              taskId: task.id,
              workspaceId: task.workspace_id,
            },
          );
        }
      }

      // Broadcast real-time event
      try {
        const ns = getNotificationServer();
        ns.broadcastToChannel(`workspace:${workspaceId}`, {
          type: "TASK_CREATED",
          task,
        });
      } catch (err) {
        logger.error("Failed to broadcast TASK_CREATED event:", err);
      }

      return task;
    } catch (error) {
      logger.error("Error creating workspace task:", error);
      throw error;
    }
  }

  /**
   * Update a task (status, assignee, etc)
   */
  static async updateTask(taskId: string, data: Partial<TaskData>) {
    try {
      let newlyAssignedUserIds: string[] = [];

      // If assignee_ids is provided, we need to handle the update carefully
      if (data.assignee_ids !== undefined) {
        // Get existing assignees to identify newly assigned users
        const existingAssignees = await prisma.taskAssignee.findMany({
          where: { task_id: taskId },
          select: { user_id: true },
        });
        const existingUserIds = existingAssignees.map(
          (a: { user_id: string }) => a.user_id,
        );
        newlyAssignedUserIds = data.assignee_ids.filter(
          (id) => !existingUserIds.includes(id),
        );

        // Simple approach: delete existing and create new
        await prisma.taskAssignee.deleteMany({
          where: { task_id: taskId },
        });

        if (data.assignee_ids.length > 0) {
          await prisma.taskAssignee.createMany({
            data: data.assignee_ids.map((userId) => ({
              task_id: taskId,
              user_id: userId,
            })),
          });
        }
      }

      const updatedTask = await prisma.workspaceTask.update({
        where: { id: taskId },
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          due_date: data.due_date,
          project_id: data.project_id, // Update project linking
        },
        include: {
          assignees: {
            include: { user: true },
          },
          creator: true,
          workspace: true,
          subtasks: {
            orderBy: { order: "asc" },
          },
          labels: true,
          attachments: true,
          comments: true,
        },
      });

      // Notify newly assigned users
      if (newlyAssignedUserIds.length > 0) {
        for (const userId of newlyAssignedUserIds) {
          await createNotification(
            userId,
            "task_assigned",
            "Added to Task",
            `You have been added to task "${updatedTask.title}" in workspace "${(updatedTask as any).workspace.name}".`,
            {
              taskId: updatedTask.id,
              workspaceId: updatedTask.workspace_id,
            },
          );
        }
      }

      // Broadcast real-time event
      try {
        const ns = getNotificationServer();
        ns.broadcastToChannel(`workspace:${updatedTask.workspace_id}`, {
          type: "TASK_UPDATED",
          task: updatedTask,
        });
      } catch (err) {
        logger.error("Failed to broadcast TASK_UPDATED event:", err);
      }

      return updatedTask;
    } catch (error) {
      logger.error("Error updating workspace task:", error);
      throw error;
    }
  }

  /**
   * Delete a task
   */
  static async deleteTask(taskId: string) {
    try {
      // Get task info before deletion to know the workspace ID
      const task = await prisma.workspaceTask.findUnique({
        where: { id: taskId },
        select: { workspace_id: true },
      });

      await prisma.workspaceTask.delete({
        where: { id: taskId },
      });

      // Broadcast real-time event
      if (task) {
        try {
          const ns = getNotificationServer();
          ns.broadcastToChannel(`workspace:${task.workspace_id}`, {
            type: "TASK_DELETED",
            taskId,
          });
        } catch (err) {
          logger.error("Failed to broadcast TASK_DELETED event:", err);
        }
      }

      return { success: true };
    } catch (error) {
      logger.error("Error deleting workspace task:", error);
      throw error;
    }
  }

  /**
   * Bulk update tasks
   */
  static async bulkUpdateTasks(
    workspaceId: string,
    taskIds: string[],
    data: Partial<TaskData>,
  ) {
    try {
      const results = [];

      // Update each task individually to reuse existing logic and broadcasting
      // This is simpler and ensures all side effects (notifications, broadcasting) are triggered
      for (const taskId of taskIds) {
        try {
          const updatedTask = await this.updateTask(taskId, data);
          results.push(updatedTask);
        } catch (err) {
          logger.error(
            `Failed to update task ${taskId} in bulk operation:`,
            err,
          );
        }
      }

      return results;
    } catch (error) {
      logger.error("Error bulk updating workspace tasks:", error);
      throw error;
    }
  }

  /**
   * Bulk delete tasks
   */
  static async bulkDeleteTasks(workspaceId: string, taskIds: string[]) {
    try {
      for (const taskId of taskIds) {
        try {
          await this.deleteTask(taskId);
        } catch (err) {
          logger.error(
            `Failed to delete task ${taskId} in bulk operation:`,
            err,
          );
        }
      }

      return { success: true };
    } catch (error) {
      logger.error("Error bulk deleting workspace tasks:", error);
      throw error;
    }
  }

  /**
   * Get all tasks for a specific project
   */
  static async getTasksByProject(projectId: string) {
    try {
      return await prisma.workspaceTask.findMany({
        where: { project_id: projectId },
        include: {
          assignees: {
            include: { user: true },
          },
          creator: true,
          workspace: true,
          subtasks: true,
          labels: true,
          attachments: true,
          comments: true,
          dependencies: {
            include: {
              depends_on: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  project_id: true, // Include for cross-project indicators
                },
              },
            },
          },
          blocked_by: {
            include: {
              task: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  project_id: true, // Include for cross-project indicators
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
      });
    } catch (error) {
      logger.error(`Error fetching tasks for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get task statistics for a specific project
   */
  static async getProjectTaskStats(projectId: string) {
    try {
      const tasks = await prisma.workspaceTask.findMany({
        where: { project_id: projectId },
        select: { status: true, priority: true },
      });

      const total = tasks.length;
      const completed = tasks.filter(
        (t: { status: string }) => t.status === "done",
      ).length;
      const inProgress = tasks.filter(
        (t: { status: string }) => t.status === "in-progress",
      ).length;
      const todo = tasks.filter(
        (t: { status: string }) => t.status === "todo",
      ).length;
      const high = tasks.filter(
        (t: { priority: string }) => t.priority === "high",
      ).length;
      const medium = tasks.filter(
        (t: { priority: string }) => t.priority === "medium",
      ).length;
      const low = tasks.filter(
        (t: { priority: string }) => t.priority === "low",
      ).length;

      return {
        total,
        completed,
        inProgress,
        todo,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        priorityBreakdown: {
          high,
          medium,
          low,
        },
      };
    } catch (error) {
      logger.error(
        `Error fetching task stats for project ${projectId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get custom field definitions for a workspace
   */
  static async getCustomFieldDefinitions(workspaceId: string) {
    try {
      return await prisma.workspaceCustomField.findMany({
        where: { workspace_id: workspaceId },
        orderBy: { name: "asc" },
      });
    } catch (error) {
      logger.error("Error fetching custom field definitions:", error);
      throw error;
    }
  }

  /**
   * Create a custom field definition
   */
  static async createCustomFieldDefinition(
    workspaceId: string,
    data: { name: string; type: string; options?: string[] },
  ) {
    try {
      return await prisma.workspaceCustomField.create({
        data: {
          workspace_id: workspaceId,
          name: data.name,
          type: data.type,
          options: data.options,
        },
      });
    } catch (error) {
      logger.error("Error creating custom field definition:", error);
      throw error;
    }
  }

  /**
   * Update custom field values for a task
   */
  static async updateTaskCustomFields(
    taskId: string,
    values: Record<string, any>,
  ) {
    try {
      // Get the task to find workspace ID
      const task = await prisma.workspaceTask.findUnique({
        where: { id: taskId },
        select: { workspace_id: true },
      });

      if (!task) throw new Error("Task not found");

      // Use a transaction to update values
      await prisma.$transaction(
        Object.entries(values).map(([fieldId, value]) => {
          const fieldVal: any = {
            text_value: null,
            number_value: null,
            date_value: null,
          };

          if (value === null || value === undefined) {
            // Leave as nulls
          } else if (typeof value === "number") {
            fieldVal.number_value = value;
          } else if (
            typeof value === "string" &&
            !isNaN(Date.parse(value)) &&
            (value.includes("-") || value.includes("/"))
          ) {
            fieldVal.date_value = new Date(value);
          } else {
            fieldVal.text_value = String(value);
          }

          return prisma.taskCustomFieldValue.upsert({
            where: {
              task_id_field_id: {
                task_id: taskId,
                field_id: fieldId,
              },
            },
            update: fieldVal,
            create: {
              task_id: taskId,
              field_id: fieldId,
              ...fieldVal,
            },
          });
        }),
      );

      const updatedTask = await this.getTaskById(taskId);

      // Broadcast update
      try {
        const ns = getNotificationServer();
        ns.broadcastToChannel(`workspace:${task.workspace_id}`, {
          type: "TASK_UPDATED",
          task: updatedTask,
        });
      } catch (err) {
        logger.error(
          "Failed to broadcast TASK_UPDATED event (custom fields):",
          err,
        );
      }

      return updatedTask;
    } catch (error) {
      logger.error("Error updating task custom fields:", error);
      throw error;
    }
  }

  /**
   * Delete a custom field definition
   */
  static async deleteCustomFieldDefinition(fieldId: string) {
    try {
      await prisma.workspaceCustomField.delete({
        where: { id: fieldId },
      });
      return { success: true };
    } catch (error) {
      logger.error("Error deleting custom field definition:", error);
      throw error;
    }
  }
}

export default WorkspaceTaskService;
