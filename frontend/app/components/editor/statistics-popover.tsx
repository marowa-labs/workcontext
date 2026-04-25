"use client";

import React, { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import {
  BarChart3,
  Clock,
  FileText,
  Type,
  Hash,
  AlignLeft,
} from "lucide-react";
import WordLimitService from "../../lib/utils/wordLimitService";
import { AIUsageTracker } from "./AIUsageTracker";

interface StatisticsPopoverProps {
  editor: Editor | null;
  wordCount: number;
  charCount: number;
}

export function StatisticsPopover({
  editor,
  wordCount,
  charCount,
}: StatisticsPopoverProps) {
  const [aiWordInfo, setAiWordInfo] = useState<any>(null);

  useEffect(() => {
    const fetchAIWordInfo = async () => {
      try {
        const wordLimitService = WordLimitService.getInstance();
        const info = await wordLimitService.getAIWordLimitInfo();
        setAiWordInfo(info);
      } catch (error) {
        console.error("Error fetching AI word info:", error);
      }
    };

    fetchAIWordInfo();
  }, []);

  if (!editor) return null;
  if (!editor.state) return null;

  const content = editor.state.doc.textContent;
  const paragraphs = content
    ? content.split(/\n\n+/).filter((p) => p.trim()).length
    : 0;
  const sentences = content
    ? content.split(/[.!?]+/).filter((s) => s.trim()).length
    : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const speakingTime = Math.max(1, Math.ceil(wordCount / 150));
  const avgWordLength =
    wordCount > 0 ? (charCount / wordCount).toFixed(1) : "0";
  const avgSentenceLength =
    sentences > 0 ? Math.round(wordCount / sentences) : 0;

  const stats = [
    {
      icon: <Type className="h-4 w-4" />,
      label: "Words",
      value: wordCount.toLocaleString(),
    },
    {
      icon: <Hash className="h-4 w-4" />,
      label: "Characters",
      value: charCount.toLocaleString(),
    },
    {
      icon: <AlignLeft className="h-4 w-4" />,
      label: "Paragraphs",
      value: paragraphs,
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: "Sentences",
      value: sentences,
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: "Reading time",
      value: `${readingTime} min`,
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: "Speaking time",
      value: `${speakingTime} min`,
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs font-medium text-gray-600 hover:text-black">
          <BarChart3 className="h-3.5 w-3.5 text-black" />
          {wordCount.toLocaleString()} words
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 bg-white border border-gray-200"
        align="start">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Document Statistics</h4>

          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <div className="text-muted-foreground">{stat.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-sm font-medium">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Combined AI Usage and Autocomplete Analytics Section */}
          <div className="pt-3 border-t border-gray-200 space-y-3">
            <h4 className="text-sm font-medium">AI Usage</h4>
            {/* AI Word Usage */}
            {aiWordInfo && aiWordInfo.wordLimit !== -1 && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">AI Words Used</span>
                  <span>{aiWordInfo.wordsUsed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">AI Word Limit</span>
                  <span>{aiWordInfo.wordLimit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    AI Words Remaining
                  </span>
                  <span>
                    {aiWordInfo.wordLimit === -1
                      ? "Unlimited"
                      : Math.max(
                          0,
                          aiWordInfo.wordLimit - aiWordInfo.wordsUsed,
                        ).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (aiWordInfo.wordsUsed / aiWordInfo.wordLimit) * 100,
                      )}%`,
                    }}></div>
                </div>
              </>
            )}

            {/* Autocomplete Analytics */}
            <div className="pt-3">
              <h4 className="text-sm font-medium mb-2">
                Autocomplete Analytics
              </h4>
              <AIUsageTracker />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Avg. word length</span>
              <span>{avgWordLength} chars</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Avg. sentence length
              </span>
              <span>{avgSentenceLength} words</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
