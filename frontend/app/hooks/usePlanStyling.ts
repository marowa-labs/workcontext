import { useState } from "react";

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
 * Custom hook for plan styling - all users get the same full-featured styling
 * @param _plan Ignored - all plans get the same styling
 * @returns Styling configuration
 */
const usePlanStyling = (
  _plan: "free" | "pro" | "team" | "enterprise" = "free",
) => {
  // All users get the same full-featured styling
  const [styling] = useState<PlanStyling>({
    backgroundColor: "bg-gray-100",
    textColor: "text-black",
    borderColor: "border-white",
    buttonColor: "bg-white",
    buttonHoverColor: "bg-white",
    accentColor: "text-black",
    planDocContentClasses: "bg-white dark:bg-white text-black text-black",
    planDocHeadingClasses: "text-black text-black",
    planDocLinkClasses:
      "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300",
    planCardClasses: "bg-white dark:bg-white border border-white border-white",
  });

  return styling;
};

export { usePlanStyling };
