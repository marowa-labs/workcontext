import { Request, Response } from "express";
import { multiAIService } from "../../services/MultiAIService";
import { prisma } from "../../lib/prisma";
import { Citation, AIChatSession, AIChatMessage } from "@prisma/client";
import logger from "../../monitoring/logger";

export const GET_CONCEPT_MAP = async (req: Request, res: Response) => {
  try {
    logger.info("=== CONCEPT MAP REQUEST STARTED ===");
    const { query, projectId, forceRefresh } = req.body;
    logger.info("Request params:", { query, projectId, forceRefresh });

    if (!query && !projectId) {
      logger.warn("Missing both query and projectId");
      return res.status(400).json({ error: "Query or Project ID is required" });
    }
    logger.info("Validation passed");

    // 1. Check for existing map in DB if Project ID is present
    if (projectId && !forceRefresh) {
      logger.info("Checking database for existing concept map...");
      try {
        // Find unique analysis
        const cachedAnalysis = await prisma.researchAnalysis.findUnique({
          where: { project_id: projectId },
          // We fetch the whole object to avoid 'select' errors if schema is out of sync
          // select: { concept_map: true },
        });
        logger.info("Database query completed", {
          hasAnalysis: !!cachedAnalysis,
          hasMap: !!cachedAnalysis?.concept_map,
        });

        if (cachedAnalysis && cachedAnalysis.concept_map) {
          logger.info("Returning cached concept map");
          return res.json({ data: cachedAnalysis.concept_map });
        }
      } catch (dbError) {
        logger.error(
          "Failed to read concept map from DB (likely schema mismatch):",
          dbError,
        );
        // Continue to generation if DB read fails
      }
    }

    // If not found in DB and no query provided, we can't generate.
    if (!query) {
      logger.info("No query provided and no cached map found, returning null");
      return res.json({ data: null });
    }
    logger.info("Proceeding to generation...");

    // 2. Prepare Context (same as before)
    let context = "";
    if (projectId) {
      // Fetch Sources
      const citations = await prisma.citation.findMany({
        where: { project_id: projectId },
        take: 15,
      });

      // Fetch Chat
      const chatSessions = await prisma.aIChatSession.findMany({
        where: { project_id: projectId },
        include: { messages: { take: 10, orderBy: { created_at: "desc" } } },
        take: 3,
      });

      const sourceText = citations
        .map((c: Citation) => `- ${c.title}: ${c.abstract?.substring(0, 200)}`)
        .join("\n");
      const chatText = chatSessions
        .flatMap((s: AIChatSession & { messages: AIChatMessage[] }) =>
          s.messages.map((m: AIChatMessage) => m.content),
        )
        .join("\n")
        .substring(0, 3000);

      context = `
       CONTEXT FROM PROJECT:
       SOURCES:
       ${sourceText}
       
       USER NOTES/CHAT:
       ${chatText}
       `;
    }

    const prompt = `
      You are an expert research visualizer.
      User Topic: "${query}"
      
      ${context}
      
      Task: Generate a comprehensive hierarchical concept map for this research topic, heavily inspired by the provided project context (sources and ideas).
      The structure should be a deep horizontal tree.
      
      Output JSON format (recursive structure):
      {
        "id": "root",
        "label": "${query}", // central node
        "type": "root",
        "children": [
          {
            "id": "unique_id",
            "label": "Major Concept",
            "type": "branch", // branch vs leaf
            "description": "Short explanation",
            "children": [
               // sub-concepts...
            ]
          }
        ]
      }
      
      Rules:
      1. Create at least 3-4 main branches.
      2. Each branch must have 2-5 sub-nodes (leaves).
      3. Use short, punchy labels (max 3-5 words).
      4. Ensure IDs are unique.
      
      Return ONLY valid JSON.
      - Do not use markdown formatting.
      - Do not include any text before or after the JSON.
    `;

    const result = await multiAIService.generateContent(
      prompt,
      "gemini-3.1-flash-lite-preview",
    );

    let cleanContent = result.content;
    const startIndex = cleanContent.indexOf("{");
    const endIndex = cleanContent.lastIndexOf("}");

    if (startIndex !== -1 && endIndex !== -1) {
      cleanContent = cleanContent.substring(startIndex, endIndex + 1);
    }

    // Sanitize common AI JSON errors
    cleanContent = cleanContent
      .replace(/":\s*=/g, '":') // Fix ": ="
      .replace(/"\s*:=\s*"/g, '":"'); // Fix ":="

    try {
      const parsedData = JSON.parse(cleanContent);

      // Recursive sanitization function to handle objects and arrays
      const sanitize = (val: any): any => {
        if (typeof val === "string") {
          return val.replace(/\\"/g, '"').replace(/\\'/g, "'");
        }
        if (Array.isArray(val)) {
          return val.map(sanitize);
        }
        if (val !== null && typeof val === "object") {
          const newObj: any = {};
          for (const key in val) {
            newObj[key] = sanitize(val[key]);
          }
          return newObj;
        }
        return val;
      };

      const sanitizedData = sanitize(parsedData);

      // 3. Save to DB if Project ID is present
      if (projectId) {
        await prisma.researchAnalysis.upsert({
          where: { project_id: projectId },
          create: {
            project_id: projectId,
            concept_map: sanitizedData,
          },
          update: {
            concept_map: sanitizedData,
          },
        });

        // 4. Auto-save as Note
        try {
          const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { user_id: true },
          });

          if (project?.user_id) {
            await prisma.note.create({
              data: {
                user_id: project.user_id,
                project_id: projectId,
                category: "mind_map",
                title: `Mind Map - ${query}`, // Use query as title context
                content: JSON.stringify(sanitizedData), // Save raw JSON for the view component to parse
                tags: ["studio-generated", "mind_map"],
              },
            });
            logger.info("Auto-saved Concept Map as Note", { projectId });
          }
        } catch (noteError) {
          logger.error("Failed to auto-save concept map note:", noteError);
        }
      }

      return res.json({ data: sanitizedData });
    } catch (e) {
      logger.error("Failed to parse concept map JSON", e);
      logger.error("Raw AI Content:", result.content); // Log the actual bad content
      logger.error("Cleaned Content:", cleanContent);
      return res.status(500).json({ error: "Failed to parse AI response" });
    }
  } catch (error: any) {
    logger.error("Error in concept map endpoint:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
      details: error,
    });
  }
};
