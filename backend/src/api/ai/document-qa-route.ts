import { withAuth } from "../../middleware/auth";
import logger from "../../monitoring/logger";
import { UnifiedAIService } from "../../services/unifiedAIService";

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
        }
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
        }
      );
    }

    // Check usage limit
    const { hasLimit, remaining } = await UnifiedAIService.checkUsageLimit(
      userId,
      "document_qa"
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
        }
      );
    }

    // Process document Q&A
    const result = await UnifiedAIService.processAIRequest({
      userId,
      capability: "document_qa",
      content: question,
      options: {
        documentContent,
        preferredModel: model,
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
      }
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
      }
    );
  }
}
