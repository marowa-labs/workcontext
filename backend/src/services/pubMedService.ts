import logger from "../monitoring/logger";
import fetch from "node-fetch";

export class PubMedService {
  private static EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

  // 1. Search for IDs
  static async searchPapers(
    query: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<any[]> {
    try {
      // Step 1: ESearch - Get list of UIDs
      const searchUrl = `${this.EUTILS_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=${limit}&retstart=${offset}`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) return [];

      const searchData: any = await searchRes.json();
      const ids = searchData.esearchresult?.idlist || [];

      if (ids.length === 0) return [];

      // Step 2: ESummary - Get details for these IDs
      // Using ESummary JSON approach usually returns clearer metadata than EFetch XML for basic display
      const summaryUrl = `${this.EUTILS_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
      const summaryRes = await fetch(summaryUrl);
      if (!summaryRes.ok) return [];

      const summaryData: any = await summaryRes.json();
      const result = ids
        .map((id: string) => {
          const doc = summaryData.result[id];
          if (!doc) return null;

          return {
            externalId: `pmid-${id}`,
            title: doc.title,
            abstract: null, // ESummary often omits abstract, EFetch required for full abstract. Keeping it simple for speed.
            authors: (doc.authors || []).map((a: any) => ({ name: a.name })),
            year: new Date(doc.pubdate).getFullYear() || null,
            venue: doc.source || "PubMed",
            citationCount: null,
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            openAccessPdf: null, // Hard to determine OA directly from ESummary
            publicationTypes: doc.pubtype || ["Journal Article"],
            source: "PubMed",
          };
        })
        .filter((item: any) => item !== null);

      return result;
    } catch (error) {
      logger.error("Error searching PubMed:", error);
      return [];
    }
  }
}
