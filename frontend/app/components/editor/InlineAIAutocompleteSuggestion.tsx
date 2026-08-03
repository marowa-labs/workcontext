"use client";

import React from "react";

interface InlineAIAutocompleteSuggestionProps {
  suggestion: string;
  onAccept: () => void;
  onDismiss: () => void;
}

const InlineAIAutocompleteSuggestion: React.FC<
  InlineAIAutocompleteSuggestionProps
> = ({ suggestion, onAccept, onDismiss }) => {
  if (!suggestion) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm shadow-sm">
      <span className="text-indigo-600 dark:text-indigo-400 font-medium text-xs uppercase tracking-wide">
        AI
      </span>
      <span className="text-gray-700 dark:text-gray-300 italic max-w-md truncate">
        {suggestion}
      </span>
      <div className="flex items-center gap-1 ml-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAccept();
          }}
          className="text-xs px-2 py-0.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          title="Press Tab to accept"
        >
          Tab
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
          className="text-xs px-2 py-0.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Press Esc to dismiss"
        >
          Esc
        </button>
      </div>
    </div>
  );
};

export default InlineAIAutocompleteSuggestion;
