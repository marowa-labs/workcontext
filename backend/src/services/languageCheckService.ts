import { UnifiedAIService } from "./unifiedAIService";
import logger from "../monitoring/logger";

export interface LanguageSuggestion {
  id: string;
  type: "grammar" | "punctuation" | "spelling" | "style";
  original: string;
  suggestion: string;
  reason: string;
  context: string;
}

export class LanguageCheckService {
  /**
   * Analyze text for language issues and return structured suggestions
   */
  static async checkLanguage(
    text: string,
    userId?: string,
  ): Promise<LanguageSuggestion[]> {
    try {
      if (!text || text.trim().length === 0) {
        return [];
      }

      // Limit text length to avoid token limits for a single check
      // For very large documents, we might need to chunk this
      const textToAnalyze = text.substring(0, 10000);

      const prompt = `You are an expert academic editor. Analyze the following text for grammar, punctuation, spelling, and style issues.
Focus on academic writing standards. For each issue, provide the original incorrect text, the corrected version, a brief reason, and a short context snippet.

Text to analyze:
"${textToAnalyze}"

Respond ONLY with a JSON array of objects in this exact format:
[
  {
    "id": "unique-id-1",
    "type": "grammar | punctuation | spelling | style",
    "original": "incorrect text",
    "suggestion": "corrected text",
    "reason": "explanation of the issue",
    "context": "three words before original + original + three words after original"
  }
]

Ensure the "original" text is an EXACT match from the provided text.
Ensure the "context" snippet is an EXACT match from the provided text to help locate the error.

Your response MUST be a valid JSON array.`;

      if (!userId) {
        throw new Error("User ID required for language check. Please log in.");
      }

      const aiResponse = await UnifiedAIService.processAIRequest({
        userId,
        capability: "grammar_check",
        content: prompt,
        options: { isAutomatic: true },
      });

      try {
        const jsonText = aiResponse.result.replace(/```json|```/g, "").trim();
        const suggestions = JSON.parse(jsonText) as LanguageSuggestion[];

        // Ensure each suggestion has an ID
        return suggestions.map((s, index) => ({
          ...s,
          id: s.id || `suggestion-${Date.now()}-${index}`,
        }));
      } catch (parseError) {
        logger.error(
          "Failed to parse AI response for language check:",
          aiResponse.result,
        );
        throw new Error("Failed to parse language check results");
      }
    } catch (error: any) {
      logger.error("Error in LanguageCheckService:", error);
      throw error;
    }
  }
}
