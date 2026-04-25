"use client";

import React, { useEffect, useState } from "react";

const AIAutocompleteSuggestion = ({
  suggestion,
  isVisible,
  onAccept,
  onDismiss,
}) => {
  const [displaySuggestion, setDisplaySuggestion] = useState("");

  // Animate the suggestion text character by character for a typing effect
  useEffect(() => {
    if (!suggestion || !isVisible) {
      setDisplaySuggestion("");
      return;
    }

    let index = 0;
    setDisplaySuggestion("");

    const timer = setInterval(() => {
      if (index < suggestion.length) {
        setDisplaySuggestion(suggestion.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 30); // Adjust speed as needed

    return () => clearInterval(timer);
  }, [suggestion, isVisible]);

  if (!isVisible || !suggestion) {
    return null;
  }

  return (
    <div className="ai-autocomplete-popup">
      <div className="ai-autocomplete-content">
        <span className="ai-autocomplete-text">{displaySuggestion}</span>
        <span className="ai-autocomplete-cursor"></span>
      </div>
      <div className="ai-autocomplete-actions">
        <button
          className="ai-autocomplete-accept"
          onClick={onAccept}
          title="Press Tab to accept"
        >
          Accept (Tab)
        </button>
        <button
          className="ai-autocomplete-dismiss"
          onClick={onDismiss}
          title="Press Esc to dismiss"
        >
          Dismiss (Esc)
        </button>
      </div>
    </div>
  );
};

export default AIAutocompleteSuggestion;
