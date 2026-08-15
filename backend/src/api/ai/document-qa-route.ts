import { withAuth } from "../../middleware/auth";
import logger from "../../monitoring/logger";
import { UnifiedAIService } from "../../services/unifiedAIService";
import { SearchAggregator } from "../../services/integrations/searchAggregator";
import { ContextEmbeddingService } from "../../services/contextEmbeddingService";

// Handle document Q&A request
export async function POST(request: Request) {
  return withAuth(handleDocumentQA)(request);
}

async function handleDocumentQA(request: Request & { user?: any }) {
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
        },
      );
    }

    const body = await request.json();
    const { documentContent, question, model } = body;

    if (!documentContent || !question) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Document content and question are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check usage limit
    const { hasLimit, remaining } = await UnifiedAIService.checkUsageLimit(
      userId,
      "document_qa",
    );
    if (hasLimit && remaining <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Document Q&A limit reached. Please upgrade your plan for more questions.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Retrieve semantically related workspace items AND connected external tool
    // content so the AI can answer questions that span the document + integrations
    let workspaceContext: any[] = [];
    try {
      const [internalResults, externalResults] = await Promise.allSettled([
        ContextEmbeddingService.similaritySearch({
          ownerId: userId,
          query: question,
          k: 4,
          threshold: 0.2,
        }),
        SearchAggregator.search({
          userId,
          query: question,
          k: 6,
          threshold: 0.2,
        }),
      ]);

      if (internalResults.status === "fulfilled") {
        workspaceContext.push(
          ...internalResults.value.map((r: any) => ({
            source: "internal",
            source_label: r.entity_type === "project" ? "Project" : "Task",
            entity_type: r.entity_type,
            title: r.title,
            content: r.content,
            url:
              r.entity_type === "project"
                ? `/dashboard/projects/${r.entity_id}`
                : `/dashboard/tasks`,
            similarity: r.similarity,
          })),
        );
      }
      if (externalResults.status === "fulfilled") {
        workspaceContext.push(
          ...externalResults.value.map((r: any) => ({
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
        );
      }
      workspaceContext.sort((a: any, b: any) => b.similarity - a.similarity);
      workspaceContext = workspaceContext.slice(0, 8);
    } catch (ctxErr: any) {
      logger.warn("Document QA context retrieval failed", {
        error: ctxErr.message,
      });
    }

    // Process document Q&A
    const result = await UnifiedAIService.processAIRequest({
      userId,
      capability: "document_qa",
      content: question,
      options: {
        documentContent,
        preferredModel: model,
        workspaceContext,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        result: result.result,
        tokensUsed: result.tokensUsed,
        cost: result.cost,
        modelUsed: result.modelUsed,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error processing document Q&A request", {
      error: error.message,
    });
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to process document Q&A request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
