import { Request, Response } from "express";
import { multiAIService } from "../../services/MultiAIService";
import logger from "../../monitoring/logger";

export const ANALYZE_PAPERS = async (req: Request, res: Response) => {
  try {
    const { papers, columns } = req.body;

    if (!papers || !Array.isArray(papers) || papers.length === 0) {
      return res.status(400).json({ error: "No papers provided" });
    }
    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      return res.status(400).json({ error: "No columns provided" });
    }

    // Limit batch size to prevent timeout/rate limits
    const BATCH_LIMIT = 5;
    const papersToAnalyze = papers.slice(0, BATCH_LIMIT);

    const analysisPromises = papersToAnalyze.map(async (paper: any) => {
      try {
        const prompt = `
          You are an expert academic researcher. Analyze the following paper abstract and details to extract the requested information.
          
          Paper Title: ${paper.title}
          Year: ${paper.year}
          Abstract: ${paper.abstract || "No abstract available."}
          
          Requested Information:
          ${columns.map((col) => `- ${col}`).join("\n")}
          
          Provide the output as a strictly valid JSON object where keys are the specific column names requested and values are the concise extracted information.
          If information is not found, use "Not stated" as the value.
          Do not include markdown formatting (like \`\`\`json). Just the raw JSON string.
        `;

        const result = await multiAIService.generateContent(
          prompt,
          "gemini-3.1-flash-lite-preview",
        );
        const cleanContent = result.content
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        try {
          const parsedData = JSON.parse(cleanContent);
          return { paperId: paper.externalId, data: parsedData };
        } catch (e) {
          logger.warn(
            `Failed to parse analysis JSON for paper ${paper.externalId}`,
            e,
          );
          // Fallback or partial
          return {
            paperId: paper.externalId,
            error: "Failed to parse analysis",
          };
        }
      } catch (error) {
        logger.error(`Error analyzing paper ${paper.externalId}:`, error);
        return { paperId: paper.externalId, error: "Analysis failed" };
      }
    });

    const results = await Promise.all(analysisPromises);

    // Transform into map for easy frontend consumption
    const responseMap: Record<string, any> = {};
    results.forEach((r: any) => {
      if (r.data) {
        responseMap[r.paperId] = r.data;
      }
    });

    return res.json({ data: responseMap });
  } catch (error) {
    logger.error("Error in analyze endpoint:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
