import { Router, type Router as ExpressRouter } from "express";
import { authenticateExpressRequest } from "../../middleware/auth";
import logger from "../../monitoring/logger";
import { prisma } from "../../lib/prisma";
import { AIService } from "../../services/aiService";
import { SearchAggregator } from "../../services/integrations/searchAggregator";

const router: ExpressRouter = Router();

/**
 * Cross-app synthesis endpoint
 * 
 * Allows users to generate documents (PRDs, status updates, handoff docs, etc.)
 * by pulling context from multiple connected tools at once.
 * 
 * POST /api/ai/synthesize
 * Body: {
 *   prompt: string,        // e.g., "Summarize client feedback from Slack and create Jira user stories"
 *   synthesisType: string, // "prd" | "status_update" | "handoff" | "summary" | "action_items" | "custom"
 *   sourceTools?: string[],// ["slack", "jira", "github"] - optional filter
 *   projectId?: string,    // Optional project context
 *   additionalContext?: string, // Any extra text to include
 * }
 */
async function handleSynthesize(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const {
      prompt,
      synthesisType = "custom",
      sourceTools,
      projectId,
      additionalContext,
    } = req.body;

    if (!prompt || !userId) {
      return res.status(400).json({
        success: false,
        message: "prompt and userId are required",
      });
    }

    // 1. Retrieve context from connected tools
    let workspaceId: string | null = null;
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { workspace_id: true },
      });
      workspaceId = project?.workspace_id || null;
    }

    // Search connected tools for relevant content
    let searchResults: any[] = [];
    try {
      searchResults = await SearchAggregator.search({
        userId,
        query: prompt,
        workspaceId: workspaceId || undefined,
        k: 15, // Get more results for synthesis
        threshold: 0.15,
        toolTypes: sourceTools as any,
      });
    } catch (err: any) {
      logger.warn("External tool search failed for synthesis", { error: err.message });
    }

    // 2. Also get internal workspace context
    let internalResults: any[] = [];
    try {
      const { ContextEmbeddingService } = await import("../../services/contextEmbeddingService");
      internalResults = await ContextEmbeddingService.similaritySearch({
        ownerId: userId,
        workspaceId,
        query: prompt,
        k: 5,
        threshold: 0.2,
      });
    } catch (err: any) {
      logger.warn("Internal context search failed for synthesis", { error: err.message });
    }

    // 3. Build source summary for the AI prompt
    const sourceSummaries: string[] = [];
    const sourceMetadata: any[] = [];

    // Add external tool sources
    for (const result of searchResults) {
      const sourceLabel = result.source_label || result.source || "Unknown";
      const title = result.title || "Untitled";
      const content = result.content_text || result.content || "";
      const url = result.content_url || "";
      const author = result.author_name || "";
      const channel = result.channel_or_project || "";

      sourceSummaries.push(
        `[Source ${sourceMetadata.length + 1}] (${sourceLabel}${channel ? ` / ${channel}` : ""}) ${title}${author ? ` by ${author}` : ""}\n${content.slice(0, 1000)}`
      );
      sourceMetadata.push({
        source_label: sourceLabel,
        title,
        url,
        channel_or_project: channel,
        author_name: author,
        content_type: result.content_type,
      });
    }

    // Add internal sources
    for (const result of internalResults) {
      const type = result.entity_type === "project" ? "Project" : "Task";
      sourceSummaries.push(
        `[Source ${sourceMetadata.length + 1}] (Internal ${type}) ${result.title}\n${(result.content || "").slice(0, 1000)}`
      );
      sourceMetadata.push({
        source_label: `Internal ${type}`,
        title: result.title,
        url: result.entity_type === "project"
          ? `/dashboard/projects/${result.entity_id}`
          : `/dashboard/tasks`,
      });
    }

    // 4. Build synthesis-specific system prompt
    const synthesisPrompts: Record<string, string> = {
      prd: `You are a product manager creating a Product Requirements Document (PRD). 
Using the provided sources, create a structured PRD with:
- Executive Summary
- Problem Statement
- Goals & Non-Goals
- User Stories / Requirements
- Success Metrics
- Timeline Estimate
Cite specific sources with [Source N] notation when referencing information.`,
      
      status_update: `You are creating a project status update.
Using the provided sources, create a clear status update with:
- Overall Status (On Track / At Risk / Blocked)
- Key Accomplishments This Period
- Current Focus Areas
- Blockers & Risks
- Next Steps
Cite specific sources with [Source N] notation.`,
      
      handoff: `You are creating a handoff document for a team member.
Using the provided sources, create a comprehensive handoff with:
- Context & Background
- Current State
- Key Decisions Made
- Open Items & Next Steps
- Important Links & References
Cite specific sources with [Source N] notation.`,
      
      summary: `You are creating a concise summary of information from multiple sources.
Using the provided sources, create a clear summary that:
- Captures the key points from each source
- Identifies themes and patterns
- Highlights action items or decisions
- Provides a brief conclusion
Cite specific sources with [Source N] notation.`,
      
      action_items: `You are extracting action items from multiple sources.
Using the provided sources, create a structured action items list:
- Extract every action item, task, or to-do mentioned
- Assign ownership where possible (from source context)
- Note deadlines or timeframes if mentioned
- Prioritize by urgency and importance
Cite the source [Source N] for each action item.`,
      
      custom: `You are a helpful AI assistant synthesizing information from multiple connected tools.
Using the provided sources, address the user's request comprehensively.
Always cite specific sources with [Source N] notation when referencing information from the sources.`,
    };

    const systemPrompt = synthesisPrompts[synthesisType] || synthesisPrompts.custom;

    // 5. Build the full prompt
    const sourcesBlock = sourceSummaries.length > 0
      ? `\n\n## Available Sources (${sourceSummaries.length} items found)\n\n${sourceSummaries.join("\n\n---\n\n")}`
      : "\n\n## No connected tool sources were found for this query. Use your general knowledge to help the user.";

    const contextBlock = additionalContext
      ? `\n\n## Additional Context\n${additionalContext}`
      : "";

    const fullPrompt = `${systemPrompt}${sourcesBlock}${contextBlock}\n\n## User Request\n${prompt}\n\n## Output`;

    // 6. Generate with the AI
    const userRecord: any = await prisma.user.findUnique({
      where: { id: userId },
    });
    const preferredModel = userRecord?.["preferred_ai_model"] || null;

    // Use AIService to process - it handles BYOK and model selection
    const result = await AIService.processAIRequest({
      action: "synthesis",
      text: fullPrompt,
      userId,
      model: preferredModel,
    });

    // 7. Track usage
    await AIService.trackAIUsage(userId, "synthesis");

    // 8. Save to history
    await AIService.saveAIHistoryItem(userId, {
      action: "synthesis",
      originalText: prompt,
      suggestion: result.suggestion,
      isFavorite: false,
    });

    return res.status(200).json({
      success: true,
      content: result.suggestion,
      metadata: {
        synthesisType,
        sourcesUsed: sourceMetadata.length,
        sources: sourceMetadata,
      },
    });
  } catch (error: any) {
    logger.error("Error in synthesis:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.post(
  "/synthesize",
  authenticateExpressRequest,
  handleSynthesize,
);

export default router;
