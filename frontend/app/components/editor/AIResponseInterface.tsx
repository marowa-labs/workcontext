"use client";

import React, { useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Copy,
  FileText,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  X,
} from "lucide-react";
import { apiClient } from "../../lib/utils/apiClient";
import ReactDiffViewer from "react-diff-viewer";

interface AIResponseInterfaceProps {
  action: string;
  originalText: string;
  suggestion: string;
  onClose: () => void;
  onApply: (text: string) => void;
  onInsertBelow: (text: string) => void;
  onCopy: (text: string) => void;
  onRegenerate: () => void;
  onAddCitation?: (citation: any) => void;
  onAddSource?: (source: any) => void;
}

const AIResponseInterface: React.FC<AIResponseInterfaceProps> = ({
  action,
  originalText,
  suggestion,
  onClose,
  onApply,
  onInsertBelow,
  onCopy,
  onRegenerate,
  onAddCitation,
  onAddSource,
}) => {
  const [viewMode, setViewMode] = useState<"side-by-side" | "inline" | "clean">(
    "side-by-side",
  );
  const [feedbackGiven, setFeedbackGiven] = useState<boolean>(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>("");

  const getActionTitle = () => {
    const titles: Record<string, string> = {
      improve_writing: "Improved Writing",
      fix_grammar: "Grammar Fix",
      simplify: "Simplified Text",
      expand: "Expanded Text",
      academic_tone: "Academic Tone",
      paraphrase: "Paraphrased Text",
      continue_writing: "Continuation",
      research_topic: "Research Topic Exploration",
      generate_citations: "Generated Citations",
      check_plagiarism: "Plagiarism Check",
      suggest_sources: "Suggested Sources",
      generate_outline: "Generated Outline",
      compare_arguments: "Compared Arguments",
      custom_prompt: "Custom Request",
    };

    return titles[action] || "AI Suggestion";
  };

  const handleFeedback = async (positive: boolean) => {
    try {
      // Send feedback to the backend
      await apiClient.post("/api/ai/feedback", {
        action,
        originalText,
        suggestion,
        isHelpful: positive,
        feedback: "",
      });

      setFeedbackGiven(true);

      // Show feedback input for additional comments
      setShowFeedbackInput(true);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      // Still update UI even if submission fails
      setFeedbackGiven(true);
      setShowFeedbackInput(true);
    }
  };

  const handleSubmitFeedbackText = async () => {
    try {
      // Send additional feedback text to the backend
      await apiClient.post("/api/ai/feedback", {
        action,
        originalText,
        suggestion,
        isHelpful: false, // This is additional feedback, not a rating
        feedback: feedbackText,
      });

      // Reset feedback input
      setFeedbackText("");
      setShowFeedbackInput(false);
    } catch (error) {
      console.error("Error submitting feedback text:", error);
      // Still update UI even if submission fails
      setFeedbackText("");
      setShowFeedbackInput(false);
    }
  };

  // Parse citations from suggestion if it's a citation generation response
  const parseCitations = () => {
    if (action !== "generate_citations") return null;

    try {
      // Try to parse as JSON if it's a structured response
      const parsed = JSON.parse(suggestion);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // If not JSON, treat as plain text
      return null;
    }
  };

  // Parse sources from suggestion if it's a source suggestion response
  const parseSources = () => {
    if (action !== "suggest_sources") return null;

    try {
      // Try to parse as JSON if it's a structured response
      const parsed = JSON.parse(suggestion);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // If not JSON, treat as plain text
      return null;
    }
  };

  const citations = parseCitations();
  const sources = parseSources();

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:max-w-5xl lg:max-w-6xl">
        {/* Header */}
        <div className="p-4 border-b border-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-purple-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-black">
              {getActionTitle()} Suggestion
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-black" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {viewMode === "side-by-side" && !citations && !sources && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* Original Text */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-black">
                    Original
                  </h4>
                </div>
                <div className="bg-gray-50 border border-white rounded-lg p-4 h-64 overflow-auto">
                  <p className="text-black whitespace-pre-wrap">
                    {originalText}
                  </p>
                </div>
              </div>

              {/* Suggested Text */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-purple-700">
                    Suggestion
                  </h4>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 h-64 overflow-auto">
                  <p className="text-black whitespace-pre-wrap">
                    {suggestion}
                  </p>
                </div>
              </div>
            </div>
          )}

          {viewMode === "inline" && !citations && !sources && (
            <div className="border border-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-black">Changes</h4>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 min-h-64">
                <ReactDiffViewer
                  oldValue={originalText}
                  newValue={suggestion}
                  splitView={false}
                  disableWordDiff={false}
                  hideLineNumbers={true}
                  useDarkTheme={false}
                  styles={{
                    diffContainer: {
                      pre: {
                        lineHeight: "1.5",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      },
                    },
                    marker: {
                      padding: "0 3px",
                      borderRadius: "3px",
                    },
                    diffAdded: {
                      backgroundColor: "#dcfce7",
                      padding: "0 4px",
                    },
                    diffRemoved: {
                      backgroundColor: "#fee2e2",
                      padding: "0 4px",
                    },
                  }}
                />
              </div>
            </div>
          )}

          {viewMode === "clean" && !citations && !sources && (
            <div className="border border-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-black">
                  Suggestion
                </h4>
              </div>
              <div className="bg-white rounded-lg p-4 min-h-64">
                <p className="text-black whitespace-pre-wrap">
                  {suggestion}
                </p>
              </div>
            </div>
          )}

          {/* Citations View */}
          {citations && (
            <div className="border border-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-black">
                  Generated Citations
                </h4>
              </div>
              <div className="space-y-4">
                {citations.map((citation, index) => (
                  <div
                    key={index}
                    className="border border-white rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-black">
                          {citation.title}
                        </h5>
                        <p className="text-sm text-black">
                          {citation.author} ({citation.year})
                        </p>
                        {citation.source && (
                          <p className="text-sm text-black mt-1">
                            {citation.source}
                          </p>
                        )}
                      </div>
                      {onAddCitation && (
                        <button
                          onClick={() => onAddCitation(citation)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                          Add Citation
                        </button>
                      )}
                    </div>
                    {citation.abstract && (
                      <p className="text-sm text-black mt-2">
                        {citation.abstract}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sources View */}
          {sources && (
            <div className="border border-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-black">
                  Suggested Sources
                </h4>
              </div>
              <div className="space-y-4">
                {sources.map((source, index) => (
                  <div
                    key={index}
                    className="border border-white rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-black">
                          {source.title}
                        </h5>
                        <p className="text-sm text-black">
                          {source.author} ({source.year})
                        </p>
                        {source.journal && (
                          <p className="text-sm text-black mt-1">
                            {source.journal}
                          </p>
                        )}
                      </div>
                      {onAddSource && (
                        <button
                          onClick={() => onAddSource(source)}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                          Add Source
                        </button>
                      )}
                    </div>
                    {source.abstract && (
                      <p className="text-sm text-black mt-2">
                        {source.abstract}
                      </p>
                    )}
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                        View Source
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex items-center justify-center mt-4 space-x-2">
            <button
              onClick={() => setViewMode("side-by-side")}
              className={`px-3 py-1 text-sm rounded-lg ${
                viewMode === "side-by-side"
                  ? "bg-purple-100 text-purple-700"
                  : "text-black hover:bg-gray-100"
              }`}>
              Side by Side
            </button>
            <button
              onClick={() => setViewMode("inline")}
              className={`px-3 py-1 text-sm rounded-lg ${
                viewMode === "inline"
                  ? "bg-purple-100 text-purple-700"
                  : "text-black hover:bg-gray-100"
              }`}>
              Inline
            </button>
            <button
              onClick={() => setViewMode("clean")}
              className={`px-3 py-1 text-sm rounded-lg ${
                viewMode === "clean"
                  ? "bg-purple-100 text-purple-700"
                  : "text-black hover:bg-gray-100"
              }`}>
              Clean
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {action !== "generate_citations" &&
                action !== "suggest_sources" && (
                  <>
                    <button
                      onClick={() => onApply(suggestion)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Replace</span>
                    </button>
                    <button
                      onClick={() => onInsertBelow(suggestion)}
                      className="px-4 py-2 border border-white rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Insert Below</span>
                    </button>
                  </>
                )}
              <button
                onClick={() => onCopy(suggestion)}
                className="px-4 py-2 border border-white rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </button>
              <button
                onClick={onRegenerate}
                className="px-4 py-2 border border-white rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <span>Regenerate</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 text-black hover:text-black">
              Dismiss
            </button>
          </div>

          {/* Feedback Section */}
          {!feedbackGiven && (
            <div className="mt-4 pt-4 border-t border-white">
              <div className="flex items-center justify-between">
                <span className="text-sm text-black">Was this helpful?</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleFeedback(true)}
                    className="p-2 rounded-lg hover:bg-green-100 text-green-600"
                    title="Helpful">
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFeedback(false)}
                    className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                    title="Not helpful">
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {showFeedbackInput && (
            <div className="mt-3">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Tell us more..."
                className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={3}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => setShowFeedbackInput(false)}
                  className="px-3 py-1 text-black hover:text-black">
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedbackText}
                  className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Submit
                </button>
              </div>
            </div>
          )}

          {feedbackGiven && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg text-green-700 text-sm">
              Thanks for your feedback! This helps us improve.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIResponseInterface;
