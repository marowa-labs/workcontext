import { apiClient } from "./apiClient";

class CitationService {
  // Get all citations for a project
  static async getProjectCitations(projectId) {
    try {
      const response = await apiClient.get(
        `/api/citations?projectId=${projectId}`,
      );
      return response.citations || [];
    } catch (error) {
      console.error("Error fetching citations:", error);
      throw error;
    }
  }

  // Get a specific citation by ID
  static async getCitationById(citationId) {
    try {
      const response = await apiClient.get(`/api/citations/${citationId}`);
      return response.citation;
    } catch (error) {
      console.error("Error fetching citation:", error);
      throw error;
    }
  }

  // Create a new citation
  static async createCitation(projectId, citationData) {
    try {
      const response = await apiClient.post("/api/citations", {
        projectId,
        ...citationData,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to create citation");
      }

      return response.citation;
    } catch (error) {
      console.error("Error creating citation:", error);
      throw error;
    }
  }

  // Add citation (alias for createCitation for compatibility)
  static async addCitation(projectId, citationData) {
    return this.createCitation(projectId, citationData);
  }

  // Update an existing citation
  static async updateCitation(citationId, citationData) {
    try {
      const response = await apiClient.put("/api/citations", {
        id: citationId,
        ...citationData,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to update citation");
      }

      return response.citation;
    } catch (error) {
      console.error("Error updating citation:", error);
      throw error;
    }
  }

  // Delete a citation
  static async deleteCitation(citationId) {
    try {
      const response = await apiClient.delete(
        `/api/citations?id=${citationId}`,
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to delete citation");
      }

      return response.success;
    } catch (error) {
      console.error("Error deleting citation:", error);
      throw error;
    }
  }
  // Search for citations (alias for searchExternal for compatibility)
  static async searchCitations(query) {
    // Default to 'article' type if not specified, or just search generally
    return this.searchExternal(query, "article");
  }

  // Search external databases for citations
  static async searchExternal(query, type) {
    try {
      const response = await apiClient.post("/api/citations/search-external", {
        query,
        type,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to search citations");
      }

      // Process and enhance the results with additional metadata
      const results = (response.results || []).map((citation) => {
        // Add CrossRef source indicator
        if (!citation.source) {
          citation.source = "CrossRef";
        }

        // Add fetched timestamp if not present
        if (!citation.fetchedAt) {
          citation.fetchedAt = new Date().toISOString();
        }

        // Ensure all required fields are present
        return {
          id:
            citation.id ||
            citation.doi ||
            `crossref-${Date.now()}-${Math.random()}`,
          type: citation.type || "article",
          title: citation.title || "",
          authors: citation.authors || [],
          year: citation.year || null,
          journal: citation.journal || "",
          publisher: citation.publisher || "",
          volume: citation.volume || "",
          issue: citation.issue || "",
          pages: citation.pages || "",
          doi: citation.doi || "",
          url: citation.url || "",
          citationCount: citation.citationCount || 0,
          abstract: citation.abstract || "",
          issn: citation.issn || "",
          isbn: citation.isbn || "",
          subjects: citation.subjects || [],
          source: citation.source,
          fetchedAt: citation.fetchedAt,
          // Add additional fields that might be useful
          ...(citation.issn && { issn: citation.issn }),
          ...(citation.isbn && { isbn: citation.isbn }),
          ...(citation.subjects && { subjects: citation.subjects }),
        };
      });

      return results;
    } catch (error) {
      console.error("Error searching citations:", error);
      throw error;
    }
  }

  // Import citation by DOI (alias for importByDOI for compatibility)
  static async importFromDOI(doi) {
    return this.importByDOI(doi);
  }

  // Import citation from URL
  static async importFromURL(url) {
    try {
      const response = await apiClient.post("/api/citations/import-url", {
        url,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to import citation from URL");
      }

      return response.citation;
    } catch (error) {
      console.error("Error importing citation from URL:", error);
      throw error;
    }
  }

  // Import citation by DOI
  static async importByDOI(doi) {
    try {
      const response = await apiClient.post("/api/citations/import-doi", {
        doi,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to import citation");
      }

      // Process and enhance the imported citation with additional metadata
      const citation = response.citation;

      // Add CrossRef source indicator
      if (!citation.source) {
        citation.source = "CrossRef";
      }

      // Add fetched timestamp if not present
      if (!citation.fetchedAt) {
        citation.fetchedAt = new Date().toISOString();
      }

      // Ensure all required fields are present
      return {
        id: citation.id || citation.doi || `crossref-${Date.now()}`,
        type: citation.type || "article",
        title: citation.title || "",
        authors: citation.authors || [],
        year: citation.year || null,
        journal: citation.journal || "",
        publisher: citation.publisher || "",
        volume: citation.volume || "",
        issue: citation.issue || "",
        pages: citation.pages || "",
        doi: citation.doi || "",
        url: citation.url || "",
        citationCount: citation.citationCount || 0,
        abstract: citation.abstract || "",
        issn: citation.issn || "",
        isbn: citation.isbn || "",
        subjects: citation.subjects || [],
        source: citation.source,
        fetchedAt: citation.fetchedAt,
        // Add additional fields that might be useful
        ...(citation.issn && { issn: citation.issn }),
        ...(citation.isbn && { isbn: citation.isbn }),
        ...(citation.subjects && { subjects: citation.subjects }),
      };
    } catch (error) {
      console.error("Error importing citation by DOI:", error);
      throw error;
    }
  }

  // Get recent research topics from local storage (citation-based)
  static async getRecentResearchTopics(limit = 10) {
    try {
      // Get recent research topics from localStorage
      const recentTopics = localStorage.getItem("citationResearchTopics");
      if (recentTopics) {
        const topics = JSON.parse(recentTopics);
        // Return only the requested limit
        return topics.slice(0, limit);
      }
      return [];
    } catch (error) {
      console.error("Error fetching recent research topics:", error);
      return [];
    }
  }

  // Save a research topic to local storage (citation-based)
  static async saveResearchTopic(topicData) {
    try {
      // Create a research topic object
      const newTopic = {
        id: `topic-${Date.now()}`,
        title: topicData.title,
        description: topicData.description || "",
        sources: topicData.sources || 0,
        lastUpdated: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        sourcesData: topicData.sourcesData || [],
      };

      // Get existing topics from localStorage
      const recentTopics = localStorage.getItem("citationResearchTopics");
      let topics = [];
      if (recentTopics) {
        topics = JSON.parse(recentTopics);
      }

      // Add new topic to the beginning of the array
      topics.unshift(newTopic);

      // Keep only the most recent 50 topics
      if (topics.length > 50) {
        topics = topics.slice(0, 50);
      }

      // Save back to localStorage
      localStorage.setItem("citationResearchTopics", JSON.stringify(topics));

      return newTopic;
    } catch (error) {
      console.error("Error saving research topic:", error);
      throw error;
    }
  }

  // Delete a research topic from local storage
  static async deleteResearchTopic(topicId) {
    try {
      const recentTopics = localStorage.getItem("citationResearchTopics");
      if (recentTopics) {
        let topics = JSON.parse(recentTopics);
        const initialLength = topics.length;
        topics = topics.filter((topic) => topic.id !== topicId);

        if (topics.length !== initialLength) {
          localStorage.setItem(
            "citationResearchTopics",
            JSON.stringify(topics),
          );
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error deleting research topic:", error);
      return false;
    }
  }

  // Format citation based on style - REMOVED ACCESS CONTROL CHECKS
  static formatCitation(citation, style = "apa") {
    try {
      // Ensure we have a citation object
      if (!citation || typeof citation !== "object") {
        return "Invalid citation data";
      }

      // Extract authors
      let authors = "Unknown";
      if (citation.authors && Array.isArray(citation.authors)) {
        if (style.toLowerCase() === "apa" || style.toLowerCase() === "apa-7") {
          // APA style: (Author, Year)
          authors = citation.authors
            .map((author) => {
              if (author.lastName && author.firstName) {
                return `${author.lastName}, ${author.firstName.charAt(0)}.`;
              } else if (author.name) {
                return author.name;
              }
              return "Unknown";
            })
            .join(", ");
        } else if (
          style.toLowerCase() === "mla" ||
          style.toLowerCase() === "mla-9"
        ) {
          // MLA style: (Author Page)
          authors = citation.authors
            .map((author) => {
              if (author.lastName && author.firstName) {
                return `${author.lastName}, ${author.firstName}.`;
              } else if (author.name) {
                return author.name;
              }
              return "Unknown";
            })
            .join(", ");
        } else if (
          style.toLowerCase() === "chicago" ||
          style.toLowerCase() === "chicago-17"
        ) {
          // Chicago style: (Author Year)
          authors = citation.authors
            .map((author) => {
              if (author.lastName && author.firstName) {
                return `${author.lastName}, ${author.firstName}.`;
              } else if (author.name) {
                return author.name;
              }
              return "Unknown";
            })
            .join(", ");
        } else if (style.toLowerCase() === "harvard") {
          // Harvard style: (Author Year)
          authors = citation.authors
            .map((author) => {
              if (author.lastName && author.firstName) {
                return `${author.lastName}, ${author.firstName.charAt(0)}.`;
              } else if (author.name) {
                return author.name;
              }
              return "Unknown";
            })
            .join(", ");
        } else if (style.toLowerCase() === "vancouver") {
          // Vancouver style: (Author)
          authors = citation.authors
            .map((author) => {
              if (author.lastName && author.firstName) {
                return `${author.lastName} ${author.firstName.charAt(0)}.`;
              } else if (author.name) {
                return author.name;
              }
              return "Unknown";
            })
            .join(", ");
        } else {
          // Default format
          authors = citation.authors
            .map((author) => {
              if (author.lastName && author.firstName) {
                return `${author.firstName} ${author.lastName}`;
              } else if (author.name) {
                return author.name;
              }
              return "Unknown";
            })
            .join(", ");
        }
      }

      // Extract year
      const year = citation.year || "N.d.";

      // Extract title
      const title = citation.title || "Untitled";

      // Format based on citation type and style
      if (citation.type === "book") {
        const publisher = citation.publisher || "N.p.";
        const isbn = citation.isbn ? `ISBN ${citation.isbn}` : "";
        const place = citation.place || "";

        if (style.toLowerCase() === "apa" || style.toLowerCase() === "apa-7") {
          return `${authors} (${year}). ${title}. ${publisher}.${isbn ? ` ${isbn}` : ""}`;
        } else if (
          style.toLowerCase() === "mla" ||
          style.toLowerCase() === "mla-9"
        ) {
          return `${authors}. ${title}. ${publisher}, ${year}.${isbn ? ` ${isbn}` : ""}`;
        } else if (
          style.toLowerCase() === "chicago" ||
          style.toLowerCase() === "chicago-17"
        ) {
          return `${authors}. ${year}. ${title}. ${place ? place + ": " : ""}${publisher}.${isbn ? ` ${isbn}` : ""}`;
        } else if (style.toLowerCase() === "harvard") {
          return `${authors}, ${year}. ${title}. ${place ? place + ": " : ""}${publisher}.${isbn ? ` ${isbn}` : ""}`;
        } else if (style.toLowerCase() === "vancouver") {
          return `${authors}. ${title} [Internet]. ${place ? place + ": " : ""}${publisher}; ${year}.${isbn ? ` ${isbn}` : ""}`;
        } else {
          // Default format
          return `${authors} (${year}). ${title}. ${publisher}.${isbn ? ` ${isbn}` : ""}`;
        }
      } else if (citation.type === "article") {
        const journal = citation.journal || "N.p.";
        const volume = citation.volume || "";
        const issue = citation.issue ? `(${citation.issue})` : "";
        const pages = citation.pages || "";
        const doi = citation.doi ? `https://doi.org/${citation.doi}` : "";

        if (style.toLowerCase() === "apa" || style.toLowerCase() === "apa-7") {
          return `${authors} (${year}). ${title}. ${journal}, ${volume}${issue}, ${pages}.${doi ? ` ${doi}` : ""}`;
        } else if (
          style.toLowerCase() === "mla" ||
          style.toLowerCase() === "mla-9"
        ) {
          return `${authors}. "${title}." ${journal}, vol. ${volume}, no. ${issue}, ${year}, pp. ${pages}.${doi ? ` ${doi}` : ""}`;
        } else if (
          style.toLowerCase() === "chicago" ||
          style.toLowerCase() === "chicago-17"
        ) {
          return `${authors}. "${title}." ${journal} ${volume}${issue} (${year}): ${pages}.${doi ? ` ${doi}` : ""}`;
        } else if (style.toLowerCase() === "harvard") {
          return `${authors}, ${year}. '${title}'. ${journal}, ${volume}${issue}, pp.${pages}.${doi ? ` ${doi}` : ""}`;
        } else if (style.toLowerCase() === "vancouver") {
          return `${authors}. ${title}. ${journal}. ${year};${volume}${issue}:${pages}.${doi ? ` ${doi}` : ""}`;
        } else {
          // Default format
          return `${authors} (${year}). ${title}. ${journal}, ${volume}${issue}, ${pages}.${doi ? ` ${doi}` : ""}`;
        }
      } else if (citation.type === "website") {
        const url = citation.url ? new URL(citation.url).hostname : "N.p.";
        const accessed = citation.accessed
          ? `Accessed ${citation.accessed}`
          : "";

        if (style.toLowerCase() === "apa" || style.toLowerCase() === "apa-7") {
          return `${authors} (${year}). ${title}. Retrieved from ${url}`;
        } else if (
          style.toLowerCase() === "mla" ||
          style.toLowerCase() === "mla-9"
        ) {
          return `${authors}. "${title}." ${url}, ${year}. ${accessed}`;
        } else if (
          style.toLowerCase() === "chicago" ||
          style.toLowerCase() === "chicago-17"
        ) {
          return `${authors}. ${year}. "${title}." ${url}. ${accessed}`;
        } else if (style.toLowerCase() === "harvard") {
          return `${authors}, ${year}. ${title}. Available from: ${url} [${accessed}]`;
        } else if (style.toLowerCase() === "vancouver") {
          return `${authors}. ${title} [Internet]. ${url}; ${year}. [${accessed}]`;
        } else {
          // Default format
          return `${authors} (${year}). ${title}. Retrieved from ${url}`;
        }
      } else if (citation.type === "conference") {
        const conference = citation.conference || "Conference";
        const publisher = citation.publisher || "N.p.";
        const pages = citation.pages || "";
        const doi = citation.doi ? `https://doi.org/${citation.doi}` : "";

        if (style.toLowerCase() === "apa" || style.toLowerCase() === "apa-7") {
          return `${authors} (${year}). ${title}. In ${conference} (pp. ${pages}). ${publisher}.${doi ? ` ${doi}` : ""}`;
        } else if (
          style.toLowerCase() === "mla" ||
          style.toLowerCase() === "mla-9"
        ) {
          return `${authors}. "${title}." ${conference}, ${year}, pp. ${pages}. ${publisher}.${doi ? ` ${doi}` : ""}`;
        } else if (
          style.toLowerCase() === "chicago" ||
          style.toLowerCase() === "chicago-17"
        ) {
          return `${authors}. ${year}. "${title}." Paper presented at ${conference}, ${pages}. ${publisher}.${doi ? ` ${doi}` : ""}`;
        } else if (style.toLowerCase() === "harvard") {
          return `${authors}, ${year}. '${title}'. In: ${conference}. ${publisher}; ${year}. pp.${pages}.${doi ? ` ${doi}` : ""}`;
        } else if (style.toLowerCase() === "vancouver") {
          return `${authors}. ${title}. In: ${conference}; ${year}. ${publisher}; ${year}. pp.${pages}.${doi ? ` ${doi}` : ""}`;
        } else {
          // Default format
          return `${authors} (${year}). ${title}. In ${conference} (pp. ${pages}). ${publisher}.${doi ? ` ${doi}` : ""}`;
        }
      } else if (citation.type === "thesis") {
        const institution = citation.publisher || "Institution";
        const type = citation.thesisType || "Doctoral dissertation";

        if (style.toLowerCase() === "apa" || style.toLowerCase() === "apa-7") {
          return `${authors} (${year}). ${title} (${type}). ${institution}.`;
        } else if (
          style.toLowerCase() === "mla" ||
          style.toLowerCase() === "mla-9"
        ) {
          return `${authors}. ${title}. ${type}, ${institution}, ${year}.`;
        } else if (
          style.toLowerCase() === "chicago" ||
          style.toLowerCase() === "chicago-17"
        ) {
          return `${authors}. ${year}. "${title}." ${type}, ${institution}.`;
        } else if (style.toLowerCase() === "harvard") {
          return `${authors}, ${year}. ${title} (${type}). ${institution}.`;
        } else if (style.toLowerCase() === "vancouver") {
          return `${authors}. ${title} (${type}). ${institution}; ${year}.`;
        } else {
          // Default format
          return `${authors} (${year}). ${title} (${type}). ${institution}.`;
        }
      } else if (citation.type === "report") {
        const institution = citation.publisher || "Institution";
        const reportNumber = citation.reportNumber || "";

        if (style.toLowerCase() === "apa" || style.toLowerCase() === "apa-7") {
          return `${authors} (${year}). ${title} (${reportNumber}). ${institution}.`;
        } else if (
          style.toLowerCase() === "mla" ||
          style.toLowerCase() === "mla-9"
        ) {
          return `${authors}. ${title}. ${institution}, ${year}. ${reportNumber}.`;
        } else if (
          style.toLowerCase() === "chicago" ||
          style.toLowerCase() === "chicago-17"
        ) {
          return `${authors}. ${year}. "${title}." ${reportNumber}, ${institution}.`;
        } else if (style.toLowerCase() === "harvard") {
          return `${authors}, ${year}. ${title}. ${institution}. ${reportNumber}.`;
        } else if (style.toLowerCase() === "vancouver") {
          return `${authors}. ${title}. ${institution}; ${year}. ${reportNumber}.`;
        } else {
          // Default format
          return `${authors} (${year}). ${title}. ${institution}. ${reportNumber}.`;
        }
      }

      // Default format for unknown types
      return `${authors} (${year}). ${title}.`;
    } catch (error) {
      console.error("Error formatting citation:", error);
      return "Error formatting citation";
    }
  }

  // Format in-text citation based on style
  static formatInTextCitation(citation, style = "apa") {
    try {
      if (!citation) return "";

      const lastName =
        citation.authors?.[0]?.lastName ||
        citation.authors?.[0]?.name?.split(" ").pop() ||
        "Author";
      const year = citation.year || "n.d.";
      const s = style.toLowerCase();

      // Numeric styles (IEEE, Nature, Vancouver, etc.)
      const numericStyles = [
        "ieee",
        "nature",
        "vancouver",
        "american-medical-association",
      ];
      if (numericStyles.some((ns) => s.includes(ns))) {
        return `[#]`; // Placeholder for numeric citation
      }

      // Author-Date styles
      if (s.includes("apa")) {
        return `(${lastName}, ${year})`;
      }

      if (s.includes("mla")) {
        return `(${lastName})`;
      }

      if (s.includes("chicago") || s.includes("harvard")) {
        return `(${lastName} ${year})`;
      }

      // Default fallback
      return `(${lastName}, ${year})`;
    } catch (error) {
      console.error("Error formatting in-text citation:", error);
      return "(Citation)";
    }
  }

  // Generate bibliography from citations - REMOVED ACCESS CONTROL CHECKS
  static async generateBibliography(citations, style = "apa") {
    try {
      if (!citations || !Array.isArray(citations) || citations.length === 0) {
        return "";
      }

      // Process citations to ensure they have all required fields
      const processedCitations = citations.map((citation) => {
        // Add CrossRef source indicator if not present
        if (!citation.source) {
          citation.source = "CrossRef";
        }

        // Add fetched timestamp if not present
        if (!citation.fetchedAt) {
          citation.fetchedAt = new Date().toISOString();
        }

        return citation;
      });

      return processedCitations
        .map((citation) => this.formatCitation(citation, style))
        .join("\n\n");
    } catch (error) {
      console.error("Error generating bibliography:", error);
      throw new Error(
        "Failed to generate bibliography: " +
          (error.message || "Unknown error"),
      );
    }
  }

  // Analyze citation style from an uploaded PDF
  static async analyzeStyleViaPDF(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.postMultipart(
        "/api/citations/analysis/pdf",
        formData,
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to analyze paper style");
      }

      return response.analysis;
    } catch (error) {
      console.error("Error analyzing PDF style:", error);
      throw error;
    }
  }

  // Analyze citation style from a remote URL
  static async analyzeStyleViaURL(url) {
    try {
      const response = await apiClient.post("/api/citations/analysis/url", {
        url,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to analyze paper style");
      }

      return response.analysis;
    } catch (error) {
      console.error("Error analyzing remote paper style:", error);
      throw error;
    }
  }
  // Analyze citations for retractions and smart metrics
  static async smartCheck(citations) {
    try {
      const response = await apiClient.post(
        "/api/citations/analysis/smart-check",
        {
          citations,
        },
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to run smart citation check");
      }

      return response.metrics;
    } catch (error) {
      console.error("Error in smartCheck:", error);
      throw error;
    }
  }
}

export default CitationService;
