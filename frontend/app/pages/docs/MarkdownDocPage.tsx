"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import DocumentationViewer from "../../components/docs/DocumentationViewer";
import { loadDocContent, docPathMap } from "../../lib/utils/docsLoader";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const MarkdownDocPage: React.FC = () => {
  const { docId } = useParams<{ docId: string }>();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const {
    planClasses,
    planDocLinkClasses,
    planCardClasses,
    planDocContentClasses,
  } = usePlanStyling();

  useEffect(() => {
    const loadContent = async () => {
      if (!docId) return;

      setLoading(true);
      setError(null);

      try {
        // In a real implementation, this would load the actual markdown file
        // For now, we'll use a placeholder
        const docContent = await loadDocContent(docPathMap[docId] || docId);
        setContent(docContent);
      } catch (err) {
        console.error("Error loading documentation:", err);
        setError("Failed to load documentation content.");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [docId]);

  if (loading) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${planClasses}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-white rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-white rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-white rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-white rounded w-4/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-white rounded w-3/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${planClasses}`}>
        <div className={`${planCardClasses} rounded-xl p-6 text-center`}>
          <h2 className={`text-xl font-semibold mb-2`}>Error</h2>
          <p>{error}</p>
          <Link
            href="/docs"
            className={`inline-flex items-center mt-4 ${planDocLinkClasses}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documentation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${planDocContentClasses}`}>
      <div className="mb-6">
        <Link
          href="/docs"
          className={`inline-flex items-center ${planDocLinkClasses}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </Link>
      </div>

      <div className={`${planCardClasses} rounded-xl p-6`}>
        <DocumentationViewer content={content} />
      </div>
    </div>
  );
};

export default MarkdownDocPage;
