import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  BookOpen,
  Plus,
  ExternalLink,
  Filter,
  Shield,
  Loader2,
  Check,
} from "lucide-react";
import { ResearchSource } from "../../../types/research";
import { ResearchService } from "../../../lib/utils/researchService";
import { useToast } from "../../../hooks/use-toast";

interface SourcesLibraryPanelProps {
  onCite?: (source: ResearchSource) => void;
  onViewDetails?: (source: ResearchSource) => void;
}

type PublicationType = "all" | "peer-reviewed" | "preprint";
type YearFilter = "all" | "recent" | "last-5" | "last-10";

export function SourcesLibraryPanel({
  onCite,
  onViewDetails,
}: SourcesLibraryPanelProps) {
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [publicationType, setPublicationType] =
    useState<PublicationType>("all");
  const [yearFilter, setYearFilter] = useState<YearFilter>("all");
  const [onlyReferenced, setOnlyReferenced] = useState(false);
  const { toast } = useToast();
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const remoteSources = await ResearchService.getUserLibrary();
        setSources(remoteSources);
      } catch (error) {
        console.error("Failed to load library:", error);
        toast({
          title: "Library Sync Issue",
          description: "Could not load library. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, [toast]);

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

  // Deduplicate sources logic
  const uniqueSources = sources.filter(
    (source, index, self) =>
      index === self.findIndex((t) => t.id === source.id),
  );

  // Apply all filters
  const filteredSources = uniqueSources.filter((source) => {
    // Search filter
    const matchesSearch =
      (source.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (source.author || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Publication type filter
    if (publicationType === "peer-reviewed") {
      if (source.confidenceScore?.status !== "strong") return false;
    } else if (publicationType === "preprint") {
      if (!source.url?.includes("arxiv")) return false;
    }

    // Year filter
    const currentYear = new Date().getFullYear();
    if (yearFilter === "recent" && source.year < currentYear - 2) return false;
    if (yearFilter === "last-5" && source.year < currentYear - 5) return false;
    if (yearFilter === "last-10" && source.year < currentYear - 10)
      return false;

    // Referenced filter - for now, all sources are considered referenced
    // This can be enhanced when you have actual reference tracking
    if (onlyReferenced) {
      // Add logic here when you implement reference tracking
    }

    return true;
  });

  // Count active filters
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
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Reference Library
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search references..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Filter / Sort Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
        <span className="text-xs text-gray-500">
          {filteredSources.length} References
        </span>
        <div className="relative" ref={filterDropdownRef}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="relative p-1 hover:bg-gray-100 rounded transition-colors">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Filter Dropdown */}
          {showFilterDropdown && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
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
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading && (
          <div className="flex justify-center p-4">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        )}
        {!loading && filteredSources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <BookOpen className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500 font-medium">
              No references found
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {activeFilterCount > 0
                ? "Try adjusting your filters or search."
                : "Add sources from the Discovery tab to build your library."}
            </p>
          </div>
        ) : (
          filteredSources.map((source) => (
            <div
              key={source.id}
              className="group flex flex-col p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex justify-between items-start gap-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
                  {source.title}
                </h3>
                <button
                  onClick={() => onViewDetails?.(source)}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="View Details">
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-xs text-gray-600 mb-2 line-clamp-1">
                {source.author} · {source.year}
                {source.journal && ` · ${source.journal}`}
              </div>

              {/* Badges - Metadata only */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {source.confidenceScore?.status === "strong" && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-100">
                    <Shield className="w-2.5 h-2.5 mr-1" />
                    Peer Reviewed
                  </span>
                )}
                {source.url?.includes("arxiv") && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
                    Preprint
                  </span>
                )}
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100">
                  Referenced
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-gray-50 pt-2 mt-auto">
                <button
                  onClick={() => onViewDetails?.(source)}
                  className="text-[10px] font-medium text-gray-500 hover:text-blue-600">
                  View Metadata
                </button>
                <div className="flex gap-2">
                  {onCite && (
                    <button
                      onClick={() => onCite(source)}
                      className="flex items-center px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-medium transition-colors">
                      <Plus className="w-3 h-3 mr-1" />
                      Cite
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
