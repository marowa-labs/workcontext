import apiClient from "./apiClient";

/**
 * Research Co-Pilot API Service
 *
 * Provides frontend access to AI Research Co-Pilot features:
 * - Multi-AI chat with document context
 * - Citation suggestions
 * - Paper recommendations
 * - Literature gap analysis
 * - Plagiarism checking
 */

export interface DocumentContext {
  projectId: string;
  title?: string;
  content: string;
  sections?: Array<{
    type: string;
    content: string;
    citations?: any[];
  }>;
  currentSection?: string;
  citationStyle?: string;
}

export interface CitationSuggestion {
  text: string;
  suggestedCitations: Array<{
    paperId: string;
    title: string;
    authors: string[];
    year: number;
    relevanceScore: number;
    reason: string;
    formattedCitation: string;
  }>;
  confidence: number;
}

export interface Paper {
  paperId: string;
  title: string;
  authors: Array<{ authorId?: string; name: string }>;
  year: number;
  abstract?: string;
  citationCount: number;
  url?: string;
  doi?: string;
  venue?: string;
  fieldsOfStudy?: string[];
}

export interface LiteratureGap {
  topic: string;
  description: string;
  suggestedPapers: Paper[];
  priority: "high" | "medium" | "low";
}

export interface ResearchChatResponse {
  content: string;
  citations: any[];
  sources: any[];
  confidenceScore: number;
  provider: string;
}

export interface PlagiarismCheckResult {
  score: number; // 0-100
  matches: Array<{
    source: string;
    similarity: number;
    excerpt: string;
  }>;
  isOriginal: boolean;
}

class ResearchCoPilotService {
  /**
   * Send research chat message with document context
   */
  static async chat(
    prompt: string,
    documentContext: DocumentContext,
    options?: {
      mode?: "general" | "research" | "autocomplete";
      includeDocumentContext?: boolean;
      includeCitationLibrary?: boolean;
      maxTokens?: number;
      temperature?: number;
      model?: string;
    },
  ): Promise<ResearchChatResponse> {
    try {
      const response = await apiClient.post("/api/ai/research-copilot/chat", {
        prompt,
        documentContext,
        options,
      });

      return response.data.data;
    } catch (error: any) {
      console.error("Research chat error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to send research chat message",
      );
    }
  }

  /**
   * Get citation suggestions for text
   */
  static async suggestCitations(
    text: string,
    documentContext: DocumentContext,
  ): Promise<CitationSuggestion[]> {
    try {
      const response = await apiClient.post(
        "/api/ai/research-copilot/suggest-citations",
        {
          text,
          documentContext,
        },
      );

      return response.data.data;
    } catch (error: any) {
      console.error("Citation suggestion error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to get citation suggestions",
      );
    }
  }

  /**
   * Recommend papers based on topic
   */
  static async recommendPapers(
    topic: string,
    existingCitations: string[] = [],
    limit: number = 10,
  ): Promise<Paper[]> {
    try {
      const response = await apiClient.post(
        "/api/ai/research-copilot/recommend-papers",
        {
          topic,
          existingCitations,
          limit,
        },
      );

      return response.data.data;
    } catch (error: any) {
      console.error("Paper recommendation error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to recommend papers",
      );
    }
  }

  /**
   * Analyze literature gaps in document
   */
  static async analyzeGaps(
    documentContext: DocumentContext,
  ): Promise<LiteratureGap[]> {
    try {
      const response = await apiClient.post(
        "/api/ai/research-copilot/analyze-gaps",
        {
          documentContext,
        },
      );

      return response.data.data;
    } catch (error: any) {
      console.error("Gap analysis error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to analyze literature gaps",
      );
    }
  }

  /**
   * Check for plagiarism
   */
  static async checkPlagiarism(
    text: string,
    sourcePapers?: any[],
  ): Promise<PlagiarismCheckResult> {
    try {
      const response = await apiClient.post(
        "/api/ai/research-copilot/check-plagiarism",
        {
          text,
          sourcePapers,
        },
      );

      return response.data.data;
    } catch (error: any) {
      console.error("Plagiarism check error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to check plagiarism",
      );
    }
  }

  /**
   * Verify claims in text
   */
  static async verifyClaims(
    text: string,
    projectId: string,
    options?: { includeGlobalContext?: boolean },
  ): Promise<any[]> {
    try {
      const response = await apiClient.post(
        "/api/ai/research-copilot/verify-claims",
        {
          text,
          projectId,
          options,
        },
      );

      return response.data.data;
    } catch (error: any) {
      console.error("Verify claims error:", error);
      throw new Error(error.response?.data?.error || "Failed to verify claims");
    }
  }

  /**
   * Get paper details
   */
  static async getPaperDetails(paperId: string): Promise<Paper | null> {
    try {
      const response = await apiClient.get(
        `/api/ai/research-copilot/paper/${paperId}`,
      );

      return response.data.data;
    } catch (error: any) {
      console.error("Get paper details error:", error);
      return null;
    }
  }

  /**
   * Get related papers
   */
  static async getRelatedPapers(
    paperId: string,
    limit: number = 10,
  ): Promise<Paper[]> {
    try {
      const response = await apiClient.get(
        `/api/ai/research-copilot/paper/${paperId}/related?limit=${limit}`,
      );

      return response.data.data;
    } catch (error: any) {
      console.error("Get related papers error:", error);
      return [];
    }
  }
}

export default ResearchCoPilotService;
