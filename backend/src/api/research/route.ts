import { Request, Response } from "express";
import { PaperDiscoveryService } from "../../services/paperDiscoveryService";
import { CitationConfidenceService } from "../../services/citationConfidenceService";
import logger from "../../monitoring/logger";

// GET /api/research/search
export async function SEARCH_PAPERS(req: Request, res: Response) {
  try {
    const query = req.query.q as string;
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const results = await PaperDiscoveryService.searchPapers(
      query,
      offset,
      limit,
    );
    return res.json({ data: results });
  } catch (error: any) {
    logger.error("Error searching papers:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}

// GET /api/research/:paperId
export async function GET_PAPER_DETAILS(req: Request, res: Response) {
  try {
    const { paperId } = req.params;
    if (!paperId || typeof paperId !== "string") {
      return res.status(400).json({ error: "Paper ID is required" });
    }

    const details = await PaperDiscoveryService.getPaperDetails(paperId);
    if (!details) {
      return res.status(404).json({ error: "Paper not found" });
    }

    // Calculate citation confidence metadata
    // We treat the "paper" as having 1 citation (itself) for the mock context,
    // or if we had references we would use them.
    // Ideally PaperDiscoveryService.getPaperDetails returns references.
    // For MVP, if references aren't available, we calculate a score based on the paper metadata itself.
    const mockCitations = [
      {
        id: details.externalId,
        title: details.title,
        author: details.authors[0]?.name || "Unknown",
        year: details.year || new Date().getFullYear(),
        type: "journal-article",
        citationCount: details.citationCount || 0,
      },
    ];

    const confidenceScore = CitationConfidenceService.calculateConfidenceScore(
      mockCitations,
      5000, // mock text length
      "default",
    );

    return res.json({ data: { ...details, confidenceScore } });
  } catch (error: any) {
    logger.error("Error getting paper details:", error);

    if (error.message && error.message.includes("429")) {
      return res
        .status(429)
        .json({
          error:
            "Too many requests to Semantic Scholar API. Please try again later.",
        });
    }

    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}

// POST /api/research/library/save
export async function SAVE_TO_LIBRARY(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { paper, notes } = req.body;
    if (!paper || !paper.externalId) {
      return res.status(400).json({ error: "Valid paper object is required" });
    }

    const saved = await PaperDiscoveryService.savePaperToLibrary(
      userId,
      paper,
      notes,
    );
    return res.json({ success: true, data: saved });
  } catch (error: any) {
    logger.error("Error saving paper:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}

// GET /api/research/library
export async function GET_LIBRARY(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const library = await PaperDiscoveryService.getUserLibrary(userId);
    return res.json({ data: library });
  } catch (error: any) {
    logger.error("Error fetching library:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}

// DELETE /api/research/library/:paperId
export async function DELETE_FROM_LIBRARY(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { paperId } = req.params;
    if (!paperId) {
      return res.status(400).json({ error: "Paper ID is required" });
    }

    await PaperDiscoveryService.removePaperFromLibrary(
      userId,
      paperId as string,
    );
    return res.json({ success: true });
  } catch (error: any) {
    logger.error("Error removing paper from library:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
