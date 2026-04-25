import { multiAIService } from "./MultiAIService";
import logger from "../monitoring/logger";
import { prisma } from "../lib/prisma";
import { SubscriptionService } from "./subscriptionService";
import SecretsService from "./secrets-service";

// Use node-fetch for HTTP requests
import fetch from "node-fetch";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

interface DeepSearchResult {
  title: string;
  url: string;
  content: string;
  summary: string;
  relevance: number;
}

export class SearchService {
  // Track search usage for users
  static async trackSearchUsage(userId: string, searchType: "web" | "deep") {
    try {
      // Get current usage for the user this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const usage: any = await prisma.aIUsage.findUnique({
        where: {
          user_id_month_year: {
            user_id: userId,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        },
      });

      // Prepare update data based on search type
      const updateData: any = { updated_at: new Date() };

      if (searchType === "web") {
        updateData.web_search_count = usage?.web_search_count
          ? usage.web_search_count + 1
          : 1;
      } else {
        updateData.deep_search_count = usage?.deep_search_count
          ? usage.deep_search_count + 1
          : 1;
      }

      if (usage) {
        // Update existing usage record
        await prisma.aIUsage.update({
          where: { id: usage.id },
          data: updateData,
        });
      } else {
        // Create new usage record with initial values
        const createData: any = {
          user_id: userId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          request_count: 0,
          chat_message_count: 0,
          image_generation_count: 0,
          web_search_count: 0,
          deep_search_count: 0,
        };

        // Set the appropriate count to 1 for the current search type
        if (searchType === "web") {
          createData.web_search_count = 1;
        } else {
          createData.deep_search_count = 1;
        }

        await prisma.aIUsage.create({
          data: createData,
        });
      }

      return true;
    } catch (error) {
      logger.error("Error tracking search usage:", error);
      return false;
    }
  }

  // Perform a web search using a search API
  static async webSearch(
    userId: string,
    query: string,
    maxResults: number = 10,
  ): Promise<SearchResult[]> {
    try {
      // Check if user can perform web search based on their subscription
      const canPerform = await SubscriptionService.canPerformAction(
        userId,
        "ai_web_search",
      );
      if (!canPerform.allowed) {
        throw new Error(canPerform.reason || "Web search limit reached");
      }

      // Track search usage
      await this.trackSearchUsage(userId, "web");

      // Use a real search API if available
      let searchResults: SearchResult[] = [];

      const serpApiKey = await SecretsService.getSerpApiKey();
      if (serpApiKey) {
        // Use SerpAPI for real web search
        const searchUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(
          query,
        )}&api_key=${serpApiKey}&num=${maxResults}`;

        const response = await fetch(searchUrl);
        const data: any = await response.json();

        if (data.error) {
          throw new Error(`SerpAPI error: ${data.error}`);
        }

        if (data.organic_results) {
          searchResults = data.organic_results
            .slice(0, maxResults)
            .map((result: any, index: number) => ({
              title: result.title || "No title",
              url: result.link || "#",
              snippet: result.snippet || "No snippet available",
              relevance: Math.max(95 - index * 5, 50), // Decreasing relevance
            }));
        }
      } else {
        const googleCseId = await SecretsService.getGoogleCseId();
        const googleApiKey = await SecretsService.getGoogleApiKey();
        if (googleCseId && googleApiKey) {
          // Use Google Custom Search Engine as fallback
          const searchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
            query,
          )}&key=${googleApiKey}&cx=${googleCseId}&num=${maxResults}`;

          const response = await fetch(searchUrl);
          const data: any = await response.json();

          if (data.error) {
            throw new Error(`Google CSE error: ${data.error.message}`);
          }

          if (data.items) {
            searchResults = data.items.map((result: any, index: number) => ({
              title: result.title || "No title",
              url: result.link || "#",
              snippet: result.snippet || "No snippet available",
              relevance: Math.max(95 - index * 5, 50), // Decreasing relevance
            }));
          }
        } else {
          // If no API keys are configured, throw an error rather than returning mock data
          logger.warn(
            "No search API keys configured. Search functionality requires API configuration.",
          );
          throw new Error(
            "Search service not properly configured. Please contact administrator.",
          );
        }
      }

      return searchResults.slice(0, maxResults);
    } catch (error: any) {
      logger.error("Error performing web search:", error);
      throw new Error(`Failed to perform web search: ${error.message}`);
    }
  }

  // Perform a Google Scholar search using SerpApi
  static async scholarSearch(
    userId: string,
    query: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<any[]> {
    try {
      // Check subscription
      const canPerform = await SubscriptionService.canPerformAction(
        userId,
        "ai_web_search", // Reuse web search quota for now
      );
      if (!canPerform.allowed) return [];

      const serpApiKey = await SecretsService.getSerpApiKey();
      if (!serpApiKey) return [];

      const searchUrl = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(
        query,
      )}&api_key=${serpApiKey}&num=${limit}&start=${offset}`;

      const response = await fetch(searchUrl);
      const data: any = await response.json();

      if (data.error || !data.organic_results) return [];

      return data.organic_results.map((result: any) => ({
        externalId:
          result.result_id || `gs-${Math.random().toString(36).substr(2, 9)}`,
        title: result.title,
        abstract: result.snippet || "",
        authors: (result.publication_info?.authors || []).map((a: any) => ({
          name: a.name || a,
        })),
        year: result.publication_info?.summary?.match(/\d{4}/)?.[0]
          ? parseInt(result.publication_info.summary.match(/\d{4}/)[0])
          : null,
        venue: "Google Scholar",
        citationCount: result.inline_links?.cited_by?.total || 0,
        url: result.link || null,
        openAccessPdf: result.resources?.[0]?.link || null,
        publicationTypes: ["Journal Article"],
        source: "Google Scholar",
      }));
    } catch (error) {
      logger.error("Error performing scholar search:", error);
      return [];
    }
  }

  // Perform a deep search (analyze content in depth)
  static async deepSearch(
    userId: string,
    query: string,
    sources: string[],
  ): Promise<DeepSearchResult[]> {
    try {
      // Check if user can perform deep search based on their subscription
      const canPerform = await SubscriptionService.canPerformAction(
        userId,
        "ai_deep_search",
      );
      if (!canPerform.allowed) {
        throw new Error(canPerform.reason || "Deep search limit reached");
      }

      // Track search usage
      await this.trackSearchUsage(userId, "deep");

      // Fetch and analyze content from the provided URLs
      const deepSearchResults: DeepSearchResult[] = [];

      for (const url of sources.slice(0, 5)) {
        // Limit to 5 sources to avoid excessive requests
        try {
          // Validate the URL to prevent SSRF attacks
          this.validateUrl(url);

          // Fetch actual content from URL
          const response = await fetch(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; ScholarForge AIBot/1.0; +https://scholarforgeai.com/bot)",
            },
          });

          if (!response.ok) {
            logger.warn(
              `Failed to fetch content from ${url}: ${response.status}`,
            );
            continue;
          }

          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("text/html")) {
            logger.warn(`Non-HTML content from ${url}: ${contentType}`);
            continue;
          }

          const htmlContent = await response.text();

          // Extract text content from HTML (basic implementation)
          // In a production environment, you might want to use a library like cheerio
          let textContent = htmlContent
            .replace(/<[^>]*>/g, " ") // Remove HTML tags
            .replace(/\s+/g, " ") // Collapse whitespace
            .trim()
            .substring(0, 5000); // Limit content length

          const prompt = `You are an academic research assistant. Summarize the following content in relation to the research query.

Research Query: ${query}

Content: ${textContent}

Please provide a concise summary of this content in relation to the research query.`;

          const result = await multiAIService.generateContent(
            prompt,
            "gemini-3.1-flash-lite-preview",
          );

          const summary = result.content || "Unable to summarize content.";

          deepSearchResults.push({
            title: `Analysis of ${new URL(url).hostname}`,
            url: url,
            content: textContent,
            summary: summary,
            relevance: 90 - deepSearchResults.length * 5, // Decreasing relevance
          });
        } catch (fetchError) {
          logger.error(`Error fetching content from ${url}:`, fetchError);
          // Continue with other sources even if one fails
        }
      }

      return deepSearchResults;
    } catch (error) {
      logger.error("Error performing deep search:", error);
      throw new Error("Failed to perform deep search");
    }
  }

  // Analyze search results and provide insights
  static async analyzeSearchResults(
    userId: string,
    query: string,
    results: SearchResult[],
  ): Promise<string> {
    try {
      // Create a prompt for analyzing the search results
      const prompt = `Analyze the following search results for the query: "${query}"

Search Results:
${results
  .map(
    (result, index) =>
      `${index + 1}. ${result.title}
   URL: ${result.url}
   Snippet: ${result.snippet}
   Relevance: ${result.relevance}%`,
  )
  .join("\n\n")}

Please provide:
1. A summary of the key findings
2. The most relevant sources
3. Any gaps in the research
4. Suggestions for further research directions`;

      const fullPrompt = `You are an academic research assistant. Analyze search results and provide insightful summaries.\n\n${prompt}`;

      const result = await multiAIService.generateContent(
        fullPrompt,
        "gemini-3.1-flash-lite-preview",
      );

      const response = result.content || "Unable to analyze search results.";

      return response;
    } catch (error) {
      logger.error("Error analyzing search results:", error);
      throw new Error("Failed to analyze search results");
    }
  }

  // Validate URL to prevent SSRF attacks
  private static validateUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);

      // Disallow internal IP addresses (localhost, private networks)
      const hostname = parsedUrl.hostname.toLowerCase();

      // Check for internal IP addresses
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("10.") ||
        (hostname.startsWith("172.") &&
          parseInt(hostname.split(".")[1]) >= 16 &&
          parseInt(hostname.split(".")[1]) <= 31) ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("0.") ||
        hostname.startsWith("127.") ||
        hostname.startsWith("::1") ||
        hostname.startsWith("[::1]")
      ) {
        throw new Error("Invalid URL: Access to internal addresses is blocked");
      }

      // Only allow HTTP and HTTPS protocols
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new Error(
          "Invalid URL: Only HTTP and HTTPS protocols are allowed",
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Invalid URL: ${error.message}`);
      } else {
        throw new Error("Invalid URL: Invalid format");
      }
    }
  }

  // Get recent research topics for a user
  static async getRecentResearchTopics(userId: string, limit: number = 10) {
    try {
      const topics = await prisma.researchTopic.findMany({
        where: {
          user_id: userId,
        },
        orderBy: {
          created_at: "desc",
        },
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          sources: true,
          created_at: true,
          updated_at: true,
        },
      });

      return topics;
    } catch (error) {
      logger.error("Error fetching recent research topics:", error);
      throw new Error("Failed to fetch recent research topics");
    }
  }

  // Save a research topic
  static async saveResearchTopic(
    userId: string,
    title: string,
    description: string,
    sources: number,
    sourcesData: any[],
  ) {
    try {
      const topic = await prisma.researchTopic.create({
        data: {
          user_id: userId,
          title,
          description,
          sources,
          sources_data: sourcesData,
        },
      });

      return topic;
    } catch (error) {
      logger.error("Error saving research topic:", error);
      throw new Error("Failed to save research topic");
    }
  }

  // Get research sources for a topic
  static async getResearchSources(topicId: string) {
    try {
      const sources = await prisma.researchSource.findMany({
        where: {
          topic_id: topicId,
        },
        select: {
          id: true,
          title: true,
          url: true,
          content: true,
          relevance: true,
          created_at: true,
        },
      });

      return sources;
    } catch (error) {
      logger.error("Error fetching research sources:", error);
      throw new Error("Failed to fetch research sources");
    }
  }
}
