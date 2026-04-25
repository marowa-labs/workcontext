import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

export interface RecencyScore {
  score: number; // 0-100
  status: "recent" | "acceptable" | "dated" | "outdated";
  yearsOld: number;
  recommendation: string;
}

export interface ConfidenceScore {
  overall: number; // 0-100
  recencyScore: number;
  coverageScore: number;
  qualityScore: number;
  diversityScore: number;
  status: "strong" | "good" | "weak" | "poor";
  warnings: string[];
  suggestions: string[];
}

interface Citation {
  id: string;
  title: string;
  author: string;
  year: number;
  type: string;
  doi?: string;
  citationCount?: number;
}

export class CitationConfidenceService {
  // Field-specific recency thresholds (in years)
  private static readonly FIELD_THRESHOLDS: Record<string, number> = {
    "computer-science": 3,
    technology: 3,
    medicine: 5,
    biology: 5,
    psychology: 7,
    sociology: 8,
    economics: 8,
    history: 15,
    literature: 15,
    philosophy: 20,
    default: 10,
  };

  /**
   * Calculate recency score for a single citation
   */
  static calculateRecencyScore(
    year: number,
    field: string = "default"
  ): RecencyScore {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    const threshold =
      this.FIELD_THRESHOLDS[field.toLowerCase()] ||
      this.FIELD_THRESHOLDS.default;

    // Calculate score based on age relative to threshold
    if (age <= threshold / 3) {
      return {
        score: 100,
        status: "recent",
        yearsOld: age,
        recommendation: "Excellent recency - within optimal range",
      };
    } else if (age <= threshold) {
      return {
        score: 75,
        status: "acceptable",
        yearsOld: age,
        recommendation: "Good recency - acceptable for field",
      };
    } else if (age <= threshold * 2) {
      return {
        score: 50,
        status: "dated",
        yearsOld: age,
        recommendation: "Consider adding more recent sources",
      };
    } else {
      return {
        score: 25,
        status: "outdated",
        yearsOld: age,
        recommendation: "Significantly outdated - needs recent citations",
      };
    }
  }

  /**
   * Calculate overall confidence score for a section's citations
   */
  static calculateConfidenceScore(
    citations: Citation[],
    textLength: number,
    field: string = "default"
  ): ConfidenceScore {
    if (citations.length === 0) {
      return {
        overall: 0,
        recencyScore: 0,
        coverageScore: 0,
        qualityScore: 0,
        diversityScore: 0,
        status: "poor",
        warnings: ["No citations found"],
        suggestions: ["Add citations to support your claims"],
      };
    }

    // 1. Recency Score (40% weight)
    const recencyScores = citations.map(
      (c) => this.calculateRecencyScore(c.year, field).score
    );
    const avgRecency =
      recencyScores.reduce((a, b) => a + b, 0) / recencyScores.length;

    // 2. Coverage Score (30% weight) - citations per 1000 words
    const wordsPerCitation = textLength / citations.length;
    const coverageScore = Math.min(
      100,
      Math.max(0, 100 - (wordsPerCitation - 200) / 5)
    );

    // 3. Quality Score (20% weight) - based on citation counts
    const validCitations = citations.filter(
      (c) => c.citationCount !== undefined && c.citationCount !== null
    );
    const avgCitationCount =
      validCitations.length > 0
        ? validCitations.reduce((sum, c) => sum + (c.citationCount || 0), 0) /
          validCitations.length
        : 0;
    const qualityScore = Math.min(
      100,
      avgCitationCount > 0 ? Math.log10(avgCitationCount + 1) * 30 : 50
    );

    // 4. Diversity Score (10% weight) - variety of sources
    const uniqueAuthors = new Set(citations.map((c) => c.author)).size;
    const diversityScore = Math.min(
      100,
      (uniqueAuthors / citations.length) * 100
    );

    // Calculate weighted overall score
    const overall = Math.round(
      avgRecency * 0.4 +
        coverageScore * 0.3 +
        qualityScore * 0.2 +
        diversityScore * 0.1
    );

    // Determine status
    let status: "strong" | "good" | "weak" | "poor";
    if (overall >= 80) status = "strong";
    else if (overall >= 60) status = "good";
    else if (overall >= 40) status = "weak";
    else status = "poor";

    // Generate warnings and suggestions
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for recent citations
    const recentCitations = citations.filter((c) => {
      const age = new Date().getFullYear() - c.year;
      return age <= 3;
    });

    if (recentCitations.length === 0) {
      warnings.push("No citations from the last 3 years");
      suggestions.push("Add recent sources to strengthen your argument");
    }

    // Check coverage
    if (wordsPerCitation > 500) {
      warnings.push("Low citation density");
      suggestions.push("Consider adding more citations to support claims");
    }

    // Check diversity
    if (diversityScore < 50) {
      warnings.push("Limited source diversity");
      suggestions.push("Include citations from multiple authors");
    }

    return {
      overall,
      recencyScore: Math.round(avgRecency),
      coverageScore: Math.round(coverageScore),
      qualityScore: Math.round(qualityScore),
      diversityScore: Math.round(diversityScore),
      status,
      warnings,
      suggestions,
    };
  }

  /**
   * Analyze all citations in a project
   */
  static async analyzeProjectCitations(
    projectId: string,
    userId: string,
    field: string = "default"
  ): Promise<{
    totalCitations: number;
    overallConfidence: ConfidenceScore;
    citationBreakdown: {
      recent: number;
      acceptable: number;
      dated: number;
      outdated: number;
    };
  }> {
    try {
      // Fetch project citations
      const citations = await prisma.citation.findMany({
        where: {
          project_id: projectId,
        },
      });

      // Get project content length
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { word_count: true },
      });

      const textLength = project?.word_count || 1000;

      // Map to Citation interface
      const citationData: Citation[] = citations.map((c: any) => ({
        id: c.id,
        title: c.title,
        author: c.author || "Unknown",
        year: c.year || new Date().getFullYear(),
        type: c.type,
        doi: c.doi || undefined,
        citationCount: 0, // Would need to fetch from CrossRef
      }));

      // Calculate overall confidence
      const overallConfidence = this.calculateConfidenceScore(
        citationData,
        textLength,
        field
      );

      // Calculate breakdown
      const breakdown = {
        recent: 0,
        acceptable: 0,
        dated: 0,
        outdated: 0,
      };

      citationData.forEach((citation) => {
        const recency = this.calculateRecencyScore(citation.year, field);
        breakdown[recency.status]++;
      });

      return {
        totalCitations: citations.length,
        overallConfidence,
        citationBreakdown: breakdown,
      };
    } catch (error: any) {
      logger.error("Error analyzing project citations", {
        error: error.message,
        projectId,
      });
      throw new Error(`Failed to analyze citations: ${error.message}`);
    }
  }
}
