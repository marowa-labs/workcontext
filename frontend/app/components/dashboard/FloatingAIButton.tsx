"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface FloatingAIButtonProps {
  isOpen: boolean;
  onClick: () => void;
  pathname?: string;
}

export function FloatingAIButton({ isOpen, onClick, pathname }: FloatingAIButtonProps) {
  // Don't render if panel is open or on full AI page
  if (isOpen || pathname === "/ai") return null;

  return (
    <>
      {/* Floating AI Button */}
      <button
        onClick={onClick}
        className="fixed bottom-6 right-6 z-40 group"
        aria-label="Open AI Chat"
      >
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-white rounded-lg shadow-lg border border-gray-200 text-sm text-gray-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Notion AI
          <span className="ml-1.5 text-xs text-gray-400">Ctrl+J</span>
        </div>

        {/* Button */}
        <div className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl hover:scale-105 transition-all duration-200">
          <Sparkles className="w-5 h-5 text-gray-700" />
        </div>
      </button>
    </>
  );
}

export default FloatingAIButton;
