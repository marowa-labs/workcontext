import logger from "../monitoring/logger";
import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

export class ArXivService {
  private static BASE_URL = "http://export.arxiv.org/api/query";

  static async searchPapers(
    query: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<any[]> {
    try {
      const url = `${this.BASE_URL}?search_query=all:${encodeURIComponent(query)}&start=${offset}&max_results=${limit}&sortBy=relevance&sortOrder=descending`;

      const response = await fetch(url);
      if (!response.ok) {
        logger.warn(`ArXiv API error: ${response.status}`);
        return [];
      }

      const xmlText = await response.text();
      return this.parseAtomFeed(xmlText);
    } catch (error) {
      logger.error("Error searching ArXiv:", error);
      return [];
    }
  }

  /**
   * Simple Atom XML parser to avoid dependency issues
   */
  private static parseAtomFeed(xml: string): any[] {
    const results: any[] = [];

    // Split by entry tags
    const entries = xml.split("<entry>");
    // Skip the first part (header)
    for (let i = 1; i < entries.length; i++) {
      const entry = entries[i];

      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const title = titleMatch
        ? titleMatch[1].replace(/\n/g, " ").trim()
        : "Untitled";

      const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
      const summary = summaryMatch
        ? summaryMatch[1].replace(/\n/g, " ").trim()
        : "";

      const idMatch = entry.match(/<id>(.*?)<\/id>/);
      const url = idMatch ? idMatch[1].trim() : "";
      const id = url.split("/").pop(); // Get default ID from URL

      const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
      const year = publishedMatch
        ? new Date(publishedMatch[1]).getFullYear()
        : new Date().getFullYear();

      // Authors
      const authorMatches = [
        ...entry.matchAll(/<author>\s*<name>(.*?)<\/name>\s*<\/author>/g),
      ];
      const authors = authorMatches.map((m) => ({ name: m[1] }));

      // PDF Link
      const pdfMatch = entry.match(/<link title="pdf" href="(.*?)"/);
      const pdfUrl = pdfMatch ? pdfMatch[1] : null;

      results.push({
        externalId: `arxiv-${id}`,
        title: title,
        abstract: summary,
        authors: authors,
        year: year,
        venue: "ArXiv Preprint",
        citationCount: 0, // ArXiv API doesn't provide citations
        url: url,
        openAccessPdf: pdfUrl,
        publicationTypes: ["Preprint"],
        source: "ArXiv",
      });
    }

    return results;
  }
}
