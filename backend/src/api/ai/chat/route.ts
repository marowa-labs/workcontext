import { withAuth } from "../../../middleware/auth";
import logger from "../../../monitoring/logger";
import { UnifiedAIService } from "../../../services/unifiedAIService";
import { ContextEmbeddingService } from "../../../services/contextEmbeddingService";

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

    // Retrieve semantically related workspace items to ground the answer
    // ("workspace memory"): ask across the whole workspace, not just the
    // open document. Scoped to the current workspace when provided.
    const lastUserMessage =
      [...(messages || [])]
        .reverse()
        .find((m: any) => m.role === "user")?.content || "";
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

    // Process chat message through UnifiedAIService
    const result = await UnifiedAIService.processAIRequest({
      userId,
      capability: "document_qa", // Using document_qa as it's closest to chat functionality
      content: JSON.stringify(messages),
      options: {
        context,
        preferredModel: model,
        documentContent: context, // Passing context as document content
        workspaceContext,
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
