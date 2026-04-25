import { multiAIService } from "./MultiAIService";
import logger from "../monitoring/logger";
import { CrossRefService } from "./crossRefService";

export interface LogicValidationResult {
  match: "match" | "partial" | "mismatch" | "unclear";
  confidence: number; // 0-100
  explanation: string;
  recommendation: string;
  citationExists?: boolean; // NEW: Does the DOI actually exist?
}

export class CitationLogicService {
  /**
   * Verify that a DOI actually exists in CrossRef
   */
  static async verifyDOIExists(doi: string): Promise<boolean> {
    try {
      logger.info("Verifying DOI exists", { doi });

      // Try to fetch from CrossRef
      const citation = await CrossRefService.getWorkByDOI(doi);

      // If we got a result with a title, it exists
      const exists = !!(citation && citation.title);

      logger.info("DOI verification complete", { doi, exists });
      return exists;
    } catch (error: any) {
      // If CrossRef throws an error, the DOI likely doesn't exist
      logger.warn("DOI not found", { doi, error: error.message });
      return false;
    }
  }

  /**
   * Validate if a claim is supported by the cited source
   * FIRST checks if the citation exists (hallucination detection)
   */
  static async validateClaimAgainstCitation(
    claim: string,
    citationDOI: string,
  ): Promise<LogicValidationResult> {
    try {
      logger.info("Validating claim against citation", { claim, citationDOI });

      // STEP 1: Verify DOI exists (hallucination check)
      const citationExists = await this.verifyDOIExists(citationDOI);

      if (!citationExists) {
        return {
          match: "mismatch",
          confidence: 100,
          explanation:
            "🚨 HALLUCINATED CITATION: This DOI does not exist in academic databases",
          recommendation:
            "Verify the DOI is correct or find the correct citation",
          citationExists: false,
        };
      }

      // STEP 2: Fetch citation details from CrossRef
      const citation = await CrossRefService.getWorkByDOI(citationDOI);

      if (!citation || !citation.abstract) {
        return {
          match: "unclear",
          confidence: 0,
          explanation: "Abstract not available for validation",
          recommendation: "Manually verify this citation supports your claim",
        };
      }

      // Use AI to compare claim to abstract

      const prompt = `You are an academic peer reviewer checking if a claim is supported by a cited source.

CLAIM:
"${claim}"

CITED SOURCE:
Title: ${citation.title}
Abstract: ${citation.abstract}

Analyze if the source supports the claim. Return ONLY valid JSON in this exact format:
{
  "match": "match" | "partial" | "mismatch" | "unclear",
  "confidence": 0-100,
  "explanation": "brief explanation",
  "recommendation": "what author should do"
}

Definitions:
- match: Source directly supports the claim
- partial: Source relates but doesn't fully support
- mismatch: Source contradicts or doesn't relate
- unclear: Not enough information to determine`;

      const result = await multiAIService.generateContent(
        prompt,
        "gemini-3.1-flash-lite-preview",
      );
      const responseText = result.content;

      // Parse JSON response
      let validation: LogicValidationResult;
      try {
        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          validation = {
            match: parsed.match,
            confidence: Math.min(100, Math.max(0, parsed.confidence)),
            explanation: parsed.explanation || "No explanation provided",
            recommendation: parsed.recommendation || "Review citation manually",
          };
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        // Fallback if JSON parsing fails
        logger.warn("Failed to parse AI response, using fallback", {
          parseError,
        });
        validation = {
          match: "unclear",
          confidence: 50,
          explanation: "Unable to automatically validate",
          recommendation: "Manually verify this citation",
        };
      }

      logger.info("Claim validation complete", {
        match: validation.match,
        confidence: validation.confidence,
      });

      return validation;
    } catch (error: any) {
      logger.error("Error validating claim", {
        error: error.message,
        claim,
        citationDOI,
      });
      return {
        match: "unclear",
        confidence: 0,
        explanation: `Validation failed: ${error.message}`,
        recommendation: "Manually verify this citation",
      };
    }
  }

  /**
   * Batch validate multiple claims
   */
  static async validateMultipleClaims(
    claimsAndCitations: Array<{ claim: string; doi: string }>,
  ): Promise<LogicValidationResult[]> {
    try {
      const results = await Promise.all(
        claimsAndCitations.map(({ claim, doi }) =>
          this.validateClaimAgainstCitation(claim, doi),
        ),
      );

      return results;
    } catch (error: any) {
      logger.error("Error in batch validation", { error: error.message });
      throw error;
    }
  }
}
