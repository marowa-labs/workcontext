"use client";

import { useState, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { AlertTriangle } from "lucide-react";
import { StatisticsPopover } from "./statistics-popover";
import WordLimitService from "../../lib/utils/wordLimitService";

interface BottomBarProps {
  wordCount: number;
  charCount: number;
  editor?: Editor | null;
  wordLimitExceeded?: boolean;
}

export function BottomBar({
  wordCount,
  charCount,
  editor,
  wordLimitExceeded = false,
}: BottomBarProps) {
  const [wordLimitInfo, setWordLimitInfo] = useState<any>(null);

  // Fetch word limit info
  useEffect(() => {
    const fetchWordLimitInfo = async () => {
      try {
        const wordLimitService = WordLimitService.getInstance();
        const info = await wordLimitService.getAIWordLimitInfo();
        setWordLimitInfo(info);
      } catch (error) {
        console.error("Error fetching AI word limit info:", error);
      }
    };

    fetchWordLimitInfo();
  }, []);

  return (
    <>
      <div className="flex h-10 items-center justify-between border-t border-white bg-white px-4">
        <div className="flex items-center text-black font-medium gap-2">
          <StatisticsPopover
            editor={editor ?? null}
            wordCount={wordCount}
            charCount={charCount}
          />

          {/* Word limit warning */}
          {wordLimitExceeded && (
            <div className="flex items-center text-red-600 text-sm ml-2">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>AI Word limit reached</span>
            </div>
          )}

          {/* Word limit indicator */}
          {wordLimitInfo && wordLimitInfo.wordLimit !== -1 && (
            <div className="text-xs text-black ml-2">
              {wordLimitInfo.wordsUsed.toLocaleString()} /{" "}
              {wordLimitInfo.wordLimit.toLocaleString()} AI words
            </div>
          )}

          {/* AI Usage Tracker - REMOVED as per requirement */}
        </div>
      </div>
    </>
  );
}
