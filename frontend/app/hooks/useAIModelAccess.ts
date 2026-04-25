import { useState, useEffect } from "react";
import AIModelAccessControl from "../lib/utils/aiModelAccessControl";

interface AIModelAccessHook {
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
  checkAccess: (modelId: string) => Promise<boolean>;
  getUserPlan: () => Promise<string>;
  getRequiredPlan: (modelId: string) => string;
}

const useAIModelAccess = (): AIModelAccessHook => {
  const [hasAccess, setHasAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAccess = async (modelId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const access = await AIModelAccessControl.hasModelAccess(modelId);
      setHasAccess(access);
      return access;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to check model access";
      setError(errorMessage);
      setHasAccess(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserPlan = async (): Promise<string> => {
    try {
      return await AIModelAccessControl.getUserPlan();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get user plan";
      setError(errorMessage);
      return "free";
    }
  };

  const getRequiredPlan = (modelId: string): string => {
    const modelDetails =
      AIModelAccessControl.MODEL_DETAILS[
        modelId as keyof typeof AIModelAccessControl.MODEL_DETAILS
      ];
    return modelDetails?.planRequired || "researcher";
  };

  return {
    hasAccess,
    isLoading,
    error,
    checkAccess,
    getUserPlan,
    getRequiredPlan,
  };
};

export default useAIModelAccess;
