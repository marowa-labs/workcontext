import logger from "../monitoring/logger";
import { prisma } from "../lib/prisma";
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageOrientation,
} from "docx";
import PDFDocument from "pdfkit";
import { Packer } from "docx";
import { CitationService } from "./citationService";
import { SupabaseStorageService } from "./supabaseStorageService";
import { SecretsService } from "./secrets-service";

interface ExportOptions {
  format:
    | "pdf"
    | "docx"
    | "txt"
    | "latex"
    | "rtf"
    | "xlsx"
    | "csv"
    | "png"
    | "zip"
    | "journal-pdf"
    | "journal-latex"
    | "overleaf"
    | "google-drive"
    | "onedrive";
  includeCitations?: boolean;
  includeComments?: boolean;
  citationStyle?: "apa" | "mla" | "chicago";
  pageSize?: "A4" | "Letter";
  orientation?: "portrait" | "landscape";
  template?: "academic" | "publication" | "presentation" | "custom";
  journalTemplate?: string; // For journal-specific templates
  journalReady?: boolean; // New flag for journal-ready formatting
  // MVP Publication Suite options
  includeCoverPage?: boolean;
  coverPageStyle?: "apa" | "mla";
  includeTOC?: boolean;
  performStructuralAudit?: boolean;
  minWordCount?: number;
  // Cover page metadata
  metadata?: {
    author?: string;
    institution?: string;
    course?: string;
    instructor?: string;
    runningHead?: string;
  };
}

interface ProjectData {
  id: string;
  title: string;
  content: any; // TipTap JSON content
  citations: any[];
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
}

export class ExportService {
  // Export project to specified format
  static async exportProject(
    projectId: string,
    userId: string,
    options: ExportOptions,
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      // Get project data
      const project = await this.getProjectData(projectId, userId);

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      // Log the received options for debugging
      logger.debug("ExportService.exportProject called with options:", options);

      // Check if user has access to advanced export options (Researcher plan only)
      const hasAdvancedExportAccess = await this.checkExportAccess(
        userId,
        options.format,
      );
      if (!hasAdvancedExportAccess) {
        throw new Error(
          `Advanced export format ${options.format} is only available for Researcher plan users`,
        );
      }

      // Set journalReady flag based on whether a journal template is selected
      const enhancedOptions = {
        ...options,
        journalReady: !!options.journalTemplate,
      };

      // Export based on format
      logger.debug(
        `Exporting project ${project.id} to format: ${enhancedOptions.format}`,
      );
      switch (enhancedOptions.format) {
        case "pdf":
          logger.debug("Calling exportToPDF");
          return await this.exportToPDF(project, enhancedOptions, userId);
        case "docx":
          logger.debug("Calling exportToDOCX");
          return await this.exportToDOCX(project, enhancedOptions);
        case "txt":
          logger.debug("Calling exportToTXT");
          return await this.exportToTXT(project, enhancedOptions);
        case "latex":
          logger.debug("Calling exportToLaTeX");
          return await this.exportToLaTeX(project, enhancedOptions);
        case "rtf":
          logger.debug("Calling exportToRTF");
          return await this.exportToRTF(project, enhancedOptions);
        case "xlsx":
          logger.debug("Calling exportToXLSX");
          return await this.exportToXLSX(project, enhancedOptions);
        case "csv":
          logger.debug("Calling exportToCSV");
          return await this.exportToCSV(project, enhancedOptions);
        case "png":
          logger.debug("Calling exportToImage");
          return await this.exportToImage(project, enhancedOptions);
        case "journal-pdf":
          logger.debug("Calling exportToPDF for journal format");
          // Set journalReady flag for journal formats
          const journalPdfOptions = { ...enhancedOptions, journalReady: true };
          return await this.exportToPDF(project, journalPdfOptions, userId);
        case "journal-latex":
          logger.debug("Calling exportToLaTeX for journal format");
          // Set journalReady flag for journal formats
          const journalLatexOptions = {
            ...enhancedOptions,
            journalReady: true,
          };
          return await this.exportToLaTeX(project, journalLatexOptions);
        case "overleaf":
          logger.debug("Calling exportToLaTeX for Overleaf export");
          // For Overleaf export, we generate LaTeX and create a temporary URL
          return await this.exportToOverleaf(project, enhancedOptions, userId);
        case "google-drive":
          logger.debug("Calling exportToGoogleDrive");
          return await this.exportToGoogleDrive(
            project,
            enhancedOptions,
            userId,
          );
        case "onedrive":
          logger.debug("Calling exportToOneDrive");
          return await this.exportToOneDrive(project, enhancedOptions, userId);
        default:
          logger.debug("Unsupported export format, throwing error");
          throw new Error(
            `Unsupported export format: ${enhancedOptions.format}`,
          );
      }
    } catch (error: any) {
      logger.error("Error exporting project:", error);
      throw new Error(`Failed to export project: ${error.message}`);
    }
  }

  // Check if user has access to export format based on their subscription plan
  private static async checkExportAccess(
    userId: string,
    format: string,
  ): Promise<boolean> {
    // Formats available to all users
    const basicFormats = ["pdf", "docx", "txt"];

    // Advanced formats require Researcher plan
    const advancedFormats = [
      "latex",
      "rtf",
      "xlsx",
      "csv",
      "png",
      "journal-pdf",
      "journal-latex",
    ];

    // Overleaf export requires Student or higher plan
    if (format === "overleaf") {
      return await this.hasStudentOrHigherPlan(userId);
    }

    // Journal templates require Researcher plan
    if (format.includes("journal")) {
      return await this.hasResearcherPlan(userId);
    }

    // Basic formats are available to all
    if (basicFormats.includes(format)) {
      return true;
    }

    // Advanced formats require Researcher plan
    if (advancedFormats.includes(format)) {
      return await this.hasResearcherPlan(userId);
    }

    return true; // Default to true for unknown formats
  }

  // Check if user has Researcher plan
  private static async hasResearcherPlan(userId: string): Promise<boolean> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      return subscription?.plan === "researcher";
    } catch (error) {
      logger.error("Error checking user plan:", error);
      return false;
    }
  }

  // Check if user has Student or higher plan
  private static async hasStudentOrHigherPlan(
    userId: string,
  ): Promise<boolean> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      // Student, Researcher, and Institutional plans can export to Overleaf
      const validPlans = ["student", "researcher", "institutional"];
      return subscription ? validPlans.includes(subscription.plan) : false;
    } catch (error) {
      logger.error("Error checking user plan for Overleaf export:", error);
      return false;
    }
  }

  // Get project data from database
  private static async getProjectData(
    projectId: string,
    userId: string,
  ): Promise<ProjectData | null> {
    try {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          user_id: userId,
        },
        include: {
          citations: true,
        },
      });

      if (!project) {
        return null;
      }

      return {
        id: project.id,
        title: project.title,
        content: project.content,
        citations: project.citations,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        wordCount: project.word_count,
      };
    } catch (error: any) {
      logger.error("Error fetching project data:", error);
      throw error;
    }
  }

  // Export to PDF
  private static async exportToPDF(
    project: ProjectData,
    options: ExportOptions,
    userId: string,
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      logger.debug(`Exporting project ${project.id} to PDF`);

      // Apply journal-ready formatting if requested
      const formattedContent = options.journalReady
        ? this.applyJournalReadyFormatting(project, options)
        : project.content;

      // Get journal-specific formatting rules
      const journalRules = options.journalTemplate
        ? this.getJournalFormattingRules(options.journalTemplate)
        : null;

      // Create a PDF document with journal-specific settings
      const docOptions: any = {
        size: options.pageSize || "A4",
        layout: options.orientation || "portrait",
        margin: journalRules ? journalRules.margins : 50,
      };

      // Apply two-column layout for journals that require it
      if (journalRules && journalRules.twoColumnLayout) {
        docOptions.columns = 2;
        docOptions.columnGap = 10;
      }

      const doc = new PDFDocument(docOptions);

      // Add citations to the end of the document if requested
      if (
        options.includeCitations &&
        project.citations &&
        project.citations.length > 0
      ) {
        // Generate bibliography
        const citationStyle = options.citationStyle || "apa";
        const bibliography = await CitationService.generateBibliography(
          project.citations,
          citationStyle,
          userId,
        );

        // Add a page break before the bibliography
        doc.addPage();

        // Add bibliography title
        doc.fontSize(16).text("References", { align: "center" });
        doc.moveDown();

        // Add bibliography content
        doc.fontSize(12).text(bibliography, { align: "left" });
      }

      // Create a buffer to store the PDF
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      // Add title
      doc.fontSize(24).text(project.title, { align: "center" });
      doc.moveDown();

      // Add metadata
      doc.fontSize(12).text(`Created: ${project.createdAt.toDateString()}`, {
        align: "center",
      });
      doc.moveDown(2);

      // Add content (convert from TipTap JSON to plain text)
      const contentText = this.convertTipTapToPlainText(formattedContent);
      doc.fontSize(12).text(contentText, {
        align: "justify",
        lineGap: 5,
      });

      // Add citations if requested
      if (options.includeCitations && project.citations.length > 0) {
        doc.addPage();
        doc.fontSize(18).text("References", { underline: true });
        doc.moveDown();

        project.citations.forEach((citation, index) => {
          const formattedCitation = this.formatCitation(
            citation,
            options.citationStyle || "apa",
          );
          doc.fontSize(10).text(`${index + 1}. ${formattedCitation}`);
          doc.moveDown();
        });
      }

      // Finalize the PDF
      doc.end();

      // Wait for the PDF to be generated
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
      });

      // Generate appropriate filename based on format
      const fileExtension = options.journalReady ? "-journal.pdf" : ".pdf";
      const filename = `${project.title.replace(/\s+/g, "_")}${fileExtension}`;

      return {
        buffer,
        filename,
        mimeType: "application/pdf",
        fileSize: buffer.length,
      };
    } catch (error: any) {
      logger.error("Error exporting to PDF:", error);
      throw new Error(`Failed to export to PDF: ${error.message}`);
    }
  }

  // Export to DOCX
  private static async exportToDOCX(
    project: ProjectData,
    options: ExportOptions,
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      logger.debug(`Exporting project ${project.id} to DOCX`);

      // Apply journal-ready formatting if requested
      const formattedContent = options.journalReady
        ? this.applyJournalReadyFormatting(project, options)
        : project.content;

      // Get journal-specific formatting rules
      const journalRules = options.journalTemplate
        ? this.getJournalFormattingRules(options.journalTemplate)
        : null;

      // Convert body content
      const bodyParagraphs =
        this.convertTipTapToDOCXParagraphs(formattedContent);

      // Generate references section
      const referencesParagraphs: Paragraph[] = [];
      if (options.includeCitations && project.citations.length > 0) {
        referencesParagraphs.push(
          new Paragraph({
            text: "References",
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 400,
              after: 200,
            },
          }),
        );
        project.citations.forEach((citation, index) => {
          referencesParagraphs.push(
            new Paragraph({
              text: `${index + 1}. ${this.formatCitation(citation, options.citationStyle || "apa")}`,
              spacing: {
                after: 100,
              },
            }),
          );
        });
      }

      // Generate cover page if requested
      let coverPageParagraphs: Paragraph[] | undefined;
      if (options.includeCoverPage && options.coverPageStyle) {
        const metadata = {
          title: project.title,
          author: options.metadata?.author,
          institution: options.metadata?.institution,
          course: options.metadata?.course,
          instructor: options.metadata?.instructor,
          runningHead: options.metadata?.runningHead,
        };
      }

      // Create document with proper DOCX structure
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                size: {
                  orientation:
                    options.orientation === "landscape"
                      ? PageOrientation.LANDSCAPE
                      : PageOrientation.PORTRAIT,
                },
              },
            },
            children: bodyParagraphs,
          },
        ],
      });

      // Generate buffer from DOCX document
      const buffer = await Packer.toBuffer(doc);
      const fileExtension = options.journalReady ? "-journal.docx" : ".docx";
      const filename = `${project.title.replace(/\s+/g, "_")}${fileExtension}`;

      logger.info("DOCX export complete", {
        projectId: project.id,
        fileSize: buffer.length,
      });

      return {
        buffer,
        filename,
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSize: buffer.length,
      };
    } catch (error: any) {
      logger.error("Error exporting to DOCX:", error);
      throw new Error(`Failed to export to DOCX: ${error.message}`);
    }
  }

  // Export to TXT
  private static async exportToTXT(
    project: ProjectData,
    options: ExportOptions,
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      logger.debug(`Exporting project ${project.id} to TXT`);

      // Apply journal-ready formatting if requested
      const formattedContent = options.journalReady
        ? this.applyJournalReadyFormatting(project, options)
        : project.content;

      let content = `${project.title}\n`;
      content += `Created: ${project.createdAt.toDateString()}\n`;
      content += `Word Count: ${project.wordCount}\n\n`;
      content += this.convertTipTapToPlainText(formattedContent);

      if (options.includeCitations && project.citations.length > 0) {
        content += "\n\nReferences:\n";
        project.citations.forEach((citation, index) => {
          content += `${index + 1}. ${this.formatCitation(citation, options.citationStyle || "apa")}\n`;
        });
      }

      const buffer = Buffer.from(content, "utf-8");
      const fileExtension = options.journalReady ? "-journal.txt" : ".txt";
      const filename = `${project.title.replace(/\s+/g, "_")}${fileExtension}`;

      return {
        buffer,
        filename,
        mimeType: "text/plain",
        fileSize: buffer.length,
      };
    } catch (error: any) {
      logger.error("Error exporting to TXT:", error);
      throw new Error(`Failed to export to TXT: ${error.message}`);
    }
  }

  // Export to LaTeX
  private static async exportToLaTeX(
    project: ProjectData,
    options: ExportOptions,
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      logger.debug(`Exporting project ${project.id} to LaTeX`);

      // Apply journal-ready formatting if requested
      const formattedContent = options.journalReady
        ? this.applyJournalReadyFormatting(project, options)
        : project.content;

      // Get journal-specific formatting rules
      const journalRules = options.journalTemplate
        ? this.getJournalFormattingRules(options.journalTemplate)
        : null;

      // Apply journal-specific LaTeX formatting
      let content = "\\documentclass{article}\n";
      content += "\\usepackage[utf8]{inputenc}\n";
      content += "\\usepackage{geometry}\n";
      content += "\\usepackage{hyperref}\n";

      // Apply journal-specific geometry
      if (journalRules) {
        content += `\\geometry{margin=${journalRules.margins.left}pt}\n`;
        if (journalRules.twoColumnLayout) {
          content += "\\usepackage{multicol}\n";
        }
      } else {
        content += "\\geometry{a4paper}\n";
      }

      content += "\\title{" + project.title.replace(/_/g, "\\_") + "}\n";
      content += "\\date{" + project.createdAt.toDateString() + "}\n";
      content += "\\begin{document}\n";
      content += "\\maketitle\n\n";

      // Convert content to LaTeX
      content += this.convertTipTapToLaTeX(formattedContent);

      if (options.includeCitations && project.citations.length > 0) {
        content += "\n\\section*{References}\n";
        content += "\\begin{enumerate}\n";

        for (const citation of project.citations) {
          const formatted = await this.formatCitation(
            citation,
            options.citationStyle || "apa",
          );
          content += "\\item " + formatted.replace(/&/g, "\\&") + "\n";
        }

        content += "\\end{enumerate}\n";
      }

      content += "\n\\end{document}";

      const buffer = Buffer.from(content, "utf-8");
      // Generate appropriate filename based on format
      const fileExtension = options.journalReady ? "-journal.tex" : ".tex";
      const filename = `${project.title.replace(/\s+/g, "_")}${fileExtension}`;

      return {
        buffer,
        filename,
        mimeType: "application/octet-stream",
        fileSize: buffer.length,
      };
    } catch (error: any) {
      logger.error("Error exporting to LaTeX:", error);
      throw new Error(`Failed to export to LaTeX: ${error.message}`);
    }
  }

  // Export to Overleaf
  private static async exportToOverleaf(
    project: ProjectData,
    options: ExportOptions,
    userId: string,
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      logger.debug(`Exporting project ${project.id} to Overleaf`);

      // First, generate the LaTeX content
      const latexResult = await this.exportToLaTeX(project, options);

      // For Overleaf export, we need to store the LaTeX content temporarily
      // and create a proper endpoint that Overleaf can access

      // Create a temporary token for this export
      const tempToken = `${project.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Store the export data in the database with a 1-hour expiration
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 1);

      // Create an export record in the database
      const exportRecord = await prisma.export.create({
        data: {
          user_id: userId,
          project_id: project.id,
          file_name: `${project.title.replace(/\s+/g, "_")}.tex`,
          file_size: latexResult.buffer.length,
          file_type: "overleaf-temp",
          download_url: ``, // Will be set after upload
          status: "pending",
          export_options: {
            format: "overleaf",
            tempToken: tempToken,
            expiration: expirationTime.toISOString(),
          },
          exported_by: "overleaf-export",
        },
      });

      try {
        const storageResult = await SupabaseStorageService.uploadFile(
          latexResult.buffer,
          `overleaf/${tempToken}/${project.title.replace(/\s+/g, "_")}.tex`,
          "application/octet-stream",
          userId,
          {
            projectId: project.id,
          },
        );

        // Update the export record with the download URL
        await prisma.export.update({
          where: { id: exportRecord.id },
          data: {
            download_url: storageResult.url,
            status: "completed",
          },
        });

        // Return a JSON response with the Overleaf URL format
        // that the frontend can use to redirect the user
        const overleafRedirectData = {
          overleafUrl: `https://www.overleaf.com/docs?snip_uri=${encodeURIComponent(storageResult.url)}&splash=none`,
          tempToken: tempToken,
          projectId: project.id,
          title: project.title,
          downloadUrl: storageResult.url,
        };

        return {
          buffer: Buffer.from(JSON.stringify(overleafRedirectData)),
          filename: "overleaf-redirect.json",
          mimeType: "application/json",
          fileSize: Buffer.byteLength(JSON.stringify(overleafRedirectData)),
        };
      } catch (storageError: any) {
        // If storage fails, update the export record as failed
        await prisma.export.update({
          where: { id: exportRecord.id },
          data: {
            status: "failed",
            download_url: "",
          },
        });

        logger.error("Error storing Overleaf export content:", storageError);
        throw new Error(
          `Failed to store Overleaf export content: ${storageError.message || "Unknown error"}`,
        );
      }
    } catch (error: any) {
      logger.error("Error exporting to Overleaf:", error);
      throw new Error(`Failed to export to Overleaf: ${error.message}`);
    }
  }

  // Export to Google Drive
  private static async exportToGoogleDrive(
    project: ProjectData,
    options: ExportOptions,
    userId: string,
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      logger.debug(`Exporting project ${project.id} to Google Drive`);

      // First, generate the content in the requested format
      let exportResult;
      switch (options.format) {
        case "google-drive":
          // Default to PDF if no specific format is requested
          exportResult = await this.exportToPDF(project, options, userId);
          break;
        default:
          // Use the requested format
          exportResult = await this.exportProject(project.id, userId, {
            ...options,
            format: options.format.replace("google-drive-", "") as any,
          });
      }

      // Upload the file to Google Drive
      const fileName = `${project.title.replace(/\s+/g, "_")}${this.getFileExtension(exportResult.mimeType)}`;

      // Log the export activity for audit purposes
      logger.info(
        `User ${userId} exported project ${project.id} to Google Drive`,
        {
          projectId: project.id,
          userId: userId,
          fileName: fileName,
          fileSize: exportResult.fileSize,
          format: options.format,
        },
      );

      // Return a JSON response with the Google Drive URL
      const responseData = {
        success: true,
        message: "File successfully exported to Google Drive",
      };

      return {
        buffer: Buffer.from(JSON.stringify(responseData)),
        filename: "google-drive-export.json",
        mimeType: "application/json",
        fileSize: Buffer.byteLength(JSON.stringify(responseData)),
      };
    } catch (error: any) {
      logger.error("Error exporting to Google Drive:", error);
      throw new Error(`Failed to export to Google Drive: ${error.message}`);
    }
  }

  // Export to OneDrive
  private static async exportToOneDrive(
    project: ProjectData,
    options: ExportOptions,
    userId: string,
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      logger.debug(`Exporting project ${project.id} to OneDrive`);

      // First, generate the content in the requested format
      // For OneDrive export, we need to first create the file in a supported format
      let exportResult;

      // Determine the format to export as (default to PDF)
      const targetFormat =
        options.format === "onedrive"
          ? "pdf"
          : options.format.replace("onedrive-", "");

      // Export the project in the determined format
      exportResult = await this.exportProject(project.id, userId, {
        ...options,
        format: targetFormat as any,
      });

      // Upload the file to OneDrive
      const fileName = `${project.title.replace(/\s+/g, "_")}${this.getFileExtension(exportResult.mimeType)}`;

      // Log the export activity for audit purposes
      logger.info(`User ${userId} exported project ${project.id} to OneDrive`, {
        projectId: project.id,
        userId: userId,
        fileName: fileName,
        fileSize: exportResult.fileSize,
        format: options.format,
      });

      // Return a JSON response with the OneDrive URL
      const responseData = {
        success: true,
        message: "File successfully exported to OneDrive",
      };

      return {
        buffer: Buffer.from(JSON.stringify(responseData)),
        filename: "onedrive-export.json",
        mimeType: "application/json",
        fileSize: Buffer.byteLength(JSON.stringify(responseData)),
      };
    } catch (error: any) {
      logger.error("Error exporting to OneDrive:", error);
      throw new Error(`Failed to export to OneDrive: ${error.message}`);
    }
  }

  // Get file extension based on MIME type
  private static getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      "application/pdf": ".pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        ".docx",
      "text/plain": ".txt",
      "application/x-tex": ".tex",
      "application/octet-stream": ".tex",
      "text/rtf": ".rtf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        ".xlsx",
      "text/csv": ".csv",
      "image/png": ".png",
      "application/zip": ".zip",
    };

    return extensions[mimeType] || "";
  }

  // Convert TipTap JSON content to plain text
  private static convertTipTapToPlainText(content: any): string {
    if (!content || !content.content) {
      return "";
    }

    let text = "";

    const processNode = (node: any) => {
      if (node.type === "text") {
        text += node.text || "";
      } else if (node.type === "image") {
        // Handle image nodes in plain text
        const attrs = node.attrs || {};
        const alt = attrs.alt || "";
        text += `[Image: ${alt || "Embedded Image"}]`;
      } else if (node.content) {
        node.content.forEach(processNode);
      }

      // Add line breaks for block elements
      if (["paragraph", "heading"].includes(node.type)) {
        text += "\n\n";
      }
    };

    content.content.forEach(processNode);

    return text.trim();
  }

  // Convert TipTap JSON content to DOCX paragraphs
  private static convertTipTapToDOCXParagraphs(content: any): any[] {
    if (!content || !content.content) {
      return [];
    }

    const paragraphs: any[] = [];

    const processNode = (node: any) => {
      if (node.type === "paragraph") {
        const textRuns: any[] = [];
        if (node.content) {
          node.content.forEach((child: any) => {
            if (child.type === "text") {
              // Check for marks (bold, italic, etc.)
              let run = new TextRun({
                text: child.text || "",
              });

              if (child.marks) {
                child.marks.forEach((mark: any) => {
                  switch (mark.type) {
                    case "bold":
                      run = new TextRun({
                        text: child.text || "",
                        bold: true,
                      });
                      break;
                    case "italic":
                      run = new TextRun({
                        text: child.text || "",
                        italics: true,
                      });
                      break;
                    case "underline":
                      run = new TextRun({
                        text: child.text || "",
                        underline: {},
                      });
                      break;
                  }
                });
              }

              textRuns.push(run);
            }
          });
        }
        paragraphs.push(
          new Paragraph({
            children: textRuns,
            spacing: {
              after: 200,
            },
          }),
        );
      } else if (node.type === "heading") {
        const textRuns: any[] = [];
        if (node.content) {
          node.content.forEach((child: any) => {
            if (child.type === "text") {
              textRuns.push(new TextRun(child.text || ""));
            }
          });
        }

        const level = node.attrs?.level || 1;
        let headingLevel:
          | "Heading1"
          | "Heading2"
          | "Heading3"
          | "Heading4"
          | "Heading5"
          | "Heading6"
          | "Title";

        switch (level) {
          case 1:
            headingLevel = "Heading1";
            break;
          case 2:
            headingLevel = "Heading2";
            break;
          case 3:
            headingLevel = "Heading3";
            break;
          default:
            headingLevel = "Heading4";
        }

        paragraphs.push(
          new Paragraph({
            children: textRuns,
            heading: headingLevel,
            spacing: {
              before: 400,
              after: 200,
            },
          }),
        );
      } else if (node.type === "image") {
        // Handle image nodes in DOCX
        const attrs = node.attrs || {};
        const src = attrs.src || "";
        const alt = attrs.alt || "";

        if (src) {
          // For DOCX, we'll add a paragraph with the image alt text as a placeholder
          // Since DOCX doesn't easily support embedding external images without complex setup
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `[Image: ${alt || "Embedded Image"}]`,
                  italics: true,
                }),
              ],
              spacing: {
                after: 200,
              },
            }),
          );
        }
      } else if (node.content) {
        node.content.forEach(processNode);
      }
    };

    content.content.forEach(processNode);

    return paragraphs;
  }

  // Convert TipTap JSON content to LaTeX
  private static convertTipTapToLaTeX(content: any): string {
    if (!content || !content.content) {
      return "";
    }

    let latex = "";

    const processNode = (node: any) => {
      if (node.type === "paragraph") {
        latex += "\n";
        if (node.content) {
          node.content.forEach((child: any) => {
            if (child.type === "text") {
              let text = child.text || "";

              // Apply formatting marks
              if (child.marks) {
                child.marks.forEach((mark: any) => {
                  switch (mark.type) {
                    case "bold":
                      text = `\\textbf{${text}}`;
                      break;
                    case "italic":
                      text = `\\textit{${text}}`;
                      break;
                    case "underline":
                      text = `\\underline{${text}}`;
                      break;
                  }
                });
              }

              latex += text;
            }
          });
        }
        latex += "\n";
      } else if (node.type === "heading") {
        const level = node.attrs?.level || 1;
        const headingCommand =
          level === 1
            ? "\\section"
            : level === 2
              ? "\\subsection"
              : "\\subsubsection";
        latex += `\n${headingCommand}{`;
        if (node.content) {
          node.content.forEach((child: any) => {
            if (child.type === "text") {
              latex += child.text || "";
            }
          });
        }
        latex += "}\n";
      } else if (node.content) {
        node.content.forEach(processNode);
      }
    };

    content.content.forEach(processNode);

    return latex;
  }

  // Format citation based on style
  private static async formatCitation(
    citation: any,
    style: string,
  ): Promise<string> {
    return CitationService.formatCitation(citation, style);
  }

  // Export to RTF
  private static async exportToRTF(
    project: ProjectData,
    options: ExportOptions,
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      logger.debug(`Exporting project ${project.id} to RTF`);

      // Apply journal-ready formatting if requested
      const formattedContent = options.journalReady
        ? this.applyJournalReadyFormatting(project, options)
        : project.content;

      // Get journal-specific formatting rules
      const journalRules = options.journalTemplate
        ? this.getJournalFormattingRules(options.journalTemplate)
        : null;

      let content = "{\\rtf1\\ansi\\deff0\n";
      content += "{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}}\n";

      // Apply journal-specific font if specified
      if (journalRules && journalRules.fontFamily) {
        content = content.replace("Arial", journalRules.fontFamily);
      }

      content +=
        "\\viewkind4\\uc1\\pard\\f0\\fs24\\b\\qc " +
        project.title +
        "\\b0\\par\n";
      content +=
        "\\qc Created: " + project.createdAt.toDateString() + "\\par\n";
      content += "\\par\n";

      // Add content (convert from TipTap JSON to RTF)
      const contentText = this.convertTipTapToPlainText(formattedContent);
      // Simple RTF formatting - replace newlines with paragraph breaks
      const rtfContent = contentText
        .replace(/\n/g, "\\par\n")
        .replace(/\*\*(.*?)\*\*/g, "\\b $1\\b0 ") // Bold
        .replace(/\*(.*?)\*/g, "\\i $1\\i0 "); // Italic

      content += rtfContent + "\\par\n";

      // Add citations if requested
      if (options.includeCitations && project.citations.length > 0) {
        content += "\\par\\b References\\b0\\par\n";

        // Process citations sequentially to maintain order
        for (let i = 0; i < project.citations.length; i++) {
          const citation = project.citations[i];
          const formattedCitation = await this.formatCitation(
            citation,
            options.citationStyle || "apa",
          );
          content += `${i + 1}. ${formattedCitation}\\par\n`;
        }
      }

      content += "}";

      const buffer = Buffer.from(content, "utf-8");
      const fileExtension = options.journalReady ? "-journal.rtf" : ".rtf";
      const filename = `${project.title.replace(/\s+/g, "_")}${fileExtension}`;

      return {
        buffer,
        filename,
        mimeType: "application/rtf",
        fileSize: buffer.length,
      };
    } catch (error: any) {
      logger.error("Error exporting to RTF:", error);
      throw new Error(`Failed to export to RTF: ${error.message}`);
    }
  }

  // Export to XLSX
  private static async exportToXLSX(
    project: ProjectData,
    options: ExportOptions,
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      logger.debug(`Exporting project ${project.id} to XLSX`);

      // Apply journal-ready formatting if requested
      const formattedContent = options.journalReady
        ? this.applyJournalReadyFormatting(project, options)
        : project.content;

      // For XLSX export, we'll create a spreadsheet with project data
      const XLSX = require("xlsx");

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();

      // Project metadata
      const metadata = [
        ["Field", "Value"],
        ["Title", project.title],
        ["Created", project.createdAt.toDateString()],
        ["Word Count", project.wordCount.toString()],
        ["Last Updated", project.updatedAt.toDateString()],
      ];

      // Content as plain text
      const contentText = this.convertTipTapToPlainText(formattedContent);

      // Citations data
      const citationsData = [["#", "Author", "Title", "Year", "Journal"]];
      project.citations.forEach((citation, index) => {
        citationsData.push([
          (index + 1).toString(),
          citation.authors
            ? citation.authors
                .map((a: any) => `${a.firstName} ${a.lastName}`)
                .join(", ")
            : "",
          citation.title || "",
          citation.year || "",
          citation.journal || citation.publisher || "",
        ]);
      });

      // Add worksheets to workbook
      const metadataSheet = XLSX.utils.aoa_to_sheet(metadata);
      const contentSheet = XLSX.utils.aoa_to_sheet([
        ["Content"],
        [contentText],
      ]);
      const citationsSheet = XLSX.utils.aoa_to_sheet(citationsData);

      XLSX.utils.book_append_sheet(wb, metadataSheet, "Metadata");
      XLSX.utils.book_append_sheet(wb, contentSheet, "Content");
      XLSX.utils.book_append_sheet(wb, citationsSheet, "References");

      // Generate buffer
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      const filename = `${project.title.replace(/\s+/g, "_")}.xlsx`;

      return {
        buffer,
        filename,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileSize: buffer.length,
      };
    } catch (error: any) {
      logger.error("Error exporting to XLSX:", error);
      throw new Error(`Failed to export to XLSX: ${error.message}`);
    }
  }

  // Export to CSV
  private static async exportToCSV(
    project: ProjectData,
    options: ExportOptions,
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      logger.debug(`Exporting project ${project.id} to CSV`);

      // Apply journal-ready formatting if requested
      const formattedContent = options.journalReady
        ? this.applyJournalReadyFormatting(project, options)
        : project.content;

      let csvContent = "Field,Value\n";
      csvContent += `"Title","${project.title}"\n`;
      csvContent += `"Created","${project.createdAt.toDateString()}"\n`;
      csvContent += `"Word Count","${project.wordCount}"\n`;
      csvContent += `"Last Updated","${project.updatedAt.toDateString()}"\n`;
      csvContent += "\n";

      // Content section
      csvContent += "Content,\n";
      const contentText = this.convertTipTapToPlainText(formattedContent);
      // Escape quotes and wrap in quotes
      const escapedContent = `"${contentText.replace(/"/g, '""')}"`;
      csvContent += `${escapedContent}\n`;
      csvContent += "\n";

      // Citations section
      csvContent += "References,\n";
      csvContent += "Number,Author,Title,Year,Journal\n";
      project.citations.forEach((citation, index) => {
        const authors = citation.authors
          ? citation.authors
              .map((a: any) => `${a.firstName} ${a.lastName}`)
              .join(", ")
          : "";
        const title = citation.title || "";
        const year = citation.year || "";
        const journal = citation.journal || citation.publisher || "";

        csvContent += `"${index + 1}","${authors}","${title}","${year}","${journal}"\n`;
      });

      const buffer = Buffer.from(csvContent, "utf-8");
      const filename = `${project.title.replace(/\s+/g, "_")}.csv`;

      return {
        buffer,
        filename,
        mimeType: "text/csv",
        fileSize: buffer.length,
      };
    } catch (error: any) {
      logger.error("Error exporting to CSV:", error);
      throw new Error(`Failed to export to CSV: ${error.message}`);
    }
  }

  // Export to Image (PNG)
  private static async exportToImage(
    project: ProjectData,
    options: ExportOptions,
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }> {
    try {
      logger.debug(`Exporting project ${project.id} to PNG`);

      // Import puppeteer dynamically to avoid issues if not installed
      const puppeteer = require("puppeteer");

      // Launch browser
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      try {
        // Create a new page
        const page = await browser.newPage();

        // Generate HTML content for the document
        const htmlContent = await this.generateDocumentHTML(project, options);

        // Set content and wait for it to load
        await page.setContent(htmlContent, { waitUntil: "networkidle0" });

        // Take screenshot of the entire document
        const buffer = await page.screenshot({
          type: "png",
          fullPage: true,
        });

        // Close the page
        await page.close();

        const filename = `${project.title.replace(/\s+/g, "_")}.png`;

        return {
          buffer,
          filename,
          mimeType: "image/png",
          fileSize: buffer.length,
        };
      } finally {
        // Always close the browser
        await browser.close();
      }
    } catch (error: any) {
      logger.error("Error exporting to Image:", error);
      throw new Error(`Failed to export to Image: ${error.message}`);
    }
  }

  // Generate HTML content for document visualization
  private static async generateDocumentHTML(
    project: ProjectData,
    options: ExportOptions,
  ): Promise<string> {
    // Convert TipTap content to HTML
    const contentHTML = this.convertTipTapToHTML(project.content);

    // Format citations if requested
    let citationsHTML = "";
    if (options.includeCitations && project.citations.length > 0) {
      const formattedCitations = await Promise.all(
        project.citations.map(async (citation) => {
          const formatted = await this.formatCitation(
            citation,
            options.citationStyle || "apa",
          );
          return `<li>${formatted}</li>`;
        }),
      );

      citationsHTML = `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc;">
          <h2>References</h2>
          <ol>
            ${formattedCitations.join("")}
          </ol>
        </div>
      `;
    }

    // Generate complete HTML document
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${project.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              line-height: 1.6;
            }
            h1 {
              color: #333;
              text-align: center;
              margin-bottom: 10px;
            }
            .metadata {
              text-align: center;
              color: #666;
              margin-bottom: 30px;
              font-size: 14px;
            }
            h2 {
              color: #333;
              margin-top: 30px;
              margin-bottom: 15px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            ol {
              padding-left: 20px;
            }
            li {
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <h1>${project.title}</h1>
          <div class="metadata">
            Created: ${project.createdAt.toDateString()} | 
            Word Count: ${project.wordCount}
          </div>
          <div class="content">
            ${contentHTML}
          </div>
          ${citationsHTML}
        </body>
      </html>
    `;
  }

  // Convert TipTap JSON content to HTML
  private static convertTipTapToHTML(content: any): string {
    if (!content || !content.content) {
      return "<p>No content available</p>";
    }

    let html = "";

    const processNode = (node: any) => {
      if (node.type === "text") {
        let text = node.text || "";

        // Apply formatting marks
        if (node.marks) {
          node.marks.forEach((mark: any) => {
            switch (mark.type) {
              case "bold":
                text = `<strong>${text}</strong>`;
                break;
              case "italic":
                text = `<em>${text}</em>`;
                break;
              case "underline":
                text = `<u>${text}</u>`;
                break;
              case "strike":
                text = `<del>${text}</del>`;
                break;
              case "code":
                text = `<code>${text}</code>`;
                break;
            }
          });
        }

        html += text;
      } else if (node.type === "paragraph") {
        html += "<p>";
        if (node.content) {
          node.content.forEach(processNode);
        }
        html += "</p>";
      } else if (node.type === "heading") {
        const level = node.attrs?.level || 1;
        const tag = `h${Math.min(level, 6)}`;
        html += `<${tag}>`;
        if (node.content) {
          node.content.forEach(processNode);
        }
        html += `</${tag}>`;
      } else if (node.type === "bulletList") {
        html += "<ul>";
        if (node.content) {
          node.content.forEach(processNode);
        }
        html += "</ul>";
      } else if (node.type === "orderedList") {
        html += "<ol>";
        if (node.content) {
          node.content.forEach(processNode);
        }
        html += "</ol>";
      } else if (node.type === "listItem") {
        html += "<li>";
        if (node.content) {
          node.content.forEach(processNode);
        }
        html += "</li>";
      } else if (node.type === "blockquote") {
        html += "<blockquote>";
        if (node.content) {
          node.content.forEach(processNode);
        }
        html += "</blockquote>";
      } else if (node.type === "codeBlock") {
        html += "<pre><code>";
        if (node.content) {
          node.content.forEach(processNode);
        }
        html += "</code></pre>";
      } else if (node.type === "image") {
        // Handle image nodes
        const attrs = node.attrs || {};
        const src = attrs.src || "";
        const alt = attrs.alt || "";
        const title = attrs.title || "";
        const style = attrs.style || "";

        if (src) {
          html += `<img src="${src}" alt="${alt}" title="${title}" style="${style}" />`;
        }
      } else if (node.content) {
        node.content.forEach(processNode);
      }
    };

    content.content.forEach(processNode);

    return html || "<p>No content available</p>";
  }

  // Apply journal template formatting
  private static applyJournalTemplate(
    content: string,
    template: string,
  ): string {
    // This would contain logic to apply specific journal formatting
    // For now, we'll just return the content as-is
    return content;
  }

  // Apply journal-ready formatting based on template
  private static applyJournalReadyFormatting(
    project: ProjectData,
    options: ExportOptions,
  ): any {
    // If no journal template specified, return original content
    if (!options.journalTemplate) {
      return project.content;
    }

    // Apply journal-specific formatting rules
    const journalFormattedContent = this.applyJournalSpecificFormatting(
      project.content,
      options.journalTemplate,
    );

    return journalFormattedContent;
  }

  // Apply journal-specific formatting rules
  private static applyJournalSpecificFormatting(
    content: any,
    template: string,
  ): any {
    // Clone the content to avoid modifying original
    const formattedContent = JSON.parse(JSON.stringify(content));

    // Define journal-specific formatting rules
    const journalRules = this.getJournalFormattingRules(template);

    // Apply formatting rules to content
    if (formattedContent.content) {
      formattedContent.content = formattedContent.content.map((node: any) =>
        this.applyFormattingToNode(node, journalRules),
      );
    }

    return formattedContent;
  }

  // Get formatting rules for specific journal templates
  private static getJournalFormattingRules(template: string): any {
    const rules: Record<string, any> = {
      ieee: {
        fontSize: 10,
        fontFamily: "Times New Roman",
        lineHeight: 1.15,
        margins: { top: 72, bottom: 72, left: 72, right: 72 }, // 1 inch in points
        twoColumnLayout: true,
        citationStyle: "ieee",
        sectionSpacing: 12,
        abstractRequired: true,
        keywordsRequired: true,
      },
      nature: {
        fontSize: 12,
        fontFamily: "Arial",
        lineHeight: 1.2,
        margins: { top: 54, bottom: 54, left: 54, right: 54 }, // 0.75 inch in points
        twoColumnLayout: false,
        citationStyle: "nature",
        sectionSpacing: 18,
        abstractRequired: true,
        keywordsRequired: true,
        figureCaptionStyle: "below",
      },
      science: {
        fontSize: 12,
        fontFamily: "Arial",
        lineHeight: 1.2,
        margins: { top: 54, bottom: 54, left: 54, right: 54 }, // 0.75 inch in points
        twoColumnLayout: false,
        citationStyle: "science",
        sectionSpacing: 18,
        abstractRequired: true,
        keywordsRequired: true,
        figureCaptionStyle: "below",
      },
      "apa-journal": {
        fontSize: 12,
        fontFamily: "Times New Roman",
        lineHeight: 2.0, // Double spaced
        margins: { top: 72, bottom: 72, left: 72, right: 72 }, // 1 inch in points
        twoColumnLayout: false,
        citationStyle: "apa",
        sectionSpacing: 24,
        abstractRequired: true,
        keywordsRequired: true,
        runningHeadRequired: true,
      },
      default: {
        fontSize: 12,
        fontFamily: "Times New Roman",
        lineHeight: 1.15,
        margins: { top: 72, bottom: 72, left: 72, right: 72 }, // 1 inch in points
        twoColumnLayout: false,
        citationStyle: "apa",
        sectionSpacing: 12,
        abstractRequired: false,
        keywordsRequired: false,
      },
    };

    return rules[template] || rules.default;
  }

  // Apply formatting rules to a content node
  private static applyFormattingToNode(node: any, rules: any): any {
    // Clone the node to avoid modifying original
    const formattedNode = JSON.parse(JSON.stringify(node));

    // Apply general formatting rules
    if (formattedNode.type === "paragraph") {
      // Add spacing based on journal rules
      if (!formattedNode.attrs) {
        formattedNode.attrs = {};
      }
      formattedNode.attrs.lineHeight = rules.lineHeight;
      formattedNode.attrs.marginBottom = rules.sectionSpacing;
    } else if (formattedNode.type === "heading") {
      // Apply heading formatting
      if (!formattedNode.attrs) {
        formattedNode.attrs = {};
      }
      formattedNode.attrs.fontFamily = rules.fontFamily;
      formattedNode.attrs.fontSize =
        rules.fontSize + (6 - (formattedNode.attrs.level || 1));
    }

    // Process child nodes recursively
    if (formattedNode.content && Array.isArray(formattedNode.content)) {
      formattedNode.content = formattedNode.content.map((childNode: any) =>
        this.applyFormattingToNode(childNode, rules),
      );
    }

    return formattedNode;
  }

  /**
   * Convert user data to CSV format
   * @param userData The user data to convert
   * @returns CSV formatted string
   */
  static convertToCSV(userData: any): string {
    try {
      let csv = "Exported Data\n";
      csv += `Exported At,${userData.exportedAt}\n\n`;

      // Add user info
      if (userData.user) {
        csv += "User Info\n";
        csv += "Field,Value\n";
        csv += `ID,${userData.user.id}\n`;
        csv += `Email,${userData.user.email}\n`;
        csv += `Name,${userData.user.full_name || ""}\n`;
        csv += `Created,${userData.user.created_at}\n`;
        csv += `Institution,${userData.user.institution || ""}\n`;
        csv += `Location,${userData.user.location || ""}\n`;
        csv += "\n";
      }

      // Add projects summary
      if (userData.projects) {
        csv += "Projects\n";
        csv += "ID,Title,Word Count,Created,Updated\n";
        userData.projects.forEach((project: any) => {
          csv += `"${project.id}","${project.title.replace(/"/g, '""')}","${project.word_count}","${project.created_at}","${project.updated_at}"\n`;
        });
        csv += "\n";
      }

      // Add citations summary
      if (userData.citations) {
        csv += "Citations\n";
        csv += "ID,Title,Author,Year,Created\n";
        userData.citations.forEach((citation: any) => {
          csv += `"${citation.id}","${citation.title?.replace(/"/g, '""') || ""}","${citation.author?.replace(/"/g, '""') || ""}","${citation.year || ""}","${citation.created_at}"\n`;
        });
        csv += "\n";
      }

      // Add comments summary
      if (userData.comments) {
        csv += "Comments\n";
        csv += "ID,Content,Created\n";
        userData.comments.forEach((comment: any) => {
          csv += `"${comment.id}","${comment.content?.replace(/"/g, '""').substring(0, 50) || ""}","${comment.created_at}"\n`;
        });
        csv += "\n";
      }

      return csv;
    } catch (error) {
      logger.error("Error converting to CSV:", error);
      throw new Error("Failed to convert data to CSV format");
    }
  }

  /**
   * Create a ZIP archive of user data
   * @param userData The user data to archive
   * @returns Buffer containing the ZIP archive
   */
  static async createZipArchive(userData: any): Promise<Buffer> {
    try {
      const archiver = await import("archiver");
      const { Writable } = await import("stream");

      // Create a promise to handle the archiving process
      return new Promise<Buffer>((resolve, reject) => {
        // Create a buffer to store the archive
        const chunks: Buffer[] = [];

        // Create a writable stream to collect the archive data
        const stream = new Writable({
          write(chunk: Buffer, encoding: any, callback: any) {
            chunks.push(chunk);
            callback();
          },
        });

        // Create the archive
        const archive = (archiver as any)("zip", {
          zlib: { level: 9 }, // Sets the compression level
        });

        // Listen for all archive data to be written
        stream.on("finish", () => {
          const finalBuffer = Buffer.concat(chunks);
          resolve(finalBuffer);
        });

        // Listen for errors
        archive.on("error", (err: Error) => {
          reject(err);
        });

        // Pipe the archive to our writable stream
        archive.pipe(stream);

        // Append files to the archive
        archive.append(JSON.stringify(userData, null, 2), {
          name: "data.json",
        });

        // Add a README file
        const readme = `
ScholarForge AIData Export
=====================

This ZIP archive contains your exported data from ScholarForge AI.

Contents:
- data.json: Complete export of your data in JSON format
- folders for each data type (if applicable)

Exported on: ${userData.exportedAt}
        `;
        archive.append(readme, { name: "README.txt" });

        // Add projects folder if data exists
        if (userData.projects && userData.projects.length > 0) {
          userData.projects.forEach((project: any) => {
            archive.append(JSON.stringify(project, null, 2), {
              name: `projects/${project.id}.json`,
            });
          });
        }

        // Add citations folder if data exists
        if (userData.citations && userData.citations.length > 0) {
          userData.citations.forEach((citation: any) => {
            archive.append(JSON.stringify(citation, null, 2), {
              name: `citations/${citation.id}.json`,
            });
          });
        }

        // Finalize the archive
        archive.finalize();
      });
    } catch (error) {
      logger.error("Error creating ZIP archive:", error);
      throw new Error("Failed to create ZIP archive");
    }
  }
}
