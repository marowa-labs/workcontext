import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

export class SourceService {
  // Get all sources for a project
  static async getProjectSources(projectId: string, userId: string) {
    try {
      const sources = await prisma.projectSource.findMany({
        where: {
          project_id: projectId,
          user_id: userId,
        },
        orderBy: {
          created_at: "desc",
        },
      });
      return sources;
    } catch (error: any) {
      logger.error("Error fetching project sources:", error);
      throw new Error("Failed to fetch project sources");
    }
  }

  // Add a URL source
  static async addUrlSource(projectId: string, userId: string, url: string, title?: string) {
    try {
      const sourceTitle = title || this.extractTitleFromUrl(url);
      
      const source = await prisma.projectSource.create({
        data: {
          project_id: projectId,
          user_id: userId,
          title: sourceTitle,
          type: "url",
          url: url,
          metadata: {
            originalUrl: url,
            addedAt: new Date().toISOString(),
          },
        },
      });
      
      logger.info(`Added URL source: ${source.id} for project: ${projectId}`);
      return source;
    } catch (error: any) {
      logger.error("Error adding URL source:", error);
      throw new Error("Failed to add URL source");
    }
  }

  // Add text content as source
  static async addTextSource(projectId: string, userId: string, content: string, title: string) {
    try {
      const source = await prisma.projectSource.create({
        data: {
          project_id: projectId,
          user_id: userId,
          title: title || "Pasted Text",
          type: "text",
          content: content,
          metadata: {
            contentLength: content.length,
            addedAt: new Date().toISOString(),
          },
        },
      });
      
      logger.info(`Added text source: ${source.id} for project: ${projectId}`);
      return source;
    } catch (error: any) {
      logger.error("Error adding text source:", error);
      throw new Error("Failed to add text source");
    }
  }

  // Add file source
  static async addFileSource(
    projectId: string,
    userId: string,
    file: {
      originalname: string;
      filename: string;
      path: string;
      size: number;
      mimetype: string;
    }
  ) {
    try {
      const source = await prisma.projectSource.create({
        data: {
          project_id: projectId,
          user_id: userId,
          title: file.originalname,
          type: "file",
          file_path: file.path,
          file_size: file.size,
          mime_type: file.mimetype,
          metadata: {
            originalName: file.originalname,
            storedName: file.filename,
            size: file.size,
            mimeType: file.mimetype,
            addedAt: new Date().toISOString(),
          },
        },
      });
      
      logger.info(`Added file source: ${source.id} for project: ${projectId}`);
      return source;
    } catch (error: any) {
      logger.error("Error adding file source:", error);
      throw new Error("Failed to add file source");
    }
  }

  // Add multiple file sources
  static async addFileSources(
    projectId: string,
    userId: string,
    files: Array<{
      originalname: string;
      filename: string;
      path: string;
      size: number;
      mimetype: string;
    }>
  ) {
    const sources = [];
    for (const file of files) {
      const source = await this.addFileSource(projectId, userId, file);
      sources.push(source);
    }
    return sources;
  }

  // Save web search results as sources
  static async saveWebSources(
    projectId: string,
    userId: string,
    sources: Array<{
      title: string;
      url: string;
      snippet?: string;
      favicon?: string;
    }>
  ) {
    try {
      const createdSources = [];
      
      for (const sourceData of sources) {
        const source = await prisma.projectSource.create({
          data: {
            project_id: projectId,
            user_id: userId,
            title: sourceData.title,
            type: "web_search",
            url: sourceData.url,
            content: sourceData.snippet,
            metadata: {
              favicon: sourceData.favicon,
              snippet: sourceData.snippet,
              addedAt: new Date().toISOString(),
            },
          },
        });
        createdSources.push(source);
      }
      
      logger.info(`Saved ${createdSources.length} web sources for project: ${projectId}`);
      return createdSources;
    } catch (error: any) {
      logger.error("Error saving web sources:", error);
      throw new Error("Failed to save web sources");
    }
  }

  // Delete a source
  static async deleteSource(sourceId: string, userId: string) {
    try {
      // First verify the source belongs to the user
      const source = await prisma.projectSource.findFirst({
        where: {
          id: sourceId,
          user_id: userId,
        },
      });

      if (!source) {
        throw new Error("Source not found or unauthorized");
      }

      await prisma.projectSource.delete({
        where: { id: sourceId },
      });

      logger.info(`Deleted source: ${sourceId}`);
      return true;
    } catch (error: any) {
      logger.error("Error deleting source:", error);
      throw new Error("Failed to delete source");
    }
  }

  // Update a source
  static async updateSource(sourceId: string, userId: string, updates: { title?: string }) {
    try {
      // First verify the source belongs to the user
      const source = await prisma.projectSource.findFirst({
        where: {
          id: sourceId,
          user_id: userId,
        },
      });

      if (!source) {
        throw new Error("Source not found or unauthorized");
      }

      const updatedSource = await prisma.projectSource.update({
        where: { id: sourceId },
        data: {
          ...(updates.title && { title: updates.title }),
          updated_at: new Date(),
        },
      });

      logger.info(`Updated source: ${sourceId}`);
      return updatedSource;
    } catch (error: any) {
      logger.error("Error updating source:", error);
      throw new Error("Failed to update source");
    }
  }

  // Import sources from another project
  static async importSourcesFromProjects(
    projectId: string,
    userId: string,
    fromProjectIds: string[]
  ) {
    try {
      const importedSources = [];
      
      for (const fromProjectId of fromProjectIds) {
        // Get sources from the source project
        const sources = await prisma.projectSource.findMany({
          where: {
            project_id: fromProjectId,
            user_id: userId,
          },
        });

        // Create copies for the target project
        for (const source of sources) {
          const newSource = await prisma.projectSource.create({
            data: {
              project_id: projectId,
              user_id: userId,
              title: source.title,
              type: source.type,
              url: source.url,
              content: source.content,
              file_path: source.file_path,
              file_size: source.file_size,
              mime_type: source.mime_type,
              metadata: {
                ...source.metadata,
                importedFrom: fromProjectId,
                importedAt: new Date().toISOString(),
              },
            },
          });
          importedSources.push(newSource);
        }
      }

      logger.info(`Imported ${importedSources.length} sources to project: ${projectId}`);
      return importedSources;
    } catch (error: any) {
      logger.error("Error importing sources:", error);
      throw new Error("Failed to import sources");
    }
  }

  // Add existing sources to project (from library)
  static async addSourcesToProject(projectId: string, userId: string, sourceIds: string[]) {
    try {
      // Get the user's library sources that match the provided IDs
      const librarySources = await prisma.researchSource.findMany({
        where: {
          id: { in: sourceIds },
          user_id: userId,
        },
      });

      const createdSources = [];
      
      for (const libSource of librarySources) {
        const source = await prisma.projectSource.create({
          data: {
            project_id: projectId,
            user_id: userId,
            title: libSource.title,
            type: "library",
            url: libSource.url,
            content: libSource.content,
            metadata: {
              librarySourceId: libSource.id,
              author: libSource.author,
              year: libSource.year,
              journal: libSource.journal,
              addedAt: new Date().toISOString(),
            },
          },
        });
        createdSources.push(source);
      }

      logger.info(`Added ${createdSources.length} library sources to project: ${projectId}`);
      return createdSources;
    } catch (error: any) {
      logger.error("Error adding sources to project:", error);
      throw new Error("Failed to add sources to project");
    }
  }

  // Extract title from URL helper
  private static extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/^www\./, "");
      const pathname = urlObj.pathname;
      
      // Extract the last meaningful part of the path
      const pathParts = pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        // Remove file extensions and replace hyphens/underscores with spaces
        const cleanTitle = lastPart
          .replace(/\.(html?|pdf|txt|docx?)$/i, "")
          .replace(/[-_]/g, " ");
        if (cleanTitle.length > 3) {
          return cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
        }
      }
      
      return hostname;
    } catch {
      return "Untitled Source";
    }
  }
}
