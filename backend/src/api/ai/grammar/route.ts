import { withAuth } from "../../../middleware/auth";
import logger from "../../../monitoring/logger";
import { UnifiedAIService } from "../../../services/unifiedAIService";

export async function POST(request: Request) {
  return withAuth(handleGrammarCheck)(request);
}

async function handleGrammarCheck(request: Request & { user?: any }) {
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
    const { text, model } = body;

    if (!text) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Text content is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Process grammar check through UnifiedAIService
    const result = await UnifiedAIService.processAIRequest({
      userId,
      capability: "grammar_check",
      content: text,
      options: { preferredModel: model },
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
    logger.error("Error processing grammar check request", {
      error: error.message,
    });
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to process grammar check request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
