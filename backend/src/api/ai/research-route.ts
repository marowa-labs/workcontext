import { Router, type Router as ExpressRouter } from "express";
import { authenticateExpressRequest } from "../../middleware/auth";
import logger from "../../monitoring/logger";
import { SearchService } from "../../services/searchService";
import { getSupabaseClient } from "../../lib/supabase/client";

const router: ExpressRouter = Router();

// Get recent research topics
async function handleGetRecentResearchTopics(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { limit } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const topics = await SearchService.getRecentResearchTopics(
      userId,
      limit ? parseInt(limit as string) : 10
    );

    return res.status(200).json({
      success: true,
      topics,
    });
  } catch (error: any) {
    logger.error("Error fetching recent research topics:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.get(
  "/topics",
  authenticateExpressRequest,
  handleGetRecentResearchTopics
);

// Save research topic
async function handlePostSaveResearchTopic(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { title, description, sources, sourcesData } = req.body;

    if (!userId || !title) {
      return res.status(400).json({
        success: false,
        message: "User ID and title are required",
      });
    }

    const topic = await SearchService.saveResearchTopic(
      userId,
      title,
      description || "",
      sources || 0,
      sourcesData || []
    );

    return res.status(200).json({
      success: true,
      topic,
    });
  } catch (error: any) {
    logger.error("Error saving research topic:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.post("/topics", authenticateExpressRequest, handlePostSaveResearchTopic);

// Get research sources for a topic
async function handleGetResearchSources(req: any, res: any) {
  try {
    const { topicId } = req.params;

    if (!topicId) {
      return res.status(400).json({
        success: false,
        message: "Topic ID is required",
      });
    }

    const sources = await SearchService.getResearchSources(topicId);

    return res.status(200).json({
      success: true,
      sources,
    });
  } catch (error: any) {
    logger.error("Error fetching research sources:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.get(
  "/topics/:topicId/sources",
  authenticateExpressRequest,
  handleGetResearchSources
);

export default router;
