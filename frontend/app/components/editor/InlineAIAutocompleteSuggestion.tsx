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
  // This component will be rendered as a decoration in the editor
  // The actual implementation will be handled by the extension
  return null;
};

export default InlineAIAutocompleteSuggestion;
