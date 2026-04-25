import { Router, Request, Response } from "express";
import multer from "multer";
import { CitationStyleAnalysisService } from "../../services/citationStyleAnalysisService";
import { SmartCitationService } from "../../services/smartCitationService";
import logger from "../../monitoring/logger";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/citations/analysis/pdf
 * Analyze citation style from an uploaded PDF
 */
router.post(
  "/analysis/pdf",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      logger.info("Analyzing citation style from uploaded PDF", {
        userId,
        fileName: req.file.originalname,
      });

      const analysis = await CitationStyleAnalysisService.analyzePdfStyle(
        req.file.buffer,
      );

      return res.json({
        success: true,
        analysis,
      });
    } catch (error: any) {
      logger.error("Error analyzing PDF style via API", {
        error: error.message,
      });
      return res.status(500).json({
        error: "Failed to analyze paper style",
        message: error.message,
      });
    }
  },
);

/**
 * POST /api/citations/analysis/url
 * Analyze citation style from a remote URL
 */
router.post("/analysis/url", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    logger.info("Analyzing citation style from URL", { userId, url });

    const analysis =
      await CitationStyleAnalysisService.analyzeRemotePaperStyle(url);

    return res.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    logger.error("Error analyzing remote paper style via API", {
      error: error.message,
    });
    return res.status(500).json({
      error: "Failed to analyze paper style",
      message: error.message,
    });
  }
});

/**
 * POST /api/citations/analysis/smart-check
 * Analyze citations for retractions and smart metrics
 */
router.post("/analysis/smart-check", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { citations } = req.body;

    if (!Array.isArray(citations)) {
      return res.status(400).json({ error: "Citations array is required" });
    }

    logger.info("Running smart citation check", {
      userId,
      citationCount: citations.length,
    });

    const metrics = await SmartCitationService.analyzeCitations(citations);

    return res.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    logger.error("Error in smart citation check API", {
      error: error.message,
    });
    return res.status(500).json({
      error: "Failed to run smart citation check",
      message: error.message,
    });
  }
});

export default router;
