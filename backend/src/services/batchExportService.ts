import { ExportService } from "./exportService";
import logger from "../monitoring/logger";
import { prisma } from "../lib/prisma";
import archiver from "archiver";
import { Readable } from "stream";

interface BatchExportOptions {
  format: "pdf" | "docx" | "txt" | "latex" | "rtf" | "xlsx" | "csv" | "zip";
  includeCitations?: boolean;
  includeComments?: boolean;
  citationStyle?: "apa" | "mla" | "chicago";
  template?: "academic" | "publication" | "presentation" | "custom";
  journalTemplate?: string;
  journalReady?: boolean; // New flag for journal-ready formatting
}

interface ProjectData {
  id: string;
  title: string;
  content: any;
  citations: any[];
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
}

export class BatchExportService {
  // Export multiple projects as a batch
  static async exportProjects(
    projectIds: string[],
    userId: string,
    options: BatchExportOptions
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      // Validate that user has access to all projects
      const projects = await this.validateProjectsAccess(projectIds, userId);

      if (projects.length === 0) {
        throw new Error("No valid projects found for export");
      }

      // Check if user has access to batch export (Researcher plan only)
      const hasBatchExportAccess = await this.checkBatchExportAccess(userId);
      if (!hasBatchExportAccess) {
        throw new Error(
          "Batch export is only available for Researcher plan users"
        );
      }

      // Handle ZIP export differently - it's a container for multiple files
      if (options.format === "zip") {
        return await this.exportAsZip(projects, userId, options);
      }

      // For other formats, we'll create a combined document
      return await this.exportAsCombinedDocument(projects, userId, options);
    } catch (error: any) {
      logger.error("Error batch exporting projects:", error);
      throw new Error(`Failed to batch export projects: ${error.message}`);
    }
  }

  // Validate that user has access to all projects
  private static async validateProjectsAccess(
    projectIds: string[],
    userId: string
  ): Promise<ProjectData[]> {
    try {
      const projects = await prisma.project.findMany({
        where: {
          id: { in: projectIds },
          user_id: userId,
        },
        include: {
          citations: true,
        },
      });

      return projects.map((project: any) => ({
        id: project.id,
        title: project.title,
        content: project.content,
        citations: project.citations,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        wordCount: project.word_count,
      }));
    } catch (error: any) {
      logger.error("Error validating project access:", error);
      throw error;
    }
  }

  // Check if user has batch export access (Researcher plan only)
  private static async checkBatchExportAccess(
    userId: string
  ): Promise<boolean> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      return subscription?.plan === "researcher";
    } catch (error) {
      logger.error("Error checking batch export access:", error);
      return false;
    }
  }

  // Export projects as a ZIP file containing individual exports
  private static async exportAsZip(
    projects: ProjectData[],
    userId: string,
    options: BatchExportOptions
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      // Create archive
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Maximum compression
      });

      // Create a buffer to store the archive
      const chunks: Buffer[] = [];
      archive.on("data", (chunk: Buffer) => chunks.push(chunk));

      // Export each project and add to archive
      for (const project of projects) {
        const exportOptions = {
          format: options.format === "zip" ? "pdf" : options.format, // Default to PDF for ZIP
          includeCitations: options.includeCitations,
          includeComments: options.includeComments,
          citationStyle: options.citationStyle,
          template: options.template,
          journalTemplate: options.journalTemplate,
          journalReady: !!options.journalTemplate, // Enable journal-ready formatting if template is selected
        };

        try {
          const exportResult = await ExportService.exportProject(
            project.id,
            userId,
            exportOptions
          );

          // Add file to archive
          archive.append(exportResult.buffer, { name: exportResult.filename });
        } catch (error) {
          logger.warn(`Failed to export project ${project.id}:`, error);
          // Continue with other projects
        }
      }

      // Finalize the archive
      archive.finalize();

      // Wait for the archive to be generated
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        archive.on("end", () => resolve(Buffer.concat(chunks)));
        archive.on("error", reject);
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `batch_export_${timestamp}.zip`;

      return {
        buffer,
        filename,
        mimeType: "application/zip",
        fileSize: buffer.length,
      };
    } catch (error: any) {
      logger.error("Error exporting as ZIP:", error);
      throw new Error(`Failed to export as ZIP: ${error.message}`);
    }
  }

  // Export projects as a combined document
  private static async exportAsCombinedDocument(
    projects: ProjectData[],
    userId: string,
    options: BatchExportOptions
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      // For combined document export, we'll create a properly structured combined document
      // that maintains formatting and organizes content by project

      // Create a combined TipTap content structure that preserves formatting
      const combinedContentStructure = {
        type: "doc",
        content: [] as any[],
      };

      // Combined citations with source tracking
      const combinedCitations: any[] = [];

      // Track citation sources to avoid duplicates and maintain attribution
      const citationSources = new Map<
        string,
        { projectTitle: string; citationIndex: number }
      >();

      // Process each project to create a well-structured combined document
      for (const project of projects) {
        // Add project title as a heading
        combinedContentStructure.content.push({
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: project.title }],
        });

        // Add project metadata
        combinedContentStructure.content.push({
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `Created: ${new Date(project.createdAt).toLocaleDateString()} | Word Count: ${project.wordCount}`,
            },
          ],
        });

        // Add a separator
        combinedContentStructure.content.push({
          type: "horizontalRule",
        });

        // Add the project content
        if (project.content && project.content.content) {
          // Process each content block from the project
          for (const contentBlock of project.content.content) {
            combinedContentStructure.content.push(contentBlock);
          }
        }

        // Add project citations with source attribution
        if (project.citations && project.citations.length > 0) {
          // Add a heading for this project's references
          combinedContentStructure.content.push({
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: `${project.title} References` }],
          });

          // Add each citation with project attribution
          project.citations.forEach((citation: any, index: number) => {
            // Create a unique identifier for this citation
            const citationKey = `${project.id}-${citation.id || index}`;

            // Add to combined citations with source tracking
            combinedCitations.push({
              ...citation,
              source_project: project.title,
              source_project_id: project.id,
            });

            // Track citation source
            citationSources.set(citationKey, {
              projectTitle: project.title,
              citationIndex: combinedCitations.length - 1,
            });
          });
        }

        // Add page break between projects (for formats that support it)
        combinedContentStructure.content.push({
          type: "paragraph",
          content: [{ type: "text", text: "" }],
        });
      }

      // Add a combined references section at the end if citations exist
      if (combinedCitations.length > 0) {
        combinedContentStructure.content.push({
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Combined References" }],
        });

        // Add explanation about citation sources
        combinedContentStructure.content.push({
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "The following references are organized by source project:",
            },
          ],
        });
      }

      // Create a temporary project data structure for export
      const combinedProject: ProjectData = {
        id: "batch-export",
        title: "Batch Export",
        content: combinedContentStructure,
        citations: combinedCitations,
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: projects.reduce(
          (total, project) => total + project.wordCount,
          0
        ),
      };

      // Use existing export service to export the combined content
      const exportOptions = {
        format: options.format,
        includeCitations: options.includeCitations,
        includeComments: options.includeComments,
        citationStyle: options.citationStyle,
        template: options.template,
        journalTemplate: options.journalTemplate,
        journalReady: !!options.journalTemplate, // Enable journal-ready formatting if template is selected
      };

      // We need to call the appropriate export method based on format
      switch (options.format) {
        case "pdf":
          return await ExportService["exportToPDF"](
            combinedProject,
            exportOptions,
            userId // Add the missing userId parameter
          );
        case "docx":
          return await ExportService["exportToDOCX"](
            combinedProject,
            exportOptions
          );
        case "txt":
          return await ExportService["exportToTXT"](
            combinedProject,
            exportOptions
          );
        case "latex":
          return await ExportService["exportToLaTeX"](
            combinedProject,
            exportOptions
          );
        case "rtf":
          return await ExportService["exportToRTF"](
            combinedProject,
            exportOptions
          );
        case "xlsx":
          return await ExportService["exportToXLSX"](
            combinedProject,
            exportOptions
          );
        case "csv":
          return await ExportService["exportToCSV"](
            combinedProject,
            exportOptions
          );
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error: any) {
      logger.error("Error exporting as combined document:", error);
      throw new Error(
        `Failed to export as combined document: ${error.message}`
      );
    }
  }
}
