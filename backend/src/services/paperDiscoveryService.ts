import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";
import SecretsService from "./secrets-service";
import fetch from "node-fetch";

// Interfaces for internal use
export interface PaperSearchResult {
  title: string;
  paperId: string;
  abstract: string | null;
  authors: { name: string; authorId?: string }[];
  year: number | null;
  venue: string | null;
  citationCount: number | null;
  externalId: string; // Semantic Scholar Paper ID
  doi?: string;
  url: string | null;
  openAccessPdf: string | null;
  publicationTypes?: string[];
  tldr?: { text: string } | null;
  fieldsOfStudy?: string[];
  source?: string;
  confidenceScore?: {
    score: number;
    status: "strong" | "good" | "weak" | "poor";
    recencyScore: number;
    qualityScore: number;
    warnings: string[];
  };
}

export interface GraphNode {
  id: string;
  label: string;
  type: "paper" | "citation" | "reference";
  data: PaperSearchResult;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface ResearchGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class PaperDiscoveryService {
  private static BASE_URL = "https://api.semanticscholar.org/graph/v1/paper";

  /**
   * Search for papers using Semantic Scholar API
   */
  /*
   * Federated Search across multiple engines
   */
  static async searchPapers(
    query: string,
    offset: number = 0,
    limit: number = 10,
  ): Promise<PaperSearchResult[]> {
    try {
      logger.info(`Starting federated search for: ${query}`);
      const limitPerSource = Math.ceil(limit / 2); // Fetch slightly more to account for dedup

      // 1. Launch Parallel Requests
      const user = "system"; // In a real request, we'd pass the actual user ID context

      const promises = [
        // Source 1: Semantic Scholar (Original)
        this.searchSemanticScholar(query, offset, limitPerSource),
        // Source 2: OpenAlex (Covers ScienceDirect, Wiley, IEEE, etc.)
        import("./openAlexService").then((m) =>
          m.OpenAlexService.searchWorks(query, limitPerSource, offset),
        ),
        // Source 3: ArXiv (Preprints)
        import("./arXivService").then((m) =>
          m.ArXivService.searchPapers(query, limitPerSource, offset),
        ),
        // Source 4: PubMed (Medical)
        import("./pubMedService").then((m) =>
          m.PubMedService.searchPapers(query, limitPerSource, offset),
        ),
        // Source 5: Google Scholar (via SerpApi)
        import("./searchService").then((m) =>
          m.SearchService.scholarSearch(
            "system_fallback",
            query,
            limitPerSource,
            offset,
          ),
        ),
        // Source 6: CrossRef (Validation & Metadata)
        import("./crossRefService").then((m) =>
          m.CrossRefService.searchWorks(query, limitPerSource, offset),
        ),
      ];

      const results = await Promise.allSettled(promises);

      // 2. Aggregate Results
      let allPapers: PaperSearchResult[] = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
          // Normalize and add Source Badge if missing
          const papers = result.value.map((p) => {
            // Calculate score if missing or invalid
            let score = p.confidenceScore;
            if (!score || typeof score.status !== "string") {
              score = this.calculateConfidenceScore(p);
            }

            return {
              ...p,
              doi:
                p.doi || p.externalId.startsWith("10.")
                  ? p.externalId
                  : undefined,
              confidenceScore: score,
            } as PaperSearchResult;
          });
          allPapers = [...allPapers, ...papers];
        } else {
          logger.warn(`Source ${index} failed or returned empty.`);
        }
      });

      // 3. Fallback to Mock if absolutely no results (Network offline?)
      if (allPapers.length === 0) {
        logger.info(`No papers found for query: ${query}`);
        return [];
      }

      // 4. Deduplication (by DOI or normalized Title)
      // 4. Deduplication (by DOI or normalized Title)
      const uniquePapers = new Map<string, PaperSearchResult>();

      allPapers.forEach((p) => {
        // Create normalization key
        const key = p.doi || p.title.toLowerCase().replace(/[^a-z0-9]/g, "");

        if (!uniquePapers.has(key)) {
          uniquePapers.set(key, p);
        } else {
          // Merge Metadata: Prefer better data from other sources
          const existing = uniquePapers.get(key)!;

          // If existing has no abstract but new one does, take new one's abstract
          if (!existing.abstract && p.abstract) existing.abstract = p.abstract;

          // If existing has no venue but new one does, take new one's venue
          if (!existing.venue && p.venue) existing.venue = p.venue;

          // If existing has no authors but new one does
          if (
            (!existing.authors || existing.authors.length === 0) &&
            p.authors &&
            p.authors.length > 0
          ) {
            existing.authors = p.authors;
          }

          // Take the year if missing
          if (!existing.year && p.year) existing.year = p.year;

          // Merge PDF/URL as before
          if (!existing.openAccessPdf && p.openAccessPdf)
            existing.openAccessPdf = p.openAccessPdf;
          if (!existing.url && p.url) existing.url = p.url;

          // Take higher citation count
          if ((p.citationCount || 0) > (existing.citationCount || 0)) {
            existing.citationCount = p.citationCount;
          }
        }
      });

      // 5. Post-Processing & Filtering
      let finalResults = Array.from(uniquePapers.values());

      // Filter out Low-Quality Results
      // If a paper has NO abstract AND NO venue/journal, it's likely a bad metadata record (e.g. from CrossRef)
      // Exception: If we have very few results, maybe keep them, but generally we want to hide them.
      if (finalResults.length > 5) {
        finalResults = finalResults.filter((p) => {
          const hasAbstract = p.abstract && p.abstract.length > 50; // Minimal length check
          const hasVenue = p.venue && p.venue.trim().length > 0;
          const hasCitations = (p.citationCount || 0) > 0;

          // Keep if it has abstract OR (venue AND citations)
          // Drop if it's just a title and year
          if (hasAbstract) return true;
          if (hasVenue && hasCitations) return true;

          return false;
        });
      }

      // 6. Sort and Return
      return finalResults
        .sort((a, b) => (b.year || 0) - (a.year || 0)) // Sort by recent first
        .slice(0, limit);
    } catch (error: any) {
      logger.error("Error searching papers:", error);
      return [];
    }
  }

  // Renamed original searchPapers to searchSemanticScholar for clarity
  private static async searchSemanticScholar(
    query: string,
    offset: number,
    limit: number,
  ): Promise<PaperSearchResult[]> {
    try {
      const apiKey = await SecretsService.getSemanticScholarApiKey();
      const headers: any = {};
      if (apiKey) headers["x-api-key"] = apiKey;

      const fields =
        "paperId,title,abstract,authors,year,venue,citationCount,url,isOpenAccess,openAccessPdf,publicationTypes,tldr";
      const searchUrl = `${this.BASE_URL}/search?query=${encodeURIComponent(query)}&offset=${offset}&limit=${limit}&fields=${fields}`;

      const response = await fetch(searchUrl, { headers });
      if (!response.ok) return [];

      const data: any = await response.json();
      if (!data.data) return [];

      return data.data.map((item: any) => ({
        externalId: item.paperId,
        title: item.title,
        abstract: item.abstract,
        authors:
          item.authors?.map((a: any) => ({
            name: a.name,
            authorId: a.authorId,
          })) || [],
        year: item.year,
        venue: item.venue,
        citationCount: item.citationCount,
        url: item.url,
        openAccessPdf: item.openAccessPdf?.url || null,
        publicationTypes: item.publicationTypes || [],
        tldr: item.tldr || null,
        source: "Semantic Scholar",
        confidenceScore: this.calculateConfidenceScore({
          year: item.year,
          citationCount: item.citationCount,
          publicationTypes: item.publicationTypes || [],
          venue: item.venue,
        } as any),
      }));
    } catch (e) {
      return [];
    }
  }

  /**
   * Get details for a specific paper
   */
  static async getPaperDetails(
    paperId: string,
  ): Promise<PaperSearchResult | null> {
    try {
      const apiKey = await SecretsService.getSemanticScholarApiKey();
      const headers: any = {};
      if (apiKey) {
        headers["x-api-key"] = apiKey;
      }

      // Normalize Paper ID for Semantic Scholar
      // If it looks like an arXiv ID (e.g. arxiv-1704.00563v1), convert to format S2 expects (ARXIV:1704.00563)
      // S2 supports: DOI, ARXIV, ACL, PMCID, PMID, etc.
      let apiPaperId = paperId;

      // Handle known prefixes from frontend/url slugs
      if (paperId.toLowerCase().startsWith("arxiv-")) {
        // Extract the ID part, remove 'arxiv-' prefix
        // Also remove version number 'v1' if present, S2 often indexes without version or expects standard format
        const cleanId = paperId.substring(6).replace(/v\d+$/, "");
        apiPaperId = `ARXIV:${cleanId}`;
      } else if (paperId.match(/^\d+\.\d+(v\d+)?$/)) {
        // It's a raw arXiv ID like 1704.00563
        const cleanId = paperId.replace(/v\d+$/, "");
        apiPaperId = `ARXIV:${cleanId}`;
      }

      const fields =
        "paperId,title,abstract,authors,year,venue,citationCount,referenceCount,url,isOpenAccess,openAccessPdf,publicationTypes,tldr";
      const url = `${this.BASE_URL}/${apiPaperId}?fields=${fields}`;

      let response = await fetch(url, { headers });

      // If 403 Forbidden and we used an API key, retry without the key
      if (response.status === 403 && headers["x-api-key"]) {
        logger.warn(
          "Semantic Scholar API Key rejected (403), retrying without key...",
        );
        response = await fetch(url);
      }

      if (response.status === 404) return null;

      // If API fails (e.g. rate limit), throw to catch block for fallback
      if (!response.ok) {
        throw new Error(`Semantic Scholar API Error: ${response.status}`);
      }

      const item: any = await response.json();

      const paper: PaperSearchResult = {
        externalId: item.paperId,
        paperId: item.paperId,
        title: item.title,
        abstract: item.abstract,
        authors:
          item.authors?.map((a: any) => ({
            name: a.name,
            authorId: a.authorId,
          })) || [],
        year: item.year,
        venue: item.venue,
        citationCount: item.citationCount,
        url: item.url,
        openAccessPdf: item.openAccessPdf?.url || null,
        publicationTypes: item.publicationTypes || [],
        tldr: item.tldr || null,
        fieldsOfStudy: item.fieldsOfStudy || [],
      };

      paper.confidenceScore = this.calculateConfidenceScore(paper);

      return paper;
    } catch (error: any) {
      logger.error(`Error getting paper details for ${paperId}:`, error);
      throw error;
    }
  }

  private static calculateConfidenceScore(paper: Partial<PaperSearchResult>): {
    score: number;
    status: "strong" | "good" | "weak" | "poor";
    recencyScore: number;
    qualityScore: number;
    warnings: string[];
  } {
    const currentYear = new Date().getFullYear();
    const age = Math.max(0, currentYear - (paper.year || currentYear));

    // 1. Recency Score (Decay)
    // 0 years = 100, 10 years ~ 20 (0.85^10 = 0.19)
    let recencyScore = Math.max(
      0,
      Math.min(100, Math.round(100 * Math.pow(0.85, age))),
    );
    if (!paper.year) recencyScore = 0;

    // 2. Quality/Impact Score (Citations & Type)
    // Log scale for citations: 0->0, 10->33, 100->66, 1000->100
    let qualityScore = 0;
    if (paper.citationCount) {
      // limit log10(cit+1) * 33 to 100
      qualityScore = Math.min(
        100,
        Math.round(Math.log10(paper.citationCount + 1) * 33),
      );
    }

    // Bonus for methodology
    const types = paper.publicationTypes || [];
    if (types.includes("MetaAnalysis") || types.includes("SystematicReview")) {
      qualityScore = Math.min(100, qualityScore + 20);
    } else if (types.includes("RandomizedControlledTrial")) {
      qualityScore = Math.min(100, qualityScore + 15);
    }

    // 3. Total Score (Weighted)
    // 40% Recency, 60% Quality
    const totalScore = Math.round(recencyScore * 0.4 + qualityScore * 0.6);

    // 4. Status
    let status: "strong" | "good" | "weak" | "poor";
    if (totalScore >= 80) status = "strong";
    else if (totalScore >= 60) status = "good";
    else if (totalScore >= 40) status = "weak";
    else status = "poor";

    // 5. Warnings
    const warnings: string[] = [];
    if (age > 10) warnings.push("Paper is over 10 years old");
    if ((paper.citationCount || 0) < 5 && age > 2)
      warnings.push("Low citation count for age");
    if (!paper.venue) warnings.push("No venue/journal verification");

    return {
      score: totalScore,
      status,
      recencyScore,
      qualityScore,
      warnings,
    };
  }

  /**
   * Save a paper to the global ResearchPaper table (idempotent)
   */
  static async savePaperToDatabase(paper: PaperSearchResult) {
    try {
      // Check if already exists by externalId
      const existing = await prisma.researchPaper.findUnique({
        where: { externalId: paper.externalId },
      });

      if (existing) return existing;

      return await prisma.researchPaper.create({
        data: {
          externalId: paper.externalId,
          title: paper.title,
          abstract: paper.abstract,
          authors: paper.authors, // Json type
          year: paper.year,
          venue: paper.venue,
          citationCount: paper.citationCount,
          url: paper.url,
          openAccessPdf: paper.openAccessPdf,
        },
      });
    } catch (error) {
      logger.error("Error saving paper to DB:", error);
      throw error;
    }
  }

  /**
   * Get Research Graph (Citations + References) for a paper
   * This bridges the gap between a single paper and its ecosystem
   */
  static async getPaperGraph(paperId: string): Promise<ResearchGraph> {
    try {
      const apiKey = await SecretsService.getSemanticScholarApiKey();
      const headers: any = {};
      if (apiKey) headers["x-api-key"] = apiKey;

      // 1. Get the central paper details
      const centerPaper = await this.getPaperDetails(paperId);
      if (!centerPaper) throw new Error("Paper not found");

      // 2. Fetch References (Who this paper cites) AND Citations (Who cites this paper)
      // Semantic Scholar Graph API allows fetching these fields
      const fields = "paperId,title,year,authors,venue,citationCount";
      const url = `${this.BASE_URL}/${paperId}?fields=${fields},references.paperId,references.title,references.year,citations.paperId,citations.title,citations.year`;

      let response = await fetch(url, { headers });

      // If 403 Forbidden and we used an API key, retry without the key
      if (response.status === 403 && headers["x-api-key"]) {
        logger.warn(
          "Semantic Scholar API Key rejected (403), retrying graph fetch without key...",
        );
        response = await fetch(url);
      }

      if (!response.ok) throw new Error("Failed to fetch graph data");

      const data: any = await response.json();

      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];

      // Add Central Node
      nodes.push({
        id: centerPaper.externalId,
        label: centerPaper.title,
        type: "paper",
        data: centerPaper,
      });

      // Process References (Outgoing Edges: Center -> Ref)
      if (data.references) {
        data.references.slice(0, 10).forEach((ref: any) => {
          if (!ref.paperId) return;
          // Add Node
          if (!nodes.find((n) => n.id === ref.paperId)) {
            nodes.push({
              id: ref.paperId,
              label: ref.title || "Unknown Paper",
              type: "reference",
              data: {
                externalId: ref.paperId,
                paperId: ref.paperId,
                title: ref.title || "Unknown",
                year: ref.year,
                authors: [], // Simplified for graph
                abstract: null,
                venue: null,
                citationCount: 0,
                url: null,
                openAccessPdf: null,
                fieldsOfStudy: [],
              },
            });
          }
          // Add Edge
          edges.push({
            id: `${centerPaper.externalId}->${ref.paperId}`,
            source: centerPaper.externalId,
            target: ref.paperId,
            label: "cites",
          });
        });
      }

      // Process Citations (Incoming Edges: Cit -> Center)
      if (data.citations) {
        data.citations.slice(0, 10).forEach((cit: any) => {
          if (!cit.paperId) return;
          // Add Node
          if (!nodes.find((n) => n.id === cit.paperId)) {
            nodes.push({
              id: cit.paperId,
              label: cit.title || "Unknown Paper",
              type: "citation",
              data: {
                paperId: cit.paperId,
                externalId: cit.paperId,
                title: cit.title || "Unknown",
                year: cit.year,
                authors: [],
                abstract: null,
                venue: null,
                citationCount: 0,
                url: null,
                openAccessPdf: null,
                fieldsOfStudy: [],
              },
            });
          }
          // Add Edge
          edges.push({
            id: `${cit.paperId}->${centerPaper.externalId}`,
            source: cit.paperId,
            target: centerPaper.externalId,
            label: "cited by",
          });
        });
      }

      return { nodes, edges };
    } catch (error) {
      logger.error("Error generating research graph:", error);
      return {
        nodes: [],
        edges: [],
      };
    }
  }
  // Save a paper to the user's library
  static async savePaperToLibrary(userId: string, paper: any, notes?: string) {
    try {
      // 1. Ensure ResearchPaper exists
      let researchPaper = await prisma.researchPaper.findUnique({
        where: { externalId: paper.externalId },
      });

      if (!researchPaper) {
        researchPaper = await prisma.researchPaper.create({
          data: {
            externalId: paper.externalId,
            title: paper.title,
            abstract: paper.abstract,
            authors: paper.authors, // Assuming internal JSON format matches
            year: paper.year,
            venue: paper.venue,
            citationCount: paper.citationCount,
            url: paper.url,
            fieldsOfStudy: paper.fieldsOfStudy || [],
            openAccessPdf: paper.openAccessPdf,
          },
        });
      }

      // 2. Create SavedPaper entry
      // Use upsert to avoid unique constraint errors if double-clicked
      const savedPaper = await prisma.savedPaper.upsert({
        where: {
          user_id_paper_id: {
            user_id: userId,
            paper_id: researchPaper.id,
          },
        },
        update: {
          notes: notes, // Update notes if provided
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          paper_id: researchPaper.id,
          notes: notes,
        },
        include: {
          paper: true,
        },
      });

      return savedPaper;
    } catch (error) {
      logger.error("Error saving paper to library:", error);
      throw error;
    }
  }

  // Get user's library
  static async getUserLibrary(userId: string) {
    try {
      const savedPapers = await prisma.savedPaper.findMany({
        where: {
          user_id: userId,
        },
        include: {
          paper: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      // Map to ResearchSource format
      // Map to ResearchSource format
      return savedPapers.map((saved: any) => {
        const paperData = {
          year: saved.paper.year,
          citationCount: saved.paper.citationCount,
          publicationTypes: saved.paper.publicationTypes || [],
          venue: saved.paper.venue,
        };

        const confidenceScore = this.calculateConfidenceScore(paperData as any);

        return {
          id: saved.paper.externalId, // Use externalId as FE id for consistency
          title: saved.paper.title,
          // Provide both string format (for cards) and array format (for details)
          author: Array.isArray(saved.paper.authors)
            ? (saved.paper.authors as any[]).map((a: any) => a.name).join(", ")
            : "Unknown",
          authors: Array.isArray(saved.paper.authors)
            ? saved.paper.authors
            : [],
          year: saved.paper.year,
          journal: saved.paper.venue,
          abstract: saved.paper.abstract,
          url: saved.paper.url,
          // Use real calculated score
          confidenceScore: confidenceScore,
          savedAt: saved.created_at,
          notes: saved.notes,
          fieldsOfStudy: saved.paper.fieldsOfStudy || [],
        };
      });
    } catch (error) {
      logger.error("Error fetching user library:", error);
      throw error;
    }
  }
  // Remove a paper from the user's library
  static async removePaperFromLibrary(userId: string, paperId: string) {
    try {
      // Logic to remove the saved paper entry
      // We look up by externalId first to find the internal ID if needed,
      // but the UI typically uses the externalId as the primary key for display.
      // However, the SavedPaper table links via internal ID.
      // Let's assume paperId passed here is the externalId (e.g. Semantic Scholar ID).

      const researchPaper = await prisma.researchPaper.findUnique({
        where: { externalId: paperId },
      });

      if (!researchPaper) {
        throw new Error("Paper not found");
      }

      const deleted = await prisma.savedPaper.delete({
        where: {
          user_id_paper_id: {
            user_id: userId,
            paper_id: researchPaper.id,
          },
        },
      });

      return deleted;
    } catch (error) {
      logger.error("Error removing paper from library:", error);
      throw error;
    }
  }
}
