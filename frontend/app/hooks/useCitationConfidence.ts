import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./use-toast";

export interface ConfidenceScore {
  overall: number;
  recencyScore: number;
  coverageScore: number;
  qualityScore: number;
  diversityScore: number;
  status: "strong" | "good" | "weak" | "poor";
  warnings: string[];
  suggestions: string[];
}

export interface SuggestedPaper {
  title: string;
  authors: string[];
  year: number;
  doi: string;
  abstract: string;
  citationCount: number;
  journal: string;
  url: string;
  relevanceScore: number;
}

export function useCitationConfidence() {
  const { getAccessToken } = useAuth();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFindingLinks, setIsFindingLinks] = useState(false);

  const analyzeConfidence = async (
    projectId: string,
    field?: string
  ): Promise<any | null> => {
    setIsAnalyzing(true);

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/citations/analyze-confidence`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ projectId, field }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to analyze confidence");
      }

      const data = await response.json();
      return data.analysis;
    } catch (error: any) {
      console.error("Error analyzing confidence:", error);
      toast({
        title: "❌ Analysis Failed",
        description: "Failed to analyze citation confidence.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const findMissingLinks = async (
    topic: string,
    field?: string,
    limit?: number
  ): Promise<SuggestedPaper[] | null> => {
    setIsFindingLinks(true);

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/citations/find-missing-links`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ topic, field, limit }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to find missing links");
      }

      const data = await response.json();

      toast({
        title: "✅ Suggestions Found",
        description: `Found ${data.suggestions.length} recent papers`,
      });

      return data.suggestions;
    } catch (error: any) {
      console.error("Error finding missing links:", error);
      toast({
        title: "❌ Search Failed",
        description: "Failed to find missing link suggestions.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsFindingLinks(false);
    }
  };

  const validateClaim = async (
    claim: string,
    citationDOI: string
  ): Promise<any | null> => {
    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/citations/validate-claim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ claim, citationDOI }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to validate claim");
      }

      const data = await response.json();
      return data.validation;
    } catch (error: any) {
      console.error("Error validating claim:", error);
      toast({
        title: "❌ Validation Failed",
        description: "Failed to validate claim.",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    analyzeConfidence,
    findMissingLinks,
    validateClaim,
    isAnalyzing,
    isFindingLinks,
  };
}
