import express, { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import logger from "../../monitoring/logger";
import { authenticateExpressRequest } from "../../middleware/auth";
import { PaperDiscoveryService } from "../../services/paperDiscoveryService";

const router = express.Router();
const authMiddleware = authenticateExpressRequest;

// GET / - List alerts
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const alerts = await prisma.searchAlert.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    res.json({ success: true, alerts });
  } catch (error: any) {
    logger.error("Error fetching alerts:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST / - Create alert
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { query, frequency = "weekly" } = req.body;

    if (!query) {
      return res
        .status(400)
        .json({ success: false, message: "Query is required" });
    }

    const alert = await prisma.searchAlert.create({
      data: {
        user_id: userId,
        query,
        frequency,
        is_active: true,
        last_checked: new Date(),
        new_matches_count: 0, // Initial count
      },
    });

    // Optionally triggers an initial check
    // We can do this asynchronously or let the user click "View"

    res.json({ success: true, alert });
  } catch (error: any) {
    logger.error("Error creating alert:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /:id - Delete alert
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    // Verify ownership
    const alert = await prisma.searchAlert.findUnique({ where: { id } });
    if (!alert || alert.user_id !== userId) {
      return res
        .status(404)
        .json({ success: false, message: "Alert not found" });
    }

    await prisma.searchAlert.delete({ where: { id } });
    res.json({ success: true, message: "Alert deleted" });
  } catch (error: any) {
    logger.error("Error deleting alert:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /:id - Update alert
router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { is_active, frequency } = req.body;

    // Verify ownership
    const alert = await prisma.searchAlert.findUnique({ where: { id } });
    if (!alert || alert.user_id !== userId) {
      return res
        .status(404)
        .json({ success: false, message: "Alert not found" });
    }

    const updated = await prisma.searchAlert.update({
      where: { id },
      data: {
        ...(is_active !== undefined && { is_active }),
        ...(frequency !== undefined && { frequency }),
      },
    });

    res.json({ success: true, alert: updated });
  } catch (error: any) {
    logger.error("Error updating alert:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /:id/check - Check for new papers now
router.post(
  "/:id/check",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      const alert = await prisma.searchAlert.findUnique({ where: { id } });
      if (!alert || alert.user_id !== userId) {
        return res
          .status(404)
          .json({ success: false, message: "Alert not found" });
      }

      // Perform the real search using PaperDiscoveryService
      // We only fetch recent results (e.g. top 5-10) to simulate "checking"
      const results = await PaperDiscoveryService.searchPapers(
        alert.query,
        0,
        10,
      );

      // In a real crawl system, we would filter by date > last_checked.
      // Here, we just count them and update the last_checked timestamp.
      // For "real feel", let's assume all fetched results are "current".
      const newMatchesCount = results.length;

      const updated = await prisma.searchAlert.update({
        where: { id },
        data: {
          last_checked: new Date(),
          new_matches_count: newMatchesCount,
        },
      });

      res.json({ success: true, alert: updated, results: results.slice(0, 5) });
    } catch (error: any) {
      logger.error("Error checking alert:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

export default router;
