import { Router, type Request, type Response } from "express";
import { authenticateExpressRequest } from "../../middleware/auth";
import { ResearchCoPilotService } from "../../services/researchCoPilotService";
import { PaperRecommendationService } from "../../services/paperRecommendationService";
import logger from "../../monitoring/logger";

const router = Router();

/**
 * POST /api/ai/research-copilot/chat
 * Main research chat with document context
 */
router.post(
  "/chat",
  authenticateExpressRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { prompt, documentContext, options } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      if (!documentContext || !documentContext.projectId) {
        return res
          .status(400)
          .json({ error: "Document context with projectId is required" });
      }

      logger.info("Research co-pilot chat request", {
        userId,
        projectId: documentContext.projectId,
        mode: options?.mode || "research",
      });

      const result = await ResearchCoPilotService.generateWithContext(
        prompt,
        documentContext,
        userId,
        options || {},
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error("Error in research co-pilot chat:", error);
      return res.status(500).json({
        error: error.message || "Failed to process chat request",
      });
    }
  },
);

/**
 * POST /api/ai/research-copilot/suggest-citations
 * Get citation suggestions for text
 */
router.post(
  "/suggest-citations",
  authenticateExpressRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { text, documentContext } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      if (!documentContext || !documentContext.projectId) {
        return res.status(400).json({ error: "Document context is required" });
      }

      logger.info("Citation suggestion request", {
        userId,
        textLength: text.length,
      });

      const suggestions = await ResearchCoPilotService.suggestCitations(
        text,
        documentContext,
        userId,
      );

      return res.json({
        success: true,
        data: suggestions,
      });
    } catch (error: any) {
      logger.error("Error suggesting citations:", error);
      return res.status(500).json({
        error: error.message || "Failed to suggest citations",
      });
    }
  },
);

/**
 * POST /api/ai/research-copilot/recommend-papers
 * Get paper recommendations
 */
router.post(
  "/recommend-papers",
  authenticateExpressRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { topic, existingCitations, limit } = req.body;

      if (!topic) {
        return res.status(400).json({ error: "Topic is required" });
      }

      logger.info("Paper recommendation request", { userId, topic });

      const papers = await ResearchCoPilotService.recommendPapers(
        topic,
        existingCitations || [],
        limit || 10,
      );

      return res.json({
        success: true,
        data: papers,
      });
    } catch (error: any) {
      logger.error("Error recommending papers:", error);
      return res.status(500).json({
        error: error.message || "Failed to recommend papers",
      });
    }
  },
);

/**
 * POST /api/ai/research-copilot/analyze-gaps
 * Analyze literature gaps
 */
router.post(
  "/analyze-gaps",
  authenticateExpressRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { documentContext } = req.body;

      if (!documentContext || !documentContext.projectId) {
        return res.status(400).json({ error: "Document context is required" });
      }

      logger.info("Literature gap analysis request", {
        userId,
        projectId: documentContext.projectId,
      });

      const gaps = await ResearchCoPilotService.analyzeGaps(
        documentContext,
        userId,
      );

      return res.json({
        success: true,
        data: gaps,
      });
    } catch (error: any) {
      logger.error("Error analyzing gaps:", error);
      return res.status(500).json({
        error: error.message || "Failed to analyze literature gaps",
      });
    }
  },
);

/**
 * POST /api/ai/research-copilot/check-plagiarism
 * Check for plagiarism
 */
router.post(
  "/check-plagiarism",
  authenticateExpressRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { text, sourcePapers } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      logger.info("Plagiarism check request", {
        userId,
        textLength: text.length,
      });

      const result = await ResearchCoPilotService.checkPlagiarism(
        text,
        sourcePapers || [],
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error("Error checking plagiarism:", error);
      return res.status(500).json({
        error: error.message || "Failed to check plagiarism",
      });
    }
  },
);

/**
 * POST /api/ai/research-copilot/verify-claims
 * Verify claims in text
 */
router.post(
  "/verify-claims",
  authenticateExpressRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { text, projectId, options } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      logger.info("Claim verification request", {
        userId,
        projectId,
        textLength: text.length,
        options,
      });

      const claims = await ResearchCoPilotService.verifyClaims(
        text,
        projectId,
        userId,
        options,
      );

      return res.json({
        success: true,
        data: claims,
      });
    } catch (error: any) {
      logger.error("Error verifying claims:", error);
      return res.status(500).json({
        error: error.message || "Failed to verify claims",
      });
    }
  },
);

/**
 * GET /api/ai/research-copilot/paper/:paperId
 * Get paper details
 */
router.get(
  "/paper/:paperId",
  authenticateExpressRequest,
  async (req: Request, res: Response) => {
    try {
      const paperId = Array.isArray(req.params.paperId)
        ? req.params.paperId[0]
        : req.params.paperId;

      if (!paperId) {
        return res.status(400).json({ error: "Paper ID is required" });
      }

      const paper = await PaperRecommendationService.getPaperDetails(paperId);

      if (!paper) {
        return res.status(404).json({ error: "Paper not found" });
      }

      return res.json({
        success: true,
        data: paper,
      });
    } catch (error: any) {
      logger.error("Error getting paper details:", error);
      return res.status(500).json({
        error: error.message || "Failed to get paper details",
      });
    }
  },
);

/**
 * GET /api/ai/research-copilot/paper/:paperId/related
 * Get related papers
 */
router.get(
  "/paper/:paperId/related",
  authenticateExpressRequest,
  async (req: Request, res: Response) => {
    try {
      const paperId = Array.isArray(req.params.paperId)
        ? req.params.paperId[0]
        : req.params.paperId;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!paperId) {
        return res.status(400).json({ error: "Paper ID is required" });
      }

      const papers = await PaperRecommendationService.getRelatedPapers(
        paperId,
        limit,
      );

      return res.json({
        success: true,
        data: papers,
      });
    } catch (error: any) {
      logger.error("Error getting related papers:", error);
      return res.status(500).json({
        error: error.message || "Failed to get related papers",
      });
    }
  },
);

export default router;
