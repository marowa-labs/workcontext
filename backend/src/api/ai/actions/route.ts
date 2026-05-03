// AI Actions API Routes
// Endpoints for processing AI actions

import { Router } from "express";
import { authenticateExpressRequest } from "../../../middleware/auth";
import logger from "../../../monitoring/logger";
import { AIActionService } from "../../../services/aiActionService";

const router = Router();

/**
 * Handle AI action processing
 */
async function handlePostAction(req: any, res: any) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const {
      message,
      sessionId,
      pageContext,
      pageDescription,
      pageRoute,
      pageSection,
      entityId,
      currentWorkspaceId,
      currentProjectId,
      conversationHistory,
      autoConfirm,
    } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Process the action with full page context
    const result = await AIActionService.processMessage({
      message,
      userId,
      sessionId,
      pageContext,
      pageDescription,
      pageRoute,
      pageSection,
      entityId,
      currentWorkspaceId,
      currentProjectId,
      conversationHistory,
      autoConfirm,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    logger.error("Error processing AI action:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process action",
      type: "error",
    });
  }
}

/**
 * Get user's action history and pending actions
 */
async function handleGetActions(req: any, res: any) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const type = req.query.type || "pending";
    const limit = parseInt(req.query.limit || "50");

    let result;
    if (type === "pending") {
      result = await AIActionService.getPendingActions(userId);
    } else {
      result = await AIActionService.getActionHistory(userId, limit);
    }

    return res.status(200).json({
      success: true,
      actions: result,
    });
  } catch (error: any) {
    logger.error("Error getting AI actions:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get actions",
    });
  }
}

// POST /api/ai/actions - Process AI action
router.post("/", authenticateExpressRequest, handlePostAction);

// GET /api/ai/actions - Get action history/pending actions
router.get("/", authenticateExpressRequest, handleGetActions);

export default router;
