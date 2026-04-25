"use client";

import { ChevronRight, Trash2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "../../ui/button";
import { StudioItem } from "./types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface StudioNoteViewProps {
  item: StudioItem;
  onBack: () => void;
  onDelete?: (id: string) => void;
  onToggleFullscreen?: (item: StudioItem) => void;
  isFullscreen?: boolean;
}

export function StudioNoteView({
  item,
  onBack,
  onDelete,
  onToggleFullscreen,
  isFullscreen,
}: StudioNoteViewProps) {
  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right-4 duration-200">
      {/* Breadcrumbs */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        <span
          className="cursor-pointer hover:text-gray-600 transition-colors"
          onClick={onBack}>
          Studio
        </span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 truncate max-w-[140px]">Note</span>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1"></div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
            onClick={() => onDelete?.(item.id)}
            title="Delete Note">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400"
            onClick={() => onToggleFullscreen?.(item)}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h1 className="text-lg font-bold text-gray-900 leading-tight">
          {item.title}
        </h1>

        <div className="space-y-4">
          <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            (Saved responses are view only)
          </div>
          <div
            className="prose prose-sm prose-indigo max-w-none text-gray-700 text-[13px] leading-relaxed 
            prose-headings:font-bold prose-headings:text-gray-900 
            prose-p:mb-4 prose-p:last:mb-0 
            prose-ul:list-disc prose-ul:ml-4 prose-li:marker:text-indigo-500
            prose-strong:font-bold prose-strong:text-gray-900">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {item.content || "No content available for this note."}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
