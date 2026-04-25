import logger from "../monitoring/logger";
import SecretsService from "./secrets-service";

// CrossRef API base URL
const CROSSREF_API_BASE = "https://api.crossref.org";
// CrossRef API key will be retrieved from SecretsService

// Simple cache for type distribution data
const typeDistributionCache: Map<string, any> = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export class CrossRefService {
  // Search for works using CrossRef API
  static async searchWorks(
    query: string,
    limit: number = 10,
    offset: number = 0,
    type?: string,
  ): Promise<any[]> {
    try {
      const encodedQuery = encodeURIComponent(query);

      // Build filter based on type
      let filter = "";
      if (type) {
        switch (type.toLowerCase()) {
          case "article":
            filter = "type:journal-article";
            break;
          case "book":
            filter = "type:book";
            break;
          case "conference":
            filter = "type:proceedings-article";
            break;
          case "thesis":
            filter = "type:dissertation";
            break;
          case "report":
            filter = "type:report";
            break;
        }
      }

      // Add is-referenced-by-count and additional fields to the selected fields
      let url = `${CROSSREF_API_BASE}/works?query=${encodedQuery}&rows=${limit}&offset=${offset}&select=DOI,title,author,issued,publisher,container-title,volume,issue,page,type,is-referenced-by-count,abstract,URL,ISSN,ISBN,subject`;

      // Add filter if specified
      if (filter) {
        url += `&filter=${filter}`;
      }

      // Add sort by relevance and then by citation count
      url += "&sort=score&order=desc";

      logger.debug(`CrossRef search request: ${url}`);

      // Prepare headers with API key if available
      const contactEmail = await SecretsService.getContactAdminEmail();
      const headers: Record<string, string> = {
        "User-Agent": `ScholarForge AI/1.0 (https://app.scholarforgeai.com; mailto:${contactEmail})`,
      };

      // Add API key to headers if provided
      const crossrefApiKey = await SecretsService.getCrossrefApiKey();
      if (crossrefApiKey && crossrefApiKey.trim() !== "") {
        headers["Crossref-Plus-API-Token"] = `Bearer ${crossrefApiKey}`;
      }

      const response = await fetch(url, {
        headers,
      });

      if (!response.ok) {
        throw new Error(
          `CrossRef API request failed with status ${response.status}`,
        );
      }

      const data = await response.json();
      logger.debug(
        `CrossRef search response: ${data.message.items.length} items found`,
      );

      return data.message.items.map((item: any) =>
        this.formatCrossRefItem(item),
      );
    } catch (error) {
      logger.error("Error searching CrossRef:", error);
      throw error;
    }
  }

  // Get work details by DOI
  static async getWorkByDOI(doi: string): Promise<any> {
    try {
      // Extract DOI identifier (remove https://doi.org/ prefix if present)
      const doiId = doi.replace(/^https?:\/\/doi\.org\//, "");

      // Add more comprehensive fields to the selected fields
      const url = `${CROSSREF_API_BASE}/works/${doiId}?select=DOI,title,author,issued,publisher,container-title,volume,issue,page,type,is-referenced-by-count,abstract,URL,ISSN,ISBN,subject`;

      logger.debug(`CrossRef DOI lookup request: ${url}`);

      // Prepare headers with API key if available
      const contactEmail = await SecretsService.getContactAdminEmail();
      const headers: Record<string, string> = {
        "User-Agent": `ScholarForge AI/1.0 (https://app.scholarforgeai.com; mailto:${contactEmail})`,
      };

      // Add API key to headers if provided
      const crossrefApiKey = await SecretsService.getCrossrefApiKey();
      if (crossrefApiKey && crossrefApiKey.trim() !== "") {
        headers["Crossref-Plus-API-Token"] = `Bearer ${crossrefApiKey}`;
      }

      const response = await fetch(url, {
        headers,
      });

      if (!response.ok) {
        throw new Error(
          `CrossRef API request failed with status ${response.status}`,
        );
      }

      const data = await response.json();
      logger.debug(`CrossRef DOI lookup response for ${doi}`);

      return this.formatCrossRefItem(data.message);
    } catch (error) {
      logger.error(`Error fetching work by DOI ${doi}:`, error);
      throw error;
    }
  }

  // Format CrossRef item to match our citation model
  private static formatCrossRefItem(item: any): any {
    try {
      // Extract authors
      let authors: any[] = [];
      if (item.author && Array.isArray(item.author)) {
        authors = item.author
          .map((author: any) => ({
            firstName: author.given || "",
            lastName: author.family || "",
          }))
          .filter((author: any) => author.firstName || author.lastName);
      }

      // Extract publication year
      let year: number | undefined;
      if (
        item.issued &&
        item.issued["date-parts"] &&
        item.issued["date-parts"][0]
      ) {
        year = item.issued["date-parts"][0][0];
      }

      // Extract container title (journal name for articles)
      const containerTitle = item["container-title"]?.[0] || "";

      // Extract page numbers
      const pages = item.page || "";

      // Extract citation count
      const citationCount = item["is-referenced-by-count"] || 0;

      // Extract ISSN and ISBN
      const issn = item.ISSN?.[0] || "";
      const isbn = item.ISBN?.[0] || "";

      // Extract subjects
      const subjects = item.subject || [];

      // Determine citation type based on CrossRef type
      let type = "article"; // default
      if (item.type) {
        switch (item.type) {
          case "book":
          case "book-chapter":
          case "book-part":
          case "book-section":
          case "book-track":
          case "book-set":
            type = "book";
            break;
          case "conference-paper":
          case "proceedings-article":
            type = "conference";
            break;
          case "dissertation":
            type = "thesis";
            break;
          case "journal-article":
            type = "article";
            break;
          case "report":
          case "report-series":
            type = "report";
            break;
          case "standard":
            type = "standard";
            break;
          default:
            type = "article";
        }
      }

      return {
        externalId: item.DOI,
        type: type,
        title: item.title?.[0] || "",
        authors: authors,
        year: year,
        journal: containerTitle,
        publisher: item.publisher || "",
        volume: item.volume || "",
        issue: item.issue || "",
        pages: pages,
        doi: item.DOI || "",
        url: item.URL || "",
        // Add citation count
        citationCount: citationCount,
        // Add abstract if available
        abstract: item.abstract || "",
        // Add identifiers
        issn: issn,
        isbn: isbn,
        // Add subjects
        subjects: subjects,
        // Add additional metadata
        source: "CrossRef",
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error formatting CrossRef item:", error);
      // Return a basic formatted item even if formatting fails
      return {
        externalId: item.DOI || "",
        type: "article",
        title: item.title?.[0] || "",
        authors: [],
        year: undefined,
        journal: "",
        publisher: "",
        volume: "",
        issue: "",
        pages: "",
        doi: item.DOI || "",
        url: item.URL || "",
        citationCount: 0,
        source: "CrossRef",
        fetchedAt: new Date().toISOString(),
      };
    }
  }

  // Get real-time citation trends from CrossRef using facets
  static async getRealTimeTrends(
    timeRange: string = "last5years",
  ): Promise<any[]> {
    try {
      logger.info(
        `Fetching real-time trends from CrossRef with time range: ${timeRange}`,
      );
      // Define the time range for the query
      let filter = "";
      const currentDate = new Date();

      switch (timeRange) {
        case "last30days":
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(currentDate.getDate() - 30);
          filter = `from-pub-date:${thirtyDaysAgo.toISOString().split("T")[0]}`;
          break;
        case "last12months":
          const twelveMonthsAgo = new Date();
          twelveMonthsAgo.setMonth(currentDate.getMonth() - 12);
          filter = `from-pub-date:${twelveMonthsAgo.toISOString().split("T")[0]}`;
          break;
        case "last5years":
        default:
          const fiveYearsAgo = new Date();
          fiveYearsAgo.setFullYear(currentDate.getFullYear() - 5);
          filter = `from-pub-date:${fiveYearsAgo.toISOString().split("T")[0]}`;
          break;
      }

      // Get facets for publication types and publication years
      let url = `${CROSSREF_API_BASE}/works?rows=0`;

      // Add filter if specified
      if (filter) {
        url += `&filter=${encodeURIComponent(filter)}`;
      }

      // Add facets for type and publication year
      url += "&facet=type-name:*,published:*";

      logger.debug(`CrossRef trends request: ${url}`);

      // Prepare headers with API key if available
      const contactEmail = await SecretsService.getContactAdminEmail();
      const headers: Record<string, string> = {
        "User-Agent": `ScholarForge AI/1.0 (https://app.scholarforgeai.com; mailto:${contactEmail})`,
      };

      // Add API key to headers if provided
      const crossrefApiKey = await SecretsService.getCrossrefApiKey();
      if (crossrefApiKey && crossrefApiKey.trim() !== "") {
        headers["Crossref-Plus-API-Token"] = `Bearer ${crossrefApiKey}`;
        logger.info("Using CrossRef API key for authenticated requests");
      } else {
        logger.info("No CrossRef API key found, using anonymous requests");
      }

      const response = await fetch(url, {
        headers,
      });

      logger.info(`CrossRef API response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(
          `CrossRef API request failed with status ${response.status}`,
        );
      }

      const data = await response.json();

      // Process the facets to create trends data
      const facets = data.message.facets;
      const trendsData = [];

      // Extract publication year data
      if (
        facets &&
        facets["published-year"] &&
        facets["published-year"].values
      ) {
        const yearValues = facets["published-year"].values;

        // Convert the yearValues object to an array and sort by year (descending)
        const sortedYears = Object.entries(yearValues)
          .sort((a, b) => b[0].localeCompare(a[0])) // Sort by year descending
          .slice(0, 20); // Limit to last 20 years to avoid too many API calls

        // For each year, get the actual type distribution by making additional API calls
        // But limit to a reasonable number to avoid rate limiting
        const maxYearsToFetch = Math.min(sortedYears.length, 10); // Limit to 10 years

        logger.info(`Processing data for ${maxYearsToFetch} years`);

        for (let i = 0; i < maxYearsToFetch; i++) {
          const [year, totalCount] = sortedYears[i];

          // Get type distribution for this specific year
          const typeDistribution = await this.getTypeDistributionForYear(
            year,
            filter,
          );

          logger.debug(`Year ${year} data:`, typeDistribution);

          trendsData.push({
            date: year,
            article_count: typeDistribution.article_count,
            book_count: typeDistribution.book_count,
            website_count: typeDistribution.website_count,
            other_count: typeDistribution.other_count,
          });
        }
      }

      // Sort by date
      trendsData.sort((a, b) => a.date.localeCompare(b.date));

      logger.debug(
        `CrossRef trends response: ${trendsData.length} data points`,
      );

      return trendsData;
    } catch (error) {
      logger.error("Error getting real-time trends from CrossRef:", error);
      throw error;
    }
  }

  // Get type distribution for a specific year
  static async getTypeDistributionForYear(
    year: string,
    baseFilter: string = "",
  ): Promise<any> {
    try {
      logger.debug(`Getting type distribution for year: ${year}`);
      // Check cache first
      const cacheKey = `${year}-${baseFilter}`;
      const cached = typeDistributionCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        logger.debug(`Using cached type distribution for year ${year}`);
        return cached.data;
      }

      // Create a filter for the specific year
      const yearFilter = `published-year:${year}`;
      let combinedFilter = yearFilter;

      // Combine with base filter if provided
      if (baseFilter) {
        combinedFilter = `${baseFilter},${yearFilter}`;
      }

      // Get facets for publication types for this year
      let url = `${CROSSREF_API_BASE}/works?rows=0&facet=type-name:*,published:*`;

      // Add filter
      url += `&filter=${encodeURIComponent(combinedFilter)}`;

      logger.debug(
        `CrossRef type distribution request for year ${year}: ${url}`,
      );

      // Prepare headers with API key if available
      const contactEmail = await SecretsService.getContactAdminEmail();
      const headers: Record<string, string> = {
        "User-Agent": `ScholarForge AI/1.0 (https://app.scholarforgeai.com; mailto:${contactEmail})`,
      };

      // Add API key to headers if provided
      const crossrefApiKey = await SecretsService.getCrossrefApiKey();
      if (crossrefApiKey && crossrefApiKey.trim() !== "") {
        headers["Crossref-Plus-API-Token"] = `Bearer ${crossrefApiKey}`;
      }

      const response = await fetch(url, {
        headers,
      });

      logger.debug(
        `CrossRef type distribution response status for year ${year}: ${response.status}`,
      );

      if (!response.ok) {
        throw new Error(
          `CrossRef API request failed with status ${response.status}`,
        );
      }

      const data = await response.json();

      // Process the type facets
      const facets = data.message.facets;
      let articleCount = 0;
      let bookCount = 0;
      let websiteCount = 0;
      let otherCount = 0;

      if (facets && facets["type-name"] && facets["type-name"].values) {
        const typeValues = facets["type-name"].values;

        logger.debug(
          `Found ${Object.keys(typeValues).length} publication types for year ${year}`,
        );

        // Categorize types into our buckets
        for (const [typeName, count] of Object.entries(typeValues)) {
          const countNum = Number(count);

          // Categorize by type name
          if (
            typeName.toLowerCase().includes("article") ||
            typeName.toLowerCase().includes("journal")
          ) {
            articleCount += countNum;
          } else if (typeName.toLowerCase().includes("book")) {
            bookCount += countNum;
          } else if (
            typeName.toLowerCase().includes("web") ||
            typeName.toLowerCase().includes("dataset")
          ) {
            websiteCount += countNum;
          } else {
            otherCount += countNum;
          }
        }
      }

      const result = {
        article_count: articleCount,
        book_count: bookCount,
        website_count: websiteCount,
        other_count: otherCount,
      };

      logger.debug(`Type distribution for year ${year}:`, result);

      // Cache the result
      typeDistributionCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      logger.error(`Error getting type distribution for year ${year}:`, error);
      // Return zeros if we can't get the data
      return {
        article_count: 0,
        book_count: 0,
        website_count: 0,
        other_count: 0,
      };
    }
  }
}
