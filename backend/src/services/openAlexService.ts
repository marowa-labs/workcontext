import logger from "../monitoring/logger";
import fetch from "node-fetch";

// Interface for OpenAlex API response items (simplified)
interface OpenAlexWork {
  id: string;
  doi: string;
  title: string;
  display_name: string;
  publication_year: number;
  publication_date: string;
  ids: {
    openalex: string;
    doi: string;
    mag?: string;
    pmid?: string;
  };
  primary_location?: {
    source?: {
      display_name: string;
      host_organization_name?: string;
    };
    pdf_url?: string;
    landing_page_url?: string;
    is_oa?: boolean;
  };
  open_access: {
    is_oa: boolean;
    oa_url?: string;
  };
  authorships: Array<{
    author: {
      display_name: string;
      id: string;
    };
  }>;
  cited_by_count: number;
  abstract_inverted_index?: Record<string, number[]>;
  type: string;
}

export class OpenAlexService {
  private static BASE_URL = "https://api.openalex.org/works";

  // Clean email for the "User-Agent" to be polite to OpenAlex API
  // Using a generic one or the project one
  private static MAILTO = "mailto:dev@scholarforgeai.com";

  /**
   * Search for works on OpenAlex
   */
  static async searchWorks(
    query: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<any[]> {
    try {
      // Build search URL
      // Use 'search' parameter for Relevance
      // OpenAlex uses 1-based page numbering
      const page = Math.floor(offset / limit) + 1;
      const url = `${this.BASE_URL}?search=${encodeURIComponent(query)}&per-page=${limit}&page=${page}&sort=relevance_score:desc`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": `ScholarForge/1.0 (${this.MAILTO})`,
        },
      });

      if (!response.ok) {
        logger.warn(`OpenAlex API error: ${response.status}`);
        return [];
      }

      const data: any = await response.json();

      if (!data.results) return [];

      return data.results.map((work: OpenAlexWork) =>
        this.formatOpenAlexItem(work),
      );
    } catch (error) {
      logger.error("Error searching OpenAlex:", error);
      return [];
    }
  }

  /**
   * Reconstruct abstract from inverted index
   */
  private static recreateAbstract(
    invertedIndex?: Record<string, number[]>,
  ): string | null {
    if (!invertedIndex) return null;

    // Create an array of correct length
    const maxIndex = Math.max(...Object.values(invertedIndex).flat());
    const words = new Array(maxIndex + 1);

    // Fill the array
    Object.entries(invertedIndex).forEach(([word, positions]) => {
      positions.forEach((pos) => {
        words[pos] = word;
      });
    });

    return words.join(" ");
  }

  /**
   * Format to our universal PaperSearchResult
   */
  private static formatOpenAlexItem(work: OpenAlexWork): any {
    return {
      externalId: work.ids.doi || work.id, // Prefer DOI, fallback to OpenAlex ID
      title: work.display_name || work.title,
      abstract: this.recreateAbstract(work.abstract_inverted_index),
      authors: work.authorships.map((a) => ({ name: a.author.display_name })),
      year: work.publication_year,
      venue: work.primary_location?.source?.display_name || null,
      citationCount: work.cited_by_count,
      url: work.ids.doi || work.primary_location?.landing_page_url || null,
      openAccessPdf:
        work.open_access?.oa_url || work.primary_location?.pdf_url || null,
      publicationTypes: [work.type],
      source: "OpenAlex", // Metadata tag
    };
  }
}
