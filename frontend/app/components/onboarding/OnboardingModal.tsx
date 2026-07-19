"use client";

import { useState } from "react";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { supabase } from "../../lib/supabase/client";

const STEPS = [
  {
    title: "Welcome to WorkContext",
    description:
      "Let's get you set up in less than a minute. We'll help you protect your work and write with confidence.",
  },
  {
    title: "Your workspace, organized",
    description:
      "Documents, citations, and AI assistance live in one place. No more switching tabs or losing track of sources.",
  },
  {
    title: "You're all set",
    description:
      "Start a new document or explore the dashboard. You can replay this tour anytime from settings.",
  },
];

export default function OnboardingModal() {
  const {
    showOnboarding,
    setShowOnboarding,
    currentOnboardingStep,
    setCurrentOnboardingStep,
    skipOnboarding,
  } = useOnboarding();
  const [completing, setCompleting] = useState(false);

  if (!showOnboarding) return null;

  const step = STEPS[currentOnboardingStep] ?? STEPS[0];
  const isLast = currentOnboardingStep >= STEPS.length - 1;

  const complete = async () => {
    setCompleting(true);
    try {
      await supabase.auth.updateUser({
        data: { has_completed_onboarding: true },
      });
    } catch (e) {
      // Even if the metadata update fails, dismiss the modal.
      console.error("Failed to save onboarding state", e);
    } finally {
      setCompleting(false);
      setShowOnboarding(false);
    }
  };

  const goNext = () => {
    if (isLast) {
      complete();
    } else {
      setCurrentOnboardingStep(currentOnboardingStep + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-gray-900 shadow-xl">
        <h2 className="text-xl font-semibold">{step.title}</h2>
        <p className="mt-2 text-sm text-gray-600">{step.description}</p>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full ${
                  i === currentOnboardingStep ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => skipOnboarding()}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              Skip
            </button>
            <button
              onClick={goNext}
              disabled={completing}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isLast
                ? completing
                  ? "Finishing..."
                  : "Finish"
                : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
