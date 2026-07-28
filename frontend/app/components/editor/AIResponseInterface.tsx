"use client";

import React, { useMemo, useState } from "react";
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

function cleanSuggestion(text: string): string {
  let cleaned = text;

  // Strip everything after a horizontal rule line (***, ---, ___)
  cleaned = cleaned.replace(/\n\s*[*_\-]{3,}\s*\n[\s\S]*$/, "");
  cleaned = cleaned.replace(/^[*_\-]{3,}\s*\n[\s\S]*$/, "");

  // Strip leading labels like "**Here is a revised version:**"
  cleaned = cleaned.replace(
    /^(\*\*)?(Here is|Here's|Here is the)\s+(a|an|the)?\s*(?:revised|improved|simplified|expanded|paraphrased|shortened)\s+(?:version|text|passage|sentence|output)(\*\*)?:?\.?\s*\n+/i,
    "",
  );

  // Strip generic "**Label:**" prefix on first line
  cleaned = cleaned.replace(/^\*\*.*?\*\*:?\s*\n+/, "");

  // Strip trailing "Why I made these changes:" / "Here's why:" / etc.
  cleaned = cleaned.replace(
    /\n\s*\*?(?:Why I (?:made|did) these changes?|Here'?s why|Key changes?|What I changed|Summary of changes):?\*?[\s\S]*$/i,
    "",
  );

  // Strip trailing follow-up questions / sign-offs
  cleaned = cleaned.replace(
    /\n\s*(?:Does that|Let me know|Is this|Would you|Feel free|Hope this|Please let me know|I hope).*$/i,
    "",
  );

  // Remove remaining markdown bold markers around the text
  cleaned = cleaned.replace(/^\s*\*{2,}/, "").replace(/\*{2,}\s*$/, "");

  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();

  return cleaned;
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
  const [feedbackGiven, setFeedbackGiven] = useState<boolean>(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>("");

  const cleanedSuggestion = useMemo(() => cleanSuggestion(suggestion), [suggestion]);

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
      await apiClient.post("/api/ai/feedback", {
        action,
        originalText,
        suggestion,
        isHelpful: positive,
        feedback: "",
      });
      setFeedbackGiven(true);
      setShowFeedbackInput(true);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setFeedbackGiven(true);
      setShowFeedbackInput(true);
    }
  };

  const handleSubmitFeedbackText = async () => {
    try {
      await apiClient.post("/api/ai/feedback", {
        action,
        originalText,
        suggestion,
        isHelpful: false,
        feedback: feedbackText,
      });
      setFeedbackText("");
      setShowFeedbackInput(false);
    } catch (error) {
      console.error("Error submitting feedback text:", error);
      setFeedbackText("");
      setShowFeedbackInput(false);
    }
  };

  const displayText = cleanedSuggestion || suggestion;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">
              {getActionTitle()}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          <div className="space-y-4">
            {action === "generate_citations" ? (
              <div className="text-sm text-gray-500">{displayText}</div>
            ) : action === "suggest_sources" ? (
              <div className="text-sm text-gray-500">{displayText}</div>
            ) : (
              <>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                    Original
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {originalText}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-1.5">
                    Suggestion
                  </h4>
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed">
                    {displayText}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t bg-gray-50 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {action !== "generate_citations" &&
                action !== "suggest_sources" && (
                  <>
                    <button
                      onClick={() => onApply(displayText)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1.5 text-sm font-medium"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Replace
                    </button>
                    <button
                      onClick={() => onInsertBelow(displayText)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-1.5 text-sm"
                    >
                      <FileText className="h-4 w-4" />
                      Insert Below
                    </button>
                  </>
                )}
              <button
                onClick={() => onCopy(displayText)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-1.5 text-sm"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
              <button
                onClick={onRegenerate}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-1.5 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </button>
            </div>
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
              Dismiss
            </button>
          </div>

          {/* Feedback */}
          {!feedbackGiven && (
            <div className="mt-3 pt-3 border-t flex items-center gap-3">
              <span className="text-xs text-gray-500">Was this helpful?</span>
              <button
                onClick={() => handleFeedback(true)}
                className="p-1.5 rounded hover:bg-green-100 text-green-600"
                title="Helpful"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className="p-1.5 rounded hover:bg-red-100 text-red-600"
                title="Not helpful"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {showFeedbackInput && (
            <div className="mt-3">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Tell us more..."
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={2}
              />
              <div className="flex justify-end gap-2 mt-1.5">
                <button
                  onClick={() => setShowFeedbackInput(false)}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedbackText}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {feedbackGiven && !showFeedbackInput && (
            <div className="mt-3 text-xs text-green-600">
              Thanks for your feedback!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIResponseInterface;
