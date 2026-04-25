import logger from "../monitoring/logger";
import { PaperDiscoveryService, PaperSearchResult } from "./paperDiscoveryService";

interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
  source?: string;
  isAcademic?: boolean;
  metadata?: {
    year?: number | null;
    venue?: string | null;
    citationCount?: number | null;
    authors?: { name: string }[];
    openAccessPdf?: string | null;
  };
}

export class WebSearchService {
  // Main search combining web and academic sources
  static async search(query: string, maxResults: number = 10): Promise<SearchResult[]> {
    try {
      const serperKey = process.env.SERPER_API_KEY;
      const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

      if (!serperKey && !googleApiKey) {
        logger.error("No search API configured");
        throw new Error("Search service not configured. Please set SERPER_API_KEY (recommended) or GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_ENGINE_ID");
      }

      // Launch parallel searches: Web + Academic Papers
      const limitPerSource = Math.ceil(maxResults / 2);

      const promises = [
        // Web Search (Serper.dev or Google)
        serperKey 
          ? this.searchWithSerper(query, limitPerSource, serperKey)
          : this.searchWithGoogle(query, limitPerSource, googleApiKey!, searchEngineId!),
        // Academic Papers via PaperDiscoveryService (Semantic Scholar, ArXiv, OpenAlex, etc.)
        this.searchAcademicPapers(query, limitPerSource),
      ];

      const [webResults, academicResults] = await Promise.allSettled(promises);

      const results: SearchResult[] = [];

      // Add web results
      if (webResults.status === "fulfilled") {
        results.push(...webResults.value);
      } else {
        logger.error("Web search failed:", webResults.reason);
      }

      // Add academic results
      if (academicResults.status === "fulfilled") {
        results.push(...academicResults.value);
      } else {
        logger.error("Academic search failed:", academicResults.reason);
      }

      // Return combined results
      if (results.length === 0) {
        throw new Error("No search results found");
      }

      return results
        .slice(0, maxResults)
        .map((r, i) => ({ ...r, id: r.id || `result-${i}` }));

    } catch (error: any) {
      logger.error("Web search error:", error);
      throw new Error("Failed to perform web search: " + error.message);
    }
  }

  private static async searchWithGoogle(
    query: string,
    maxResults: number,
    apiKey: string,
    searchEngineId: string
  ): Promise<SearchResult[]> {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.append("key", apiKey);
    url.searchParams.append("cx", searchEngineId);
    url.searchParams.append("q", query);
    url.searchParams.append("num", Math.min(maxResults, 10).toString());

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }

    const data = await response.json();
    
    return (data.items || []).map((item: any, index: number) => ({
      id: `google-${index}`,
      title: item.title,
      url: item.link,
      snippet: item.snippet || item.htmlSnippet?.replace(/<[^>]*>/g, '') || '',
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(item.link).hostname}&sz=64`,
      source: "Google",
      isAcademic: false,
    }));
  }

  private static async searchWithSerper(
    query: string,
    maxResults: number,
    apiKey: string
  ): Promise<SearchResult[]> {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: Math.min(maxResults, 10),
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status}`);
    }

    const data = await response.json();
    
    return (data.organic || []).map((item: any, index: number) => ({
      id: `serper-${index}`,
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      favicon: item.favicons?.[0] || 
               `https://www.google.com/s2/favicons?domain=${new URL(item.link).hostname}&sz=64`,
      source: "Serper",
      isAcademic: false,
    }));
  }

  // Search academic papers via PaperDiscoveryService (Semantic Scholar, ArXiv, OpenAlex, PubMed, etc.)
  private static async searchAcademicPapers(
    query: string,
    maxResults: number
  ): Promise<SearchResult[]> {
    try {
      // Use PaperDiscoveryService which searches multiple academic sources in parallel
      const papers = await PaperDiscoveryService.searchPapers(query, 0, maxResults);

      return papers.map((paper: PaperSearchResult, index: number) => {
        // Determine best URL: prefer open access PDF, then paper URL
        const bestUrl = paper.openAccessPdf || paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`;
        
        // Build snippet from abstract or TLDR
        const snippet = paper.tldr?.text || paper.abstract || `Academic paper from ${paper.venue || 'unknown venue'} (${paper.year || 'unknown year'})`;

        // Extract domain for favicon
        let domain = "semanticscholar.org";
        try {
          if (bestUrl) {
            domain = new URL(bestUrl).hostname;
          }
        } catch (e) {
          // Keep default
        }

        return {
          id: `academic-${paper.paperId || index}`,
          title: paper.title,
          url: bestUrl,
          snippet: snippet,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
          source: paper.source || "Academic",
          isAcademic: true,
          metadata: {
            year: paper.year,
            venue: paper.venue,
            citationCount: paper.citationCount,
            authors: paper.authors,
            openAccessPdf: paper.openAccessPdf,
          },
        };
      });
    } catch (error: any) {
      logger.error("Academic paper search failed:", error);
      return []; // Return empty array if academic search fails, don't break the whole search
    }
  }
}
