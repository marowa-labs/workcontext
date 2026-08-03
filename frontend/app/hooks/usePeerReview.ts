import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./use-toast";

export interface PeerReviewFeedback {
  overallVerdict: "accept" | "minor_revisions" | "major_revisions" | "reject";
  overallScore: number; // 0-100
  harshCritique: string; // The "mean reviewer" summary
  detailedIssues: ReviewIssue[];
  strengths: string[];
  recommendations: string[];
}

export interface ReviewIssue {
  category: "novelty" | "methodology" | "citations" | "clarity" | "evidence";
  severity: "critical" | "major" | "minor";
  location: string; // e.g., "Introduction, paragraph 2"
  issue: string;
  suggestion: string;
}

export function usePeerReview() {
  const { getAccessToken } = useAuth();
  const { toast } = useToast();
  const [isReviewing, setIsReviewing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Simulate a harsh peer review (the "mean reviewer")
   */
  const simulateHarshReview = async (
    title: string,
    abstract: string,
    fullText: string,
    citations: Array<{ title: string; year: number; doi?: string }> = []
  ): Promise<PeerReviewFeedback | null> => {
    setIsReviewing(true);

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/peer-review/simulate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, abstract, fullText, citations }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to simulate peer review");
      }

      const data = await response.json();

      toast({
        title: "✅ Review Complete",
        description: `Peer review simulation finished with verdict: ${data.review.overallVerdict}`,
      });

      return data.review;
    } catch (error: any) {
      console.error("Error simulating peer review:", error);
      toast({
        title: "❌ Review Failed",
        description: error.message || "Failed to simulate peer review.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsReviewing(false);
    }
  };

  /**
   * Quick rejection check (common rejection reasons)
   */
  const quickRejectionCheck = async (
    citations: Array<{ year: number }>,
    wordCount: number
  ): Promise<{ willReject: boolean; reasons: string[] } | null> => {
    setIsChecking(true);

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/peer-review/quick-check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ citations, wordCount }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to check rejection risks");
      }

      const data = await response.json();

      return data.check;
    } catch (error: any) {
      console.error("Error checking rejection risks:", error);
      toast({
        title: "❌ Check Failed",
        description: error.message || "Failed to check rejection risks.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    simulateHarshReview,
    quickRejectionCheck,
    isReviewing,
    isChecking,
  };
}
