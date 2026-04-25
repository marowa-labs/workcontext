import { Router, type Router as ExpressRouter } from "express";
import { SearchService } from "../../services/searchService";
import logger from "../../monitoring/logger";
import { authenticateExpressRequest } from "../../middleware/auth";

const router: ExpressRouter = Router();

// Perform a web search
export async function handlePostWebSearch(req: any, res: any) {
  try {
    const body = req.body;
    const userId = req.user?.id;
    const { query, maxResults } = body;

    if (!userId || !query) {
      return res.status(400).json({
        success: false,
        message: "User ID and query are required",
      });
    }

    // Perform web search
    const results = await SearchService.webSearch(userId, query, maxResults);

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error: any) {
    logger.error("Error performing web search:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.post("/web", authenticateExpressRequest, handlePostWebSearch);

// Perform a deep search
export async function handlePostDeepSearch(req: any, res: any) {
  try {
    const body = req.body;
    const userId = req.user?.id;
    const { query, sources } = body;

    if (!userId || !query || !sources || !Array.isArray(sources)) {
      return res.status(400).json({
        success: false,
        message: "User ID, query, and sources array are required",
      });
    }

    // Perform deep search
    const results = await SearchService.deepSearch(userId, query, sources);

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error: any) {
    logger.error("Error performing deep search:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.post("/deep", authenticateExpressRequest, handlePostDeepSearch);

// Analyze search results
export async function handlePostAnalyzeSearchResults(req: any, res: any) {
  try {
    const body = req.body;
    const userId = req.user?.id;
    const { query, results } = body;

    if (!userId || !query || !results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        message: "User ID, query, and results array are required",
      });
    }

    // Analyze search results
    const analysis = await SearchService.analyzeSearchResults(
      userId,
      query,
      results
    );

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    logger.error("Error analyzing search results:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.post(
  "/analyze",
  authenticateExpressRequest,
  handlePostAnalyzeSearchResults
);

export default router;
