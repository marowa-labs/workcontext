"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  LayoutList,
  Table,
  Sparkles,
  Network,
} from "lucide-react";
import { PaperCard } from "./PaperCard";
import { ResearchMatrix } from "./ResearchMatrix"; // Import Matrix View
import { ResearchChatSidebar } from "./ResearchChatSidebar"; // Import Sidebar
import { ResearchGraph } from "./ResearchGraph"; // Import Graph View
import PaperDetailsPanel from "./PaperDetailsPanel";
import { useSearchParams } from "next/navigation";
import { useUser } from "../lib/utils/useUser";
import { SynthesisCard } from "./SynthesisCard";

interface ResearchInterfaceProps {
  isPanel?: boolean;
  onSelectPaper?: (paperId: string) => void;
}

export default function ResearchInterface({
  isPanel = false,
  onSelectPaper,
}: ResearchInterfaceProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "matrix" | "graph">("list");
  const [showChat, setShowChat] = useState(false); // Chat State
  const { token } = useUser();

  // Pagination State
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  // Shared search function
  const performSearch = async (searchTerm: string, isLoadMore = false) => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    if (!isLoadMore) {
      setSearched(true);
      setOffset(0); // Reset offset for new searches
    }

    try {
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Calculate current offset based on isLoadMore
      const currentOffset = isLoadMore ? offset + LIMIT : 0;

      const response = await fetch(
        `/api/research/search?q=${encodeURIComponent(searchTerm)}&offset=${currentOffset}&limit=${LIMIT}`,
        { headers },
      );
      const data = await response.json();

      if (data.data) {
        // Enforce uniqueness within the new batch itself
        const uniqueBatch: any[] = [];
        const seenInBatch = new Set();
        for (const p of data.data) {
          // If externalId is missing, generate one or skip.
          // For safety, we keep it but warn.
          if (!p.externalId) {
            console.warn("Paper missing externalId:", p);
            p.externalId = `gen-${Math.random().toString(36).substr(2, 9)}`;
          }

          if (!seenInBatch.has(p.externalId)) {
            seenInBatch.add(p.externalId);
            uniqueBatch.push(p);
          }
        }

        if (isLoadMore) {
          setResults((prev) => {
            const existingIds = new Set(prev.map((p) => p.externalId));
            const newPapers = uniqueBatch.filter(
              (p: any) => !existingIds.has(p.externalId),
            );
            return [...prev, ...newPapers];
          });
          setOffset(currentOffset);
        } else {
          setResults(uniqueBatch);
        }

        // Determine if there are likely more results
        setHasMore(uniqueBatch.length === LIMIT);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Effect to handle URL search params on mount or change
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      // If query param changed, update state and search
      if (q !== query) {
        setQuery(q);
        performSearch(q);
      }
      // If query matches but we have no results (e.g. blocked by missing token initially),
      // retry when token updates (dependency).
      else if (results.length === 0 && !loading) {
        performSearch(q);
      }
    }
  }, [searchParams, token]); // Retry when token loads

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const savePaper = async (paper: any) => {
    try {
      if (!token) throw new Error("User not authenticated");

      const response = await fetch("/api/research/library/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paper }),
      });

      if (!response.ok) throw new Error("Failed to save");
      // Could show toast success here
    } catch (error) {
      console.error("Save failed:", error);
      throw error;
    }
  };

  const [selectedPaper, setSelectedPaper] = useState<any>(null);

  if (selectedPaper) {
    return (
      <div className={`h-full ${isPanel ? "" : "w-full"}`}>
        <PaperDetailsPanel
          paperData={selectedPaper}
          onBack={() => setSelectedPaper(null)}
          isPanel={isPanel}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex relative overflow-hidden ${isPanel ? "h-full" : "h-[calc(100vh-4rem)]"}`}>
      {/* Main Content Column */}
      <div
        className={`flex-1 flex flex-col h-full bg-white overflow-hidden ${isPanel ? "px-2 py-4" : "px-6 py-8"}`}>
        <div className={`${isPanel ? "mb-6" : "mb-8"}`}>
          <div className="flex items-center justify-between mb-4">
            <h1
              className={`${
                isPanel
                  ? "text-xl font-bold text-black mb-0"
                  : "text-3xl font-bold text-black mb-0"
              }`}>
              Intelligent Paper Discovery
            </h1>

            {/* Controls: View Toggle & Chat */}
            {results.length > 0 && !isPanel && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    showChat
                      ? "bg-purple-100 text-purple-700"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}>
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Ask AI</span>
                </button>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
                    title="List View">
                    <LayoutList className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("matrix")}
                    className={`p-1.5 rounded-md transition-all ${viewMode === "matrix" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
                    title="Matrix View">
                    <Table className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("graph")}
                    className={`p-1.5 rounded-md transition-all ${viewMode === "graph" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
                    title="Graph View">
                    <Network className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <p
            className={`${
              isPanel
                ? "text-sm text-gray-700"
                : "text-lg text-gray-700 max-w-2xl mx-auto hidden" // Hiding description in large mode to save space for Matrix
            }`}>
            Find, analyze, and organize academic research with AI-powered
            search.
          </p>
        </div>

        {/* Feature #7: Recommendations Frame (UI Only) */}
        {!isPanel && !searched && (
          <div className="mb-8 w-3/4 mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Suggested For You
              </h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
              {[
                {
                  title: "Advances in Neural Networks",
                  reason: "Based on your interest in AI",
                },
                {
                  title: "Climate Policy Review 2024",
                  reason: "Trending in your field",
                },
                {
                  title: "Quantum Error Correction",
                  reason: "Related to recent searches",
                },
              ].map((rec, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(rec.title);
                    handleSearch({ preventDefault: () => {} } as any);
                  }}
                  className="flex-shrink-0 w-64 p-3 bg-white border border-purple-100 hover:border-purple-300 rounded-lg text-left shadow-sm hover:shadow-md transition-all group">
                  <div className="text-xs font-medium text-purple-600 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {rec.reason}
                  </div>
                  <div className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-purple-700 transition-colors">
                    {rec.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSearch}
          className={`${isPanel ? "mb-6" : "mb-8 w-3/4 mx-auto"}`}>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isPanel
                  ? "Search papers..."
                  : "Search for papers, topics, or authors..."
              }
              className={`w-full ${
                isPanel ? "px-4 py-2 text-sm" : "px-6 py-4 text-lg"
              } rounded-full border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:bg-white text-black transition-all shadow-sm`}
            />
            <button
              type="submit"
              disabled={loading}
              className={`absolute right-1.5 top-1.5 ${
                isPanel ? "p-1.5" : "p-2.5"
              } bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-70`}>
              {loading ? (
                <Loader2
                  className={`${isPanel ? "w-4 h-4" : "w-6 h-6"} animate-spin`}
                />
              ) : (
                <Search className={`${isPanel ? "w-4 h-4" : "w-6 h-6"}`} />
              )}
            </button>
          </div>
        </form>

        <div className="space-y-6 flex-1 overflow-hidden flex flex-col min-h-0 relative">
          {loading && results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-black text-sm">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="flex h-full overflow-hidden relative">
              <div className="flex-1 overflow-hidden flex flex-col min-w-0">
                {/* Consensus Synthesis Card - Only show for first page of results (<= 10) AND only in List view */}
                {results.length <= 10 && viewMode === "list" && (
                  <div className="px-4 pt-4">
                    <SynthesisCard query={query} papers={results} />
                  </div>
                )}

                {viewMode === "list" ? (
                  <div className="grid gap-4 overflow-y-auto pr-2 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {results.map((paper, index) => (
                      <div
                        key={paper.externalId || `paper-${index}`}
                        className="relative group">
                        <PaperCard
                          paper={paper}
                          onSave={savePaper}
                          isPanel={isPanel}
                          onClick={() => setSelectedPaper(paper)}
                        />
                      </div>
                    ))}

                    {/* Load More Button */}
                    {hasMore && (
                      <div className="flex justify-center pt-4 pb-2">
                        <button
                          onClick={() => performSearch(query, true)}
                          disabled={loading}
                          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-full hover:bg-gray-50 hover:border-blue-300 transition-all shadow-sm focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed">
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Loading more...</span>
                            </>
                          ) : (
                            <>
                              <span>Load More Results</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : viewMode === "matrix" ? (
                  <div className="h-full overflow-hidden">
                    <ResearchMatrix papers={results} />
                  </div>
                ) : (
                  <div className="h-full p-4 overflow-hidden">
                    <ResearchGraph query={query} papers={results} />
                  </div>
                )}
              </div>
            </div>
          ) : searched ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              No results found for "{query}".
            </div>
          ) : (
            <div
              className={`text-center ${
                isPanel ? "py-10" : "py-20"
              } bg-gray-50 dark:bg-white/50 rounded-2xl border border-dashed border-gray-200`}>
              <div className="max-w-md mx-auto px-4">
                <h3 className="text-sm font-semibold text-black mb-2">
                  Start your research
                </h3>
                <p className="text-xs text-gray-700 mb-4">
                  Enter a topic above to explore millions of open access
                  academic papers.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "Machine Learning",
                    "Climate Change",
                    "Quantum Computing",
                  ].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setQuery(term);
                        handleSearch({ preventDefault: () => {} } as any);
                      }}
                      className="px-2 py-1 bg-white border border-gray-200 rounded-full text-xs hover:border-blue-500 transition-colors bg-white text-gray-800">
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top-level Chat Sidebar (Right) - Always rendered if results exist to allow transition, or conditional */}
      {results.length > 0 && !isPanel && (
        <div
          className={`transition-all duration-300 ease-in-out border-l border-gray-200 bg-white ${
            showChat
              ? "w-[400px] translate-x-0"
              : "w-0 translate-x-full opacity-0"
          } overflow-hidden h-full shadow-lg z-20 shrink-0`}>
          <div className="w-[400px] h-full">
            <ResearchChatSidebar
              isOpen={showChat}
              onClose={() => setShowChat(false)}
              papers={results}
            />
          </div>
        </div>
      )}
    </div>
  );
}
