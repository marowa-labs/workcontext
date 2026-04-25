export interface ResearchTopic {
  id: string;
  title: string;
  description: string;
  sources: number;
  lastUpdated: string;
  createdAt: string;
}

export interface ResearchSource {
  id: string;
  title: string;
  author: string;
  year: number;
  journal?: string;
  abstract?: string;
  url?: string;
  relevance: number;
  content?: string;
  summary?: string;
  confidenceScore?: {
    overall: number;
    recencyScore: number;
    coverageScore: number;
    qualityScore: number;
    diversityScore: number;
    status: "strong" | "good" | "weak" | "poor";
    warnings: string[];
    suggestions: string[];
  };
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

export interface DeepSearchResult {
  title: string;
  url: string;
  content: string;
  summary: string;
  relevance: number;
}
