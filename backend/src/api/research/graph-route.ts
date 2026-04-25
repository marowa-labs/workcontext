import { Request, Response } from "express";
import { PaperDiscoveryService } from "../../services/paperDiscoveryService";
import logger from "../../monitoring/logger";

// GET /api/research/graph
export async function GET_GRAPH(req: Request, res: Response) {
  try {
    const paperId = req.query.paperId as string;

    // If no paperId is provided, we can return a default/empty graph or handle it
    // But for the Concept Map, we usually start from a seed paper.
    if (!paperId) {
      return res
        .status(400)
        .json({ error: "Paper ID is required to generate graph" });
    }

    const start = Date.now();
    const graph = await PaperDiscoveryService.getPaperGraph(paperId);

    logger.info("Generated research graph", {
      paperId,
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      duration: Date.now() - start,
    });

    return res.json({ data: graph });
  } catch (error: any) {
    logger.error("Error generating research graph:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
