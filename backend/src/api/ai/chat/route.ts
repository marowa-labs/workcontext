import { withAuth } from "../../../middleware/auth";
import logger from "../../../monitoring/logger";
import { UnifiedAIService } from "../../../services/unifiedAIService";
import { ContextEmbeddingService } from "../../../services/contextEmbeddingService";
import { SearchAggregator, UnifiedSearchResult } from "../../../services/integrations/searchAggregator";

export async function POST(request: Request) {
  return withAuth(handleChat)(request);
}

async function handleChat(request: Request & { user?: any }) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "User not authenticated",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const { messages, context, model } = body;

    // Retrieve semantically related workspace items AND connected tool content
    // to ground the answer ("workspace memory").
    const lastUserMessage =
      [...(messages || [])]
        .reverse()
        .find((m: any) => m.role === "user")?.content || "";

    // 1) Internal workspace embeddings
    const workspaceContext = await ContextEmbeddingService.similaritySearch({
      ownerId: userId,
      workspaceId: (context as any)?.workspaceId || null,
      query: lastUserMessage,
      k: 4,
      threshold: 0.2,
    }).catch((err) => {
      logger.warn("Workspace context retrieval failed", { error: err.message });
      return [];
    });

    // 2) External tool content
    const externalResults = await SearchAggregator.search({
      userId,
      query: lastUserMessage,
      workspaceId: (context as any)?.workspaceId || undefined,
      k: 6,
      threshold: 0.2,
    }).catch((err) => {
      logger.warn("External tool search failed", { error: err.message });
      return [];
    });

    // Combine and format for AI context
    const combinedContext = [
      ...workspaceContext.map((r: any) => ({
        source: "internal",
        source_label: r.entity_type === "project" ? "Project" : "Task",
        entity_type: r.entity_type,
        title: r.title,
        content: r.content,
        url: r.entity_type === "project" ? `/dashboard/projects/${r.entity_id}` : `/dashboard/tasks`,
        similarity: r.similarity,
      })),
      ...externalResults.map((r) => ({
        source: r.source,
        source_label: r.source_label,
        entity_type: r.content_type,
        title: r.title,
        content: r.content_text,
        url: r.content_url,
        similarity: r.similarity,
        channel_or_project: r.channel_or_project,
        author_name: r.author_name,
      })),
    ].sort((a: any, b: any) => b.similarity - a.similarity)
     .slice(0, 8);

    // Process chat message through UnifiedAIService
    const result = await UnifiedAIService.processAIRequest({
      userId,
      capability: "document_qa", // Using document_qa as it's closest to chat functionality
      content: JSON.stringify(messages),
      options: {
        context,
        preferredModel: model,
        documentContent: context, // Passing context as document content
        workspaceContext: combinedContext,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        text: result.result,
        tokensUsed: result.tokensUsed,
        cost: result.cost,
        modelUsed: result.modelUsed,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    logger.error("Error processing chat request", {
      error: error.message,
    });
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to process chat request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
