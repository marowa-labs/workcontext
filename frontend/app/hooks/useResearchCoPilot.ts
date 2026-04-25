import { useState, useCallback } from "react";
import ResearchCoPilotService, {
  type DocumentContext,
  type CitationSuggestion,
  type Paper,
  type LiteratureGap,
  type PlagiarismCheckResult,
} from "../lib/utils/researchCoPilotService";

/**
 * Hook for Research Co-Pilot features
 *
 * Provides access to AI research features:
 * - Citation suggestions
 * - Paper recommendations
 * - Literature gap analysis
 * - Plagiarism checking
 */

export const useResearchCoPilot = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citationSuggestions, setCitationSuggestions] = useState<
    CitationSuggestion[]
  >([]);
  const [recommendedPapers, setRecommendedPapers] = useState<Paper[]>([]);
  const [literatureGaps, setLiteratureGaps] = useState<LiteratureGap[]>([]);
  const [plagiarismResult, setPlagiarismResult] =
    useState<PlagiarismCheckResult | null>(null);

  /**
   * Get citation suggestions for selected text
   */
  const suggestCitations = useCallback(
    async (text: string, documentContext: DocumentContext) => {
      try {
        setIsLoading(true);
        setError(null);

        const suggestions = await ResearchCoPilotService.suggestCitations(
          text,
          documentContext,
        );

        setCitationSuggestions(suggestions);
        return suggestions;
      } catch (err: any) {
        setError(err.message || "Failed to get citation suggestions");
        console.error("Citation suggestion error:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Recommend papers for a topic
   */
  const recommendPapers = useCallback(
    async (
      topic: string,
      existingCitations: string[] = [],
      limit: number = 10,
    ) => {
      try {
        setIsLoading(true);
        setError(null);

        const papers = await ResearchCoPilotService.recommendPapers(
          topic,
          existingCitations,
          limit,
        );

        setRecommendedPapers(papers);
        return papers;
      } catch (err: any) {
        setError(err.message || "Failed to recommend papers");
        console.error("Paper recommendation error:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Analyze literature gaps
   */
  const analyzeGaps = useCallback(async (documentContext: DocumentContext) => {
    try {
      setIsLoading(true);
      setError(null);

      const gaps = await ResearchCoPilotService.analyzeGaps(documentContext);

      setLiteratureGaps(gaps || []);
      return gaps || [];
    } catch (err: any) {
      setError(err.message || "Failed to analyze literature gaps");
      console.error("Gap analysis error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check for plagiarism
   */
  const checkPlagiarism = useCallback(
    async (text: string, sourcePapers?: any[]) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await ResearchCoPilotService.checkPlagiarism(
          text,
          sourcePapers,
        );

        setPlagiarismResult(result);
        return result;
      } catch (err: any) {
        setError(err.message || "Failed to check plagiarism");
        console.error("Plagiarism check error:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Verify claims
   */
  const verifyClaims = useCallback(
    async (
      text: string,
      projectId: string,
      options?: { includeGlobalContext?: boolean },
    ) => {
      try {
        setIsLoading(true);
        setError(null);

        const claims = await ResearchCoPilotService.verifyClaims(
          text,
          projectId,
          options,
        );

        return claims; // Component manages state for claims locally or we could add global state
      } catch (err: any) {
        setError(err.message || "Failed to verify claims");
        console.error("Claim verification error:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Get paper details
   */
  const getPaperDetails = useCallback(async (paperId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const paper = await ResearchCoPilotService.getPaperDetails(paperId);
      return paper;
    } catch (err: any) {
      setError(err.message || "Failed to get paper details");
      console.error("Get paper details error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get related papers
   */
  const getRelatedPapers = useCallback(
    async (paperId: string, limit: number = 10) => {
      try {
        setIsLoading(true);
        setError(null);

        const papers = await ResearchCoPilotService.getRelatedPapers(
          paperId,
          limit,
        );
        return papers;
      } catch (err: any) {
        setError(err.message || "Failed to get related papers");
        console.error("Get related papers error:", err);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear all results
   */
  const clearResults = useCallback(() => {
    setCitationSuggestions([]);
    setRecommendedPapers([]);
    setLiteratureGaps([]);
    setPlagiarismResult(null);
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    citationSuggestions,
    recommendedPapers,
    literatureGaps,
    plagiarismResult,

    // Actions
    suggestCitations,
    recommendPapers,
    analyzeGaps,
    checkPlagiarism,
    verifyClaims, // Export method
    getPaperDetails,
    getRelatedPapers,
    clearError,
    clearResults,
  };
};
