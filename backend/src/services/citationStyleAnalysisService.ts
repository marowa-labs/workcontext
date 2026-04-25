import pdf from "pdf-parse";
import logger from "../monitoring/logger";
import { OpenAIService } from "./openaiService";
import fetch from "node-fetch";

export interface StyleAnalysisResult {
  styleId: string;
  styleName: string;
  confidence: number;
  explanation: string;
}

export class CitationStyleAnalysisService {
  /**
   * Analyze citation style from a PDF buffer
   */
  static async analyzePdfStyle(
    fileBuffer: Buffer,
  ): Promise<StyleAnalysisResult> {
    try {
      const data = await pdf(fileBuffer);
      const fullText = data.text;

      return await this.identifyStyleFromText(fullText);
    } catch (error: any) {
      logger.error("Error analyzing PDF style:", error);
      throw new Error(`Failed to analyze PDF style: ${error.message}`);
    }
  }

  /**
   * Analyze citation style from a remote URL (searched paper)
   */
  static async analyzeRemotePaperStyle(
    url: string,
  ): Promise<StyleAnalysisResult> {
    try {
      logger.info(`Analyzing remote paper style from URL: ${url}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch paper: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/pdf")) {
        const buffer = await response.buffer();
        return await this.analyzePdfStyle(buffer);
      } else {
        // Fallback or generic HTML parsing if it's not a PDF
        // For now, let's focus on PDF as it's the most reliable source for formatting
        const text = await response.text();
        // Strip HTML tags for analysis
        const cleanText = text.replace(/<[^>]*>?/gm, " ");
        return await this.identifyStyleFromText(cleanText);
      }
    } catch (error: any) {
      logger.error("Error analyzing remote paper style:", error);
      throw new Error(`Failed to analyze remote paper style: ${error.message}`);
    }
  }

  /**
   * Internal logic to identify style from extracted text using AI
   */
  private static async identifyStyleFromText(
    text: string,
  ): Promise<StyleAnalysisResult> {
    try {
      // 1. Extract snippets: References section and some body text
      const referencesMatch = text.match(
        /(References|Bibliography|Works Cited)[\s\S]{1,5000}/i,
      );
      const referencesText = referencesMatch ? referencesMatch[0] : "";

      // Get some mid-document text for in-text citations
      const midpoint = Math.floor(text.length / 2);
      const bodySnippet = text.substring(midpoint, midpoint + 2000);

      // 2. Build prompt for LLM
      const prompt = `You are an expert in academic citation styles (CSL).
Analyze the following snippets from a research paper to identify the citation style used.

### Body Snippet (for in-text citations):
"${bodySnippet}"

### References Snippet:
"${referencesText}"

### Task:
Identify the specific CSL (Citation Style Language) style ID that most closely matches this document.
Respond ONLY with a JSON object in the following format:
{
  "styleId": "e.g., apa, ieee, modern-language-association, chicago-author-date, vancouver, harvard1",
  "styleName": "e.g., APA 7th Edition",
  "confidence": 0.95,
  "explanation": "Brief explanation of why this style was chosen based on the patterns found (e.g., 'Uses [1] for in-text and sorted by appearance in bibliography')."
}

Common CSL IDs to consider:
- apa (Author-Date, e.g., (Smith, 2020))
- ieee (Numeric, e.g., [1])
- modern-language-association (MLA, e.g., Smith 12)
- chicago-author-date (e.g., Smith 2020)
- vancouver (Numeric, e.g., (1) or 1)
- harvard1 (Author-Date)
- nature (Numeric)
- american-medical-association (Numeric)

Style ID:`;

      const aiResponse = await OpenAIService.sendCompletion(
        prompt,
        "gpt-4o-mini",
        500,
        0.2,
      );

      try {
        // Clean response text in case LLM added markdown backticks
        const jsonText = aiResponse.content.replace(/```json|```/g, "").trim();
        return JSON.parse(jsonText) as StyleAnalysisResult;
      } catch (parseError) {
        logger.error(
          "Failed to parse AI response for style analysis:",
          aiResponse.content,
        );
        return {
          styleId: "apa",
          styleName: "APA (Fallback)",
          confidence: 0.1,
          explanation:
            "Could not definitively identify style, falling back to APA.",
        };
      }
    } catch (error: any) {
      logger.error("Error identifying style from text:", error);
      throw error;
    }
  }
}
