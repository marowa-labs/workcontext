// AI Actions API Routes
// Endpoints for processing AI actions

import { withAuth } from "../../../middleware/auth";
import logger from "../../../monitoring/logger";
import { AIActionService } from "../../../services/aiActionService";

export async function POST(request: Request) {
  return withAuth(handleAction)(request);
}

export async function GET(request: Request) {
  return withAuth(handleGetActions)(request);
}

/**
 * Handle AI action processing
 */
async function handleAction(request: Request & { user?: any }) {
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
      message,
      sessionId,
      pageContext,
      currentWorkspaceId,
      currentProjectId,
      conversationHistory,
      autoConfirm,
    } = body;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Message is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Process the action
    const result = await AIActionService.processMessage({
      message,
      userId,
      sessionId,
      pageContext,
      currentWorkspaceId,
      currentProjectId,
      conversationHistory,
      autoConfirm,
    });

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    logger.error("Error processing AI action:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to process action",
        type: "error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Get user's action history and pending actions
 */
async function handleGetActions(request: Request & { user?: any }) {
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

    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "pending";
    const limit = parseInt(url.searchParams.get("limit") || "50");

    let result;
    if (type === "pending") {
      result = await AIActionService.getPendingActions(userId);
    } else {
      result = await AIActionService.getActionHistory(userId, limit);
    }

    return new Response(
      JSON.stringify({
        success: true,
        actions: result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    logger.error("Error getting AI actions:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to get actions",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
