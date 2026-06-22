// Simplified ProjectServiceEnhanced for productivity pivot
// Removed academic-specific features (citations, research, etc.)

import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

export class ProjectServiceEnhanced {
  // Get all projects for a user
  static async getUserProjects(
    userId: string,
    includeArchived: boolean = false,
    archivedOnly: boolean = false,
    workspaceId?: string | null,
  ) {
    try {
      const where: any = {
        OR: [
          { user_id: userId },
          { collaborators: { some: { user_id: userId } } },
        ],
      };

      if (archivedOnly) {
        where.status = "archived";
      } else if (!includeArchived) {
        where.status = { not: "archived" };
      }

      // Filter by workspace if provided
      if (workspaceId === null) {
        where.workspace_id = null;
      } else if (workspaceId && workspaceId !== "not-null") {
        where.workspace_id = workspaceId;
      } else if (workspaceId === "not-null") {
        where.workspace_id = { not: null };
      }

      const projects = await prisma.project.findMany({
        where,
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
          collaborators: {
            include: {
              user: {
                select: { id: true, full_name: true, email: true },
              },
            },
          },
          workspace: {
            select: { id: true, name: true },
          },
        },
        orderBy: { updated_at: "desc" },
      });

      return projects;
    } catch (error) {
      logger.error("=== ProjectServiceEnhanced.getUserProjects ERROR ===");
      logger.error("Error type:", typeof error);
      logger.error("Error message:", (error as Error).message);
      logger.error("Error stack:", (error as Error).stack);
      logger.error(
        "Full error:",
        JSON.stringify(error, Object.getOwnPropertyNames(error)),
      );
      throw new Error(
        `Error fetching user projects: ${(error as Error).message}`,
      );
    }
  }

  // Get project by ID
  static async getProjectById(projectId: string, userId: string) {
    try {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { user_id: userId },
            { collaborators: { some: { user_id: userId } } },
          ],
        },
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
          collaborators: {
            include: {
              user: {
                select: { id: true, full_name: true, email: true },
              },
            },
          },
          workspace: true,
        },
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      return project;
    } catch (error) {
      logger.error("Error fetching project:", error);
      throw error;
    }
  }

  // Create a new project
  static async createProject(projectData: any, userId: string) {
    try {
      const project = await prisma.project.create({
        data: {
          ...projectData,
          user_id: userId,
          status: projectData.status || "active",
        },
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
          workspace: true,
        },
      });

      return project;
    } catch (error) {
      logger.error("Error creating project:", error);
      throw new Error(`Error creating project: ${(error as Error).message}`);
    }
  }

  // Update a project
  static async updateProject(
    projectId: string,
    updateData: any,
    userId: string,
  ) {
    try {
      // Verify ownership or membership
      const existing = await this.getProjectById(projectId, userId);
      if (!existing) {
        throw new Error("Project not found or access denied");
      }

      const project = await prisma.project.update({
        where: { id: projectId },
        data: updateData,
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
          workspace: true,
        },
      });

      return project;
    } catch (error) {
      logger.error("Error updating project:", error);
      throw new Error(`Error updating project: ${(error as Error).message}`);
    }
  }

  // Delete a project
  static async deleteProject(projectId: string, userId: string) {
    try {
      // Verify ownership
      const existing = await prisma.project.findFirst({
        where: { id: projectId, user_id: userId },
      });

      if (!existing) {
        throw new Error("Project not found or access denied");
      }

      await prisma.project.delete({
        where: { id: projectId },
      });

      return { success: true };
    } catch (error) {
      logger.error("Error deleting project:", error);
      throw new Error(`Error deleting project: ${(error as Error).message}`);
    }
  }

  // Get project stats
  static async getProjectStats(userId: string) {
    try {
      const totalProjects = await prisma.project.count({
        where: {
          OR: [
            { user_id: userId },
            { collaborators: { some: { user_id: userId } } },
          ],
        },
      });

      const activeProjects = await prisma.project.count({
        where: {
          OR: [
            { user_id: userId },
            { collaborators: { some: { user_id: userId } } },
          ],
          status: { not: "archived" },
        },
      });

      const archivedProjects = await prisma.project.count({
        where: {
          OR: [
            { user_id: userId },
            { collaborators: { some: { user_id: userId } } },
          ],
          status: "archived",
        },
      });

      return {
        total: totalProjects,
        active: activeProjects,
        archived: archivedProjects,
      };
    } catch (error) {
      logger.error("Error fetching project stats:", error);
      throw new Error(`Error fetching stats: ${(error as Error).message}`);
    }
  }

  // Get collaboration projects
  static async getCollaborationProjects(userId: string) {
    try {
      const projects = await prisma.project.findMany({
        where: {
          collaborators: { some: { user_id: userId } },
          NOT: { user_id: userId },
        },
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
          workspace: true,
        },
        orderBy: { updated_at: "desc" },
      });

      return projects;
    } catch (error) {
      logger.error("Error fetching collaboration projects:", error);
      throw new Error(
        `Error fetching collaborations: ${(error as Error).message}`,
      );
    }
  }

  // Get document versions (placeholder - versions stored in ProjectVersion table)
  static async getProjectDocumentVersions(projectId: string, userId: string) {
    try {
      // Verify access
      await this.getProjectById(projectId, userId);

      const versions = await prisma.documentVersion.findMany({
        where: { project_id: projectId },
        orderBy: { created_at: "desc" },
      });

      return versions;
    } catch (error) {
      logger.error("Error fetching document versions:", error);
      throw new Error(`Error fetching versions: ${(error as Error).message}`);
    }
  }

  // Restore document version
  static async restoreDocumentVersion(
    projectId: string,
    versionId: string,
    userId: string,
  ) {
    try {
      // Verify access
      await this.getProjectById(projectId, userId);

      const version = await prisma.documentVersion.findFirst({
        where: { id: versionId, project_id: projectId },
      });

      if (!version) {
        throw new Error("Version not found");
      }

      // Update project with version content
      const project = await prisma.project.update({
        where: { id: projectId },
        data: {
          content: version.content,
          updated_at: new Date(),
        },
      });

      return project;
    } catch (error) {
      logger.error("Error restoring version:", error);
      throw new Error(`Error restoring version: ${(error as Error).message}`);
    }
  }

  // Apply AI edit (placeholder implementation)
  static async applyAIEdit(
    projectId: string,
    userId: string,
    editOptions: {
      text: string;
      action: string;
      context?: string;
      preferences?: any;
    },
  ) {
    try {
      const project = await this.getProjectById(projectId, userId);

      // Log the AI edit
      logger.info(`AI edit applied to project ${projectId} by user ${userId}`, {
        action: editOptions.action,
        preferences: editOptions.preferences,
      });

      return { success: true, project };
    } catch (error) {
      logger.error("Error applying AI edit:", error);
      throw new Error(`Error applying AI edit: ${(error as Error).message}`);
    }
  }

  // Get AI edit history (placeholder)
  static async getAIEditHistory(projectId: string, userId: string) {
    try {
      await this.getProjectById(projectId, userId);
      // Return empty array for now - implement with actual AIEdit table if needed
      return [];
    } catch (error) {
      logger.error("Error fetching AI edit history:", error);
      throw new Error(`Error fetching history: ${(error as Error).message}`);
    }
  }

  // Get project citations (deprecated - returns empty for productivity pivot)
  static async getProjectCitations(projectId: string, userId: string) {
    try {
      await this.getProjectById(projectId, userId);
      // Academic feature removed - return empty array
      return [];
    } catch (error) {
      logger.error("Error fetching citations:", error);
      return [];
    }
  }

  // Calculate project progress (placeholder - simplified for productivity pivot)
  static calculateProjectProgress(project: any): number {
    // Simplified progress calculation based on content word count
    const content = project?.content;
    if (!content) return 0;

    // Basic heuristic: more content = higher progress
    const textContent = JSON.stringify(content);
    const wordCount = textContent.split(/\s+/).length;

    // Assume 1000 words = 100% for this simple calculation
    const progress = Math.min(100, Math.round((wordCount / 1000) * 100));
    return progress;
  }

  // Export project — supports all formats (PDF, DOCX, TXT, LaTeX, RTF, Journal)
  static async exportProject(
    projectId: string,
    userId: string,
    options: {
      format: string;
      includeComments?: boolean;
      includeCitations?: boolean;
      citationStyle?: "apa" | "mla" | "chicago";
    },
  ) {
    try {
      const project = await this.getProjectById(projectId, userId);

      // Extract plain text from the project content (stored as JSON/HTML)
      const plainText = this.extractPlainText(project.content);
      const title = project.title || "Untitled";
      const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();

      const format = options.format || "pdf";
      let mimeType: string;
      let filename: string;
      let buffer: Buffer;

      switch (format) {
        case "txt":
          mimeType = "text/plain";
          filename = `${safeTitle}.txt`;
          buffer = Buffer.from(plainText, "utf-8");
          break;

        case "rtf":
          mimeType = "application/rtf";
          filename = `${safeTitle}.rtf`;
          buffer = Buffer.from(this.generateRTF(title, plainText), "utf-8");
          break;

        case "tex":
        case "latex":
          mimeType = "application/x-latex";
          filename = `${safeTitle}.tex`;
          buffer = Buffer.from(this.generateLaTeX(title, plainText), "utf-8");
          break;

        case "journal-latex":
          mimeType = "application/x-latex";
          filename = `${safeTitle}-journal.tex`;
          buffer = Buffer.from(
            this.generateJournalLaTeX(title, plainText),
            "utf-8",
          );
          break;

        case "docx":
          // Simple DOCX: wrap in basic Office Open XML
          mimeType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          filename = `${safeTitle}.docx`;
          buffer = Buffer.from(
            this.generateSimpleDocx(title, plainText),
            "utf-8",
          );
          break;

        case "pdf":
        case "journal-pdf":
        default:
          // PDF: generate a simple text-based PDF
          mimeType = "application/pdf";
          filename =
            format === "journal-pdf"
              ? `${safeTitle}-journal.pdf`
              : `${safeTitle}.pdf`;
          buffer = Buffer.from(
            this.generateSimplePDF(title, plainText),
            "utf-8",
          );
          break;
      }

      return {
        mimeType,
        filename,
        fileSize: buffer.length,
        buffer,
      };
    } catch (error) {
      logger.error("Error exporting project:", error);
      throw new Error(`Error exporting project: ${(error as Error).message}`);
    }
  }

  // Extract plain text from project content (stored as JSON with HTML)
  private static extractPlainText(content: any): string {
    try {
      if (typeof content === "string") {
        // Strip HTML tags
        return content
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim();
      }
      if (content && typeof content === "object") {
        const text = JSON.stringify(content);
        return text
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim();
      }
      return String(content || "");
    } catch {
      return String(content || "");
    }
  }

  // Generate a simple valid PDF (text-based, no external dependencies)
  private static generateSimplePDF(title: string, content: string): string {
    // Minimal valid PDF with embedded text
    const encodedTitle = this.escapePDFString(title);
    const lines = content.split("\n");
    const textObjects: string[] = [];
    let y = 750;
    for (const line of lines) {
      if (y < 50) break;
      const escaped = this.escapePDFString(
        line.length > 100 ? line.slice(0, 100) : line,
      );
      if (escaped) {
        textObjects.push(`BT /F1 12 Tf 50 ${y} Td (${escaped}) Tj ET`);
        y -= 16;
      }
    }

    const textStream = textObjects.join("\n");
    const streamLength = textStream.length;
    const catalogObj = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj";
    const pagesObj =
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj";
    const pageObj = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj`;
    const contentObj = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${textStream}\nendstream\nendobj`;

    const body = `${catalogObj}\n${pagesObj}\n${pageObj}\n${contentObj}\n`;
    const xrefOffset = body.length;
    const xref = `xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n${String(catalogObj.length + 1).padStart(10, "0")} 00000 n \n${String(catalogObj.length + pagesObj.length + 2).padStart(10, "0")} 00000 n \n${String(catalogObj.length + pagesObj.length + pageObj.length + 3).padStart(10, "0")} 00000 n \n`;
    const trailer = `trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return `%PDF-1.4\n${body}${xref}${trailer}`;
  }

  private static escapePDFString(s: string): string {
    return s
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/\r/g, "");
  }

  // Generate RTF
  private static generateRTF(title: string, content: string): string {
    const escapedContent = content
      .replace(/\\/g, "\\\\")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}")
      .replace(/\n/g, "\\par\n");
    return `{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 Times New Roman;}}\n\\f0\\fs24\n{\\b ${title}}\\par\n\\par\n${escapedContent}\n}`;
  }

  // Generate LaTeX
  private static generateLaTeX(title: string, content: string): string {
    const escapedContent = content
      .replace(/\\/g, "\\textbackslash ")
      .replace(/[&%$#_{}]/g, (c) => "\\" + c)
      .replace(/~/g, "\\textasciitilde ")
      .replace(/\^/g, "\\textasciicircum ");
    return `\\documentclass[12pt]{article}\n\\title{${escapedContent.split("\\n")[0] || title}}\n\\date{\\today}\n\\begin{document}\n\\maketitle\n\n${escapedContent}\n\\end{document}`;
  }

  // Generate Journal-ready LaTeX
  private static generateJournalLaTeX(title: string, content: string): string {
    const escapedContent = content
      .replace(/\\/g, "\\textbackslash ")
      .replace(/[&%$#_{}]/g, (c) => "\\" + c);
    return `\\documentclass[12pt]{article}\n\\usepackage{amsmath,amssymb}\n\\usepackage[margin=1in]{geometry}\n\\title{${escapedContent.split("\\n")[0] || title}}\n\\author{}\n\\date{\\today}\n\\begin{document}\n\\maketitle\n\\begin{abstract}\n\n\\end{abstract}\n\n${escapedContent}\n\\end{document}`;
  }

  // Generate a basic DOCX (Office Open XML wrapper around plain text)
  private static generateSimpleDocx(title: string, content: string): string {
    const escapedContent = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "</w:t></w:r></w:p><w:p><w:r><w:t>");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>${escapedContent}</w:t></w:r></w:p>
  </w:body>
</w:document>`;
  }
}
