import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./use-toast";

export interface RephraseOption {
  id: string;
  text: string;
  confidence: number;
}

export function useRephrase() {
  const { getAccessToken } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateRephrase = async (
    text: string,
    context?: string
  ): Promise<RephraseOption[] | null> => {
    setIsGenerating(true);

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/plagiarism/rephrase`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text, context }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate rephrase");
      }

      const data = await response.json();
      return data.result.options;
    } catch (error: any) {
      console.error("Error generating rephrase:", error);
      toast({
        title: "❌ Rephrase Failed",
        description: "Failed to generate alternatives. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateRephrase,
    isGenerating,
  };
}
