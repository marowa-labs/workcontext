"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  Search,
  Sparkles,
  MessageSquare,
  Plus,
  FileText,
  FolderOpen,
  Zap,
  BarChart3,
  HelpCircle,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: "ai" | "create" | "navigate" | "analyze";
}

interface SlashCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
}

export function SlashCommandPalette({
  isOpen,
  onClose,
  workspaceId,
}: SlashCommandPaletteProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Define all available commands
  const commands: CommandItem[] = [
    {
      id: "ai-chat",
      title: "AI Chat",
      description: "Open AI assistant to help with your work",
      icon: <MessageSquare className="w-4 h-4" />,
      shortcut: "⌘J",
      category: "ai",
      action: () => {
        // Open AI chat - will be handled by parent
        onClose();
        window.dispatchEvent(new CustomEvent("open-ai-chat"));
      },
    },
    {
      id: "summarize",
      title: "Summarize Space",
      description: "AI analyzes and summarizes workspace content",
      icon: <Sparkles className="w-4 h-4" />,
      category: "ai",
      action: () => {
        onClose();
        if (workspaceId) {
          window.dispatchEvent(
            new CustomEvent("summarize-workspace", {
              detail: { workspaceId },
            })
          );
        }
      },
    },
    {
      id: "create-task",
      title: "Create Task",
      description: "Quickly add a new task to your workspace",
      icon: <Plus className="w-4 h-4" />,
      shortcut: "⌘T",
      category: "create",
      action: () => {
        onClose();
        window.dispatchEvent(new CustomEvent("create-quick-task"));
      },
    },
    {
      id: "create-project",
      title: "Create Space",
      description: "Create a new workspace or project",
      icon: <FolderOpen className="w-4 h-4" />,
      category: "create",
      action: () => {
        onClose();
        window.dispatchEvent(new CustomEvent("create-project"));
      },
    },
    {
      id: "search",
      title: "Search Everything",
      description: "Search across all your content",
      icon: <Search className="w-4 h-4" />,
      shortcut: "⌘K",
      category: "navigate",
      action: () => {
        onClose();
        window.dispatchEvent(new CustomEvent("open-search"));
      },
    },
    {
      id: "go-workspace",
      title: "Go to Workspace",
      description: "Navigate to your workspaces",
      icon: <Command className="w-4 h-4" />,
      category: "navigate",
      action: () => {
        onClose();
        router.push("/projects");
      },
    },
    {
      id: "analytics",
      title: "View Analytics",
      description: "See workspace insights and metrics",
      icon: <BarChart3 className="w-4 h-4" />,
      category: "analyze",
      action: () => {
        onClose();
        if (workspaceId) {
          router.push(`/dashboard/workspace/${workspaceId}/analytics`);
        } else {
          // If no workspace context, go to projects page
          router.push("/projects");
        }
      },
    },
    {
      id: "stats",
      title: "View Stats",
      description: "See workspace statistics and metrics",
      icon: <BarChart3 className="w-4 h-4" />,
      category: "analyze",
      action: () => {
        onClose();
        if (workspaceId) {
          router.push(`/dashboard/workspace/${workspaceId}/analytics`);
        } else {
          // If no workspace context, go to projects page
          router.push("/projects");
        }
      },
    },
    {
      id: "help",
      title: "How to Use",
      description: "Learn commands and features",
      icon: <HelpCircle className="w-4 h-4" />,
      category: "navigate",
      action: () => {
        onClose();
        router.push("/guide");
      },
    },
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const categoryOrder = ["ai", "create", "navigate", "analyze"];
  const categoryLabels: Record<string, string> = {
    ai: "AI Actions",
    create: "Create",
    navigate: "Navigate",
    analyze: "Analyze",
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, filteredCommands, selectedIndex, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSelectedIndex(0);
      setSearchQuery("");
    }
  }, [isOpen]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  if (!isOpen) return null;

  let globalIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-card rounded-xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <Command className="w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-foreground placeholder-muted-foreground outline-none text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Commands List */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <p>No commands found</p>
              <p className="text-sm mt-1">Try a different search</p>
            </div>
          ) : (
            categoryOrder.map((category) => {
              const cmds = groupedCommands[category];
              if (!cmds || cmds.length === 0) return null;

              return (
                <div key={category}>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {categoryLabels[category]}
                  </div>
                  {cmds.map((cmd) => {
                    const isSelected = globalIndex === selectedIndex;
                    const currentIndex = globalIndex++;

                    return (
                      <button
                        key={cmd.id}
                        onClick={() => cmd.action()}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                          isSelected
                            ? "bg-muted"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-muted-foreground">
                          {cmd.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {cmd.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {cmd.description}
                          </p>
                        </div>
                        {cmd.shortcut && (
                          <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">
                            {cmd.shortcut}
                          </kbd>
                        )}
                        <ChevronRight className="w-4 h-4 text-border" />
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card rounded border border-border">
                ↑↓
              </kbd>{" "}
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card rounded border border-border">
                ↵
              </kbd>{" "}
              to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card rounded border border-border">
                esc
              </kbd>{" "}
              to close
            </span>
          </div>
          <span>{filteredCommands.length} commands</span>
        </div>
      </div>
    </div>
  );
}
