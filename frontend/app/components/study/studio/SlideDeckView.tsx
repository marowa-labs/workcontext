import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Download,
  Play,
  Clock,
  Trash2,
  Minimize2,
} from "lucide-react";
import { Button } from "../../ui/button";
import { StudioItem } from "./types";

interface Slide {
  number: number;
  type: "title" | "content" | "section" | "conclusion";
  title: string;
  subtitle?: string;
  content?: string; // markdown
  layout?: "text" | "two-column" | "image-text";
  notes?: string;
}

interface SlideDeckViewProps {
  slides: Slide[];
  metadata?: {
    totalSlides: number;
    estimatedDuration?: string;
    sources?: string[];
  };
  item?: StudioItem;
  onBack?: () => void;
  onDelete?: (id: string) => void;
  onToggleFullscreen?: (item: StudioItem) => void;
  isFullscreen?: boolean;
}

export function SlideDeckView({
  slides,
  metadata,
  item,
  onDelete,
  onToggleFullscreen,
  isFullscreen,
}: SlideDeckViewProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(true);

  const currentSlide = slides[currentSlideIndex];

  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const goToPreviousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const jumpToSlide = (index: number) => {
    setCurrentSlideIndex(index);
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log("Exporting to PDF");
  };

  // Render markdown-style content
  const renderContent = (content?: string) => {
    if (!content) return null;

    // Simple markdown rendering for bullets
    const lines = content.split("\\n");
    return (
      <div className="space-y-3">
        {lines.map((line, index) => {
          if (line.startsWith("- ")) {
            return (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-teal-600 mt-2 flex-shrink-0" />
                <p className="text-gray-700 text-lg leading-relaxed">
                  {line.substring(2)}
                </p>
              </div>
            );
          } else if (line.startsWith("**") && line.endsWith("**")) {
            return (
              <h3
                key={index}
                className="text-xl font-semibold text-gray-900 mt-4">
                {line.replace(/\*\*/g, "")}
              </h3>
            );
          } else if (line.trim()) {
            return (
              <p key={index} className="text-gray-700 text-lg leading-relaxed">
                {line}
              </p>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F9FAFB]">
      {/* Left Sidebar - Slide Thumbnails */}
      <div className="w-[200px] border-r border-gray-200 bg-white flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Slides
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => jumpToSlide(index)}
              className={`w-full rounded-lg border-2 transition-all hover:border-teal-400 ${
                currentSlideIndex === index
                  ? "border-teal-600 bg-teal-50"
                  : "border-gray-200 bg-white"
              }`}>
              <div className="aspect-video p-2 flex flex-col items-center justify-center">
                <div className="text-xs font-medium text-gray-900 text-center line-clamp-2">
                  {slide.title}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  Slide {slide.number}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Slide Display */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <div className="w-full max-w-[900px] bg-white rounded-lg shadow-xl aspect-video p-12 relative">
            {/* Slide Number Badge */}
            <div className="absolute bottom-4 right-4 text-sm text-gray-400 font-medium">
              {currentSlide.number} / {slides.length}
            </div>

            {/* Render based on slide type */}
            {currentSlide.type === "title" ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
                  {currentSlide.title}
                </h1>
                {currentSlide.subtitle && (
                  <p className="text-2xl text-teal-600 font-medium">
                    {currentSlide.subtitle}
                  </p>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <h2 className="text-4xl font-bold text-teal-600 mb-8 border-b-4 border-teal-200 pb-3">
                  {currentSlide.title}
                </h2>
                <div className="flex-1 overflow-y-auto">
                  {renderContent(currentSlide.content)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="border-t border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousSlide}
              disabled={currentSlideIndex === 0}
              className="h-8">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextSlide}
              disabled={currentSlideIndex === slides.length - 1}
              className="h-8">
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* <Button variant="outline" size="sm" className="h-8">
              <Play className="w-4 h-4 mr-1" />
              Play
            </Button> */}
            {metadata?.estimatedDuration && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{metadata.estimatedDuration} remaining</span>
              </div>
            )}
            {item && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="h-8 text-gray-500 hover:text-red-500 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => item && onToggleFullscreen?.(item)}
              className="h-8">
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 mr-1" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Maximize className="w-4 h-4 mr-1" />
                  Fullscreen
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="h-8">
              <Download className="w-4 h-4 mr-1" />
              Export to PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Presenter Notes */}
      {showNotes && (
        <div className="w-[300px] border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Presenter Notes
            </h3>
            <button
              onClick={() => setShowNotes(false)}
              className="text-gray-400 hover:text-gray-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {currentSlide.notes ? (
              <p className="text-sm text-gray-700 leading-relaxed">
                {currentSlide.notes}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">
                No speaker notes for this slide
              </p>
            )}

            {/* Source References */}
            {metadata?.sources && metadata.sources.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Source References
                </h4>
                <div className="space-y-1">
                  {metadata.sources.slice(0, 3).map((source, index) => (
                    <div key={index} className="text-xs text-gray-600">
                      • {source}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
