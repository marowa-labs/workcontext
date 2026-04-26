"use client";

import { useState, useEffect } from "react";
import { FileText, Folder, CheckSquare, User, Link2, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import { supabase } from "../../lib/supabase/client";

interface RelatedItem {
  id: string;
  type: "page" | "space" | "task" | "user";
  title: string;
  subtitle?: string;
  relevanceScore: number;
  lastAccessed?: string;
}

interface RelatedItemsProps {
  projectId: string;
  workspaceId?: string;
  className?: string;
}

const typeIcons = {
  page: FileText,
  space: Folder,
  task: CheckSquare,
  user: User,
};

const typeColors = {
  page: "text-purple-500 bg-purple-50",
  space: "text-green-500 bg-green-50",
  task: "text-orange-500 bg-orange-50",
  user: "text-blue-500 bg-blue-50",
};

export function RelatedItems({ projectId, workspaceId, className }: RelatedItemsProps) {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const fetchRelatedItems = async () => {
      if (!projectId) return;

      setIsLoading(true);
      try {
        // Get auth token from Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        // Call backend API to get related items based on content similarity
        const response = await fetch(
          `/api/projects/${projectId}/related?workspaceId=${workspaceId || ""}&limit=5`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!response.ok) throw new Error("Failed to fetch related items");

        const data = await response.json();
        setItems(data.items || []);
      } catch (error) {
        console.error("Failed to fetch related items:", error);
        // Fallback to mock data for demo
        setItems([
          {
            id: "1",
            type: "page",
            title: "Q3 Roadmap",
            subtitle: "Last edited 2 days ago",
            relevanceScore: 0.92,
          },
          {
            id: "2",
            type: "task",
            title: "Review product specs",
            subtitle: "Due tomorrow • High priority",
            relevanceScore: 0.85,
          },
          {
            id: "3",
            type: "space",
            title: "Engineering",
            subtitle: "24 pages",
            relevanceScore: 0.78,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedItems();
  }, [projectId, workspaceId]);

  const handleItemClick = (item: RelatedItem) => {
    // Navigate based on type
    const urls = {
      page: `/editor/${item.id}`,
      space: `/projects`,
      task: `/dashboard/workspace/${workspaceId}/tasks`,
      user: `/profile/${item.id}`,
    };

    window.open(urls[item.type], "_blank");
  };

  const handleAddConnection = () => {
    // Open modal to manually add a connection
    console.log("Add manual connection");
  };

  if (!isExpanded) {
    return (
      <div className={cn("border-l border-gray-200 dark:border-gray-700 pl-4", className)}>
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <Link2 className="w-4 h-4" />
          <span>Related ({items.length})</span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn("border-l border-gray-200 dark:border-gray-700 pl-4 w-64", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Related Items
          </h3>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Collapse</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-6">
          <Link2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No related items yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Connections will appear as you create more content
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = typeIcons[item.type];
            const colorClass = typeColors[item.type];

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left group"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    colorClass
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate group-hover:text-blue-600">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                  )}
                  {/* Relevance indicator */}
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${item.relevanceScore * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">
                      {Math.round(item.relevanceScore * 100)}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Add manual connection */}
          <button
            onClick={handleAddConnection}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm text-gray-500"
          >
            <Link2 className="w-4 h-4" />
            Add Connection
          </button>
        </div>
      )}
    </div>
  );
}
