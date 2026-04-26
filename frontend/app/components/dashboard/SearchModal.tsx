"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Folder,
  FolderOpen,
  CheckSquare,
  Layout,
  ChevronRight,
  Loader2,
  Hash,
} from "lucide-react";
import { supabase } from "../../lib/supabase/client";
import { cn } from "../../lib/utils";

interface SearchResult {
  id: string;
  type: "workspace" | "space" | "task";
  title: string;
  subtitle: string;
  status?: string;
  priority?: string;
  workspaceId?: string;
  workspaceName?: string;
  icon?: string;
  score: number;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  categories: {
    workspaces: number;
    projects: number;
    tasks: number;
  };
  query: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=20`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Search API error:", errorData);
        throw new Error(errorData.details || errorData.error || "Search failed");
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
      setSelectedIndex(0);
    } catch (error: any) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, results, selectedIndex, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    onClose();

    switch (result.type) {
      case "workspace":
        router.push(`/dashboard/workspace/${result.id}`);
        break;
      case "space":
        router.push(`/dashboard/workspace/${result.workspaceId}/projects`);
        break;
      case "task":
        router.push(`/dashboard/workspace/${result.workspaceId}/kanban`);
        break;
    }
  };

  // Get icon for result type
  const getResultIcon = (type: string, icon?: string) => {
    switch (type) {
      case "workspace":
        return icon === "Hash" ? <Hash className="w-5 h-5" /> : <Layout className="w-5 h-5" />;
      case "space":
        return <FolderOpen className="w-5 h-5" />;
      case "task":
        return <CheckSquare className="w-5 h-5" />;
      default:
        return <Folder className="w-5 h-5" />;
    }
  };

  // Get color for result type
  const getResultColor = (type: string) => {
    switch (type) {
      case "workspace":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "space":
        return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      case "task":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Filter tabs
  const filterTabs = [
    { id: "all", label: "All", count: results.length },
    { id: "workspaces", label: "Workspaces", count: results.filter(r => r.type === "workspace").length },
    { id: "spaces", label: "Spaces", count: results.filter(r => r.type === "space").length },
    { id: "tasks", label: "Tasks", count: results.filter(r => r.type === "task").length },
  ];

  const [activeFilter, setActiveFilter] = useState("all");

  const filteredResults = activeFilter === "all"
    ? results
    : results.filter(r => {
      if (activeFilter === "workspaces") return r.type === "workspace";
      if (activeFilter === "spaces") return r.type === "space";
      if (activeFilter === "tasks") return r.type === "task";
      return true;
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-card rounded-xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search workspaces, spaces, tasks..."
            className="flex-1 bg-transparent text-foreground placeholder-muted-foreground outline-none text-base"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Filter Tabs */}
        {query.trim() && results.length > 0 && (
          <div className="flex gap-1 px-4 py-2 border-b border-border bg-muted/30">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full transition-colors",
                  activeFilter === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        )}

        {/* Results List */}
        <div className="max-h-[50vh] overflow-y-auto">
          {!query.trim() ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Start typing to search...</p>
              <p className="text-sm mt-1 opacity-60">
                Search across all your workspaces, projects, and tasks
              </p>
            </div>
          ) : loading ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
              <p>Searching...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <p>No results found for &quot;{query}&quot;</p>
              <p className="text-sm mt-1 opacity-60">
                Try different keywords or check your spelling
              </p>
            </div>
          ) : (
            <div className="py-2">
              {filteredResults.map((result, index) => {
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                      isSelected ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg",
                      getResultColor(result.type)
                    )}>
                      {getResultIcon(result.type, result.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {result.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {result.status && (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          result.status === "completed" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                          result.status === "in_progress" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                          result.status === "todo" && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        )}>
                          {result.status.replace("_", " ")}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-border" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card rounded border border-border">↑↓</kbd>
              {" "}to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card rounded border border-border">↵</kbd>
              {" "}to open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card rounded border border-border">esc</kbd>
              {" "}to close
            </span>
          </div>
          <span>
            {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
