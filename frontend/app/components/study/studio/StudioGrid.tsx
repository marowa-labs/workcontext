import React from "react";
import {
  Sparkles,
  FileText,
  Network,
  Layout,
  Hash,
  HelpCircle,
  Table,
  PenTool,
  MoreVertical,
  Loader2,
  BarChart3,
  Presentation,
  Trash2,
  PenBox,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Button } from "../../ui/button";
import { cn } from "../../../lib/utils";
import { StudioItem } from "./types";

interface StudioGridProps {
  notes: StudioItem[];
  onItemClick: (item: StudioItem) => void;
  onActionClick?: (action: string) => void;
  loadingActions?: Set<string>;
  onDeleteNote?: (id: string) => void;
  onRenameNote?: (id: string, currentTitle: string) => void;
  onDownloadNote?: (item: StudioItem) => void;
}

export function StudioGrid({
  notes,
  onItemClick,
  onActionClick,
  loadingActions = new Set(),
  onDeleteNote,
  onRenameNote,
  onDownloadNote,
}: StudioGridProps) {
  const actions = [
    {
      id: "audio_overview",
      label: "Audio Overview",
      icon: Sparkles,
      color: "indigo",
      badge: "NEW",
    },
    {
      id: "lit_review",
      label: "Lit Review",
      icon: FileText,
      color: "blue",
      badge: "NEW",
    },
    { id: "mind_map", label: "Mind Map", icon: Network, color: "gray" },
    {
      id: "reports",
      label: "Reports",
      icon: Layout,
      color: "amber",
      badge: "BETA",
    },
    { id: "flashcards", label: "Flashcards", icon: Hash, color: "rose" },
    { id: "quiz", label: "Quiz", icon: HelpCircle, color: "blue" },
    {
      id: "data_table",
      label: "Data table",
      icon: Table,
      color: "indigo",
      badge: "BETA",
    },
    {
      id: "infographic",
      label: "Infographic",
      icon: BarChart3,
      color: "purple",
      badge: "BETA",
    },
    {
      id: "slide_deck",
      label: "Slide deck",
      icon: Presentation,
      color: "teal",
      badge: "BETA",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 min-w-[240px]">
      {/* Audio/Language Promo */}
      <div className="bg-green-50/50 border border-green-100 p-3 rounded-xl">
        <p className="text-[11px] text-green-800">
          Create an Audio Overview in:{" "}
          <span className="text-blue-600 cursor-pointer hover:underline">
            हिन्दी, বাংলা, ગુજરાતી, ಕನ್ನಡ, മലായാളം, मराठी, ਪੰਜਾਬੀ, தமிழ், తెలుగు
          </span>
        </p>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => onActionClick?.(action.id)}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all text-center gap-3 group relative h-[100px]">
            {/* Badge */}
            {action.badge && (
              <span className="absolute top-2 left-2 bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded-full scale-90 origin-top-left">
                {action.badge}
              </span>
            )}
            {/* Edit Icon Hover */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1">
              <PenTool className="w-3 h-3 text-gray-300" />
            </div>

            <div
              className={cn(
                "p-2 rounded-xl transition-colors",
                loadingActions.has(action.id)
                  ? "bg-indigo-100 text-indigo-600"
                  : `bg-${action.color}-50 text-${action.color}-600 group-hover:bg-${action.color}-100`,
              )}>
              {loadingActions.has(action.id) ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <action.icon className="w-5 h-5" />
              )}
            </div>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Recent Notes Section */}
      <div className="space-y-4 pt-4 border-t border-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
            Recent Notes
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] font-bold text-indigo-600 uppercase">
            View All
          </Button>
        </div>

        <div className="space-y-3">
          {notes.map((note, i) => {
            const isProcessing =
              note.time === "Processing" ||
              note.id.includes("generating") ||
              note.time === "Error";

            return (
              <div
                key={i}
                onClick={() => !isProcessing && onItemClick(note)}
                className={cn(
                  "group p-3 rounded-2xl border border-gray-50 bg-white transition-all flex gap-3 relative",
                  isProcessing
                    ? "opacity-60 cursor-not-allowed bg-gray-50/50 border-gray-100"
                    : "hover:shadow-md hover:border-indigo-100 cursor-pointer",
                )}>
                <div
                  className={cn(
                    "p-2 rounded-lg transition-colors shrink-0",
                    isProcessing
                      ? "bg-gray-100 text-gray-400"
                      : "bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600",
                  )}>
                  <note.icon
                    className={cn(
                      "w-4 h-4",
                      isProcessing &&
                        note.time === "Processing" &&
                        "animate-pulse text-indigo-400",
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800 leading-tight truncate">
                    {note.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {note.badge && (
                      <span className="bg-indigo-50 text-indigo-600 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        {note.badge}
                      </span>
                    )}
                    <p className="text-[10px] text-gray-400 font-medium truncate">
                      {note.time}
                    </p>
                  </div>
                </div>
                {!isProcessing && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()} // Prevent card click
                        className="h-6 w-6 text-gray-300 opacity-0 group-hover:opacity-100 absolute top-2 right-2 hover:bg-white/50 data-[state=open]:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-40 z-50 bg-white border-gray-200">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onRenameNote?.(note.id, note.title);
                        }}
                        className="gap-2 text-xs">
                        <PenBox className="w-3.5 h-3.5" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadNote?.(note);
                        }}
                        className="gap-2 text-xs">
                        <Download className="w-3.5 h-3.5" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNote?.(note.id);
                        }}
                        className="gap-2 text-xs text-red-600 focus:text-red-700 bg-red-50 focus:bg-red-100 mt-1">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
