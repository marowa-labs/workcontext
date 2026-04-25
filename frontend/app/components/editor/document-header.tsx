"use client";

import { useState, useEffect } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import type { Editor } from "@tiptap/react";
import { SidebarPanel } from "./main-editor";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  FileText,
  Microscope,
  Settings,
  History,
  Download,
  MoreHorizontal,
  Keyboard,
  Maximize,
  Search,
  ShieldAlert,
  CloudUpload,
  CheckCircle2,
  Save,
  Share2,
} from "lucide-react";
import { saveProjectContent } from "../../lib/utils/editorService";
import { ExportModal } from "./export-modal";

interface DocumentHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  onOpenSettings?: () => void;
  onOpenShortcuts?: () => void;
  onToggleFocusMode?: () => void;
  isFocusMode?: boolean;
  projectId?: string;
  onOpenHistory?: () => void;
  pageColor?: string;
  onPageColorChange?: (color: string) => void;
  editor?: Editor | null;
  onOpenResearch?: () => void;
  activePanel?: SidebarPanel;
  onTogglePanel?: (panel: SidebarPanel) => void;
  provider?: HocuspocusProvider | null;
  isCollaborative?: boolean;
  onShare?: () => void;
  allowedPanels?: SidebarPanel[];
}

export function DocumentHeader({
  title,
  onTitleChange,
  onOpenSettings,
  onOpenShortcuts,
  onToggleFocusMode,
  isFocusMode = false,
  projectId,
  onOpenHistory,
  editor,
  onOpenResearch,
  activePanel,
  onTogglePanel,
  provider,
  saveStatus = "saved",
  onManualSave,
  isCollaborative = false,
  onShare, // New prop
  allowedPanels = [
    "ai-chat",
    "citations",
    "paper-search",
    "citation-check",
    "team-chat",
  ],
}: DocumentHeaderProps & {
  saveStatus?: "saved" | "saving" | "unsaved";
  onManualSave?: () => void;
  onShare?: () => void; // New prop type
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [showExport, setShowExport] = useState(false);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  // Listen to awareness updates from Hocuspocus/Y.js
  useEffect(() => {
    if (!isCollaborative || !provider || !provider.awareness) {
      setActiveUsers([]);
      return;
    }

    const handleUpdate = () => {
      // Use optional chaining just in case, though the check above safeguards it mostly
      const states = provider?.awareness?.getStates();
      if (!states) return;

      // Explicitly cast the Array.from result
      const users = (Array.from(states.entries()) as [number, any][]).map(
        ([clientId, state]) => {
          return {
            id: clientId,
            name: state.user?.name || "Anonymous",
            color: state.user?.color || "#94a3b8",
            status: state.cursor ? "editing" : "online",
          };
        },
      );

      // Filter out duplicates if any (awareness might have stale entries)
      // and sort to keep current user first or consistent order
      setActiveUsers(users);
    };

    provider.awareness.on("update", handleUpdate);

    // Initial load
    handleUpdate();

    return () => {
      provider?.awareness?.off("update", handleUpdate);
    };
  }, [provider, isCollaborative]);

  // Handle title save to backend
  const handleTitleSave = async (newTitle: string) => {
    try {
      if (projectId) {
        // Save the new title to the backend
        await saveProjectContent(projectId, null, newTitle);
        // Update the parent component state
        onTitleChange(newTitle);
      }
    } catch (error) {
      console.error("Error saving document title:", error);
      // Revert to the previous title if save fails
      setLocalTitle(title);
    } finally {
      setIsEditing(false);
    }
  };

  // Handle title change
  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle);
  };

  // Handle blur event (when user clicks away)
  const handleBlur = () => {
    if (localTitle.trim() !== "" && localTitle !== title) {
      handleTitleSave(localTitle);
    } else {
      // If title is empty or unchanged, revert to original
      setLocalTitle(title);
      setIsEditing(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (localTitle.trim() !== "" && localTitle !== title) {
        handleTitleSave(localTitle);
      } else {
        // If title is empty or unchanged, revert to original
        setLocalTitle(title);
        setIsEditing(false);
      }
    } else if (e.key === "Escape") {
      // Cancel editing on Escape key
      setLocalTitle(title);
      setIsEditing(false);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-blue-100 bg-[#F0F9FF] px-6">
      <div className="flex items-center space-x-4">
        <div className="h-6 w-px bg-[#E5E7EB]"></div>

        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-[#475569]" />

          {isEditing ? (
            <Input
              value={localTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="h-8 w-64 text-sm font-medium bg-white border-[#E5E7EB] text-[#0F172A]"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium text-[#0F172A] hover:text-[#2563EB] transition-colors">
              {title}
            </button>
          )}
        </div>

        {/* Save Status Indicator */}
        <div className="flex items-center gap-2 ml-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onManualSave}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors text-xs font-medium text-gray-500">
                  {saveStatus === "saving" && (
                    <>
                      <CloudUpload className="h-3.5 w-3.5 animate-pulse text-blue-500" />
                      <span className="text-blue-500">Saving...</span>
                    </>
                  )}
                  {saveStatus === "saved" && (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Saved</span>
                    </>
                  )}
                  {saveStatus === "unsaved" && (
                    <>
                      <Save className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-amber-500">Save</span>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {saveStatus === "saved"
                  ? "All changes saved"
                  : saveStatus === "saving"
                    ? "Saving changes..."
                    : "Unsaved changes"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          {isCollaborative && (
            <div className="flex -space-x-2 mr-3">
              {activeUsers.map((user: any) => (
                <Tooltip key={user.id}>
                  <TooltipTrigger asChild>
                    <Avatar
                      className="h-8 w-8 border-2 border-white ring-2 ring-gray-100 hover:scale-110 transition-transform cursor-pointer"
                      style={{ borderColor: user.color }}>
                      <AvatarImage src="/placeholder.svg" alt={user.name} />
                      <AvatarFallback
                        style={{ backgroundColor: user.color }}
                        className="text-white text-xs font-medium">
                        {user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white border-white">
                    <div className="text-xs">
                      <p className="font-medium text-[#0F172A]">{user.name}</p>
                      <p className="text-[#475569]">
                        {user.status === "editing"
                          ? `Editing: ${user.cursorPosition || "document"}`
                          : user.status}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleFocusMode}
                className={`px-3 py-2 border rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-all ${
                  isFocusMode
                    ? "bg-blue-50 border-blue-400 text-blue-700"
                    : "bg-white border-white text-black hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                }`}>
                <Maximize className="h-4 w-4" />
                <span>Focus</span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-white border-slate-200">
              Focus Mode
            </TooltipContent>
          </Tooltip>

          {onShare && (
            <button
              onClick={onShare}
              className="px-3 py-2 border rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-all bg-white border-white text-black hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          )}

          <button
            onClick={() => setShowExport(true)}
            className={`px-3 py-2 border rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-all ${"bg-white border-white text-black hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"}`}>
            <Download className="h-3.5 w-3.5 text-black" />
            <span>Export</span>
          </button>

          {isCollaborative && (
            <button
              onClick={() => {
                if (onOpenHistory) {
                  onOpenHistory();
                }
              }}
              className={`px-3 py-2 border rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-all ${"bg-white border-white text-black hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"}`}>
              <History className="h-4 w-4" />
              <span>History</span>
            </button>
          )}

          {allowedPanels.includes("ai-chat") && (
            <button
              onClick={() => {
                if (onOpenResearch) {
                  onOpenResearch();
                }
              }}
              className={`px-3 py-2 border rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-all ${"bg-white border-white text-black hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"}`}>
              <Microscope className="h-3.5 w-3.5 text-black" />
              <span>Assistant</span>
            </button>
          )}

          {allowedPanels.includes("paper-search") && (
            <button
              onClick={() => onTogglePanel?.("paper-search")}
              className={`px-3 py-2 border rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-all ${
                activePanel === "paper-search"
                  ? "bg-blue-50 border-blue-400 text-blue-700"
                  : "bg-white border-white text-black hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
              }`}>
              <Search className="h-3.5 w-3.5" />
              <span>Discovery</span>
            </button>
          )}

          {allowedPanels.includes("citations") && (
            <button
              onClick={() => onTogglePanel?.("citations")}
              className={`px-3 py-2 border rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-all ${
                activePanel === "citations"
                  ? "bg-blue-50 border-blue-400 text-blue-700"
                  : "bg-white border-white text-black hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
              }`}>
              <FileText className="h-3.5 w-3.5" />
              <span>Citations</span>
            </button>
          )}

          {allowedPanels.includes("plagiarism-check") && (
            <button
              onClick={() => onTogglePanel?.("plagiarism-check")}
              className={`px-3 py-2 border rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-all ${
                activePanel === "plagiarism-check"
                  ? "bg-blue-50 border-blue-400 text-blue-700"
                  : "bg-white border-white text-black hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
              }`}>
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Originality</span>
            </button>
          )}

          {/* If Team Chat is allowed, showing it here might be useful too if it's not handled elsewhere, 
              but usually it's in the sidebar. Let's stick to cleaning existing buttons. */}

          <div className="h-6 w-px bg-gray-300 mx-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 bg-gray-500 border border-white shadow-sm hover:bg-white hover:border-white hover:text-black">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            {/* ... */}
            <DropdownMenuContent align="end" className="bg-white border-white">
              {/* Core functionality menu items */}
              <DropdownMenuItem
                onClick={onOpenShortcuts}
                className="hover:bg-blue-50 cursor-pointer text-black">
                <Keyboard className="h-4 w-4 mr-2" />
                <span>Keyboard Shortcuts</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onOpenSettings}
                className="hover:bg-blue-50 cursor-pointer text-black">
                <Settings className="h-4 w-4 mr-2" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>

        <ExportModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          editor={editor || null}
          documentTitle={title}
          projectId={projectId || ""}
        />
      </div>
    </header>
  );
}
