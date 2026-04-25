"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Quote,
  ArrowRight,
} from "lucide-react";
import { SmartCitationBadge } from "../components/citations/SmartCitationBadge";
import { useToast } from "../hooks/use-toast";

interface Paper {
  externalId: string;
  title: string;
  abstract: string | null;
  authors: { name: string; authorId?: string }[];
  year: number | null;
  venue: string | null;
  citationCount: number | null;
  url: string | null;
  openAccessPdf: string | null;
  publicationTypes?: string[];
  tldr?: { text: string } | null;
}

interface PaperCardProps {
  paper: Paper;
  onSave: (paper: Paper) => Promise<void>;
  isSaved?: boolean;
  isPanel?: boolean;
  onClick?: () => void;
}

export const PaperCard: React.FC<PaperCardProps> = ({
  paper,
  onSave,
  isSaved = false,
  isPanel = false,
  onClick,
}) => {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(isSaved);

  // Mock Scite Data (Randomized for effect)
  const mockScite = React.useMemo(() => {
    // Deterministic pseudorandom based on title length
    const seed = paper.title.length;
    return {
      supporting: seed % 7,
      mentioning: (seed * 2) % 15,
      contrasting: seed % 3 === 0 ? 1 : 0,
    };
  }, [paper.title]);

  const { toast } = useToast();

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) return;

    setLoading(true);
    try {
      await onSave(paper);
      setSaved(true);
      toast({
        title: "Paper Saved",
        description: "Added to your Sources Library.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error saving paper:", error);
      toast({
        title: "Save Failed",
        description: "Could not save paper. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ...

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow relative group ${
        onClick ? "cursor-pointer hover:border-blue-200" : ""
      }`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mb-2`}>
            <span className="font-medium text-blue-600">
              {paper.year || "Unknown Year"}
            </span>
            <span>•</span>
            <span className="font-medium">
              {paper.venue || "Unknown Venue"}
            </span>
            {paper.citationCount !== null && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Quote className="w-3 h-3" />
                  {paper.citationCount}
                </span>
              </>
            )}
            {/* Study Type Badges */}
            {paper.publicationTypes?.map((type) => {
              if (
                [
                  "Review",
                  "Systematic Review",
                  "MetaAnalysis",
                  "ClinicalTrial",
                ].includes(type)
              ) {
                const colors: Record<string, string> = {
                  Review: "bg-purple-100 text-purple-800",
                  "Systematic Review": "bg-purple-100 text-purple-800",
                  MetaAnalysis: "bg-indigo-100 text-indigo-800",
                  ClinicalTrial: "bg-green-100 text-green-800",
                };
                return (
                  <span
                    key={type}
                    className={`inline-flex items-center px-2 py-0.5 rounded textxs font-medium ${colors[type] || "bg-gray-100 text-gray-800"}`}>
                    {type === "MetaAnalysis" ? "Meta-Analysis" : type}
                  </span>
                );
              }
              return null;
            })}

            {/* Smart Citation Badge (Scite) */}
            <div className="ml-auto">
              <SmartCitationBadge
                supporting={mockScite.supporting}
                mentioning={mockScite.mentioning}
                contrasting={mockScite.contrasting}
                size="sm"
              />
            </div>
          </div>

          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
            {paper.title}
          </h3>

          <div className="text-sm text-black dark:text-black mb-4 line-clamp-3">
            {paper.tldr?.text ? (
              <span className="font-semibold text-gray-900">
                TL;DR:{" "}
                <span className="font-normal text-gray-700">
                  {paper.tldr.text}
                </span>
              </span>
            ) : (
              paper.abstract || "No abstract available."
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {paper.authors.slice(0, isPanel ? 2 : 5).map((author, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-black">
                {author.name}
              </span>
            ))}
            {paper.authors.length > (isPanel ? 2 : 5) && (
              <span className="text-xs text-gray-500 flex items-center">
                +{paper.authors.length - (isPanel ? 2 : 5)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={handleSave}
            disabled={saved || loading}
            className={`flex items-center justify-center ${isPanel ? "p-1.5" : "p-2"} rounded-lg transition-colors ${
              saved
                ? "bg-green-100 text-green-700 cursor-default"
                : "bg-gray-100 hover:bg-gray-200 text-black"
            }`}
            title={saved ? "Saved to Library" : "Save to Library"}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : saved ? (
              <BookmarkCheck className={`${isPanel ? "w-4 h-4" : "w-5 h-5"}`} />
            ) : (
              <Bookmark className={`${isPanel ? "w-4 h-4" : "w-5 h-5"}`} />
            )}
          </button>

          {/* Translate Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Translation logic would go here
            }}
            className={`flex items-center justify-center gap-1 ${isPanel ? "p-1.5" : "p-2"} bg-white border border-gray-200 rounded-lg shadow-sm text-xs text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors`}
            title="Translate to Spanish">
            <span className="font-mono text-[10px]">EN</span>
            <ArrowRight className="w-3 h-3" />
            <span className="font-mono text-[10px]">ES</span>
          </button>

          {paper.openAccessPdf && (
            <a
              href={paper.openAccessPdf}
              onClick={(e) => e.stopPropagation()}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center ${isPanel ? "p-1.5" : "p-2"} rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors`}
              title="Open Access PDF">
              <BookOpen className={`${isPanel ? "w-4 h-4" : "w-5 h-5"}`} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
