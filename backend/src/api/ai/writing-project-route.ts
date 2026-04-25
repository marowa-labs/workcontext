import { withAuth } from "../../middleware/auth";
import logger from "../../monitoring/logger";
import { UnifiedAIService } from "../../services/unifiedAIService";

// Handle writing project assistance request
export async function POST(request: Request) {
  return withAuth(handleWritingProjectAssistance)(request);
}

async function handleWritingProjectAssistance(
  request: Request & { user?: any }
) {
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
    const {
      projectDescription,
      userRequest,
      action,
      projectType,
      researchTopic,
    } = body;

    if (!userRequest) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "User request is required",
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
      "writing_project"
    );
    if (hasLimit && remaining <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Writing project assistance limit reached. Please upgrade your plan for more assistance.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Process writing project assistance
    const result = await UnifiedAIService.processAIRequest({
      userId,
      capability: "writing_project",
      content: userRequest,
      options: {
        projectDescription,
        action,
        projectType,
        researchTopic,
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
    logger.error("Error processing writing project assistance request", {
      error: error.message,
    });
    return new Response(
      JSON.stringify({
        success: false,
        message:
          error.message ||
          "Failed to process writing project assistance request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
