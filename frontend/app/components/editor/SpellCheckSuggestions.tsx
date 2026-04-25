"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, X } from "lucide-react";

interface SpellCheckSuggestionsProps {
  word: string;
  suggestions: string[];
  position: { x: number; y: number };
  onCorrect: (correction: string) => void;
  onIgnore: () => void;
  onAddToDictionary: () => void;
  onClose: () => void;
}

const SpellCheckSuggestions: React.FC<SpellCheckSuggestionsProps> = ({
  word,
  suggestions,
  position,
  onCorrect,
  onIgnore,
  onAddToDictionary,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleSuggestionClick = (suggestion: string) => {
    onCorrect(suggestion);
    onClose();
  };

  const handleIgnoreClick = () => {
    onIgnore();
    onClose();
  };

  const handleAddToDictionaryClick = () => {
    onAddToDictionary();
    onClose();
  };

  return (
    <div
      ref={popupRef}
      className="absolute z-50 bg-white border border-white rounded-lg shadow-lg py-2 min-w-[200px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}>
      <div className="px-4 py-2 border-b border-white">
        <div className="font-medium text-black">Spell Check</div>
        <div className="text-sm text-black">"{word}" is misspelled</div>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {suggestions.length > 0 ? (
          suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-black hover:text-black flex items-center"
              onClick={() => handleSuggestionClick(suggestion)}>
              <Check className="w-4 h-4 mr-2 text-green-500" />
              {suggestion}
            </button>
          ))
        ) : (
          <div className="px-4 py-2 text-black text-sm">
            No suggestions available
          </div>
        )}
      </div>

      <div className="border-t border-white pt-1">
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-black hover:text-black flex items-center"
          onClick={handleIgnoreClick}>
          <X className="w-4 h-4 mr-2 text-black" />
          Ignore
        </button>
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-black hover:text-black"
          onClick={handleAddToDictionaryClick}>
          Add to dictionary
        </button>
      </div>
    </div>
  );
};

export default SpellCheckSuggestions;
