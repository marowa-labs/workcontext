import { useState, useEffect } from "react";

export interface PlanStyling {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  buttonColor: string;
  buttonHoverColor: string;
  accentColor: string;
  planDocContentClasses: string;
  planDocHeadingClasses: string;
  planDocLinkClasses: string;
  planCardClasses: string;
}

/**
 * Custom hook to determine styling based on user's plan
 * @param plan The user's plan ('free', 'pro', 'team', 'enterprise')
 * @returns Styling configuration for the plan
 */
const usePlanStyling = (
  plan: "free" | "pro" | "team" | "enterprise" = "free"
) => {
  const [styling, setStyling] = useState<PlanStyling>({
    backgroundColor: "bg-gray-100",
    textColor: "text-black",
    borderColor: "border-white",
    buttonColor: "bg-white",
    buttonHoverColor: "bg-white",
    accentColor: "text-black",
    planDocContentClasses:
      "bg-white dark:bg-white text-black text-black",
    planDocHeadingClasses: "text-black text-black",
    planDocLinkClasses:
      "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300",
    planCardClasses:
      "bg-white dark:bg-white border border-white border-white",
  });

  useEffect(() => {
    // Define styling based on plan
    const planStyling: Record<string, PlanStyling> = {
      free: {
        backgroundColor: "bg-gray-100",
        textColor: "text-black",
        borderColor: "border-white",
        buttonColor: "bg-white",
        buttonHoverColor: "bg-white",
        accentColor: "text-black",
        planDocContentClasses:
          "bg-white dark:bg-white text-black text-black",
        planDocHeadingClasses: "text-black text-black",
        planDocLinkClasses:
          "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300",
        planCardClasses:
          "bg-white dark:bg-white border border-white border-white",
      },
      pro: {
        backgroundColor: "bg-blue-50",
        textColor: "text-blue-900",
        borderColor: "border-blue-300",
        buttonColor: "bg-blue-600",
        buttonHoverColor: "bg-blue-700",
        accentColor: "text-blue-600",
        planDocContentClasses:
          "bg-blue-50 dark:bg-white text-blue-900 text-black",
        planDocHeadingClasses: "text-blue-900 text-black",
        planDocLinkClasses:
          "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300",
        planCardClasses:
          "bg-blue-50 dark:bg-white border border-blue-200 border-white",
      },
      team: {
        backgroundColor: "bg-purple-50",
        textColor: "text-purple-900",
        borderColor: "border-purple-300",
        buttonColor: "bg-purple-600",
        buttonHoverColor: "bg-purple-700",
        accentColor: "text-purple-600",
        planDocContentClasses:
          "bg-purple-50 dark:bg-white text-purple-900 text-black",
        planDocHeadingClasses: "text-purple-900 text-black",
        planDocLinkClasses:
          "text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300",
        planCardClasses:
          "bg-purple-50 dark:bg-white border border-purple-200 border-white",
      },
      enterprise: {
        backgroundColor: "bg-indigo-50",
        textColor: "text-indigo-900",
        borderColor: "border-indigo-300",
        buttonColor: "bg-indigo-600",
        buttonHoverColor: "bg-indigo-700",
        accentColor: "text-indigo-600",
        planDocContentClasses:
          "bg-indigo-50 dark:bg-white text-indigo-900 text-black",
        planDocHeadingClasses: "text-indigo-900 text-black",
        planDocLinkClasses:
          "text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300",
        planCardClasses:
          "bg-indigo-50 dark:bg-white border border-indigo-200 border-white",
      },
    };

    setStyling(planStyling[plan] || planStyling.free);
  }, [plan]);

  return styling;
};

export { usePlanStyling };
