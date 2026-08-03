import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

/**
 * DecisionService
 * Manages decisions, action items, blockers, and insights across the workspace.
 * Supports CRUD operations, status tracking, assignment, and semantic search.
 */

interface CreateDecisionParams {
  userId: string;
  workspaceId: string;
  projectId?: string;
  transcriptId?: string;
  type: "decision" | "action_item" | "blocker" | "insight";
  title: string;
  description: string;
  assignee?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: string;
  dueDate?: string;
  sourceUrl?: string;
  sourceTool?: string;
}

interface UpdateDecisionParams {
  title?: string;
  description?: string;
  assignee?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: string;
  dueDate?: string;
}

interface ListDecisionsOptions {
  workspaceId: string;
  projectId?: string;
  type?: string;
  status?: string;
  assignee?: string;
  priority?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export class DecisionService {
  /**
   * Create a new decision/action item/blocker/insight
   */
  static async create(params: CreateDecisionParams) {
    try {
      const decision = await prisma.decision.create({
        data: {
          user_id: params.userId,
          workspace_id: params.workspaceId,
          project_id: params.projectId || null,
          transcript_id: params.transcriptId || null,
          type: params.type,
          title: params.title,
          description: params.description,
          assignee: params.assignee || null,
          priority: params.priority || "medium",
          status: params.status || "open",
          due_date: params.dueDate ? new Date(params.dueDate) : null,
          source_url: params.sourceUrl || null,
          source_tool: params.sourceTool || "manual",
        },
      });

      // Log to activity feed
      await prisma.activityFeedItem.create({
        data: {
          user_id: params.userId,
          workspace_id: params.workspaceId,
          project_id: params.projectId || null,
          decision_id: decision.id,
          action: "created",
          entity_type: "decision",
          entity_id: decision.id,
          entity_title: decision.title,
          description: `New ${params.type.replace("_", " ")}: ${params.title}`,
          metadata: {
            type: params.type,
            priority: params.priority,
            assignee: params.assignee,
          },
        },
      });

      return decision;
    } catch (error) {
      logger.error("Failed to create decision", {
        error: (error as Error).message,
        userId: params.userId,
      });
      throw error;
    }
  }

  /**
   * Update a decision's status, priority, or details
   */
  static async update(
    decisionId: string,
    userId: string,
    params: UpdateDecisionParams
  ) {
    try {
      const existing = await prisma.decision.findUnique({
        where: { id: decisionId },
      });

      if (!existing) {
        throw new Error("Decision not found");
      }

      const updated = await prisma.decision.update({
        where: { id: decisionId },
        data: {
          ...(params.title !== undefined && { title: params.title }),
          ...(params.description !== undefined && {
            description: params.description,
          }),
          ...(params.assignee !== undefined && { assignee: params.assignee }),
          ...(params.priority !== undefined && { priority: params.priority }),
          ...(params.status !== undefined && { status: params.status }),
          ...(params.dueDate !== undefined && {
            due_date: params.dueDate ? new Date(params.dueDate) : null,
          }),
        },
      });

      // Log status changes to activity feed
      if (params.status && params.status !== existing.status) {
        await prisma.activityFeedItem.create({
          data: {
            user_id: userId,
            workspace_id: existing.workspace_id,
            project_id: existing.project_id,
            decision_id: decisionId,
            action: params.status === "completed" ? "completed" : "updated",
            entity_type: "decision",
            entity_id: decisionId,
            entity_title: updated.title,
            description: `Status changed from "${existing.status}" to "${params.status}"`,
            metadata: {
              old_status: existing.status,
              new_status: params.status,
            },
          },
        });
      }

      return updated;
    } catch (error) {
      logger.error("Failed to update decision", {
        error: (error as Error).message,
        decisionId,
      });
      throw error;
    }
  }

  /**
   * List decisions with filtering, search, and pagination
   */
  static async list(options: ListDecisionsOptions) {
    const where: any = {
      workspace_id: options.workspaceId,
    };

    if (options.projectId) {
      where.project_id = options.projectId;
    }
    if (options.type) {
      where.type = options.type;
    }
    if (options.status) {
      where.status = options.status;
    }
    if (options.assignee) {
      where.assignee = options.assignee;
    }
    if (options.priority) {
      where.priority = options.priority;
    }
    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const [decisions, total] = await Promise.all([
      prisma.decision.findMany({
        where,
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
          project: {
            select: { id: true, title: true },
          },
          transcript: {
            select: { id: true, title: true, source: true },
          },
        },
        orderBy: [
          { priority: "desc" },
          { created_at: "desc" },
        ],
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      prisma.decision.count({ where }),
    ]);

    return { decisions, total };
  }

  /**
   * Get a single decision by ID
   */
  static async get(decisionId: string) {
    return prisma.decision.findUnique({
      where: { id: decisionId },
      include: {
        user: {
          select: { id: true, full_name: true, email: true },
        },
        project: {
          select: { id: true, title: true },
        },
        transcript: {
          select: { id: true, title: true, source: true },
        },
        activityFeed: {
          orderBy: { created_at: "desc" },
          take: 10,
        },
      },
    });
  }

  /**
   * Delete a decision
   */
  static async delete(decisionId: string, userId: string) {
    const existing = await prisma.decision.findUnique({
      where: { id: decisionId },
    });

    if (!existing) {
      throw new Error("Decision not found");
    }

    await prisma.decision.delete({
      where: { id: decisionId },
    });

    return { success: true };
  }

  /**
   * Get decision statistics for a workspace
   */
  static async getStats(workspaceId: string) {
    const [total, byType, byStatus, byPriority, overdueCount] = await Promise.all([
      prisma.decision.count({
        where: { workspace_id: workspaceId },
      }),
      prisma.decision.groupBy({
        by: ["type"],
        where: { workspace_id: workspaceId },
        _count: true,
      }),
      prisma.decision.groupBy({
        by: ["status"],
        where: { workspace_id: workspaceId },
        _count: true,
      }),
      prisma.decision.groupBy({
        by: ["priority"],
        where: { workspace_id: workspaceId },
        _count: true,
      }),
      prisma.decision.count({
        where: {
          workspace_id: workspaceId,
          status: { notIn: ["completed", "cancelled"] },
          due_date: { lt: new Date() },
        },
      }),
    ]);

    return {
      total,
      overdue: overdueCount,
      byType: byType.reduce((acc: Record<string, number>, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc: Record<string, number>, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc: Record<string, number>, item) => {
        acc[item.priority] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
