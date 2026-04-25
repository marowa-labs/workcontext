import { prisma } from "../../lib/prisma";
import logger from "../../monitoring/logger";
import { ExportService } from "../../services/exportService";
import { StorageService } from "../../services/storageService";

// Define a generic request interface that works for both web Request and our mock
interface FileProcessingRequest {
  json(): Promise<{
    fileData: any;
    fileType: string;
    userId: string;
  }>;
}

// Serverless function for file processing (document uploads, exports, etc.)
export default async function fileProcessing(req: FileProcessingRequest) {
  try {
    // Extract file data from request
    const requestData = (await req.json()) as {
      fileData: any;
      fileType: string;
      userId: string;
    };
    const { fileData, fileType, userId } = requestData;

    // Process file based on type
    let result;
    switch (fileType) {
      case "document-import":
        result = await processDocumentImport(fileData, userId);
        break;
      case "export-pdf":
        result = await generatePDFExport(fileData, userId);
        break;
      case "export-docx":
        result = await generateDOCXExport(fileData, userId);
        break;
      case "export-txt":
        result = await generateTXTExport(fileData, userId);
        break;
      case "export-latex":
        result = await generateLaTeXExport(fileData, userId);
        break;
      case "export-rtf":
        result = await generateRTFExport(fileData, userId);
        break;
      case "export-xlsx":
        result = await generateXLSXExport(fileData, userId);
        break;
      case "export-csv":
        result = await generateCSVExport(fileData, userId);
        break;
      case "export-png":
        result = await generatePNGExport(fileData, userId);
        break;
      default:
        throw new Error("Unsupported file type");
    }

    return new Response(
      JSON.stringify({
        success: true,
        result,
        message: "File processed successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    logger.error("File processing failed", { error: error.message });
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "File processing failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Process document import
async function processDocumentImport(fileData: any, userId: string) {
  try {
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check storage limit
    const storageInfo = await StorageService.getUserStorageInfo(userId);
    const newStorageUsed = storageInfo.used + 0.01; // Estimate 10KB for new document

    if (newStorageUsed > storageInfo.limit) {
      throw new Error("Storage limit exceeded");
    }

    // Create project from imported document
    const project = await prisma.project.create({
      data: {
        user_id: userId,
        title: fileData.title || "Imported Document",
        type: fileData.type || "research-paper",
        citation_style: fileData.citationStyle || "apa",
        content: fileData.content || {},
        word_count: fileData.wordCount || 0,
        status: "draft",
      },
    });

    // Update user's storage usage
    await prisma.user.update({
      where: { id: userId },
      data: {
        storage_used: newStorageUsed,
      },
    });

    logger.info("Document imported successfully", {
      projectId: project.id,
      userId,
    });

    return {
      projectId: project.id,
      wordCount: project.word_count,
      processedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error processing document import", { error });
    throw error;
  }
}

// Generate PDF export
async function generatePDFExport(fileData: any, userId: string) {
  try {
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Validate project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: {
        id: fileData.projectId,
        user_id: userId,
      },
    });

    if (!project) {
      throw new Error("Project not found or access denied");
    }

    // Generate PDF using ExportService
    const exportResult = await ExportService.exportProject(
      fileData.projectId,
      userId,
      {
        format: "pdf",
        includeCitations: fileData.includeCitations ?? true,
        includeComments: fileData.includeComments ?? false,
        citationStyle: fileData.citationStyle || "apa",
        pageSize: fileData.pageSize || "A4",
        orientation: fileData.orientation || "portrait",
        journalTemplate: fileData.journalTemplate || "",
        journalReady: !!fileData.journalTemplate,
      }
    );

    // Upload the file to Supabase Storage
    const { SupabaseStorageService } =
      await import("../../services/supabaseStorageService");

    const { url: downloadUrl } = await SupabaseStorageService.uploadFile(
      exportResult.buffer,
      `${project.title}.pdf`,
      "application/pdf",
      userId,
      {
        userId,
        fileName: `${project.title}.pdf`,
        fileType: "pdf",
        fileSize: exportResult.fileSize,
        projectId: fileData.projectId,
        createdAt: new Date(),
      }
    );

    // Store export record in database
    await prisma.export.create({
      data: {
        user_id: userId,
        project_id: fileData.projectId,
        file_name: `${project.title}.pdf`,
        file_size: exportResult.fileSize,
        file_type: "pdf",
        download_url: downloadUrl,
        status: "completed",
      },
    });

    logger.info("PDF export generated successfully", {
      projectId: fileData.projectId,
      userId,
      fileSize: exportResult.fileSize,
    });

    return {
      downloadUrl,
      fileSize: exportResult.fileSize,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error generating PDF export", { error });

    // Store failed export record in database
    try {
      const project = await prisma.project.findUnique({
        where: {
          id: fileData.projectId,
        },
      });

      if (project) {
        await prisma.export.create({
          data: {
            user_id: userId,
            project_id: fileData.projectId,
            file_name: `${project.title}.pdf`,
            file_size: 0,
            file_type: "pdf",
            download_url: "",
            status: "failed",
          },
        });
      }
    } catch (dbError) {
      logger.error("Error storing failed export record", { dbError });
    }

    throw error;
  }
}

// Generate DOCX export
async function generateDOCXExport(fileData: any, userId: string) {
  try {
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Validate project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: {
        id: fileData.projectId,
        user_id: userId,
      },
    });

    if (!project) {
      throw new Error("Project not found or access denied");
    }

    // Generate DOCX using ExportService
    const exportResult = await ExportService.exportProject(
      fileData.projectId,
      userId,
      {
        format: "docx",
        includeCitations: fileData.includeCitations ?? true,
        includeComments: fileData.includeComments ?? false,
        citationStyle: fileData.citationStyle || "apa",
        journalTemplate: fileData.journalTemplate || "",
        journalReady: !!fileData.journalTemplate,
      }
    );

    // Upload the file to Supabase Storage
    const { SupabaseStorageService } =
      await import("../../services/supabaseStorageService");

    const { url: downloadUrl } = await SupabaseStorageService.uploadFile(
      exportResult.buffer,
      `${project.title}.docx`,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      userId,
      {
        userId,
        fileName: `${project.title}.docx`,
        fileType: "docx",
        fileSize: exportResult.fileSize,
        projectId: fileData.projectId,
        createdAt: new Date(),
      }
    );

    // Store export record in database
    await prisma.export.create({
      data: {
        user_id: userId,
        project_id: fileData.projectId,
        file_name: `${project.title}.docx`,
        file_size: exportResult.fileSize,
        file_type: "docx",
        download_url: downloadUrl,
        status: "completed",
      },
    });

    logger.info("DOCX export generated successfully", {
      projectId: fileData.projectId,
      userId,
      fileSize: exportResult.fileSize,
    });

    return {
      downloadUrl,
      fileSize: exportResult.fileSize,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error generating DOCX export", { error });

    // Store failed export record in database
    try {
      const project = await prisma.project.findUnique({
        where: {
          id: fileData.projectId,
        },
      });

      if (project) {
        await prisma.export.create({
          data: {
            user_id: userId,
            project_id: fileData.projectId,
            file_name: `${project.title}.docx`,
            file_size: 0,
            file_type: "docx",
            download_url: "",
            status: "failed",
          },
        });
      }
    } catch (dbError) {
      logger.error("Error storing failed export record", { dbError });
    }

    throw error;
  }
}

// Generate TXT export
async function generateTXTExport(fileData: any, userId: string) {
  try {
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Validate project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: {
        id: fileData.projectId,
        user_id: userId,
      },
    });

    if (!project) {
      throw new Error("Project not found or access denied");
    }

    // Generate TXT using ExportService
    const exportResult = await ExportService.exportProject(
      fileData.projectId,
      userId,
      {
        format: "txt",
        includeCitations: fileData.includeCitations ?? true,
        citationStyle: fileData.citationStyle || "apa",
        journalTemplate: fileData.journalTemplate || "",
        journalReady: !!fileData.journalTemplate,
      }
    );

    // Upload the file to Supabase Storage
    const { SupabaseStorageService } =
      await import("../../services/supabaseStorageService");

    const { url: downloadUrl } = await SupabaseStorageService.uploadFile(
      exportResult.buffer,
      `${project.title}.txt`,
      "text/plain",
      userId,
      {
        userId,
        fileName: `${project.title}.txt`,
        fileType: "txt",
        fileSize: exportResult.fileSize,
        projectId: fileData.projectId,
        createdAt: new Date(),
      }
    );

    // Store export record in database
    await prisma.export.create({
      data: {
        user_id: userId,
        project_id: fileData.projectId,
        file_name: `${project.title}.txt`,
        file_size: exportResult.fileSize,
        file_type: "txt",
        download_url: downloadUrl,
        status: "completed",
      },
    });

    logger.info("TXT export generated successfully", {
      projectId: fileData.projectId,
      userId,
      fileSize: exportResult.fileSize,
    });

    return {
      downloadUrl,
      fileSize: exportResult.fileSize,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error generating TXT export", { error });

    // Store failed export record in database
    try {
      const project = await prisma.project.findUnique({
        where: {
          id: fileData.projectId,
        },
      });

      if (project) {
        await prisma.export.create({
          data: {
            user_id: userId,
            project_id: fileData.projectId,
            file_name: `${project.title}.txt`,
            file_size: 0,
            file_type: "txt",
            download_url: "",
            status: "failed",
          },
        });
      }
    } catch (dbError) {
      logger.error("Error storing failed export record", { dbError });
    }

    throw error;
  }
}

// Generate LaTeX export
async function generateLaTeXExport(fileData: any, userId: string) {
  try {
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Validate project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: {
        id: fileData.projectId,
        user_id: userId,
      },
    });

    if (!project) {
      throw new Error("Project not found or access denied");
    }

    // Generate LaTeX using ExportService
    const exportResult = await ExportService.exportProject(
      fileData.projectId,
      userId,
      {
        format: "latex",
        includeCitations: fileData.includeCitations ?? true,
        citationStyle: fileData.citationStyle || "apa",
        journalTemplate: fileData.journalTemplate || "",
        journalReady: !!fileData.journalTemplate,
      }
    );

    // Upload the file to Supabase Storage
    const { SupabaseStorageService } =
      await import("../../services/supabaseStorageService");

    const { url: downloadUrl } = await SupabaseStorageService.uploadFile(
      exportResult.buffer,
      `${project.title}.tex`,
      "application/octet-stream",
      userId,
      {
        userId,
        fileName: `${project.title}.tex`,
        fileType: "tex",
        fileSize: exportResult.fileSize,
        projectId: fileData.projectId,
        createdAt: new Date(),
      }
    );

    // Store export record in database
    await prisma.export.create({
      data: {
        user_id: userId,
        project_id: fileData.projectId,
        file_name: `${project.title}.tex`,
        file_size: exportResult.fileSize,
        file_type: "tex",
        download_url: downloadUrl,
        status: "completed",
      },
    });

    logger.info("LaTeX export generated successfully", {
      projectId: fileData.projectId,
      userId,
      fileSize: exportResult.fileSize,
    });

    return {
      downloadUrl,
      fileSize: exportResult.fileSize,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error generating LaTeX export", { error });

    // Store failed export record in database
    try {
      const project = await prisma.project.findUnique({
        where: {
          id: fileData.projectId,
        },
      });

      if (project) {
        await prisma.export.create({
          data: {
            user_id: userId,
            project_id: fileData.projectId,
            file_name: `${project.title}.tex`,
            file_size: 0,
            file_type: "tex",
            download_url: "",
            status: "failed",
          },
        });
      }
    } catch (dbError) {
      logger.error("Error storing failed export record", { dbError });
    }

    throw error;
  }
}

// Generate RTF export
async function generateRTFExport(fileData: any, userId: string) {
  try {
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Validate project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: {
        id: fileData.projectId,
        user_id: userId,
      },
    });

    if (!project) {
      throw new Error("Project not found or access denied");
    }

    // Generate RTF using ExportService
    const exportResult = await ExportService.exportProject(
      fileData.projectId,
      userId,
      {
        format: "rtf",
        includeCitations: fileData.includeCitations ?? true,
        citationStyle: fileData.citationStyle || "apa",
        journalTemplate: fileData.journalTemplate || "",
        journalReady: !!fileData.journalTemplate,
      }
    );

    // Upload the file to Supabase Storage
    const { SupabaseStorageService } =
      await import("../../services/supabaseStorageService");

    const { url: downloadUrl } = await SupabaseStorageService.uploadFile(
      exportResult.buffer,
      `${project.title}.rtf`,
      "application/rtf",
      userId,
      {
        userId,
        fileName: `${project.title}.rtf`,
        fileType: "rtf",
        fileSize: exportResult.fileSize,
        projectId: fileData.projectId,
        createdAt: new Date(),
      }
    );

    // Store export record in database
    await prisma.export.create({
      data: {
        user_id: userId,
        project_id: fileData.projectId,
        file_name: `${project.title}.rtf`,
        file_size: exportResult.fileSize,
        file_type: "rtf",
        download_url: downloadUrl,
        status: "completed",
      },
    });

    logger.info("RTF export generated successfully", {
      projectId: fileData.projectId,
      userId,
      fileSize: exportResult.fileSize,
    });

    return {
      downloadUrl,
      fileSize: exportResult.fileSize,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error generating RTF export", { error });

    // Store failed export record in database
    try {
      const project = await prisma.project.findUnique({
        where: {
          id: fileData.projectId,
        },
      });

      if (project) {
        await prisma.export.create({
          data: {
            user_id: userId,
            project_id: fileData.projectId,
            file_name: `${project.title}.rtf`,
            file_size: 0,
            file_type: "rtf",
            download_url: "",
            status: "failed",
          },
        });
      }
    } catch (dbError) {
      logger.error("Error storing failed export record", { dbError });
    }

    throw error;
  }
}

// Generate XLSX export
async function generateXLSXExport(fileData: any, userId: string) {
  try {
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Validate project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: {
        id: fileData.projectId,
        user_id: userId,
      },
    });

    if (!project) {
      throw new Error("Project not found or access denied");
    }

    // Generate XLSX using ExportService
    const exportResult = await ExportService.exportProject(
      fileData.projectId,
      userId,
      {
        format: "xlsx",
        includeCitations: fileData.includeCitations ?? true,
        citationStyle: fileData.citationStyle || "apa",
        journalTemplate: fileData.journalTemplate || "",
        journalReady: !!fileData.journalTemplate,
      }
    );

    // Upload the file to Supabase Storage
    const { SupabaseStorageService } =
      await import("../../services/supabaseStorageService");

    const { url: downloadUrl } = await SupabaseStorageService.uploadFile(
      exportResult.buffer,
      `${project.title}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      userId,
      {
        userId,
        fileName: `${project.title}.xlsx`,
        fileType: "xlsx",
        fileSize: exportResult.fileSize,
        projectId: fileData.projectId,
        createdAt: new Date(),
      }
    );

    // Store export record in database
    await prisma.export.create({
      data: {
        user_id: userId,
        project_id: fileData.projectId,
        file_name: `${project.title}.xlsx`,
        file_size: exportResult.fileSize,
        file_type: "xlsx",
        download_url: downloadUrl,
        status: "completed",
      },
    });

    logger.info("XLSX export generated successfully", {
      projectId: fileData.projectId,
      userId,
      fileSize: exportResult.fileSize,
    });

    return {
      downloadUrl,
      fileSize: exportResult.fileSize,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error generating XLSX export", { error });

    // Store failed export record in database
    try {
      const project = await prisma.project.findUnique({
        where: {
          id: fileData.projectId,
        },
      });

      if (project) {
        await prisma.export.create({
          data: {
            user_id: userId,
            project_id: fileData.projectId,
            file_name: `${project.title}.xlsx`,
            file_size: 0,
            file_type: "xlsx",
            download_url: "",
            status: "failed",
          },
        });
      }
    } catch (dbError) {
      logger.error("Error storing failed export record", { dbError });
    }

    throw error;
  }
}

// Generate CSV export
async function generateCSVExport(fileData: any, userId: string) {
  try {
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Validate project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: {
        id: fileData.projectId,
        user_id: userId,
      },
    });

    if (!project) {
      throw new Error("Project not found or access denied");
    }

    // Generate CSV using ExportService
    const exportResult = await ExportService.exportProject(
      fileData.projectId,
      userId,
      {
        format: "csv",
        includeCitations: fileData.includeCitations ?? true,
        citationStyle: fileData.citationStyle || "apa",
        journalTemplate: fileData.journalTemplate || "",
        journalReady: !!fileData.journalTemplate,
      }
    );

    // Upload the file to Supabase Storage
    const { SupabaseStorageService } =
      await import("../../services/supabaseStorageService");

    const { url: downloadUrl } = await SupabaseStorageService.uploadFile(
      exportResult.buffer,
      `${project.title}.csv`,
      "text/csv",
      userId,
      {
        userId,
        fileName: `${project.title}.csv`,
        fileType: "csv",
        fileSize: exportResult.fileSize,
        projectId: fileData.projectId,
        createdAt: new Date(),
      }
    );

    // Store export record in database
    await prisma.export.create({
      data: {
        user_id: userId,
        project_id: fileData.projectId,
        file_name: `${project.title}.csv`,
        file_size: exportResult.fileSize,
        file_type: "csv",
        download_url: downloadUrl,
        status: "completed",
      },
    });

    logger.info("CSV export generated successfully", {
      projectId: fileData.projectId,
      userId,
      fileSize: exportResult.fileSize,
    });

    return {
      downloadUrl,
      fileSize: exportResult.fileSize,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error generating CSV export", { error });

    // Store failed export record in database
    try {
      const project = await prisma.project.findUnique({
        where: {
          id: fileData.projectId,
        },
      });

      if (project) {
        await prisma.export.create({
          data: {
            user_id: userId,
            project_id: fileData.projectId,
            file_name: `${project.title}.csv`,
            file_size: 0,
            file_type: "csv",
            download_url: "",
            status: "failed",
          },
        });
      }
    } catch (dbError) {
      logger.error("Error storing failed export record", { dbError });
    }

    throw error;
  }
}

// Generate PNG export
async function generatePNGExport(fileData: any, userId: string) {
  try {
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Validate project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: {
        id: fileData.projectId,
        user_id: userId,
      },
    });

    if (!project) {
      throw new Error("Project not found or access denied");
    }

    // Generate PNG using ExportService
    const exportResult = await ExportService.exportProject(
      fileData.projectId,
      userId,
      {
        format: "png",
        includeCitations: fileData.includeCitations ?? true,
        citationStyle: fileData.citationStyle || "apa",
      }
    );

    // Upload the file to Supabase Storage
    const { SupabaseStorageService } =
      await import("../../services/supabaseStorageService");

    const { url: downloadUrl } = await SupabaseStorageService.uploadFile(
      exportResult.buffer,
      `${project.title}.png`,
      "image/png",
      userId,
      {
        userId,
        fileName: `${project.title}.png`,
        fileType: "png",
        fileSize: exportResult.fileSize,
        projectId: fileData.projectId,
        createdAt: new Date(),
      }
    );

    // Store export record in database
    await prisma.export.create({
      data: {
        user_id: userId,
        project_id: fileData.projectId,
        file_name: `${project.title}.png`,
        file_size: exportResult.fileSize,
        file_type: "png",
        download_url: downloadUrl,
        status: "completed",
      },
    });

    logger.info("PNG export generated successfully", {
      projectId: fileData.projectId,
      userId,
      fileSize: exportResult.fileSize,
    });

    return {
      downloadUrl,
      fileSize: exportResult.fileSize,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error generating PNG export", { error });

    // Store failed export record in database
    try {
      const project = await prisma.project.findUnique({
        where: {
          id: fileData.projectId,
        },
      });

      if (project) {
        await prisma.export.create({
          data: {
            user_id: userId,
            project_id: fileData.projectId,
            file_name: `${project.title}.png`,
            file_size: 0,
            file_type: "png",
            download_url: "",
            status: "failed",
          },
        });
      }
    } catch (dbError) {
      logger.error("Error storing failed export record", { dbError });
    }

    throw error;
  }
}

// Export config for serverless function
export const config = {
  runtime: "nodejs18.x",
};
