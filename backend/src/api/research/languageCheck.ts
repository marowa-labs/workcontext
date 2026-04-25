import { Router } from "express";
import { LanguageCheckService } from "../../services/languageCheckService";
import logger from "../../monitoring/logger";
import { withAuth } from "../../middleware/auth";

const router = Router();

/**
 * POST /api/research/language-check
 * Body: { text: string }
 */
router.post("/", withAuth, async (req: any, res: any) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Missing text for analysis",
      });
    }

    const suggestions = await LanguageCheckService.checkLanguage(text);

    return res.json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    logger.error("Error in language-check route:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze text",
    });
  }
});

export default router;
