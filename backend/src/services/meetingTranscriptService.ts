import { prisma } from "../lib/prisma";
import { UnifiedAIService } from "./unifiedAIService";
import logger from "../monitoring/logger";

/**
 * MeetingTranscriptService
 * Handles ingestion, parsing, and AI-powered analysis of meeting transcripts.
 * Supports Zoom, Otter.ai, Teams, manual uploads, and external imports.
 */

interface TranscriptUploadParams {
  userId: string;
  workspaceId: string;
  title: string;
  source: string; // "zoom" | "otter" | "teams" | "manual" | "external"
  externalUrl?: string;
  content: string;
  durationMin?: number;
  participants?: string[];
  meetingDate?: string;
}

interface ExtractedItem {
  type: "decision" | "action_item" | "blocker" | "insight";
  title: string;
  description: string;
  assignee?: string;
  priority: "low" | "medium" | "high" | "urgent";
  sourceUrl?: string;
}

interface TranscriptAnalysis {
  summary: string;
  decisions: ExtractedItem[];
  actionItems: ExtractedItem[];
  blockers: ExtractedItem[];
  insights: ExtractedItem[];
}

export class MeetingTranscriptService {
  /**
   * Upload and store a meeting transcript
   */
  static async uploadTranscript(params: TranscriptUploadParams) {
    try {
      const transcript = await prisma.meetingTranscript.create({
        data: {
          user_id: params.userId,
          workspace_id: params.workspaceId,
          title: params.title,
          source: params.source,
          external_url: params.externalUrl || null,
          content: params.content,
          duration_min: params.durationMin || null,
          participants: params.participants || [],
          meeting_date: params.meetingDate
            ? new Date(params.meetingDate)
            : null,
        },
      });

      // Log activity
      await prisma.activityFeedItem.create({
        data: {
          user_id: params.userId,
          workspace_id: params.workspaceId,
          action: "created",
          entity_type: "meeting",
          entity_id: transcript.id,
          entity_title: transcript.title,
          description: `Uploaded meeting transcript from ${params.source}`,
          metadata: {
            source: params.source,
            duration_min: params.durationMin,
            participants: params.participants,
          },
        },
      });

      return transcript;
    } catch (error) {
      logger.error("Failed to upload transcript", {
        error: (error as Error).message,
        userId: params.userId,
      });
      throw error;
    }
  }

  /**
   * Analyze a transcript using AI to extract decisions, action items, blockers, and insights
   */
  static async analyzeTranscript(transcriptId: string): Promise<TranscriptAnalysis> {
    try {
      const transcript = await prisma.meetingTranscript.findUnique({
        where: { id: transcriptId },
      });

      if (!transcript) {
        throw new Error("Transcript not found");
      }

      const analysisPrompt = `Analyze the following meeting transcript and extract:
1. DECISIONS: Key decisions that were made (what was decided, who decided)
2. ACTION ITEMS: Tasks assigned to people (what needs to be done, who does it, deadline if mentioned)
3. BLOCKERS: Issues or obstacles mentioned that prevent progress
4. INSIGHTS: Notable observations, ideas, or recommendations

For each item, provide:
- title: short summary (max 100 chars)
- description: detailed explanation
- assignee: person responsible (if mentioned)
- priority: low/medium/high/urgent based on context

Meeting Title: ${transcript.title}
${transcript.participants.length > 0 ? `Participants: ${transcript.participants.join(", ")}` : ""}
${transcript.duration_min ? `Duration: ${transcript.duration_min} minutes` : ""}

Transcript Content:
${transcript.content.substring(0, 8000)}

Respond in this JSON format:
{
  "summary": "Brief meeting summary (2-3 sentences)",
  "decisions": [{"type": "decision", "title": "...", "description": "...", "priority": "medium"}],
  "actionItems": [{"type": "action_item", "title": "...", "description": "...", "assignee": "...", "priority": "high"}],
  "blockers": [{"type": "blocker", "title": "...", "description": "...", "priority": "high"}],
  "insights": [{"type": "insight", "title": "...", "description": "...", "priority": "low"}]
}`;

      const response = await UnifiedAIService.processAIRequest({
        userId: transcript.user_id,
        capability: "summarization",
        content: analysisPrompt,
        options: {
          temperature: 0.3,
          maxTokens: 3000,
        },
      });

      const content = response.result || "";

      // Parse JSON from response, handling potential markdown code blocks
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      const analysis: TranscriptAnalysis = JSON.parse(cleanedContent);

      // Update transcript with summary
      await prisma.meetingTranscript.update({
        where: { id: transcriptId },
        data: { summary: analysis.summary },
      });

      // Create Decision records for each extracted item
      const allItems: ExtractedItem[] = [
        ...analysis.decisions,
        ...analysis.actionItems,
        ...analysis.blockers,
        ...analysis.insights,
      ];

      for (const item of allItems) {
        await prisma.decision.create({
          data: {
            user_id: transcript.user_id,
            workspace_id: transcript.workspace_id,
            transcript_id: transcriptId,
            type: item.type,
            title: item.title,
            description: item.description,
            assignee: item.assignee || null,
            priority: item.priority,
            status: item.type === "blocker" ? "open" : "open",
            source_tool: "meeting",
          },
        });
      }

      // Log activity
      await prisma.activityFeedItem.create({
        data: {
          user_id: transcript.user_id,
          workspace_id: transcript.workspace_id,
          action: "decided",
          entity_type: "meeting",
          entity_id: transcriptId,
          entity_title: transcript.title,
          description: `AI extracted ${analysis.decisions.length} decisions, ${analysis.actionItems.length} action items, ${analysis.blockers.length} blockers, ${analysis.insights.length} insights`,
          metadata: {
            decisions_count: analysis.decisions.length,
            action_items_count: analysis.actionItems.length,
            blockers_count: analysis.blockers.length,
            insights_count: analysis.insights.length,
          },
        },
      });

      return analysis;
    } catch (error) {
      logger.error("Failed to analyze transcript", {
        error: (error as Error).message,
        transcriptId,
      });
      throw error;
    }
  }

  /**
   * Get all transcripts for a workspace
   */
  static async getTranscripts(
    workspaceId: string,
    options?: { limit?: number; offset?: number; source?: string }
  ) {
    const where: any = { workspace_id: workspaceId };
    if (options?.source) {
      where.source = options.source;
    }

    const [transcripts, total] = await Promise.all([
      prisma.meetingTranscript.findMany({
        where,
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
          decisions: true,
        },
        orderBy: { created_at: "desc" },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.meetingTranscript.count({ where }),
    ]);

    return { transcripts, total };
  }

  /**
   * Get a single transcript with its extracted items
   */
  static async getTranscript(transcriptId: string) {
    return prisma.meetingTranscript.findUnique({
      where: { id: transcriptId },
      include: {
        user: {
          select: { id: true, full_name: true, email: true },
        },
        decisions: {
          orderBy: { created_at: "desc" },
        },
      },
    });
  }

  /**
   * Delete a transcript
   */
  static async deleteTranscript(transcriptId: string, userId: string) {
    const transcript = await prisma.meetingTranscript.findUnique({
      where: { id: transcriptId },
    });

    if (!transcript) {
      throw new Error("Transcript not found");
    }

    if (transcript.user_id !== userId) {
      throw new Error("Not authorized to delete this transcript");
    }

    await prisma.meetingTranscript.delete({
      where: { id: transcriptId },
    });

    return { success: true };
  }
}
