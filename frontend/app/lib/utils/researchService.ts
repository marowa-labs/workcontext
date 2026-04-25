import { apiClient } from "./apiClient";
import {
  ResearchTopic,
  ResearchSource,
  SearchResult,
  DeepSearchResult,
} from "../../types/research";

export class ResearchService {
  // Perform a web search for research topics
  static async webSearch(
    query: string,
    maxResults: number = 10,
  ): Promise<SearchResult[]> {
    try {
      const response = await apiClient.post("/api/ai/search/web", {
        query,
        maxResults,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to perform web search");
      }

      return response.results;
    } catch (error) {
      console.error("Error performing web search:", error);
      throw error;
    }
  }

  // Perform a deep search on specific sources
  static async deepSearch(
    query: string,
    sources: string[],
  ): Promise<DeepSearchResult[]> {
    try {
      const response = await apiClient.post("/api/ai/search/deep", {
        query,
        sources,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to perform deep search");
      }

      return response.results;
    } catch (error) {
      console.error("Error performing deep search:", error);
      throw error;
    }
  }

  // Analyze search results to generate insights
  static async analyzeSearchResults(
    query: string,
    results: SearchResult[],
  ): Promise<string> {
    try {
      const response = await apiClient.post("/api/ai/search/analyze", {
        query,
        results,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to analyze search results");
      }

      return response.analysis;
    } catch (error) {
      console.error("Error analyzing search results:", error);
      throw error;
    }
  }

  // Get research graph data
  static async getResearchGraph(paperId: string): Promise<any> {
    try {
      const response = await apiClient.get(
        `/api/research/graph?paperId=${paperId}`,
      );

      if (!response && !response.data) {
        throw new Error("Failed to fetch research graph");
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching research graph:", error);
      throw error;
    }
  }

  // Get recent research topics
  static async getRecentResearchTopics(): Promise<ResearchTopic[]> {
    try {
      const response = await apiClient.get("/api/ai/research/topics");

      if (!response.success) {
        throw new Error(
          response.message || "Failed to fetch recent research topics",
        );
      }

      return response.topics;
    } catch (error) {
      console.error("Error fetching recent research topics:", error);
      throw error;
    }
  }

  // Chat regarding specific papers
  static async chatWithPapers(
    query: string,
    paperIds: string[],
    history: any[] = [],
    projectId?: string,
    sessionId?: string | null,
    model?: string,
  ): Promise<any> {
    try {
      const response = await apiClient.post("/api/research/chat", {
        query,
        paperIds,
        history,
        projectId,
        sessionId,
        model,
      });

      if (!response && !response.data) {
        throw new Error("Failed to get chat response");
      }

      // Return the full response which includes data (answer), sessionId, and messageId
      return response;
    } catch (error) {
      console.error("Error in chatWithPapers:", error);
      throw error;
    }
  }

  // Chat regarding uploaded PDF
  static async chatWithPdf(
    message: string,
    documentId: string,
    history: any[] = [],
  ): Promise<string> {
    try {
      const response = await apiClient.post("/api/pdf/chat", {
        message,
        documentId,
        history,
      });

      if (!response && !response.answer) {
        throw new Error("Failed to get chat response");
      }

      return response.answer;
    } catch (error) {
      console.error("Error chatting with PDF:", error);
      throw error;
    }
  }

  // Save a research topic
  static async saveResearchTopic(
    topic: Omit<ResearchTopic, "id" | "createdAt">,
    sourcesData: Omit<ResearchSource, "id">[] = [],
  ): Promise<ResearchTopic> {
    try {
      const response = await apiClient.post("/api/ai/research/topics", {
        title: topic.title,
        description: topic.description,
        sources: topic.sources,
        sourcesData: sourcesData.map((source) => ({
          title: source.title,
          author: source.author,
          year: source.year,
          journal: source.journal,
          abstract: source.abstract,
          url: source.url,
          content: source.content,
          summary: source.summary,
          relevance: source.relevance,
        })),
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to save research topic");
      }

      return response.topic;
    } catch (error) {
      console.error("Error saving research topic:", error);
      throw error;
    }
  }

  // Get concept map
  static async getConceptMap(
    query: string,
    projectId?: string | null,
  ): Promise<any> {
    try {
      const response = await apiClient.post("/api/research/map", {
        query,
        projectId,
      });
      // apiClient throws on HTTP errors, so if we're here the request succeeded
      return response;
    } catch (error) {
      console.error("Error fetching concept map:", error);
      throw error;
    }
  }

  // Generate generic Studio Item (Flashcards, Quiz, Report, etc.)
  static async generateStudioItem(
    projectId: string,
    type: string, // "flashcards" | "quiz" | "reports" | "data_table"
  ): Promise<any> {
    try {
      console.log("Calling generateStudioItem with:", { projectId, type });
      const response = await apiClient.post("/api/research/studio", {
        projectId,
        type,
      });
      console.log("generateStudioItem response:", response);
      if (!response && !response.data) {
        throw new Error(`Failed to generate ${type}`);
      }
      return response;
    } catch (error) {
      console.error(`Error generating ${type}:`, error);
      throw error;
    }
  }

  // Get user's sources library
  static async getUserLibrary(): Promise<ResearchSource[]> {
    try {
      const response = await apiClient.get("/api/research/library");

      if (!response.success && !response.data) {
        // If the API returns a standard success: false structure
        throw new Error(response.message || "Failed to fetch library sources");
      }

      // Handle cases where response might be { data: [...] } or just [...]
      return response.data || response;
    } catch (error) {
      console.error("Error fetching library sources:", error);
      // Return empty array instead of throwing to prevent UI crash,
      // but log error. optional: throw error if we want UI to show error state.
      throw error;
    }
  }
  // Remove a paper from the library
  static async removePaperFromLibrary(paperId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete(
        `/api/research/library/${paperId}`,
        null,
      );

      if (!response && !response.success) {
        throw new Error("Failed to remove paper from library");
      }

      return true;
    } catch (error) {
      console.error("Error removing paper from library:", error);
      throw error;
    }
  }

  // Get research guide data
  static async getResearchGuide(projectId: string): Promise<any> {
    try {
      const response = await apiClient.post("/api/research/guide", {
        projectId,
      });
      return response;
    } catch (error) {
      console.error("Error fetching research guide:", error);
      throw error;
    }
  }

  // Generate audio overview
  static async generateAudioOverview(
    projectId: string,
    settings?: { tone: string; length: string },
  ): Promise<any> {
    try {
      const response = await apiClient.post("/api/research/audio/generate", {
        projectId,
        ...settings,
      });
      return response;
    } catch (error) {
      console.error("Error generating audio:", error);
      throw error;
    }
  }

  // Get audio generation status
  static async getAudioStatus(projectId: string): Promise<any> {
    try {
      const response = await apiClient.get(
        `/api/research/audio/status/${projectId}`,
      );
      return response;
    } catch (error) {
      console.error("Error fetching audio status:", error);
      throw error;
    }
  }

  // Get chat history for a project
  static async getChatHistory(
    projectId: string,
  ): Promise<{ session: any; messages: any[] }> {
    try {
      const response = await apiClient.get(`/api/research/chat/${projectId}`);
      // return empty if null/false
      if (!response) return { session: null, messages: [] };
      return response;
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return { session: null, messages: [] };
    }
  }

  // Get all chat sessions for a project
  static async getChatSessions(projectId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(
        `/api/research/chat/sessions/${projectId}`,
      );
      return response.sessions || [];
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      return [];
    }
  }

  // Get a specific chat session
  static async getChatSession(
    sessionId: string,
  ): Promise<{ session: any; messages: any[] }> {
    try {
      const response = await apiClient.get(
        `/api/research/chat/session/${sessionId}`,
      );
      return response;
    } catch (error) {
      console.error("Error fetching chat session:", error);
      throw error;
    }
  }

  // Get current user profile
  static async getCurrentUser(): Promise<any> {
    try {
      const response = await apiClient.get("/api/users");
      return response.user;
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw error;
    }
  }

  // Alias for getUserLibrary for the AddSourcesModal
  static async getUserSources(): Promise<ResearchSource[]> {
    return this.getUserLibrary();
  }

  // Get all user projects
  static async getProjects(userId: string): Promise<{ id: string; title: string; sourceCount?: number }[]> {
    try {
      const queryParams = new URLSearchParams({ userId });
      const response = await apiClient.get(`/api/projects?${queryParams.toString()}`);
      
      return response.projects || response.data || [];
    } catch (error) {
      console.error("Error fetching projects:", error);
      return [];
    }
  }

  // Add sources to a project
  static async addSourcesToProject(projectId: string, sourceIds: string[]): Promise<boolean> {
    try {
      const response = await apiClient.post("/api/projects/sources/add", {
        projectId,
        sourceIds,
      });
      
      if (!response.success) {
        throw new Error(response.message || "Failed to add sources to project");
      }
      
      return true;
    } catch (error) {
      console.error("Error adding sources to project:", error);
      throw error;
    }
  }

  // Import sources from other projects
  static async importSourcesFromProjects(projectId: string, fromProjectIds: string[]): Promise<boolean> {
    try {
      const response = await apiClient.post("/api/projects/sources/import", {
        projectId,
        fromProjectIds,
      });
      
      if (!response.success) {
        throw new Error(response.message || "Failed to import sources");
      }
      
      return true;
    } catch (error) {
      console.error("Error importing sources from projects:", error);
      throw error;
    }
  }

  // Upload files to project
  static async uploadFiles(projectId: string, files: File[]): Promise<any[]> {
    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      files.forEach((file) => formData.append("files", file));

      const response = await apiClient.post("/api/sources/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.sources || response.data || [];
    } catch (error) {
      console.error("Error uploading files:", error);
      throw error;
    }
  }

  // Add website URL as source
  static async addWebsiteSource(projectId: string, url: string, title?: string): Promise<any> {
    try {
      const response = await apiClient.post("/api/sources/web", {
        projectId,
        url,
        title,
      });

      return response.source || response.data;
    } catch (error) {
      console.error("Error adding website source:", error);
      throw error;
    }
  }

  // Add text content as source
  static async addTextSource(projectId: string, content: string, title?: string): Promise<any> {
    try {
      const response = await apiClient.post("/api/sources/text", {
        projectId,
        content,
        title: title || "Pasted Text",
      });

      return response.source || response.data;
    } catch (error) {
      console.error("Error adding text source:", error);
      throw error;
    }
  }

  // Search web for sources with selectable results
  static async searchWebSources(query: string, maxResults: number = 10): Promise<any[]> {
    try {
      const response = await apiClient.post("/api/sources/search", {
        query,
        maxResults,
      });

      return response.results || response.data || [];
    } catch (error) {
      console.error("Error searching web sources:", error);
      throw error;
    }
  }

  // Save selected web search results as sources
  static async saveWebSources(projectId: string, sources: any[]): Promise<any[]> {
    try {
      const response = await apiClient.post("/api/sources/web/save", {
        projectId,
        sources,
      });

      return response.sources || response.data || [];
    } catch (error) {
      console.error("Error saving web sources:", error);
      throw error;
    }
  }

  // Get sources for a project
  static async getProjectSources(projectId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/api/sources?projectId=${projectId}`);
      return response.sources || response.data || [];
    } catch (error) {
      console.error("Error fetching project sources:", error);
      return [];
    }
  }

  // Delete a source
  static async deleteSource(sourceId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/sources/${sourceId}`, {});
    } catch (error) {
      console.error("Error deleting source:", error);
      throw error;
    }
  }

  // Update a source
  static async updateSource(sourceId: string, updates: { title?: string }): Promise<void> {
    try {
      await apiClient.patch(`/api/sources/${sourceId}`, updates);
    } catch (error) {
      console.error("Error updating source:", error);
      throw error;
    }
  }

  // Generate summary and questions for selected sources (doesn't save to chat history)
  static async generateSourcesSummary(
    sourceIds: string[],
    projectId?: string,
    model?: string,
  ): Promise<{ summary: string; questions: string[] }> {
    try {
      const response = await apiClient.post("/api/research/summarize", {
        sourceIds,
        projectId,
        model,
      });

      return {
        summary: response.summary || "",
        questions: response.questions || [],
      };
    } catch (error) {
      console.error("Error generating sources summary:", error);
      throw error;
    }
  }
}
