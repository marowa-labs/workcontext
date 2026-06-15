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
  BarChart3,
  HelpCircle,
  X,
  ChevronRight,
  Activity,
  CheckSquare,
  Layout,
  StickyNote,
  Loader2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { supabase } from "../../lib/supabase/client";

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
            }),
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
      title: "Go to Workspaces",
      description: "Navigate to your workspaces",
      icon: <Command className="w-4 h-4" />,
      category: "navigate",
      action: () => {
        onClose();
        router.push("/spaces");
      },
    },
    {
      id: "analytics",
      title: "View Analytics",
      description: "Platform-wide analytics and insights",
      icon: <BarChart3 className="w-4 h-4" />,
      category: "analyze",
      action: () => {
        onClose();
        router.push("/analytics");
      },
    },
    {
      id: "stats",
      title: "View Stats",
      description: "Your personal KPIs and performance metrics",
      icon: <Activity className="w-4 h-4" />,
      category: "analyze",
      action: () => {
        onClose();
        router.push("/stats");
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

  // ---- Real search results state ----
  interface SearchResult {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    status?: string;
    workspaceId?: string;
    workspaceName?: string;
    score: number;
  }

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const performRealSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(
        "/api/search?q=" + encodeURIComponent(q) + "&limit=10",
        {
          headers: token ? { Authorization: "Bearer " + token } : {},
        },
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced API search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performRealSearch(searchQuery);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, performRealSearch]);

  const handleSearchResultClick = (result: SearchResult) => {
    onClose();
    switch (result.type) {
      case "workspace":
        router.push("/dashboard/workspaces/" + result.id);
        break;
      case "space":
        router.push(
          "/dashboard/workspaces/" + result.workspaceId + "/projects",
        );
        break;
      case "task":
        router.push("/dashboard/workspaces/" + result.workspaceId + "/kanban");
        break;
      case "chat":
        window.dispatchEvent(
          new CustomEvent("open-ai-chat", {
            detail: { sessionId: result.status },
          }),
        );
        break;
      case "note":
      case "document":
        router.push("/projects/" + result.id);
        break;
    }
  };

  const getSearchResultIcon = (type: string) => {
    switch (type) {
      case "workspace":
        return <Layout className="w-4 h-4" />;
      case "space":
        return <FolderOpen className="w-4 h-4" />;
      case "task":
        return <CheckSquare className="w-4 h-4" />;
      case "chat":
        return <MessageSquare className="w-4 h-4" />;
      case "note":
        return <StickyNote className="w-4 h-4" />;
      case "document":
        return <FileText className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  // Filter commands based on search
  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    },
    {} as Record<string, CommandItem[]>,
  );

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
            prev < filteredCommands.length - 1 ? prev + 1 : prev,
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
    [isOpen, filteredCommands, selectedIndex, onClose],
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
          {/* Static commands section */}
          {filteredCommands.length > 0 &&
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
                          isSelected ? "bg-muted" : "hover:bg-muted/50",
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
            })}

          {/* Real-time search results from API */}
          {searchQuery.trim().length > 0 && searchResults.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Search Results
              </div>
              {searchResults.map((result, idx) => (
                <button
                  key={result.type + "-" + result.id}
                  onClick={() => handleSearchResultClick(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-muted-foreground">
                    {getSearchResultIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {result.title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {result.subtitle}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-border" />
                </button>
              ))}
            </div>
          )}

          {/* Empty state when nothing matches */}
          {filteredCommands.length === 0 &&
            searchQuery.trim().length > 0 &&
            !searchLoading &&
            searchResults.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <p>No results found for &quot;{searchQuery}&quot;</p>
                <p className="text-sm mt-1">Try different keywords</p>
              </div>
            )}

          {searchLoading && (
            <div className="px-4 py-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </div>
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
