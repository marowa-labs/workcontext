"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { cn } from "../../lib/utils";
import { List, FileText, Sparkles, Users } from "lucide-react";
import WorkspaceService from "../../lib/utils/workspaceService";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    prompt: string,
    outlineType: "standard" | "smart" | "empty",
    workspaceId?: string
  ) => void;
  isCreating: boolean;
}

export function NewProjectModal({
  isOpen,
  onClose,
  onConfirm,
  isCreating,
}: NewProjectModalProps) {
  const [prompt, setPrompt] = useState("");
  const [outlineType, setOutlineType] = useState<
    "standard" | "smart" | "empty"
  >("standard");
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(
    null
  );

  // Load workspaces when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchWorkspaces = async () => {
        try {
          const userWorkspaces = await WorkspaceService.getWorkspaces();
          setWorkspaces(userWorkspaces);
          // Optionally set the first workspace as default
          if (userWorkspaces.length > 0) {
            setSelectedWorkspace(userWorkspaces[0].id);
          }
        } catch (err) {
          console.error("Error fetching workspaces:", err);
          // Don't show error to user as workspaces are optional
        }
      };
      fetchWorkspaces();
    }
  }, [isOpen]);

  const wordCount = prompt.trim().split(/\s+/).filter(Boolean).length;
  const isWeakPrompt = wordCount < 5 && prompt.length > 0;

  const handleSubmit = () => {
    onConfirm(prompt, outlineType, selectedWorkspace || undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 bg-white text-gray-900 border-gray-200 shadow-xl">
        <div className="p-6 pb-2">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold">
              What are you writing today?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., A research paper on the effects of climate change on marine biodiversity"
                className="min-h-[120px] resize-none text-base p-4 border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Prompt Strength Indicator */}
            <div className="flex items-center justify-between text-xs">
              <span
                className={cn(
                  "font-medium transition-colors",
                  isWeakPrompt ? "text-orange-500" : "text-gray-500"
                )}
              >
                {prompt.length === 0
                  ? "Enter a topic to get started"
                  : isWeakPrompt
                  ? "Weak prompt: Add more context for higher quality generations"
                  : "Strong prompt"}
              </span>
              <span className="text-gray-400">{prompt.length} chars</span>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 space-y-4">
          <Label className="text-sm font-medium text-gray-700">
            Generate outline
          </Label>

          <div className="space-y-3">
            {/* Option 1: Standard Headings */}
            <div
              onClick={() => setOutlineType("standard")}
              className={cn(
                "flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-white",
                outlineType === "standard"
                  ? "border-blue-600 bg-white shadow-sm"
                  : "border-transparent bg-white border-gray-100 hover:border-gray-200"
              )}
            >
              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5 shrink-0",
                  outlineType === "standard"
                    ? "border-blue-600"
                    : "border-gray-300"
                )}
              >
                {outlineType === "standard" && (
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                )}
              </div>
              <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-gray-500 mr-3 shrink-0">
                <List className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900">
                  Standard headings
                </div>
                <div className="text-xs text-gray-500">
                  Add standard headings (Introduction, Methods, Results etc.)
                </div>
              </div>
            </div>

            {/* Option 2: Smart Headings */}
            <div
              onClick={() => setOutlineType("smart")}
              className={cn(
                "flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-white",
                outlineType === "smart"
                  ? "border-blue-600 bg-white shadow-sm"
                  : "border-transparent bg-white border-gray-100 hover:border-gray-200"
              )}
            >
              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5 shrink-0",
                  outlineType === "smart"
                    ? "border-blue-600"
                    : "border-gray-300"
                )}
              >
                {outlineType === "smart" && (
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                )}
              </div>
              <div className="h-10 w-10 bg-purple-50 rounded flex items-center justify-center text-purple-600 mr-3 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900">
                  Smart headings
                </div>
                <div className="text-xs text-gray-500">
                  AI will generate headings based on your document prompt
                </div>
              </div>
            </div>

            {/* Option 3: No Headings */}
            <div
              onClick={() => setOutlineType("empty")}
              className={cn(
                "flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-white",
                outlineType === "empty"
                  ? "border-blue-600 bg-white shadow-sm"
                  : "border-transparent bg-white border-gray-100 hover:border-gray-200"
              )}
            >
              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5 shrink-0",
                  outlineType === "empty"
                    ? "border-blue-600"
                    : "border-gray-300"
                )}
              >
                {outlineType === "empty" && (
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                )}
              </div>
              <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-gray-500 mr-3 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900">
                  No headings
                </div>
                <div className="text-xs text-gray-500">
                  Start with a blank document
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Workspace (optional)
            </Label>
            <select
              value={selectedWorkspace || ""}
              onChange={(e) => setSelectedWorkspace(e.target.value || null)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
            >
              <option value="">None (Personal Project)</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Select a workspace to organize your project with your team
            </p>
          </div>
        </div>

        <DialogFooter className="p-6 pt-2 flex justify-end">
          {/* Autocomplete settings removed as requested */}
          <Button
            onClick={handleSubmit}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
          >
            {isCreating ? "Creating..." : "Start Writing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
