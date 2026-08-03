import { prisma } from "../lib/prisma";
import { UnifiedAIService } from "./unifiedAIService";
import logger from "../monitoring/logger";

/**
 * AutoSummaryService
 * Generates automatic summaries for workspaces, projects, and time periods.
 * Pulls context from projects, tasks, decisions, integrations, and activity feed.
 */

interface GenerateSummaryParams {
  userId: string;
  workspaceId: string;
  projectId?: string;
  summaryType: "daily" | "weekly" | "project" | "meeting" | "custom";
  title?: string;
  customPrompt?: string;
  dateRange?: { start: string; end: string };
}

interface SourceRef {
  type: string;
  id: string;
  title: string;
}

export class AutoSummaryService {
  static async generate(params: GenerateSummaryParams) {
    try {
      const context = await this.gatherContext(params);
      const summaryPrompt = this.buildPrompt(params, context);

      const response = await UnifiedAIService.processAIRequest({
        userId: params.userId,
        capability: "summarization",
        content: summaryPrompt,
        options: {
          temperature: 0.4,
          maxTokens: 2500,
        },
      });

      const content = response.result || "";

      const summary = await prisma.autoSummary.create({
        data: {
          user_id: params.userId,
          workspace_id: params.workspaceId,
          project_id: params.projectId || null,
          title:
            params.title ||
            `${this.capitalizeType(params.summaryType)} Summary - ${new Date().toLocaleDateString()}`,
          summary_type: params.summaryType,
          content,
          source_refs: context.sources as any,
        },
      });

      // Log activity
      await prisma.activityFeedItem.create({
        data: {
          user_id: params.userId,
          workspace_id: params.workspaceId,
          project_id: params.projectId || null,
          action: "created",
          entity_type: "document",
          entity_id: summary.id,
          entity_title: summary.title,
          description: `Generated ${params.summaryType} summary from ${context.sources.length} sources`,
          metadata: {
            summary_type: params.summaryType,
            source_count: context.sources.length,
          },
        },
      });

      return summary;
    } catch (error) {
      logger.error("Failed to generate summary", {
        error: (error as Error).message,
        userId: params.userId,
      });
      throw error;
    }
  }

  private static async gatherContext(params: GenerateSummaryParams) {
    const workspaceId = params.workspaceId;
    const projectId = params.projectId;

    const dateFilter: any = {};
    if (params.dateRange) {
      dateFilter.gte = new Date(params.dateRange.start);
      dateFilter.lte = new Date(params.dateRange.end);
    } else if (params.summaryType === "daily") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter.gte = today;
    } else if (params.summaryType === "weekly") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter.gte = weekAgo;
    }

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const [projects, tasks, decisions, recentActivity, transcripts] =
      await Promise.all([
        prisma.project.findMany({
          where: {
            workspace_id: workspaceId,
            ...(projectId ? { id: projectId } : {}),
            ...(hasDateFilter ? { updated_at: dateFilter } : {}),
          },
          select: {
            id: true,
            title: true,
            status: true,
            description: true,
            word_count: true,
            updated_at: true,
          },
          orderBy: { updated_at: "desc" },
          take: 10,
        }),

        prisma.workspaceTask.findMany({
          where: {
            workspace_id: workspaceId,
            ...(hasDateFilter ? { updated_at: dateFilter } : {}),
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            due_date: true,
          },
          orderBy: { updated_at: "desc" },
          take: 20,
        }),

        prisma.decision.findMany({
          where: {
            workspace_id: workspaceId,
            ...(projectId ? { project_id: projectId } : {}),
            ...(hasDateFilter ? { created_at: dateFilter } : {}),
          },
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            priority: true,
            assignee: true,
          },
          orderBy: { created_at: "desc" },
          take: 15,
        }),

        prisma.activityFeedItem.findMany({
          where: {
            workspace_id: workspaceId,
            ...(hasDateFilter ? { created_at: dateFilter } : {}),
          },
          select: {
            id: true,
            action: true,
            entity_type: true,
            entity_title: true,
            description: true,
            created_at: true,
          },
          orderBy: { created_at: "desc" },
          take: 30,
        }),

        prisma.meetingTranscript.findMany({
          where: {
            workspace_id: workspaceId,
            ...(hasDateFilter ? { created_at: dateFilter } : {}),
          },
          select: {
            id: true,
            title: true,
            summary: true,
            source: true,
            meeting_date: true,
          },
          orderBy: { created_at: "desc" },
          take: 5,
        }),
      ]);

    // Build source references
    const sources: SourceRef[] = [];
    projects.forEach((p: any) => sources.push({ type: "project", id: p.id, title: p.title }));
    decisions.forEach((d: any) => sources.push({ type: "decision", id: d.id, title: d.title }));
    transcripts.forEach((t: any) => sources.push({ type: "meeting", id: t.id, title: t.title }));

    return {
      projects,
      tasks,
      decisions,
      recentActivity,
      transcripts,
      sources,
    };
  }

  private static buildPrompt(
    params: GenerateSummaryParams,
    context: Awaited<ReturnType<typeof AutoSummaryService.gatherContext>>
  ) {
    let prompt = "";

    switch (params.summaryType) {
      case "daily":
        prompt = `Generate a DAILY SUMMARY for today. Include:\n\n`;
        break;
      case "weekly":
        prompt = `Generate a WEEKLY SUMMARY for the past 7 days. Include:\n\n`;
        break;
      case "project":
        prompt = `Generate a PROJECT SUMMARY. Include:\n\n`;
        break;
      case "meeting":
        prompt = `Generate a MEETING SUMMARY. Include:\n\n`;
        break;
      case "custom":
        prompt = params.customPrompt
          ? `${params.customPrompt}\n\n`
          : `Generate a CUSTOM SUMMARY. Include:\n\n`;
        break;
    }

    prompt += `1. **Overview** - Brief high-level summary\n`;
    prompt += `2. **Key Decisions** - Decisions that were made\n`;
    prompt += `3. **Progress** - What was accomplished\n`;
    prompt += `4. **Blockers** - Issues preventing progress\n`;
    prompt += `5. **Action Items** - Tasks that need attention\n`;
    prompt += `6. **Next Steps** - Recommended follow-ups\n\n`;

    if (context.projects.length > 0) {
      prompt += `## Projects\n`;
      context.projects.forEach((p: any) => {
        prompt += `- ${p.title} (${p.status}) - ${p.word_count} words, updated ${p.updated_at}\n`;
      });
      prompt += `\n`;
    }

    if (context.tasks.length > 0) {
      prompt += `## Tasks\n`;
      context.tasks.forEach((t: any) => {
        prompt += `- [${t.status}] ${t.title} (priority: ${t.priority}${t.due_date ? `, due: ${t.due_date}` : ""})\n`;
      });
      prompt += `\n`;
    }

    if (context.decisions.length > 0) {
      prompt += `## Decisions & Action Items\n`;
      context.decisions.forEach((d: any) => {
        prompt += `- [${d.type}] ${d.title} - ${d.status} (priority: ${d.priority}${d.assignee ? `, assigned: ${d.assignee}` : ""})\n`;
      });
      prompt += `\n`;
    }

    if (context.recentActivity.length > 0) {
      prompt += `## Recent Activity\n`;
      context.recentActivity.slice(0, 15).forEach((a: any) => {
        prompt += `- ${a.action} ${a.entity_type}: ${a.entity_title || a.description || "no details"}\n`;
      });
      prompt += `\n`;
    }

    if (context.transcripts.length > 0) {
      prompt += `## Meeting Transcripts\n`;
      context.transcripts.forEach((t: any) => {
        prompt += `- ${t.title} (${t.source})${t.summary ? `: ${t.summary.substring(0, 200)}` : ""}\n`;
      });
      prompt += `\n`;
    }

    if (params.projectId) {
      prompt += `Focus the summary on the specific project context above.\n`;
    }

    return prompt;
  }

  private static capitalizeType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  static async getSummaries(
    workspaceId: string,
    options?: {
      projectId?: string;
      summaryType?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: any = { workspace_id: workspaceId };
    if (options?.projectId) where.project_id = options.projectId;
    if (options?.summaryType) where.summary_type = options.summaryType;

    const [summaries, total] = await Promise.all([
      prisma.autoSummary.findMany({
        where,
        include: {
          user: { select: { id: true, full_name: true, email: true } },
        },
        orderBy: { generated_at: "desc" },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.autoSummary.count({ where }),
    ]);

    return { summaries, total };
  }

  static async getSummary(summaryId: string) {
    return prisma.autoSummary.findUnique({
      where: { id: summaryId },
      include: {
        user: { select: { id: true, full_name: true, email: true } },
      },
    });
  }

  static async togglePin(summaryId: string) {
    const summary = await prisma.autoSummary.findUnique({
      where: { id: summaryId },
    });

    if (!summary) throw new Error("Summary not found");

    return prisma.autoSummary.update({
      where: { id: summaryId },
      data: { is_pinned: !summary.is_pinned },
    });
  }

  static async deleteSummary(summaryId: string, userId: string) {
    const summary = await prisma.autoSummary.findUnique({
      where: { id: summaryId },
    });

    if (!summary) throw new Error("Summary not found");
    if (summary.user_id !== userId) throw new Error("Not authorized");

    await prisma.autoSummary.delete({ where: { id: summaryId } });
    return { success: true };
  }
}
