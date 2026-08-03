/**
 * Cross-Source Search API
 *
 * POST /api/integrations/search
 *
 * Performs semantic search across all connected external tools AND internal
 * workspace content. Returns unified, ranked results with source attribution.
 *
 * Body: {
 *   query: string,
 *   workspace_id?: string,
 *   tool_types?: ToolType[],
 *   include_internal?: boolean,
 *   limit?: number
 * }
 */

import { Router } from "express";
import { authenticateExpressRequest } from "../../../middleware/auth";
import { SearchAggregator } from "../../../services/integrations/searchAggregator";
import { ToolType } from "../../../services/integrations/connectorBase";
import logger from "../../../monitoring/logger";

const router: Router = Router();

function getUserId(req: any): string {
  const user = (req as any).user;
  if (!user) throw new Error("Unauthorized");
  return user.id || user.sub || user.userId;
}

// ============================================================
// POST /api/integrations/search — Cross-source search
// ============================================================
router.post("/", authenticateExpressRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    const {
      query,
      workspace_id,
      tool_types,
      include_internal = true,
      limit = 20,
    } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Query is required and must be a non-empty string",
      });
    }

    const results = await SearchAggregator.search({
      userId,
      query: query.trim(),
      workspaceId: workspace_id,
      toolTypes: tool_types as ToolType[] | undefined,
      k: Math.min(limit, 50),
    });

    // Group results by source for the frontend
    const grouped: Record<string, any[]> = {};
    for (const result of results) {
      const key = result.source;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(result);
    }

    return res.json({
      success: true,
      query: query.trim(),
      total: results.length,
      results,
      grouped_by_source: grouped,
      sources: Object.keys(grouped).map((source) => ({
        source,
        label: results.find((r) => r.source === source)?.source_label || source,
        count: grouped[source].length,
      })),
    });
  } catch (error: any) {
    logger.error("POST /api/integrations/search failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
