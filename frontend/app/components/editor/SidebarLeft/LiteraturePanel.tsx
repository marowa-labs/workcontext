"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { ScrollArea } from "../../ui/scroll-area";
import {
  Search,
  BookOpen,
  TrendingUp,
  Clock,
  Filter,
  ArrowRight,
  Sparkles,
  Bookmark,
  Loader2,
  Check,
} from "lucide-react";
import { useUser } from "../../../lib/utils/useUser";

interface LiteraturePanelProps {
  onOpenResearch: (query?: string) => void;
  onOpenPaper?: (paper: any) => void;
}

type PublicationType = "all" | "peer-reviewed" | "preprint";
type YearFilter = "all" | "recent" | "last-5" | "last-10";

export function LiteraturePanel({
  onOpenResearch,
  onOpenPaper,
}: LiteraturePanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentPapers, setRecentPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [publicationType, setPublicationType] =
    useState<PublicationType>("all");
  const [yearFilter, setYearFilter] = useState<YearFilter>("all");
  const [onlyReferenced, setOnlyReferenced] = useState(false);
  const { token } = useUser();
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const trendingTopics = [
    { name: "Large Language Models", count: 1250 },
    { name: "RAG Systems", count: 850 },
    { name: "AI Safety", count: 620 },
    { name: "Multimodal Learning", count: 430 },
  ];

  useEffect(() => {
    if (token) {
      fetchRecentPapers();
    }
  }, [token]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchRecentPapers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/research/library", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.data) {
        // Sort by created_at desc if not already
        const sorted = data.data.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setRecentPapers(sorted.slice(0, 5)); // Top 5
      }
    } catch (error) {
      console.error("Failed to fetch library:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onOpenResearch(searchQuery);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Filter Logic
  const filteredPapers = recentPapers.filter((paper) => {
    // Publication type filter
    if (publicationType === "peer-reviewed") {
      if (paper.confidenceScore?.status !== "strong") return false;
    } else if (publicationType === "preprint") {
      if (!paper.url?.includes("arxiv")) return false;
    }

    // Year filter
    const currentYear = new Date().getFullYear();
    const paperYear = paper.year || paper.paper_data?.year;
    if (yearFilter === "recent" && paperYear < currentYear - 2) return false;
    if (yearFilter === "last-5" && paperYear < currentYear - 5) return false;
    if (yearFilter === "last-10" && paperYear < currentYear - 10) return false;

    // Referenced filter
    if (onlyReferenced) {
      // logic for referenced papers
    }

    return true;
  });

  const activeFilterCount =
    (publicationType !== "all" ? 1 : 0) +
    (yearFilter !== "all" ? 1 : 0) +
    (onlyReferenced ? 1 : 0);

  const clearAllFilters = () => {
    setPublicationType("all");
    setYearFilter("all");
    setOnlyReferenced(false);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Literature Review
        </h3>
        <p className="text-xs text-gray-500">
          Discover and organize research papers
        </p>
      </div>

      {/* Search Section */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search Semantic Scholar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 bg-white border-gray-200"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1" ref={filterDropdownRef}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="w-full text-xs text-gray-600 h-8 bg-white flex items-center justify-center gap-1.5">
              <Filter className="h-3 w-3" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Filter Dropdown */}
            {showFilterDropdown && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-700">
                    Filters
                  </span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-[10px] text-blue-600 hover:text-blue-700 font-medium">
                      Clear all
                    </button>
                  )}
                </div>

                {/* Publication Type */}
                <div className="px-3 py-2 border-b border-gray-50">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Publication Type
                  </span>
                  {[
                    { value: "all", label: "All Types" },
                    { value: "peer-reviewed", label: "Peer Reviewed" },
                    { value: "preprint", label: "Preprint" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setPublicationType(option.value as PublicationType)
                      }
                      className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded transition-colors">
                      <span>{option.label}</span>
                      {publicationType === option.value && (
                        <Check className="w-3 h-3 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Year Range */}
                <div className="px-3 py-2 border-b border-gray-50">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Year Range
                  </span>
                  {[
                    { value: "all", label: "All Time" },
                    { value: "recent", label: "Recent (Last 2 Years)" },
                    { value: "last-5", label: "Last 5 Years" },
                    { value: "last-10", label: "Last 10 Years" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setYearFilter(option.value as YearFilter)}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded transition-colors">
                      <span>{option.label}</span>
                      {yearFilter === option.value && (
                        <Check className="w-3 h-3 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Status */}
                <div className="px-3 py-2">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Status
                  </span>
                  <button
                    onClick={() => setOnlyReferenced(!onlyReferenced)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded transition-colors">
                    <span>Only Referenced</span>
                    {onlyReferenced && (
                      <Check className="w-3 h-3 text-blue-600" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleSearch}
            className="flex-1 text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white">
            Search
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Trending Topics */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <h4 className="text-sm font-semibold text-gray-900">
                Trending Topics
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map((topic) => (
                <button
                  key={topic.name}
                  onClick={() => onOpenResearch(topic.name)}
                  className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md text-xs font-medium transition-colors border border-purple-100">
                  {topic.name}
                  <span className="ml-1.5 text-purple-400 font-normal">
                    {topic.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Papers (Library) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-900">
                Recent Saved Papers
              </h4>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : filteredPapers.length > 0 ? (
                filteredPapers.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (onOpenPaper) {
                        onOpenPaper(item.paper_data || item);
                      }
                    }}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600">
                        {item.title}
                      </h5>
                      <Bookmark className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 fill-current" />
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {item.authors && item.authors.length > 0
                        ? item.authors[0].name
                        : "Unknown Author"}{" "}
                      • {item.year}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-2">
                  No papers found matching your filters.
                </p>
              )}
            </div>
          </div>

          {/* Discovery Card */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 text-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-blue-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              Smart Discovery
            </h4>
            <p className="text-xs text-blue-700 mb-3 opacity-80">
              Find connected papers based on your current writing context.
            </p>
            <Button
              size="sm"
              onClick={() => {
                if (recentPapers.length > 0) {
                  // Recommend based on most recent saved paper
                  // We use the title as a seed for semantic search
                  onOpenResearch(recentPapers[0].title);
                } else {
                  // Fallback to a random trending topic
                  const randomTopic =
                    trendingTopics[
                      Math.floor(Math.random() * trendingTopics.length)
                    ];
                  onOpenResearch(randomTopic.name);
                }
              }}
              className="w-full bg-white text-blue-600 hover:bg-blue-50 border border-blue-200">
              Explore Recommendations
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
