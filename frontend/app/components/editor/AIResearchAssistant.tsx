"use client";

import React, { useState, useEffect } from "react";
import {
  Microscope,
  X,
  Search,
  BookOpen,
  Lightbulb,
  TrendingUp,
  FileText,
  Users,
  Globe,
  Calendar,
  Link as LinkIcon,
  Trash2,
} from "lucide-react";
import BillingService from "../../lib/utils/billingService";
import CitationService from "../../lib/utils/citationService";
import { ResearchTopic, ResearchSource } from "../../types/research";

interface AIResearchAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertContent: (content: string) => void;
  projectId?: string;
  onCitationAdded?: () => void;
  isPanel?: boolean;
}

const AIResearchAssistant: React.FC<AIResearchAssistantProps> = ({
  isOpen,
  onClose,
  onInsertContent,
  projectId,
  onCitationAdded,
  isPanel = false,
}) => {
  console.log("AIResearchAssistant rendered with props:", {
    isOpen,
    onClose,
    onInsertContent,
    projectId,
    onCitationAdded,
    isPanel,
  });

  const [activeTab, setActiveTab] = useState<
    "explore" | "sources" | "insights"
  >("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [, setResearchTopics] = useState<ResearchTopic[]>([]);
  const [researchSources, setResearchSources] = useState<ResearchSource[]>([]);
  const [insights, setInsights] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [, setUserPlan] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [recentSearches, setRecentSearches] = useState<ResearchTopic[]>([]);
  // Add state for trending research data
  const [trendingResearch, setTrendingResearch] = useState<any[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);

  // Effect to generate insights when switching to insights tab and sources exist but insights don't
  useEffect(() => {
    if (activeTab === "insights" && researchSources.length > 0 && !insights) {
      const newInsights = generateCitationBasedInsights(
        searchQuery,
        researchSources,
      );
      setInsights(newInsights);
    }
  }, [activeTab, researchSources, insights, searchQuery]);

  // Load initial data when component opens
  useEffect(() => {
    if (isOpen) {
      loadRecentResearchTopics();
      loadTrendingResearch();
    }
  }, [isOpen]);

  // Load trending research data from CrossRef
  const loadTrendingResearch = async () => {
    setIsLoadingTrending(true);
    try {
      // Fetch trending research from CrossRef API
      // Using focused search terms to get relevant trending topics
      const trendingQueries = [
        "machine learning",
        "artificial intelligence",
        "climate change",
        "quantum computing",
        "biotechnology",
        "renewable energy",
        "neuroscience",
        "blockchain",
        "nanotechnology",
        "genomics",
      ];

      const trendingData = [];

      // Fetch data for each query
      for (const query of trendingQueries) {
        try {
          const results = await CitationService.searchExternal(
            query,
            "article",
          );
          if (results && results.length > 0) {
            // Sort results by citation count to get the most impactful works
            const sortedResults = [...results].sort(
              (a: any, b: any) =>
                (b.citationCount ? b.citationCount : 0) -
                (a.citationCount ? a.citationCount : 0),
            );

            // Get the most cited result
            const result = sortedResults[0];

            // Format authors properly
            let authors = "Unknown Authors";
            if (result.authors && Array.isArray(result.authors)) {
              if (result.authors.length > 0) {
                authors = result.authors
                  .slice(0, 3)
                  .map((author: any) => {
                    if (author.name) return author.name;
                    if (author.firstName && author.lastName) {
                      return `${author.firstName} ${author.lastName}`;
                    }
                    return "Unknown Author";
                  })
                  .join(", ");

                if (result.authors.length > 3) {
                  authors += " et al.";
                }
              }
            }

            // Get subjects/tags
            const subjects =
              result.subjects && Array.isArray(result.subjects)
                ? result.subjects.slice(0, 3).join(", ")
                : "N/A";

            trendingData.push({
              title: result.title,
              authors: authors,
              journal: result.journal,
              year: result.year,
              citationCount: result.citationCount ? result.citationCount : 0,
              doi: result.doi,
              url: result.url,
              abstract: result.abstract,
              subjects: subjects,
              source: result.source,
              fetchedAt: result.fetchedAt,
            });
          }
        } catch (error) {
          console.error(`Error fetching data for query: ${query}`, error);
          // Skip this query if there's an error
        }
      }

      // Sort trending data by citation count
      trendingData.sort((a, b) => b.citationCount - a.citationCount);

      setTrendingResearch(trendingData);
    } catch (error) {
      console.error("Error loading trending research:", error);
      setTrendingResearch([]);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  const loadRecentResearchTopics = async () => {
    try {
      const topics = await CitationService.getRecentResearchTopics(10);
      setRecentSearches(topics);
    } catch (err) {
      console.error("Error loading recent research topics:", err);
    }
  };

  const handleDeleteTopic = async (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    try {
      const success = await CitationService.deleteResearchTopic(topicId);
      if (success) {
        setRecentSearches((prev) => prev.filter((t) => t.id !== topicId));
      }
    } catch (err) {
      console.error("Error deleting research topic:", err);
    }
  };

  const handleSearch = async () => {
    // Check if user has access
    if (!hasAccess) {
      setError(
        "AI Research Assistant is only available for Student Pro and Researcher plans. Please upgrade to access this feature.",
      );
      return;
    }

    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      // Perform citation-based search using CrossRef via CitationService
      const searchResults = await CitationService.searchExternal(
        searchQuery,
        "article",
      );

      // Check if we have results
      if (!searchResults || searchResults.length === 0) {
        setError(
          "No research sources found for your query. Try adjusting your search terms.",
        );
        setResearchSources([]);
        return;
      }

      // Process and format the search results
      const formattedSources = searchResults.map((result: any) => {
        // Format authors properly
        let authors = "Unknown Authors";
        if (result.authors && Array.isArray(result.authors)) {
          if (result.authors.length > 0) {
            authors = result.authors
              .slice(0, 3)
              .map((author: any) => {
                if (author.name) return author.name;
                if (author.firstName && author.lastName) {
                  return `${author.firstName} ${author.lastName}`;
                }
                return "Unknown Author";
              })
              .join(", ");

            if (result.authors.length > 3) {
              authors += " et al.";
            }
          }
        }

        // Get subjects/tags
        const subjects =
          result.subjects && Array.isArray(result.subjects)
            ? result.subjects.slice(0, 3).join(", ")
            : "N/A";

        // Calculate relevance score based on citation count and title match
        const titleMatch = result.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
          ? 1
          : 0;
        const citationScore = result.citationCount
          ? Math.log(result.citationCount + 1)
          : 0;
        const relevance = Math.round(
          (titleMatch * 0.7 + citationScore * 0.3) * 100,
        );

        return {
          id: result.id || result.doi,
          title: result.title,
          author: authors,
          year: result.year,
          journal: result.journal,
          abstract: result.abstract,
          url: result.url,
          doi: result.doi,
          citationCount: result.citationCount || 0,
          subjects: subjects,
          source: result.source,
          fetchedAt: result.fetchedAt,
          relevance: relevance,
          type: result.type,
          volume: result.volume,
          issue: result.issue,
          pages: result.pages,
          publisher: result.publisher,
          issn: result.issn,
          isbn: result.isbn,
        };
      });

      // Sort by relevance score
      formattedSources.sort((a: any, b: any) => b.relevance - a.relevance);

      setResearchSources(formattedSources);

      // Save the search topic
      const newTopic = await CitationService.saveResearchTopic({
        title: searchQuery,
        description: `Research findings for "${searchQuery}"`,
        sources: formattedSources.length,
        sourcesData: formattedSources.map((source: any) => ({
          title: source.title,
          author: source.author,
          year: source.year,
          journal: source.journal,
          abstract: source.abstract,
          url: source.url,
          relevance: source.relevance,
        })),
      });

      setResearchTopics((prev) => [newTopic, ...prev]);
      setRecentSearches((prev) => [newTopic, ...prev]);

      // Generate insights based on the new sources
      const newInsights = generateCitationBasedInsights(
        searchQuery,
        formattedSources,
      );
      setInsights(newInsights);

      setActiveTab("sources");
    } catch (err: any) {
      console.error("Search error:", err);
      setError(
        err.message
          ? err.message
          : "Failed to search for research topic. Please try again.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Generate insights based on citation data
  const generateCitationBasedInsights = (
    query: string,
    sources: ResearchSource[],
  ): string => {
    if (!sources || sources.length === 0) {
      return `No sources found for "${query}". Try adjusting your search terms.`;
    }

    // Create insights based on the sources data
    const totalSources = sources.length;
    const avgRelevance =
      sources.reduce((sum, source) => sum + source.relevance, 0) / totalSources;
    const years = sources.map((source) => source.year).filter((year) => year);
    const minYear =
      years.length > 0
        ? Math.min(...(years as number[]))
        : new Date().getFullYear();
    const maxYear =
      years.length > 0
        ? Math.max(...(years as number[]))
        : new Date().getFullYear();

    const insights = [
      `Found ${totalSources} academic sources related to "${query}".`,
      `Average relevance score of sources: ${Math.round(avgRelevance)}%.`,
      `Publication date range: ${minYear} to ${maxYear}.`,
      `These sources provide scholarly perspectives on your topic.`,
      `Consider reviewing the most relevant sources first (those with higher relevance scores).`,
    ];

    return insights.join("\n\n");
  };

  const handleInsertSource = (source: ResearchSource) => {
    const formattedCitation = CitationService.formatCitation({
      title: source.title,
      authors: [{ name: source.author }],
      year: source.year,
      journal: source.journal,
      url: source.url,
      type: "article",
    });
    onInsertContent(formattedCitation);
  };

  const handleInsertInsight = () => {
    if (insights) {
      onInsertContent(insights);
    }
  };

  const handleAddToReferences = async (source: ResearchSource) => {
    if (projectId) {
      try {
        // Convert ResearchSource to citation format
        const citationData = {
          title: source.title,
          authors: [{ name: source.author }],
          year: source.year,
          journal: source.journal,
          url: source.url,
          type: "article", // Default to article type
        };

        // Create the citation using CitationService
        await CitationService.createCitation(projectId, citationData);

        // Notify parent component that a citation was added
        if (onCitationAdded) {
          onCitationAdded();
        }
      } catch (error) {
        console.error("Error adding citation:", error);
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  const content = (
    <div
      className={`bg-white flex flex-col h-full overflow-hidden ${isPanel ? "" : "rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh]"}`}>
      {/* Header */}
      <div
        className={`${isPanel ? "p-3" : "p-4"} border-b border-gray-200 flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-purple-100 rounded-lg">
            <Microscope className="h-5 w-5 text-purple-600" />
          </div>
          <h3
            className={`${isPanel ? "text-base" : "text-lg"} font-semibold text-black`}>
            AI Research Assistant
          </h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
          <X className="h-5 w-5 text-black" />
        </button>
      </div>

      {/* Search Bar */}
      <div className={`${isPanel ? "p-3" : "p-4"} border-b border-gray-200`}>
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isPanel
                  ? "Search topics..."
                  : "Explore research topics, keywords, or questions..."
              }
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              disabled={!hasAccess || isSearching}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !hasAccess}
            className={`px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center ${isPanel ? "w-10" : "space-x-2"}`}>
            {isSearching ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : isPanel ? (
              <Search className="h-4 w-4" />
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>
        {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav
          className={`flex ${isPanel ? "justify-around px-1" : "space-x-8 px-4"}`}>
          <button
            onClick={() => setActiveTab("explore")}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "explore"
                ? "border-purple-500 text-purple-600"
                : "border-transparent text-gray-600 hover:text-black hover:border-gray-200"
            }`}
            disabled={!hasAccess}>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span className={isPanel ? "hidden sm:inline" : ""}>Explore</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("sources")}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "sources"
                ? "border-purple-500 text-purple-600"
                : "border-transparent text-gray-600 hover:text-black hover:border-gray-200"
            }`}
            disabled={!hasAccess}>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Sources</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("insights")}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "insights"
                ? "border-purple-500 text-purple-600"
                : "border-transparent text-gray-600 hover:text-black hover:border-gray-200"
            }`}
            disabled={!hasAccess}>
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-4 w-4" />
              <span>Insights</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Explore Topics Tab */}
        {hasAccess && activeTab === "explore" && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-black">
              Recent Research Topics
            </h4>
            {recentSearches.length > 0 ? (
              <div
                className={`grid gap-4 ${isPanel ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
                {recentSearches.map((topic) => (
                  <div
                    key={topic.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-black">
                          {topic.title}
                        </h5>
                        <p className="text-sm text-black mt-1">
                          {topic.description}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteTopic(topic.id, e)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete topic">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-black">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{topic.sources} sources</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{topic.lastUpdated}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSearchQuery(topic.title);
                          handleSearch();
                        }}
                        className="text-purple-600 hover:text-purple-800">
                        Explore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-black">
                No recent research topics found. Try searching for a topic
                above.
              </div>
            )}
          </div>
        )}

        {/* Sources Tab */}
        {hasAccess && activeTab === "sources" && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-black">Research Sources</h4>
            {researchSources.length > 0 ? (
              <div className="space-y-3">
                {researchSources.map((source) => (
                  <div
                    key={source.id}
                    className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-black">
                          {source.title}
                        </h5>
                        <p className="text-sm text-black">
                          {source.author} ({source.year})
                          {source.journal && (
                            <span className="text-black">
                              {" "}
                              • {source.journal}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          {source.relevance}% relevant
                        </span>
                      </div>
                    </div>
                    {source.abstract && (
                      <p className="text-sm text-black mt-2">
                        {source.abstract.substring(0, 200)}...
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-3">
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-sm text-blue-600 hover:underline">
                            <LinkIcon className="h-4 w-4" />
                            <span>View Source</span>
                          </a>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleInsertSource(source)}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                          Insert Citation
                        </button>
                        {projectId && (
                          <button
                            onClick={() => handleAddToReferences(source)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                            Add to References
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-black">
                No sources found. Try searching for a topic to find relevant
                sources.
              </div>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {hasAccess && activeTab === "insights" && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-black">
              Research Insights
            </h4>
            {insights ? (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="prose max-w-none">
                  <p className="text-black whitespace-pre-wrap">{insights}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleInsertInsight}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Insert into Document</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-black">
                No insights generated yet. Search for a topic to generate
                insights based on the research sources.
              </div>
            )}

            <div
              className={`grid gap-4 mt-6 ${isPanel ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"}`}>
              {isLoadingTrending ? (
                <div className="col-span-3 flex justify-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                </div>
              ) : trendingResearch.length > 0 ? (
                <>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <h5 className="font-medium text-black">
                        {trendingResearch[0].title}
                      </h5>
                    </div>
                    <p className="text-sm text-black">
                      {trendingResearch[0].authors}
                      <br />
                      {trendingResearch[0].journal} ({trendingResearch[0].year})
                      <br />
                      Citations: {trendingResearch[0].citationCount}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <h5 className="font-medium text-black">
                        {trendingResearch[1].title}
                      </h5>
                    </div>
                    <p className="text-sm text-black">
                      {trendingResearch[1].authors}
                      <br />
                      {trendingResearch[1].journal} ({trendingResearch[1].year})
                      <br />
                      Citations: {trendingResearch[1].citationCount}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Globe className="h-5 w-5 text-purple-600" />
                      <h5 className="font-medium text-black">
                        {trendingResearch[2].title}
                      </h5>
                    </div>
                    <p className="text-sm text-black">
                      {trendingResearch[2].authors}
                      <br />
                      {trendingResearch[2].journal} ({trendingResearch[2].year})
                      <br />
                      Citations: {trendingResearch[2].citationCount}
                    </p>
                  </div>
                </>
              ) : (
                <div className="col-span-3 text-center py-8 text-black">
                  No trending research data available
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className={`${isPanel ? "p-3" : "p-4"} border-t border-gray-200 bg-gray-50 text-xs text-black`}>
        <div
          className={`flex ${isPanel ? "flex-col space-y-2 text-center" : "items-center justify-between"}`}>
          <span className={isPanel ? "opacity-75" : ""}>
            AI Research Assistant • Powered by CrossRef
          </span>
          {!isPanel && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-black hover:text-black hover:bg-gray-100 rounded-lg transition-colors">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (isPanel) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
      {content}
    </div>
  );
};

export default AIResearchAssistant;
