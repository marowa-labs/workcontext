import { authenticateExpressRequest, withAuth } from "../../middleware/auth";
import logger from "../../monitoring/logger";
import { UnifiedAIService } from "../../services/unifiedAIService";
import express, {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";

// Express.js compatible handler
export async function handleGrammarCheckExpress(
  req: ExpressRequest,
  res: ExpressResponse
) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { text, model } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Text content is required",
      });
    }

    // Check usage limit
    const { hasLimit, remaining } = await UnifiedAIService.checkUsageLimit(
      userId,
      "grammar_check"
    );
    if (hasLimit && remaining <= 0) {
      return res.status(429).json({
        success: false,
        message:
          "Grammar check limit reached. Please upgrade your plan for more checks.",
      });
    }

    // Process grammar check
    // Mark as automatic since this is initiated by the system for real-time checking
    const result = await UnifiedAIService.processAIRequest({
      userId,
      capability: "grammar_check",
      content: text,
      options: { preferredModel: model, isAutomatic: true },
    });

    return res.status(200).json({
      success: true,
      result: result.result,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    logger.error("Error processing grammar check request", {
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process grammar check request",
    });
  }
}

// Express.js route setup
export function setupGrammarRoute(app: any) {
  app.post(
    "/api/ai/grammar",
    authenticateExpressRequest,
    handleGrammarCheckExpress
  );
}

// Handle grammar checking request (for Next.js API routes)
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

    // Check usage limit
    const { hasLimit, remaining } = await UnifiedAIService.checkUsageLimit(
      userId,
      "grammar_check"
    );
    if (hasLimit && remaining <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Grammar check limit reached. Please upgrade your plan for more checks.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Process grammar check
    // Mark as automatic since this is initiated by the system for real-time checking
    const result = await UnifiedAIService.processAIRequest({
      userId,
      capability: "grammar_check",
      content: text,
      options: { preferredModel: model, isAutomatic: true },
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

// Handle grammar checking request for Next.js API routes
export async function POST(request: Request) {
  return withAuth(handleGrammarCheck)(request);
}
