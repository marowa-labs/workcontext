"use client";

import React, { useState, useEffect } from "react";
import { X, BookOpen, Plus } from "lucide-react";
import CitationService from "../../lib/utils/citationService";
import ProjectService from "../../lib/utils/projectService";

interface CitationSuggestion {
  id: string;
  title: string;
  author: string;
  year: string;
  source: string;
}

interface AutoCitationSuggestionProps {
  content: string;
  citations: CitationSuggestion[];
  onAddCitation: (citation: any) => void;
  onDismiss: () => void;
  projectId: string;
}

interface Project {
  id: string;
  title: string;
  citation_style: string;
  // ... other project properties
}

const AutoCitationSuggestion: React.FC<AutoCitationSuggestionProps> = ({
  content,
  citations,
  onAddCitation,
  onDismiss,
  projectId,
}) => {
  const [selectedCitation, setSelectedCitation] =
    useState<CitationSuggestion | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  // Fetch project data to get citation style
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) return;

      try {
        const projectData = await ProjectService.getProjectById(projectId);
        setProject(projectData);
      } catch (err: any) {
        console.error("Error fetching project data:", err);
        setError(
          err.message ||
            "Failed to load project citation style. Using default APA style.",
        );
      }
    };

    fetchProjectData();
  }, [projectId]);

  const handleAddCitation = async () => {
    if (!selectedCitation || !projectId) return;

    setIsAdding(true);
    setError(null);

    try {
      // Create the citation in the database
      const createdCitation = await CitationService.createCitation(
        projectId,
        selectedCitation,
      );

      // Format citation based on project style
      const citationStyle = project?.citation_style || "apa";
      const formattedCitation = CitationService.formatCitation(
        createdCitation,
        citationStyle,
      );

      // Call the onAddCitation callback with the formatted citation
      onAddCitation({
        ...createdCitation,
        formatted: formattedCitation,
      });

      // Close the suggestion
      onDismiss();
    } catch (error: any) {
      console.error("Error adding citation:", error);
      setError(error.message || "Failed to add citation. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md">
      <div className="bg-white rounded-xl shadow-2xl border border-white">
        {/* Header */}
        <div className="p-4 border-b border-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-purple-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-black">
              Citation Suggestion
            </h3>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-black" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <p className="text-black mb-4">
            This content may benefit from a citation:
          </p>
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-black italic">"{content}"</p>
          </div>

          {citations && citations.length > 0 ? (
            <>
              <h4 className="font-medium text-black mb-2">
                Suggested Sources
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {citations.map((citation, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCitation === citation
                        ? "border-purple-500 bg-purple-50"
                        : "border-white hover:border-white"
                    }`}
                    onClick={() => setSelectedCitation(citation)}>
                    <div className="flex items-start">
                      <div className="flex-1">
                        <h5 className="font-medium text-black">
                          {citation.title}
                        </h5>
                        <p className="text-sm text-black">
                          {citation.author} ({citation.year})
                        </p>
                        {citation.source && (
                          <p className="text-xs text-black mt-1">
                            {citation.source}
                          </p>
                        )}
                      </div>
                      {selectedCitation === citation && (
                        <div className="flex-shrink-0 ml-2 mt-1">
                          <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2 mt-4">
                <button
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  onClick={handleAddCitation}
                  disabled={!selectedCitation || isAdding}>
                  {isAdding ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Citation
                    </span>
                  )}
                </button>
                <button
                  className="px-4 py-2 border border-white text-black rounded-lg hover:bg-gray-50"
                  onClick={onDismiss}>
                  Dismiss
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <BookOpen className="h-8 w-8 text-black mx-auto mb-2" />
              <p className="text-black">
                No citations found for this content
              </p>
              <button
                className="mt-2 text-purple-600 hover:text-purple-800"
                onClick={onDismiss}>
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoCitationSuggestion;
