// AI Actions Cancel API
// Endpoint for cancelling pending actions

import { withAuth } from "../../../../middleware/auth";
import logger from "../../../../monitoring/logger";
import { AIActionService } from "../../../../services/aiActionService";

export async function POST(request: Request) {
  return withAuth(handleCancel)(request);
}

async function handleCancel(request: Request & { user?: any }) {
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
    const { actionId } = body;

    if (!actionId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Action ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Cancel the action
    const result = await AIActionService.cancelAction(actionId);

    return new Response(
      JSON.stringify({
        success: result.type !== "error",
        ...result,
      }),
      {
        status: result.type === "error" ? 400 : 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    logger.error("Error cancelling AI action:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to cancel action",
        type: "error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
