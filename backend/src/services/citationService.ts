import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";
import { CrossRefService } from "./crossRefService";
import { SubscriptionService } from "./subscriptionService";
import { createNotification } from "./notificationService";
const Cite = require("citation-js");
require("@citation-js/plugin-csl");
require("@citation-js/plugin-bibtex");
require("@citation-js/plugin-ris");

export class CitationService {
  // Get all citations for a project
  static async getProjectCitations(
    projectId: string,
    userId: string,
    filters?: {
      search?: string;
      type?: string;
      sortBy?: string;
      sortOrder?: string;
    },
  ) {
    try {
      console.log("DEBUG: getProjectCitations start", { projectId, userId });
      logger.info("getProjectCitations called", {
        projectId,
        userId,
        filters,
      });

      // Verify user has access to project (owner or collaborator)
      logger.debug("Checking project access", { projectId, userId });
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          user_id: userId,
        },
      });

      logger.debug("Project lookup result", {
        projectFound: !!project,
        projectId,
        userId,
      });

      if (!project) {
        const error = new Error("Project not found or access denied");
        logger.warn("Project access denied", {
          projectId,
          userId,
          error: error.message,
        });
        throw error;
      }

      // Build where clause
      const where: any = { project_id: projectId };

      if (filters?.type && filters.type !== "all") {
        where.type = filters.type;
      }

      if (filters?.search) {
        where.OR = [
          { title: { contains: filters.search, mode: "insensitive" } },
          {
            authors: {
              path: "$[*].firstName",
              string_contains: filters.search,
            },
          },
          {
            authors: { path: "$[*].lastName", string_contains: filters.search },
          },
          { journal: { contains: filters.search, mode: "insensitive" } },
          { doi: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      // Build orderBy clause
      const orderBy: any = {};
      if (filters?.sortBy) {
        orderBy[filters.sortBy] = filters.sortOrder || "desc";
      } else {
        orderBy.created_at = "desc";
      }

      logger.debug("Query parameters", {
        where,
        orderBy,
        projectId,
        userId,
      });

      console.log("DEBUG: Executing findMany citations", { where });
      const citations = await prisma.citation.findMany({
        where,
        orderBy,
        select: {
          id: true,
          type: true,
          title: true,
          authors: true,
          year: true,
          journal: true,
          volume: true,
          issue: true,
          pages: true,
          doi: true,
          url: true,
          publisher: true,
          isbn: true,
          edition: true,
          place: true,
          conference: true,
          abstract: true,
          tags: true,
          notes: true,
          metadata: true,
          created_at: true,
          updated_at: true,
        },
      });

      logger.info("Successfully fetched citations", {
        count: citations.length,
        projectId,
        userId,
      });

      return citations;
    } catch (error) {
      logger.error("Error fetching project citations:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        userId,
      });
      throw error;
    }
  }

  // Get a specific citation by ID
  static async getCitationById(citationId: string, userId: string) {
    try {
      const citation = await prisma.citation.findFirst({
        where: {
          id: citationId,
          project: {
            user_id: userId,
          },
        },
        select: {
          id: true,
          type: true,
          title: true,
          authors: true,
          year: true,
          journal: true,
          volume: true,
          issue: true,
          pages: true,
          doi: true,
          url: true,
          publisher: true,
          isbn: true,
          edition: true,
          place: true,
          conference: true,
          abstract: true,
          tags: true,
          notes: true,
          metadata: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!citation) {
        throw new Error("Citation not found or access denied");
      }

      return citation;
    } catch (error) {
      logger.error("Error fetching citation:", error);
      throw error;
    }
  }

  // Validate citation data
  private static validateCitationData(
    citationData: any,
    type: string,
  ): string[] {
    const errors: string[] = [];

    // Validate required fields based on citation type
    if (!citationData.title) {
      errors.push("Title is required");
    }

    // Validate authors
    if (citationData.authors) {
      if (!Array.isArray(citationData.authors)) {
        errors.push("Authors must be an array");
      } else {
        citationData.authors.forEach((author: any, index: number) => {
          if (author && typeof author === "object") {
            if (!author.firstName && !author.lastName && !author.name) {
              errors.push(
                `Author ${index + 1}: Name, or First name/Last name is required`,
              );
            }
          } else {
            errors.push(`Author ${index + 1}: Invalid author format`);
          }
        });
      }
    }

    // Type-specific validation
    switch (type) {
      case "article":
        // For CrossRef articles, we should allow articles without authors if they come from CrossRef
        if (citationData.authors && citationData.authors.length === 0) {
          // Only require authors if this is not a CrossRef import
          if (citationData.source !== "CrossRef") {
            errors.push("Articles require at least one author");
          }
        }
        break;
      case "book":
        if (!citationData.publisher) {
          errors.push("Books require a publisher");
        }
        if (!citationData.year) {
          errors.push("Books require a publication year");
        }
        break;
      case "website":
        if (!citationData.url) {
          errors.push("Websites require a URL");
        }
        break;
    }

    return errors;
  }

  // Create a new citation
  static async createCitation(
    projectId: string,
    userId: string,
    citationData: any,
  ) {
    try {
      logger.info("createCitation called", {
        projectId,
        userId,
        citationData,
      });

      // Validate citation data
      const errors = this.validateCitationData(
        citationData,
        citationData.type || "article",
      );
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join(", ")}`);
      }

      // Verify user has access to project (owner or collaborator)
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          user_id: userId,
        },
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      // Create the citation
      const citation = await prisma.citation.create({
        data: {
          project_id: projectId,
          type: citationData.type || "article",
          title: citationData.title,
          authors: citationData.authors,
          year: citationData.year,
          journal: citationData.journal,
          volume: citationData.volume,
          issue: citationData.issue,
          pages: citationData.pages,
          doi: citationData.doi,
          url: citationData.url,
          publisher: citationData.publisher,
          isbn: citationData.isbn,
          edition: citationData.edition,
          place: citationData.place,
          conference: citationData.conference,
          abstract: citationData.abstract,
          tags: citationData.tags,
          notes: citationData.notes,
          metadata: citationData.metadata || {},
        },
        select: {
          id: true,
          type: true,
          title: true,
          authors: true,
          year: true,
          journal: true,
          volume: true,
          issue: true,
          pages: true,
          doi: true,
          url: true,
          publisher: true,
          isbn: true,
          edition: true,
          place: true,
          conference: true,
          abstract: true,
          tags: true,
          notes: true,
          metadata: true,
          created_at: true,
          updated_at: true,
        },
      });

      // Update citation analytics with source tracking
      await this.updateCitationAnalytics(
        userId,
        "created",
        citationData.source,
      );

      return citation;
    } catch (error) {
      logger.error("Error creating citation:", error);
      throw error;
    }
  }

  // Update a citation
  static async updateCitation(
    citationId: string,
    userId: string,
    updateData: any,
  ) {
    try {
      // Get existing citation to determine type for validation
      const existingCitation = await prisma.citation.findFirst({
        where: {
          id: citationId,
          project: {
            OR: [
              { user_id: userId }, // User is the owner
              {
                collaborators: {
                  some: {
                    user_id: userId,
                  },
                },
              }, // User is a collaborator
            ],
          },
        },
      });

      if (!existingCitation) {
        throw new Error("Citation not found or access denied");
      }

      // Validate citation data
      const errors = this.validateCitationData(
        updateData,
        existingCitation.type,
      );
      if (errors.length > 0) {
        throw new Error("Validation errors: " + errors.join(", "));
      }

      const citation = await prisma.citation.update({
        where: {
          id: citationId,
          project: {
            user_id: userId,
          },
        },
        data: updateData,
        select: {
          id: true,
          type: true,
          title: true,
          authors: true,
          year: true,
          journal: true,
          volume: true,
          issue: true,
          pages: true,
          doi: true,
          url: true,
          publisher: true,
          isbn: true,
          edition: true,
          place: true,
          conference: true,
          abstract: true,
          tags: true,
          notes: true,
          metadata: true,
          created_at: true,
          updated_at: true,
        },
      });

      // Update citation analytics
      await this.updateCitationAnalytics(userId, "updated");

      return citation;
    } catch (error) {
      logger.error("Error updating citation:", error);
      throw error;
    }
  }

  // Delete a citation
  static async deleteCitation(citationId: string, userId: string) {
    try {
      // First delete related shares to avoid foreign key constraint
      await prisma.citationShare.deleteMany({
        where: {
          citation_id: citationId,
        },
      });

      await prisma.citation.delete({
        where: {
          id: citationId,
          project: {
            OR: [
              { user_id: userId }, // User is the owner
              {
                collaborators: {
                  some: {
                    user_id: userId,
                  },
                },
              }, // User is a collaborator
            ],
          },
        },
      });

      // Update citation analytics
      await this.updateCitationAnalytics(userId, "deleted");

      return true;
    } catch (error) {
      logger.error("Error deleting citation:", error);
      throw error;
    }
  }

  // Search external databases for citations
  static async searchExternal(query: string, type?: number) {
    try {
      logger.debug(`Searching external databases for: ${query}`);

      // Use CrossRef API for external search with enhanced parameters
      const results = await CrossRefService.searchWorks(query, 15, type);

      logger.debug(`Found ${results.length} results from CrossRef`);
      return results;
    } catch (error) {
      logger.error("Error searching external databases:", error);
      // Return empty array instead of throwing to prevent complete failure
      return [];
    }
  }

  // Format citation in different styles (APA, MLA, Chicago, etc.)
  static async formatCitation(
    citation: any,
    style: string = "apa",
  ): Promise<string> {
    try {
      // Convert our internal format to CSL-JSON
      const cslData = {
        id: citation.id || "temp-id",
        type: this.mapTypeToCSL(citation.type),
        title: citation.title,
        author: Array.isArray(citation.authors)
          ? citation.authors.map((a: any) => ({
              given: a.firstName || a.name?.split(" ")[0] || "",
              family:
                a.lastName ||
                a.name?.split(" ").slice(1).join(" ") ||
                a.name ||
                "Unknown",
            }))
          : [],
        issued: { "date-parts": [[citation.year || new Date().getFullYear()]] },
        "container-title":
          citation.journal || citation.venue || citation.publisher,
        volume: citation.volume,
        issue: citation.issue,
        page: citation.pages,
        DOI: citation.doi,
        URL: citation.url,
        publisher: citation.publisher,
      };

      // Configuration for Cite
      const config = Cite.plugins.config.get("@citation-js/plugin-csl");
      config.set("defaultLocale", "en-US");

      // Basic style mapping for common names
      let templateName = style.toLowerCase();
      if (templateName === "apa" || templateName === "apa-7")
        templateName = "apa";
      if (templateName === "mla" || templateName === "mla-9")
        templateName = "modern-language-association";
      if (templateName === "chicago") templateName = "chicago-author-date";
      if (templateName === "harvard") templateName = "harvard1";
      if (templateName === "vancouver") templateName = "vancouver";
      if (templateName === "ieee") templateName = "ieee";

      // Initialize Cite object
      const cite = new Cite(cslData);

      // Generate bibliography entry
      const output = cite.format("bibliography", {
        format: "text",
        template: templateName,
        lang: "en-US",
      });

      return output.trim();
    } catch (error) {
      logger.error("Error formatting citation:", error);
      // Fallback to basic format if CSL fails
      return `${citation.authors?.[0]?.lastName || "Unknown"}, (${citation.year}). ${citation.title}.`;
    }
  }

  private static mapTypeToCSL(type: string): string {
    switch (type?.toLowerCase()) {
      case "article":
        return "article-journal";
      case "book":
        return "book";
      case "website":
        return "webpage";
      case "conference":
        return "paper-conference";
      case "thesis":
        return "thesis";
      case "report":
        return "report";
      default:
        return "article";
    }
  }

  // Generate bibliography from citations
  static async generateBibliography(
    citations: any[],
    style: string = "apa",
    userId: string,
  ): Promise<string> {
    try {
      // All users can now use any citation format - REMOVED ACCESS CONTROL CHECK

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

        // Ensure all required fields are present
        return {
          id: citation.id || `citation-${Date.now()}-${Math.random()}`,
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

      return processedCitations
        .map((citation) => this.formatCitation(citation, style))
        .join("\n\n");
    } catch (error) {
      logger.error("Error generating bibliography:", error);
      throw error;
    }
  }

  // Get user citation settings
  static async getUserCitationSettings(userId: string) {
    try {
      // Try to get existing settings
      let settings = await prisma.citationSettings.findUnique({
        where: { user_id: userId },
      });

      // If no settings exist, create default settings
      if (!settings) {
        settings = await prisma.citationSettings.create({
          data: {
            user_id: userId,
            default_style: "apa",
            auto_generate_bib: true,
            auto_check_duplicates: true,
            show_citation_preview: true,
            enable_auto_import: true,
            import_sources: [],
          },
        });
      }

      return settings;
    } catch (error) {
      logger.error("Error getting user citation settings:", error);
      throw error;
    }
  }

  // Update user citation settings
  static async updateUserCitationSettings(userId: string, settings: any) {
    try {
      // Check if settings already exist
      const existingSettings = await prisma.citationSettings.findUnique({
        where: { user_id: userId },
      });

      let updatedSettings;
      if (existingSettings) {
        // Update existing settings
        updatedSettings = await prisma.citationSettings.update({
          where: { user_id: userId },
          data: {
            default_style: settings.default_style,
            auto_generate_bib: settings.auto_generate_bib,
            auto_check_duplicates: settings.auto_check_duplicates,
            show_citation_preview: settings.show_citation_preview,
            enable_auto_import: settings.enable_auto_import,
            import_sources: settings.import_sources,
          },
        });
      } else {
        // Create new settings
        updatedSettings = await prisma.citationSettings.create({
          data: {
            user_id: userId,
            default_style: settings.default_style || "apa",
            auto_generate_bib:
              settings.auto_generate_bib !== undefined
                ? settings.auto_generate_bib
                : true,
            auto_check_duplicates:
              settings.auto_check_duplicates !== undefined
                ? settings.auto_check_duplicates
                : true,
            show_citation_preview:
              settings.show_citation_preview !== undefined
                ? settings.show_citation_preview
                : true,
            enable_auto_import:
              settings.enable_auto_import !== undefined
                ? settings.enable_auto_import
                : true,
            import_sources: settings.import_sources || [],
          },
        });
      }

      return updatedSettings;
    } catch (error) {
      logger.error("Error updating user citation settings:", error);
      throw error;
    }
  }

  // Get user citation analytics
  static async getUserCitationAnalytics(
    userId: string,
    period: string = "all_time",
  ) {
    try {
      // Try to get existing analytics
      let analytics = await prisma.citationAnalytics.findUnique({
        where: { user_id: userId },
      });

      // If no analytics exist, create default analytics
      if (!analytics) {
        analytics = await prisma.citationAnalytics.create({
          data: {
            user_id: userId,
            total_citations_added: 0,
            total_citations_imported: 0,
            total_citations_created: 0,
            most_used_style: "apa",
            most_used_type: "article",
            peak_usage_hours: [],
            sources_used: [],
            duplicate_citations: 0,
            // Add new fields for CrossRef tracking
            crossref_citations_imported: 0,
            crossref_citations_added: 0,
            crossref_sources_used: [],
          },
        });
      }

      return analytics;
    } catch (error) {
      logger.error("Error getting user citation analytics:", error);
      throw error;
    }
  }

  // Update citation analytics
  static async updateCitationAnalytics(
    userId: string,
    action: string,
    source?: string,
  ) {
    try {
      // Get current analytics or create if doesn't exist
      let analytics = await prisma.citationAnalytics.findUnique({
        where: { user_id: userId },
      });

      if (!analytics) {
        analytics = await prisma.citationAnalytics.create({
          data: {
            user_id: userId,
            total_citations_added: 0,
            total_citations_imported: 0,
            total_citations_created: 0,
            most_used_style: "apa",
            most_used_type: "article",
            peak_usage_hours: [],
            sources_used: [],
            duplicate_citations: 0,
            // Add new fields for CrossRef tracking
            crossref_citations_imported: 0,
            crossref_citations_added: 0,
            crossref_sources_used: [],
          },
        });
      }

      // Prepare update data
      const updateData: any = {
        last_analyzed: new Date(),
      };

      switch (action) {
        case "created":
          updateData.total_citations_added = { increment: 1 };
          updateData.total_citations_created = { increment: 1 };
          // Track CrossRef source if specified
          if (source === "CrossRef") {
            updateData.crossref_citations_added = { increment: 1 };
          } else if (source === "Library Import") {
            updateData.total_citations_imported = { increment: 1 };
          }
          break;
        case "imported":
          updateData.total_citations_added = { increment: 1 };
          updateData.total_citations_imported = { increment: 1 };
          // Track CrossRef source if specified
          if (source === "CrossRef") {
            updateData.crossref_citations_imported = { increment: 1 };
            // Update sources used - append to existing array
            const currentSources = Array.isArray(analytics.sources_used)
              ? [...analytics.sources_used]
              : [];
            if (!currentSources.includes("CrossRef")) {
              currentSources.push("CrossRef");
            }
            updateData.sources_used = currentSources;

            // Update crossref sources used - append to existing array
            const crossrefSources = Array.isArray(
              analytics.crossref_sources_used,
            )
              ? [...analytics.crossref_sources_used]
              : [];
            if (!crossrefSources.includes("CrossRef")) {
              crossrefSources.push("CrossRef");
            }
            updateData.crossref_sources_used = crossrefSources;
          }
          break;
        case "updated":
          // No specific counter for updates
          break;
        case "deleted":
          // No specific counter for deletions
          break;
      }

      // Only update if we have data to update (more than just last_analyzed)
      if (Object.keys(updateData).length > 1) {
        await prisma.citationAnalytics.update({
          where: { user_id: userId },
          data: updateData,
        });

        // Log the update for debugging
        logger.debug("Updated citation analytics", {
          userId,
          action,
          source,
          updateData,
        });
      }
    } catch (error) {
      logger.error("Error updating citation analytics:", error);
    }
  }

  // Track citation activity for notifications
  static async trackCitationActivity(
    userId: string,
    projectId: string | null,
    action: string,
    details: any = {},
  ) {
    try {
      // Only create activity record if citation_id is valid and exists
      const activityData: any = {
        user_id: userId,
        action: action,
        details: details,
      };

      // Only add project_id if it's provided
      if (projectId) {
        activityData.project_id = projectId;
      }

      // Only add citation_id if it's provided and valid
      if (details.citationId) {
        // Verify the citation exists before creating activity
        const citationExists = await prisma.citation.findUnique({
          where: { id: details.citationId },
        });

        if (citationExists) {
          activityData.citation_id = details.citationId;
        }
      }

      await prisma.citationActivity.create({
        data: activityData,
      });

      // Track CrossRef-specific activities
      if (details.source === "CrossRef") {
        logger.info("CrossRef citation activity tracked", {
          userId,
          action,
          details,
        });
      }
    } catch (error) {
      logger.error("Error tracking citation activity:", error);
    }
  }

  // Get real-time citation trends from CrossRef
  static async getRealTimeCitationTrends() {
    try {
      // Use the CrossRefService to get real internet data trends
      logger.info("Attempting to fetch real-time trends from CrossRef");
      const trends = await CrossRefService.getRealTimeTrends("last5years");

      // If we got data, return it
      if (trends && trends.length > 0) {
        logger.info(
          `Successfully fetched ${trends.length} data points from CrossRef`,
        );
        return trends;
      }

      // Fallback to mock data if CrossRef API fails or returns no data
      logger.warn("CrossRef API returned no data, falling back to mock data");
      const fallbackData = [];
      const currentDate = new Date();
      const months = 5 * 12;

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const dateString = `${year}-${month}`;

        const baseCount = 50 + Math.floor(Math.random() * 100);

        fallbackData.push({
          date: dateString,
          article_count: Math.max(
            1,
            Math.floor(baseCount * 0.6) + Math.floor(Math.random() * 20),
          ),
          book_count: Math.max(
            0,
            Math.floor(baseCount * 0.2) + Math.floor(Math.random() * 10),
          ),
          website_count: Math.max(
            0,
            Math.floor(baseCount * 0.3) + Math.floor(Math.random() * 15),
          ),
          other_count: Math.max(
            0,
            Math.floor(baseCount * 0.1) + Math.floor(Math.random() * 5),
          ),
        });
      }

      return fallbackData;
    } catch (error) {
      logger.error("Error getting real-time citation trends:", error);
      // Fallback to mock data if CrossRef API fails
      const fallbackData = [];
      const currentDate = new Date();
      const months = 5 * 12;

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const dateString = `${year}-${month}`;

        const baseCount = 50 + Math.floor(Math.random() * 100);

        fallbackData.push({
          date: dateString,
          article_count: Math.max(
            1,
            Math.floor(baseCount * 0.6) + Math.floor(Math.random() * 20),
          ),
          book_count: Math.max(
            0,
            Math.floor(baseCount * 0.2) + Math.floor(Math.random() * 10),
          ),
          website_count: Math.max(
            0,
            Math.floor(baseCount * 0.3) + Math.floor(Math.random() * 15),
          ),
          other_count: Math.max(
            0,
            Math.floor(baseCount * 0.1) + Math.floor(Math.random() * 5),
          ),
        });
      }

      return fallbackData;
    }
  }

  // Send citation notification
  static async sendCitationNotification(
    userId: string,
    projectId: string | null,
    action: string,
    citation: any,
    recipientUserId?: string,
  ) {
    try {
      let title = "";
      let message = "";

      switch (action) {
        case "created":
          title = "Citation Added";
          message = `New citation "${citation.title}" has been added to your project.`;
          break;
        case "updated":
          title = "Citation Updated";
          message = `Citation "${citation.title}" has been updated.`;
          break;
        case "deleted":
          title = "Citation Deleted";
          message = `Citation "${citation.title}" has been deleted from your project.`;
          break;
        case "shared":
          title = "Citation Shared";
          message = `Citation "${citation.title}" has been shared with you.`;
          break;
        default:
          return;
      }

      // Send notification to the user or specified recipient
      const targetUserId = recipientUserId || userId;

      // Prepare notification data - only include projectId if it's not null
      const notificationData: any = {
        citationId: citation.id,
        action: action,
      };

      if (projectId) {
        notificationData.projectId = projectId;
      }

      await createNotification(
        targetUserId,
        "document_change",
        title,
        message,
        notificationData,
      );
    } catch (error) {
      logger.error("Error sending citation notification:", error);
    }
  }

  // Share a citation with another user
  static async shareCitation(
    userId: string,
    sharedToUserId: string,
    citationId: string,
    permission: string = "view",
  ) {
    try {
      // Verify the citation belongs to the user
      const citation = await prisma.citation.findFirst({
        where: {
          id: citationId,
          project: {
            OR: [
              { user_id: userId }, // User is the owner
              {
                collaborators: {
                  some: {
                    user_id: userId,
                  },
                },
              }, // User is a collaborator
            ],
          },
        },
      });

      if (!citation) {
        throw new Error("Citation not found or access denied");
      }

      // Create the share record
      const share = await prisma.citationShare.create({
        data: {
          citation_id: citationId,
          shared_by_id: userId,
          shared_to_id: sharedToUserId,
          permission: permission,
        },
      });

      return share;
    } catch (error) {
      logger.error("Error sharing citation:", error);
      throw error;
    }
  }

  // Get shared citations
  static async getSharedCitations(userId: string, type: string = "received") {
    try {
      let shares;
      if (type === "shared") {
        // Get citations shared by the user
        shares = await prisma.citationShare.findMany({
          where: {
            shared_by_id: userId,
          },
          include: {
            citation: true,
            shared_to: {
              select: {
                id: true,
                email: true,
                full_name: true,
              },
            },
          },
        });
      } else {
        // Get citations shared with the user
        shares = await prisma.citationShare.findMany({
          where: {
            shared_to_id: userId,
          },
          include: {
            citation: true,
            shared_by: {
              select: {
                id: true,
                email: true,
                full_name: true,
              },
            },
          },
        });
      }

      return shares;
    } catch (error) {
      logger.error("Error getting shared citations:", error);
      throw error;
    }
  }

  // Check if user can create more citations based on subscription
  static async checkCitationLimit(userId: string): Promise<boolean> {
    try {
      // Get user's subscription info
      const subscriptionInfo =
        await SubscriptionService.getUserPlanInfo(userId);

      // For free plan, limit to 100 citations
      if (subscriptionInfo.plan.id === "free") {
        const citationCount = await prisma.citation.count({
          where: {
            project: {
              user_id: userId,
            },
          },
        });

        return citationCount < 100;
      }

      // For paid plans, no limit
      return true;
    } catch (error) {
      logger.error("Error checking citation limit:", error);
      // If there's an error, allow creation to avoid blocking users
      return true;
    }
  }

  // Import a paper from the user's library (SavedPaper) to a project citation
  static async importFromLibrary(
    projectId: string,
    savedPaperId: string,
    userId: string,
  ) {
    try {
      // 1. Fetch the SavedPaper with its related ResearchPaper
      const savedPaper = await prisma.savedPaper.findFirst({
        where: {
          id: savedPaperId,
          user_id: userId,
        },
        include: {
          paper: true,
        },
      });

      if (!savedPaper || !savedPaper.paper) {
        throw new Error("Saved paper not found");
      }

      const paper = savedPaper.paper;

      // 2. Map ResearchPaper data to Citation data
      // Parsing authors from JSON if needed
      let authors = [];
      if (typeof paper.authors === "string") {
        try {
          authors = JSON.parse(paper.authors);
        } catch (e) {
          authors = [{ name: "Unknown Author" }];
        }
      } else if (Array.isArray(paper.authors)) {
        authors = paper.authors;
      }

      // Normalize authors to {firstName, lastName} if possible
      const normalizedAuthors = authors.map((a: any) => {
        if (a.firstName && a.lastName) return a;
        if (a.name) {
          const parts = a.name.split(" ");
          if (parts.length > 1) {
            return {
              firstName: parts[0],
              lastName: parts.slice(1).join(" "),
            };
          }
          return { name: a.name, firstName: "", lastName: a.name };
        }
        return { name: "Unknown", firstName: "", lastName: "Unknown" };
      });

      const citationData = {
        type: "article", // default for research papers
        title: paper.title,
        authors: normalizedAuthors,
        year: paper.year || new Date().getFullYear(),
        journal: paper.venue || "",
        url: paper.url || paper.openAccessPdf || "",
        abstract: paper.abstract || "",
        doi: paper.externalId || "", // Using externalId as proxy for DOI if valid format, otherwise specific logic needed
        source: "Library Import",
      };

      // 3. Create the citation
      return await this.createCitation(projectId, userId, citationData);
    } catch (error: any) {
      logger.error("Error importing from library:", error);
      throw error;
    }
  }

  // Export citations to BibTeX or RIS
  static async exportCitations(
    projectId: string,
    userId: string,
    format: "bibtex" | "ris",
  ): Promise<string> {
    try {
      // 1. Fetch citations
      const citations = await this.getProjectCitations(projectId, userId);

      if (citations.length === 0) {
        return "";
      }

      // 2. Convert to CSL-JSON
      const cslData = citations.map((citation: any) => ({
        id: citation.id,
        type: this.mapTypeToCSL(citation.type),
        title: citation.title,
        author: Array.isArray(citation.authors)
          ? citation.authors.map((a: any) => ({
              given: a.firstName || a.name?.split(" ")[0] || "",
              family:
                a.lastName ||
                a.name?.split(" ").slice(1).join(" ") ||
                a.name ||
                "Unknown",
            }))
          : [],
        issued: { "date-parts": [[citation.year || new Date().getFullYear()]] },
        "container-title":
          citation.journal || citation.venue || citation.publisher,
        volume: citation.volume,
        issue: citation.issue,
        page: citation.pages,
        DOI: citation.doi,
        URL: citation.url,
        publisher: citation.publisher,
      }));

      // 3. Format using citation-js
      const cite = new Cite(cslData);

      const output = cite.format(format, {
        format: "text",
      });

      return output;
    } catch (error: any) {
      logger.error("Error exporting citations:", error);
      throw error;
    }
  }
}
