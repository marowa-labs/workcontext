"use client";

import React from "react";
import { FileText, BookOpen, Globe, Users, Search, X } from "lucide-react";

interface SearchCitationFormProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (overrideQuery?: string) => void;
  searching: boolean;
  results: any[];
  onSelect: (result: any) => void;
  onMatchStyle?: (url: string) => void;
  analyzingUrl?: string | null;
}

export const SearchCitationForm: React.FC<SearchCitationFormProps> = ({
  query,
  onQueryChange,
  onSearch,
  searching,
  results,
  onSelect,
  onMatchStyle,
  analyzingUrl,
}) => {
  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-black" />
        </div>
        <input
          type="text"
          placeholder="Search by title, author, DOI..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          className="block w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
            <X className="h-4 w-4 text-gray-500 hover:text-black" />
          </button>
        )}
      </div>

      {/* Quick Search Options */}
      <div className="flex flex-wrap gap-1.5">
        <button
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
          onClick={() => {
            onQueryChange("journal article");
            // We need to trigger search with new query, but state update is async.
            // Ideally we pass the query to onSearch.
            onSearch("journal article");
          }}>
          Articles
        </button>
        <button
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
          onClick={() => {
            onQueryChange("book");
            onSearch("book");
          }}>
          Books
        </button>
        <button
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
          onClick={() => {
            onQueryChange("website");
            onSearch("website");
          }}>
          Websites
        </button>
        <button
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
          onClick={() => onSearch()}>
          All
        </button>
      </div>

      {/* Search Results */}
      {searching ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-3 border border-gray-200 rounded-lg animate-pulse">
              <div className="h-3.5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-2.5 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-2.5 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-3 pb-2">
          {results.map((result) => (
            <div
              key={result.id || result.doi || Math.random()}
              className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {result.type === "article" && (
                      <FileText className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                    )}
                    {result.type === "book" && (
                      <BookOpen className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                    )}
                    {result.type === "website" && (
                      <Globe className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
                    )}
                    {result.type === "conference" && (
                      <Users className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                    )}
                    <h3 className="font-medium text-sm text-black truncate">
                      {result.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-gray-700 truncate">
                    {result.authors
                      ?.map(
                        (author: any) =>
                          `${author.firstName} ${author.lastName}`,
                      )
                      .join(", ")}
                  </p>
                  <div className="mt-1 flex items-center text-xs text-gray-600 flex-wrap gap-x-2">
                    <span>{result.year}</span>
                    {result.journal && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="truncate max-w-[100px]">
                          {result.journal}
                        </span>
                      </>
                    )}
                  </div>
                  {/* Add CrossRef-specific metadata */}
                  {result.citationCount > 0 && (
                    <div className="mt-1 flex items-center text-xs text-green-600">
                      <span>Cited {result.citationCount} times</span>
                    </div>
                  )}
                  {result.subjects && result.subjects.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {result.subjects
                        .slice(0, 2)
                        .map((subject: string, index: number) => (
                          <span
                            key={index}
                            className="text-[10px] bg-gray-100 text-black px-1.5 py-0.5 rounded-full truncate max-w-[80px]">
                            {subject}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 ml-2">
                  <button
                    className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium whitespace-nowrap"
                    onClick={() => onSelect(result)}>
                    Use
                  </button>
                  {onMatchStyle && result.url && (
                    <button
                      className="px-2.5 py-1.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-xs font-medium whitespace-nowrap flex items-center justify-center gap-1"
                      onClick={() => onMatchStyle(result.url)}
                      disabled={analyzingUrl === result.url}>
                      {analyzingUrl === result.url ? (
                        <div className="w-3 h-3 animate-spin rounded-full border border-blue-600 border-t-transparent" />
                      ) : (
                        "Match Style"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-8">
          <Search className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-black">
            No sources found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try different keywords or add manually instead
          </p>
        </div>
      ) : (
        <div className="text-center py-8">
          <Search className="mx-auto h-12 w-12 text-gray-300 border border-gray-300 rounded-full p-2" />
          <h3 className="mt-3 text-sm font-medium text-black">
            Search for citations
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Enter a title, author, DOI, or ISBN to find sources
          </p>
        </div>
      )}
    </div>
  );
};
