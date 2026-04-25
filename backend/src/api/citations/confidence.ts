import { Router, Request, Response } from "express";
import { CitationConfidenceService } from "../../services/citationConfidenceService";
import { CitationLogicService } from "../../services/citationLogicService";
import logger from "../../monitoring/logger";

const router = Router();

/**
 * POST /api/citations/analyze-confidence
 * Analyze confidence score for project citations
 */
router.post("/analyze-confidence", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { projectId, field } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    logger.info("Analyzing citation confidence", { userId, projectId, field });

    const analysis = await CitationConfidenceService.analyzeProjectCitations(
      projectId,
      userId,
      field || "default",
    );

    return res.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    logger.error("Error analyzing citation confidence", {
      error: error.message,
    });
    return res.status(500).json({
      error: "Failed to analyze citations",
      message: error.message,
    });
  }
});

/**
 * POST /api/citations/validate-claim
 * Validate if a claim matches the cited source
 */
router.post("/validate-claim", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { claim, citationDOI } = req.body;

    if (!claim || !citationDOI) {
      return res
        .status(400)
        .json({ error: "Claim and citation DOI are required" });
    }

    logger.info("Validating claim against citation", {
      userId,
      claim,
      citationDOI,
    });

    const validation = await CitationLogicService.validateClaimAgainstCitation(
      claim,
      citationDOI,
    );

    return res.json({
      success: true,
      validation,
    });
  } catch (error: any) {
    logger.error("Error validating claim", { error: error.message });
    return res.status(500).json({
      error: "Failed to validate claim",
      message: error.message,
    });
  }
});

/**
 * POST /api/citations/batch-validate
 * Validate multiple claims at once
 */
router.post("/batch-validate", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { claims } = req.body;

    if (!Array.isArray(claims) || claims.length === 0) {
      return res.status(400).json({ error: "Claims array is required" });
    }

    logger.info("Batch validating claims", { userId, count: claims.length });

    const validations =
      await CitationLogicService.validateMultipleClaims(claims);

    return res.json({
      success: true,
      validations,
    });
  } catch (error: any) {
    logger.error("Error in batch validation", { error: error.message });
    return res.status(500).json({
      error: "Failed to validate claims",
      message: error.message,
    });
  }
});

export default router;
