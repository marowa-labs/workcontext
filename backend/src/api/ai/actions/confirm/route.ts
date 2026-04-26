// AI Actions Confirmation API
// Endpoint for confirming pending actions

import { withAuth } from "../../../../middleware/auth";
import logger from "../../../../monitoring/logger";
import { AIActionService } from "../../../../services/aiActionService";

export async function POST(request: Request) {
  return withAuth(handleConfirm)(request);
}

async function handleConfirm(request: Request & { user?: any }) {
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

    // Confirm and execute the action
    const result = await AIActionService.confirmAction(actionId, userId);

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
    logger.error("Error confirming AI action:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to confirm action",
        type: "error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
