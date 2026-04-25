import { Request, Response } from "express";
import { multiAIService } from "../../services/MultiAIService";
import logger from "../../monitoring/logger";

export const GET_CONSENSUS = async (req: Request, res: Response) => {
  try {
    const { query, papers } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }
    if (!papers || !Array.isArray(papers) || papers.length === 0) {
      return res.status(400).json({ error: "No papers provided" });
    }

    // Limit to top 20 to avoid token limits
    const BATCH_LIMIT = 20;
    const papersToAnalyze = papers.slice(0, BATCH_LIMIT);

    const prompt = `
      You are an expert research assistant.
      User Query: "${query}"
      
      Here are abstracts from scientific papers:
      ${papersToAnalyze
        .map(
          (p: any, i: number) => `
      [Paper ${i + 1}] Title: ${p.title}
      Abstract: ${p.abstract || "No abstract"}
      ID: ${p.externalId}
      `,
        )
        .join("\n")}

      Task:
      1. Determine if the overall scientific consensus based ONLY on these papers supports the query/hypothesis.
      2. Categorize each paper as "YES" (Supports), "NO" (Refutes/Disagrees), "MAYBE" (Inconclusive/Conditional/Neutral/Unrelated).
      3. Provide a concise 1-sentence summary of the consensus.

      Output JSON format:
      {
        "consensus": "string (summary)",
        "yesCount": number,
        "noCount": number,
        "maybeCount": number,
        "paperClassifications": [
          { "paperId": "string (ID)", "classification": "YES" | "NO" | "MAYBE", "reason": "short phrase" }
        ]
      }
      
      Return ONLY valid JSON.
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
      return res.json({ data: parsedData });
    } catch (e) {
      logger.error("Failed to parse consensus JSON", e);
      return res.status(500).json({ error: "Failed to parse AI response" });
    }
  } catch (error) {
    logger.error("Error in consensus endpoint:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
