import { Metadata } from "next";
import ResearchInterface from "../../research/ResearchInterface";

// Metadata for SEO
export const metadata: Metadata = {
  title: "Research | ScholarForge AI",
  description: "Intelligent Paper Discovery and Analysis",
};

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white">
      <ResearchInterface />
    </div>
  );
}
