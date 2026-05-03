import { Router } from "express";
import { UserStatsService } from "../../services/UserStatsService";
import { authenticateExpressRequest } from "../../middleware/auth";
import logger from "../../monitoring/logger";

const router = Router();

// Get user-specific stats
async function handleGetUserStats(req: any, res: any) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const range = req.query.range || "month";
    const stats = await UserStatsService.getUserStats(userId, range);

    return res.status(200).json(stats);
  } catch (error: any) {
    logger.error("Error in user stats route:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.get("/user", authenticateExpressRequest, handleGetUserStats);

export default router;
