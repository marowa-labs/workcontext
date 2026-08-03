import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

/**
 * ActivityFeedService
 * Centralized activity feed that aggregates events from all sources:
 * - Internal (projects, tasks, comments, editor activity)
 * - External (Slack, Notion, Jira, GitHub, Figma via integrations)
 * - Decisions, meetings, and auto-summaries
 */

interface LogActivityParams {
  userId: string;
  workspaceId: string;
  projectId?: string;
  decisionId?: string;
  action: string;
  entityType: string;
  entityId: string;
  entityTitle?: string;
  description?: string;
  metadata?: Record<string, any>;
  visibility?: string;
}

interface ActivityFeedOptions {
  workspaceId: string;
  projectId?: string;
  userId?: string;
  entityType?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export class ActivityFeedService {
  static async log(params: LogActivityParams) {
    try {
      const item = await prisma.activityFeedItem.create({
        data: {
          user_id: params.userId,
          workspace_id: params.workspaceId,
          project_id: params.projectId || null,
          decision_id: params.decisionId || null,
          action: params.action,
          entity_type: params.entityType,
          entity_id: params.entityId,
          entity_title: params.entityTitle || null,
          description: params.description || null,
          metadata: params.metadata || undefined,
          visibility: params.visibility || "workspace",
        },
      });
      return item;
    } catch (error) {
      logger.error("Failed to log activity", {
        error: (error as Error).message,
        userId: params.userId,
      });
      return null;
    }
  }

  static async getFeed(options: ActivityFeedOptions) {
    const where: any = { workspace_id: options.workspaceId };
    if (options.projectId) where.project_id = options.projectId;
    if (options.userId) where.user_id = options.userId;
    if (options.entityType) where.entity_type = options.entityType;
    if (options.action) where.action = options.action;
    if (options.startDate || options.endDate) {
      where.created_at = {};
      if (options.startDate) where.created_at.gte = new Date(options.startDate);
      if (options.endDate) where.created_at.lte = new Date(options.endDate);
    }

    const [items, total] = await Promise.all([
      prisma.activityFeedItem.findMany({
        where,
        include: {
          user: { select: { id: true, full_name: true, email: true } },
          project: { select: { id: true, title: true } },
          decision: { select: { id: true, title: true, type: true, status: true } },
        },
        orderBy: { created_at: "desc" },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      prisma.activityFeedItem.count({ where }),
    ]);

    return { items, total };
  }

  static async getUnifiedFeed(
    workspaceId: string,
    options?: { limit?: number; offset?: number; startDate?: string; endDate?: string }
  ) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const internalWhere: any = { workspace_id: workspaceId };
    if (options?.startDate || options?.endDate) {
      internalWhere.created_at = {};
      if (options.startDate) internalWhere.created_at.gte = new Date(options.startDate);
      if (options.endDate) internalWhere.created_at.lte = new Date(options.endDate);
    }

    const [internalItems, totalInternal] = await Promise.all([
      prisma.activityFeedItem.findMany({
        where: internalWhere,
        include: {
          user: { select: { id: true, full_name: true, email: true } },
          project: { select: { id: true, title: true } },
        },
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.activityFeedItem.count({ where: internalWhere }),
    ]);

    const normalized = internalItems.map((item) => ({
      id: item.id,
      type: "internal" as const,
      action: item.action,
      entityType: item.entity_type,
      entityId: item.entity_id,
      entityTitle: item.entity_title,
      description: item.description,
      metadata: item.metadata,
      user: item.user,
      project: item.project,
      createdAt: item.created_at,
    }));

    return { items: normalized, total: totalInternal };
  }

  static async getStats(workspaceId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayCount, weekCount, monthCount, totalCount, byEntityType, byAction] =
      await Promise.all([
        prisma.activityFeedItem.count({
          where: { workspace_id: workspaceId, created_at: { gte: todayStart } },
        }),
        prisma.activityFeedItem.count({
          where: { workspace_id: workspaceId, created_at: { gte: weekStart } },
        }),
        prisma.activityFeedItem.count({
          where: { workspace_id: workspaceId, created_at: { gte: monthStart } },
        }),
        prisma.activityFeedItem.count({ where: { workspace_id: workspaceId } }),
        prisma.activityFeedItem.groupBy({
          by: ["entity_type"],
          where: { workspace_id: workspaceId },
          _count: true,
        }),
        prisma.activityFeedItem.groupBy({
          by: ["action"],
          where: { workspace_id: workspaceId },
          _count: true,
        }),
      ]);

    return {
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
      total: totalCount,
      byEntityType: byEntityType.reduce((acc: Record<string, number>, item) => {
        acc[item.entity_type] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byAction: byAction.reduce((acc: Record<string, number>, item) => {
        acc[item.action] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  static async bulkLog(items: LogActivityParams[]) {
    try {
      const result = await prisma.activityFeedItem.createMany({
        data: items.map((item) => ({
          user_id: item.userId,
          workspace_id: item.workspaceId,
          project_id: item.projectId || null,
          decision_id: item.decisionId || null,
          action: item.action,
          entity_type: item.entityType,
          entity_id: item.entityId,
          entity_title: item.entityTitle || null,
          description: item.description || null,
          metadata: item.metadata || undefined,
          visibility: item.visibility || "workspace",
        })),
        skipDuplicates: true,
      });
      return { count: result.count };
    } catch (error) {
      logger.error("Failed to bulk log activity", {
        error: (error as Error).message,
        count: items.length,
      });
      return { count: 0 };
    }
  }
}
