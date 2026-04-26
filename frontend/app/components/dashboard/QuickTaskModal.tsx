"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckSquare,
  X,
  Loader2,
  ChevronDown,
  Folder,
  Flag,
  Calendar,
} from "lucide-react";
import { supabase } from "../../lib/supabase/client";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface Workspace {
  id: string;
  name: string;
}

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickTaskModal({ isOpen, onClose, onSuccess }: QuickTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);

  // Load workspaces
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchWorkspaces = async () => {
      setLoadingWorkspaces(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        const response = await fetch("/api/workspaces", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (response.ok) {
          const data = await response.json();
          // Handle different response structures
          const workspaceList = data.workspaces || data || [];
          setWorkspaces(workspaceList);
          
          // Auto-select first workspace if available
          if (workspaceList.length > 0 && !selectedWorkspace) {
            setSelectedWorkspace(workspaceList[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch workspaces:", error);
      } finally {
        setLoadingWorkspaces(false);
      }
    };
    
    fetchWorkspaces();
  }, [isOpen, selectedWorkspace]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setShowWorkspaceDropdown(false);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === "Escape" && !showWorkspaceDropdown) {
        onClose();
      }
    },
    [isOpen, onClose, showWorkspaceDropdown]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !selectedWorkspace) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch("/api/workspaces/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          workspaceId: selectedWorkspace,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          status: "todo",
        }),
      });
      
      if (response.ok) {
        onSuccess?.();
        onClose();
      } else {
        const error = await response.json();
        console.error("Failed to create task:", error);
        alert("Failed to create task. Please try again.");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedWorkspaceName = workspaces.find(
    (w) => w.id === selectedWorkspace
  )?.name;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card rounded-xl shadow-2xl border border-border overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <CheckSquare className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Quick Create Task
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title" className="text-sm font-medium">
              Task Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="task-title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background border-border"
              autoFocus
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-desc" className="text-sm font-medium">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="task-desc"
              placeholder="Add more details about this task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background border-border min-h-[80px] resize-none"
              disabled={loading}
            />
          </div>

          {/* Workspace Selection */}
          <div className="space-y-2 relative">
            <Label className="text-sm font-medium">
              Workspace <span className="text-red-500">*</span>
            </Label>
            <button
              type="button"
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              disabled={loadingWorkspaces || workspaces.length === 0}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-md border border-border bg-background text-left transition-colors",
                loadingWorkspaces && "opacity-50 cursor-not-allowed",
                !loadingWorkspaces && "hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-muted-foreground" />
                <span className={cn(
                  "text-sm",
                  selectedWorkspaceName ? "text-foreground" : "text-muted-foreground"
                )}>
                  {loadingWorkspaces 
                    ? "Loading workspaces..." 
                    : selectedWorkspaceName 
                      ? selectedWorkspaceName 
                      : "Select a workspace"
                  }
                </span>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                showWorkspaceDropdown && "rotate-180"
              )} />
            </button>
            
            {/* Dropdown */}
            {showWorkspaceDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-auto">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => {
                      setSelectedWorkspace(workspace.id);
                      setShowWorkspaceDropdown(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                      selectedWorkspace === workspace.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-muted-foreground" />
                      {workspace.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Priority</Label>
            <div className="flex gap-2">
              {[
                { value: "low", label: "Low", color: "bg-green-500" },
                { value: "medium", label: "Medium", color: "bg-yellow-500" },
                { value: "high", label: "High", color: "bg-red-500" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value as any)}
                  disabled={loading}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-all",
                    priority === p.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border hover:border-primary/30 text-muted-foreground"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", p.color)} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="bg-muted hover:bg-muted/80"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim() || !selectedWorkspace}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Create Task
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 bg-muted/50 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card rounded border border-border">Esc</kbd>
              {" "}to close
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card rounded border border-border">↵</kbd>
              {" "}to create
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
