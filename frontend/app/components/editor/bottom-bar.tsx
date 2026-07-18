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
}

export function BottomBar({ wordCount, charCount, editor }: BottomBarProps) {
  return (
    <>
      <div className="flex h-10 items-center justify-between border-t border-white bg-white px-4">
        <div className="flex items-center text-black font-medium gap-2">
          <StatisticsPopover
            editor={editor ?? null}
            wordCount={wordCount}
            charCount={charCount}
          />
        </div>
      </div>
    </>
  );
}
