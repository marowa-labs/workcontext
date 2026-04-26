"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { User, FileText, Folder, CheckSquare, Hash } from "lucide-react";

export interface MentionItem {
  id: string;
  type: "user" | "page" | "space" | "task";
  title: string;
  subtitle?: string;
  avatar?: string;
}

interface MentionSuggestionListProps {
  items: MentionItem[];
  selectedIndex: number;
  onSelect: (item: MentionItem) => void;
  query: string;
}

const typeIcons = {
  user: User,
  page: FileText,
  space: Folder,
  task: CheckSquare,
};

const typeLabels = {
  user: "People",
  page: "Pages",
  space: "Spaces",
  task: "Tasks",
};

export function MentionSuggestionList({
  items,
  selectedIndex,
  onSelect,
  query,
}: MentionSuggestionListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current && listRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  // Group items by type
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, MentionItem[]>);

  // Flatten with headers
  const flattenedItems: (MentionItem | { type: "header"; category: string })[] = [];
  Object.entries(groupedItems).forEach(([type, typeItems]) => {
    if (typeItems.length > 0) {
      flattenedItems.push({ type: "header", category: type });
      flattenedItems.push(...typeItems);
    }
  });

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[280px]">
        <p className="text-sm text-gray-500 text-center">
          No results for "{query}"
        </p>
        <p className="text-xs text-gray-400 text-center mt-1">
          Try searching for people, pages, spaces, or tasks
        </p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-[320px] max-h-[400px] overflow-y-auto"
    >
      {flattenedItems.map((item, index) => {
        if (item.type === "header") {
          return (
            <div
              key={`header-${item.category}`}
              className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-2"
            >
              {(() => {
                const Icon = typeIcons[item.category as keyof typeof typeIcons] || Hash;
                return <Icon className="w-3 h-3" />;
              })()}
              {typeLabels[item.category as keyof typeof typeLabels]}
            </div>
          );
        }

        const realIndex = items.findIndex((i) => i.id === item.id);
        const isSelected = realIndex === selectedIndex;
        const Icon = typeIcons[item.type];

        return (
          <button
            key={item.id}
            ref={isSelected ? selectedRef : null}
            onClick={() => onSelect(item)}
            className={cn(
              "w-full px-3 py-2 flex items-center gap-3 text-left transition-colors",
              isSelected
                ? "bg-blue-50 dark:bg-blue-900/20"
                : "hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            {item.type === "user" && item.avatar ? (
              <img
                src={item.avatar}
                alt={item.title}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Icon className="w-4 h-4 text-gray-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {item.title}
              </p>
              {item.subtitle && (
                <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
              )}
            </div>
            {isSelected && (
              <span className="text-xs text-blue-500 font-medium">↵</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
