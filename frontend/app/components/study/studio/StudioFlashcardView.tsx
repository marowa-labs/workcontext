import React, { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Shuffle,
  CheckCircle2,
  X,
  Lightbulb,
  Maximize2,
  Minimize2,
  Trash2,
} from "lucide-react";
import { Button } from "../../ui/button";
import { StudioItem } from "./types";

interface StudioFlashcardViewProps {
  item: StudioItem;
  onBack: () => void;
  onDelete?: (id: string) => void;
  onToggleFullscreen?: (item: StudioItem) => void;
  isFullscreen?: boolean;
}

interface Flashcard {
  front: string;
  back: string;
  category?: string;
  difficulty?: string;
  hint?: string;
}

export function StudioFlashcardView({
  item,
  onBack,
  onDelete,
  onToggleFullscreen,
  isFullscreen,
}: StudioFlashcardViewProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    try {
      return typeof item.content === "string"
        ? JSON.parse(item.content)
        : item.content;
    } catch {
      return [];
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set());

  const currentCard = flashcards[currentIndex];
  const progress = ((studiedCards.size / flashcards.length) * 100).toFixed(0);

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      setStudiedCards(new Set([...studiedCards, currentIndex]));
    }
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setStudiedCards(new Set());
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getCategoryIcon = (category?: string) => {
    // Return a colored dot based on category
    const colors: Record<string, string> = {
      definition: "bg-blue-500",
      concept: "bg-purple-500",
      application: "bg-green-500",
      comparison: "bg-orange-500",
      critical: "bg-red-500",
    };
    return colors[category?.toLowerCase() || ""] || "bg-gray-500";
  };

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <span className="cursor-pointer hover:text-gray-600" onClick={onBack}>
            Studio
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900">Flashcards</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No flashcards available
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col bg-white ${isFullscreen ? "h-full" : "h-full"} animate-in slide-in-from-right-4 duration-200`}>
      {/* Breadcrumbs */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        <span
          className="cursor-pointer hover:text-gray-600 transition-colors"
          onClick={onBack}>
          Studio
        </span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 truncate max-w-[140px]">Flashcards</span>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600 font-medium">
            {currentIndex + 1} / {flashcards.length}
          </span>
          <span className="mx-2 text-gray-300">•</span>
          <span className="text-xs text-gray-600">
            {studiedCards.size} studied
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-blue-600"
            onClick={handleShuffle}
            title="Shuffle">
            <Shuffle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-blue-600"
            onClick={handleReset}
            title="Reset Progress">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
            onClick={() => onDelete?.(item.id)}
            title="Delete Flashcards">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400"
            onClick={() => onToggleFullscreen?.(item)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-gray-500 w-8">
            {progress}%
          </span>
        </div>
      </div>

      {/* Flashcard Display */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Card Metadata */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {currentCard.category && (
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${getCategoryIcon(currentCard.category)}`}
                  />
                  <span className="text-xs text-gray-600 capitalize">
                    {currentCard.category}
                  </span>
                </div>
              )}
            </div>
            {currentCard.difficulty && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getDifficultyColor(currentCard.difficulty)}`}>
                {currentCard.difficulty}
              </span>
            )}
          </div>

          {/* The Card */}
          <div
            className="relative w-full h-80 cursor-pointer perspective-1000"
            onClick={handleFlip}>
            <div
              className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}>
              {/* Front */}
              <div className="absolute inset-0 backface-hidden">
                <div className="h-full border-2 border-gray-200 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-8 flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-center">
                    <div className="inline-block px-3 py-1 bg-white rounded-full text-[10px] font-bold text-indigo-600 mb-4">
                      QUESTION
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-snug">
                      {currentCard.front}
                    </h2>
                  </div>
                  <div className="absolute bottom-6 text-xs text-gray-400">
                    Click to reveal answer
                  </div>
                </div>
              </div>

              {/* Back */}
              <div className="absolute inset-0 backface-hidden rotate-y-180">
                <div className="h-full border-2 border-gray-200 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-8 flex flex-col items-center justify-center shadow-lg">
                  <div className="text-center w-full">
                    <div className="inline-block px-3 py-1 bg-white rounded-full text-[10px] font-bold text-green-600 mb-4">
                      ANSWER
                    </div>
                    <p className="text-lg text-gray-800 leading-relaxed">
                      {currentCard.back}
                    </p>
                    {studiedCards.has(currentIndex) && (
                      <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium">Studied</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hint Button */}
          {currentCard.hint && !isFlipped && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHint(!showHint);
                }}>
                <Lightbulb className="w-3.5 h-3.5 mr-1.5" />
                {showHint ? "Hide Hint" : "Need a Hint?"}
              </Button>
              {showHint && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  💡 {currentCard.hint}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              variant="outline"
              className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              variant="default"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
