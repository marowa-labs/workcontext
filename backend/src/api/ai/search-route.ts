import { Router, type Router as ExpressRouter } from "express";
import { SearchService } from "../../services/searchService";
import logger from "../../monitoring/logger";
import { authenticateExpressRequest } from "../../middleware/auth";

const router: ExpressRouter = Router();

function isPrivateIpAddress(hostname: string): boolean {
  if (!hostname) return false;

  const normalized = hostname.toLowerCase();
  if (
    normalized === "localhost" ||
    normalized === "ip6-localhost" ||
    normalized === "::1"
  ) {
    return true;
  }

  const ipv4Match = normalized.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octets = ipv4Match.slice(1).map(Number);
    const [a, b] = octets;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }

  return /^fd|^fc|^fe80:/i.test(normalized);
}

function sanitizeSources(sources: any[]): string[] {
  if (!Array.isArray(sources)) {
    return [];
  }

  const sanitized: string[] = [];
  for (const maybeSource of sources) {
    if (typeof maybeSource !== "string") {
      continue;
    }

    const source = maybeSource.trim();
    try {
      const url = new URL(source);
      if (
        (url.protocol === "http:" || url.protocol === "https:") &&
        !isPrivateIpAddress(url.hostname)
      ) {
        sanitized.push(url.toString());
      }
    } catch {
      continue;
    }
  }

  return sanitized;
}

// Perform a web search
export async function handlePostWebSearch(req: any, res: any) {
  try {
    const body = req.body;
    const userId = req.user?.id;
    const { query, maxResults } = body;

    if (!userId || !query) {
      return res.status(400).json({
        success: false,
        message: "User ID and query are required",
      });
    }

    // Perform web search
    const results = await SearchService.webSearch(userId, query, maxResults);

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error: any) {
    logger.error("Error performing web search:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.post("/web", authenticateExpressRequest, handlePostWebSearch);

// Perform a deep search
export async function handlePostDeepSearch(req: any, res: any) {
  try {
    const body = req.body;
    const userId = req.user?.id;
    const { query, sources } = body;

    const sanitizedSources = sanitizeSources(sources);

    if (!userId || !query || sanitizedSources.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User ID, query, and valid public sources are required",
      });
    }

    // Perform deep search
    const results = await SearchService.deepSearch(userId, query, sanitizedSources);

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error: any) {
    logger.error("Error performing deep search:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.post("/deep", authenticateExpressRequest, handlePostDeepSearch);

// Analyze search results
export async function handlePostAnalyzeSearchResults(req: any, res: any) {
  try {
    const body = req.body;
    const userId = req.user?.id;
    const { query, results } = body;

    if (!userId || !query || !results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        message: "User ID, query, and results array are required",
      });
    }

    // Analyze search results
    const analysis = await SearchService.analyzeSearchResults(
      userId,
      query,
      results
    );

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    logger.error("Error analyzing search results:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.post(
  "/analyze",
  authenticateExpressRequest,
  handlePostAnalyzeSearchResults
);

export default router;
