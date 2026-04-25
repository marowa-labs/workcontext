import axios from "axios";
import logger from "../monitoring/logger";
import { OpenAIService } from "./openaiService";

export interface CitationMetric {
  id: string;
  doi: string;
  title: string;
  isRetracted: boolean;
  retractionReason?: string;
  supportingCount: number;
  contrastingCount: number;
  mentioningCount: number;
  totalCitations: number;
  smartRationale?: string;
  reliabilityScore?: number; // 0-100
}

export class SmartCitationService {
  /**
   * Analyze high-level metadata for a list of citations
   */
  static async analyzeCitations(citations: any[]): Promise<CitationMetric[]> {
    const results: CitationMetric[] = [];

    for (const citation of citations) {
      if (!citation.doi) {
        // Fallback for citations without DOI
        results.push(this.getDefaultMetric(citation));
        continue;
      }

      try {
        const metric = await this.getMetricsFromDOIs(citation.doi, citation);
        results.push(metric);
      } catch (error) {
        logger.error(`Error analyzing citation ${citation.doi}:`, error);
        results.push(this.getDefaultMetric(citation));
      }
    }

    return results;
  }

  /**
   * Fetch data from OpenAlex or CrossRef
   */
  private static async getMetricsFromDOIs(
    doi: string,
    originalData: any,
  ): Promise<CitationMetric> {
    // OpenAlex API URL for works
    const url = `https://api.openalex.org/works/https://doi.org/${doi}`;

    try {
      const response = await axios.get(url);
      const data = response.data;

      // Extract retraction information
      // In OpenAlex, check for is_retracted field
      const isRetracted = data.is_retracted || false;

      // Extract citation counts
      const totalCitations = data.cited_by_count || 0;
      const abstract = this.extractAbstract(data);

      // AI Analysis
      const aiAnalysis = await this.runAIAnalysis(
        data.title,
        abstract,
        totalCitations,
        isRetracted,
      );

      return {
        id: originalData.id || `cit-${Date.now()}`,
        doi: doi,
        title: data.title || originalData.title,
        isRetracted: isRetracted,
        retractionReason: isRetracted
          ? "Identified as retracted in OpenAlex database."
          : undefined,
        supportingCount: aiAnalysis.supporting,
        contrastingCount: aiAnalysis.contrasting,
        mentioningCount: aiAnalysis.mentioning,
        totalCitations: totalCitations,
        smartRationale: aiAnalysis.rationale,
        reliabilityScore: aiAnalysis.reliability,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return this.getDefaultMetric(originalData);
      }
      throw error;
    }
  }

  private static extractAbstract(data: any): string {
    // OpenAlex abstracts are often stored in an inverted index format
    if (data.abstract_inverted_index) {
      const invertedIndex = data.abstract_inverted_index;
      const words: string[] = [];
      for (const [word, positions] of Object.entries(invertedIndex)) {
        for (const pos of positions as number[]) {
          words[pos] = word;
        }
      }
      return words.join(" ");
    }
    return "";
  }

  private static async runAIAnalysis(
    title: string,
    abstract: string,
    total: number,
    isRetracted: boolean,
  ) {
    if (total === 0 && !isRetracted) {
      return {
        supporting: 0,
        contrasting: 0,
        mentioning: 0,
        rationale: "No external citations found to analyze.",
        reliability: 80,
      };
    }

    try {
      const prompt = `Analyze the potential scholarly impact and reliability of this research paper based on its metadata.
Title: ${title}
Abstract: ${abstract ? abstract.substring(0, 500) : "N/A"}
Total Citations: ${total}
Retraction Status: ${isRetracted ? "RETRACTED" : "Normal"}

Your task:
1. Estimate the distribution of citation types: Supporting (agreement), Contrasting (contradiction/debate), and Mentioning (neutral citing).
2. Provide a 1-sentence "Smart Rationale" explaining the paper's standing in the field.
3. Assign a reliability score (0-100).

Return ONLY a JSON object in this format:
{
  "supporting": number,
  "contrasting": number,
  "mentioning": number,
  "rationale": "string",
  "reliability": number
}

Note: Total supporting + contrasting + mentioning MUST equal ${total}. If info is scarce, use common academic distributions (80% mentioning, 15% supporting, 5% contrasting).`;

      const aiResponse = await OpenAIService.sendCompletion(
        prompt,
        "gpt-4o-mini",
        500,
        0.2,
      );
      return JSON.parse(aiResponse.content);
    } catch (error) {
      logger.error("AI Analysis failed for citation:", error);
      // Fallback distribution
      const supporting = Math.floor(total * 0.15);
      const contrasting = Math.floor(total * 0.05);
      return {
        supporting,
        contrasting,
        mentioning: total - supporting - contrasting,
        rationale: "Analysis completed via metadata heuristics fallback.",
        reliability: isRetracted ? 0 : 70,
      };
    }
  }

  private static getDefaultMetric(citation: any): CitationMetric {
    return {
      id: citation.id || `cit-fallback-${Date.now()}`,
      doi: citation.doi || "",
      title: citation.title || "Unknown Title",
      isRetracted: false,
      supportingCount: 0,
      contrastingCount: 0,
      mentioningCount: 0,
      totalCitations: 0,
      smartRationale: "Insufficient metadata for AI analysis.",
      reliabilityScore: 50,
    };
  }
}
