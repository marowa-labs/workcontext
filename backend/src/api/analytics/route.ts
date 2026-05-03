import { Router } from "express";
import { PlatformAnalyticsService } from "../../services/PlatformAnalyticsService";
import { authenticateExpressRequest } from "../../middleware/auth";
import logger from "../../monitoring/logger";

const router = Router();

// Get platform-wide analytics
async function handleGetPlatformAnalytics(req: any, res: any) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const range = req.query.range || "30d";
    const analytics = await PlatformAnalyticsService.getPlatformAnalytics(range);

    return res.status(200).json(analytics);
  } catch (error: any) {
    logger.error("Error in platform analytics route:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.get("/platform", authenticateExpressRequest, handleGetPlatformAnalytics);

export default router;
