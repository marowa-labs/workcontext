"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface AILoadingProps {
  onCancel: () => void;
}

const AILoading: React.FC<AILoadingProps> = ({ onCancel }) => {
  const messages = [
    "Analyzing your text...",
    "Thinking...",
    "Generating suggestions...",
    "Almost done...",
  ];

  const [currentMessage, setCurrentMessage] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 text-center sm:max-w-lg md:max-w-xl">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Sparkles className="h-12 w-12 text-purple-600 animate-pulse" />
            <div className="absolute inset-0 h-12 w-12 rounded-full bg-purple-600 opacity-20 animate-ping"></div>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-black mb-2">
          Processing with AI
        </h3>
        <p className="text-black mb-6">{messages[currentMessage]}</p>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-purple-600 h-2 rounded-full animate-pulse"
            style={{ width: "60%" }}></div>
        </div>

        <button
          onClick={onCancel}
          className="px-4 py-2 text-black hover:text-black">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AILoading;
