import { withAuth } from "../../middleware/auth";
import logger from "../../monitoring/logger";
import { UnifiedAIService } from "../../services/unifiedAIService";

// Handle document summarization request
export async function POST(request: Request) {
  return withAuth(handleDocumentSummarization)(request);
}

async function handleDocumentSummarization(request: Request & { user?: any }) {
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
    const { content, summaryType } = body;

    if (!content) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Document content is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check usage limit
    const { hasLimit, remaining } = await UnifiedAIService.checkUsageLimit(
      userId,
      "summarization"
    );
    if (hasLimit && remaining <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Summarization limit reached. Please upgrade your plan for more summaries.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Process document summarization
    const result = await UnifiedAIService.processAIRequest({
      userId,
      capability: "summarization",
      content: content,
      options: { summaryType },
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
      }
    );
  } catch (error: any) {
    logger.error("Error processing document summarization request", {
      error: error.message,
    });
    return new Response(
      JSON.stringify({
        success: false,
        message:
          error.message || "Failed to process document summarization request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
