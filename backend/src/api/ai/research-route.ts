import { Router, type Router as ExpressRouter } from "express";
import { authenticateExpressRequest } from "../../middleware/auth";
import logger from "../../monitoring/logger";
import { SearchService } from "../../services/searchService";
import { UnifiedAIService } from "../../services/unifiedAIService";
import { getSupabaseClient } from "../../lib/supabase/client";
import { prisma } from "../../lib/prisma";

const router: ExpressRouter = Router();

// Get recent research topics
async function handleGetRecentResearchTopics(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { limit } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const topics = await SearchService.getRecentResearchTopics(
      userId,
      limit ? parseInt(limit as string) : 10,
    );

    return res.status(200).json({
      success: true,
      topics,
    });
  } catch (error: any) {
    logger.error("Error fetching recent research topics:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.get(
  "/topics",
  authenticateExpressRequest,
  handleGetRecentResearchTopics,
);

// Save research topic
async function handlePostSaveResearchTopic(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { title, description, sources, sourcesData } = req.body;

    if (!userId || !title) {
      return res.status(400).json({
        success: false,
        message: "User ID and title are required",
      });
    }

    const topic = await SearchService.saveResearchTopic(
      userId,
      title,
      description || "",
      sources || 0,
      sourcesData || [],
    );

    return res.status(200).json({
      success: true,
      topic,
    });
  } catch (error: any) {
    logger.error("Error saving research topic:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.post("/topics", authenticateExpressRequest, handlePostSaveResearchTopic);

// Get research sources for a topic
async function handleGetResearchSources(req: any, res: any) {
  try {
    const { topicId } = req.params;

    if (!topicId) {
      return res.status(400).json({
        success: false,
        message: "Topic ID is required",
      });
    }

    const sources = await SearchService.getResearchSources(topicId);

    return res.status(200).json({
      success: true,
      sources,
    });
  } catch (error: any) {
    logger.error("Error fetching research sources:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.get(
  "/topics/:topicId/sources",
  authenticateExpressRequest,
  handleGetResearchSources,
);

// Generate concept map from document content
async function handlePostConceptMap(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { query, projectId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Fetch document content if projectId is provided
    let documentContent = "";
    let documentTitle = query || "Document";

    if (projectId) {
      try {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { title: true, content: true },
        });
        if (project) {
          documentTitle = project.title || documentTitle;
          // Extract text content from JSON if needed
          if (project.content) {
            try {
              const contentObj =
                typeof project.content === "string"
                  ? JSON.parse(project.content)
                  : project.content;
              // Recursively extract text from Tiptap JSON
              const extractText = (node: any): string => {
                let text = "";
                if (node.text) text += node.text + " ";
                if (node.content && Array.isArray(node.content)) {
                  node.content.forEach((child: any) => {
                    text += extractText(child);
                  });
                }
                return text;
              };
              documentContent = extractText(contentObj).trim();
            } catch {
              documentContent =
                typeof project.content === "string" ? project.content : "";
            }
          }
        }
      } catch (dbError) {
        logger.warn("Could not fetch project for concept map", dbError);
      }
    }

    // Build the prompt for AI
    const prompt = `You are an expert academic researcher. Generate a concept map as a JSON tree structure based on the following document.

Document Title: ${documentTitle}
${documentContent ? `\nDocument Content:\n${documentContent.slice(0, 8000)}` : ""}
${query ? `\nTopic Focus: ${query}` : ""}

Generate a hierarchical concept map with 3-5 main branches, each with 2-4 sub-concepts.
Return ONLY valid JSON in this exact format (no markdown, no explanation):

{
  "id": "root",
  "label": "${documentTitle}",
  "type": "root",
  "children": [
    {
      "id": "branch-1",
      "label": "Main Concept 1",
      "type": "branch",
      "children": [
        { "id": "leaf-1-1", "label": "Sub-concept 1.1", "type": "leaf" },
        { "id": "leaf-1-2", "label": "Sub-concept 1.2", "type": "leaf" }
      ]
    },
    {
      "id": "branch-2",
      "label": "Main Concept 2",
      "type": "branch",
      "children": [
        { "id": "leaf-2-1", "label": "Sub-concept 2.1", "type": "leaf" }
      ]
    }
  ]
}`;

    const aiResponse = await UnifiedAIService.processAIRequest({
      userId,
      capability: "summarization",
      content: prompt,
      options: { isAutomatic: true },
    });

    // Parse the AI response to extract JSON
    let conceptMapData;
    try {
      // Try to extract JSON from the response (handle markdown code fences)
      let cleaned = aiResponse.result.trim();
      cleaned = cleaned
        .replace(/^```json\s*/g, "")
        .replace(/```\s*$/g, "")
        .trim();
      conceptMapData = JSON.parse(cleaned);
    } catch (parseError) {
      logger.error("Failed to parse concept map AI response", parseError);
      return res.status(500).json({
        success: false,
        message: "Failed to parse concept map response",
      });
    }

    return res.status(200).json({
      success: true,
      data: conceptMapData,
    });
  } catch (error: any) {
    logger.error("Error generating concept map:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate concept map",
    });
  }
}

router.post("/map", authenticateExpressRequest, handlePostConceptMap);

export default router;
