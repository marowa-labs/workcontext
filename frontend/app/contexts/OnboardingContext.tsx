"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useUser } from "../lib/utils/useUser";

interface OnboardingContextType {
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  hasCompletedOnboarding: boolean;
  startOnboarding: () => void;
  skipOnboarding: () => void;
  currentOnboardingStep: number;
  setCurrentOnboardingStep: (step: number) => void;
  onboardingPaused: boolean;
  setOnboardingPaused: (paused: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);
  const [onboardingPaused, setOnboardingPaused] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    if (user) {
      // Check for onboarding completion in user metadata
      const completed = user.user_metadata?.has_completed_onboarding || false;
      setHasCompletedOnboarding(completed);

      if (!completed) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  const startOnboarding = () => {
    setShowOnboarding(true);
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
  };

  const value = {
    showOnboarding,
    setShowOnboarding,
    hasCompletedOnboarding,
    startOnboarding,
    skipOnboarding,
    currentOnboardingStep,
    setCurrentOnboardingStep,
    onboardingPaused,
    setOnboardingPaused,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
