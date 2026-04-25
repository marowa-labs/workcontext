import { useState, useEffect } from "react";
import AIService from "../lib/utils/aiService";

interface AIUsage {
  remaining: number;
  limit: number;
  percentage: number;
}

export const useAIUsage = () => {
  const [usage, setUsage] = useState<AIUsage>({
    remaining: 0,
    limit: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setLoading(true);
        const usageData = await AIService.getAIUsage();

        const percentage =
          usageData.limit > 0
            ? Math.round((usageData.remaining / usageData.limit) * 100)
            : 0;

        setUsage({
          remaining: usageData.remaining,
          limit: usageData.limit,
          percentage,
        });
      } catch (err: any) {
        setError(err.message || "Failed to fetch AI usage");
        console.error("Failed to fetch AI usage:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, []);

  const isLimitReached = usage.remaining <= 0;

  return {
    usage,
    loading,
    error,
    isLimitReached,
    refreshUsage: () => {
      // Re-fetch usage data
      setLoading(true);
      AIService.getAIUsage()
        .then((usageData) => {
          const percentage =
            usageData.limit > 0
              ? Math.round((usageData.remaining / usageData.limit) * 100)
              : 0;

          setUsage({
            remaining: usageData.remaining,
            limit: usageData.limit,
            percentage,
          });
        })
        .catch((err) => {
          setError(err.message || "Failed to fetch AI usage");
        })
        .finally(() => {
          setLoading(false);
        });
    },
  };
};

export default useAIUsage;
