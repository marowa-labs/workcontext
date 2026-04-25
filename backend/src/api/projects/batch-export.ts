import { BatchExportService } from "../../services/batchExportService";
import logger from "../../monitoring/logger";
import { withHybridAuth } from "../../middleware/hybridAuth";

// Batch export projects
export async function POST(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handlePOST)(request);
}

async function handlePOST(request: Request & { user?: any }) {
  try {
    // Handle both Express (body already parsed) and Fetch API (body needs parsing) cases
    let body: any;
    if ("body" in request && request.body) {
      // Express case - body is already parsed
      body = request.body;
    } else {
      // Fetch API case - body needs to be parsed
      body = await request.json();
    }

    const { projectIds, format } = body;
    const includeCitations = body.includeCitations !== false; // Default to true
    const includeComments = body.includeComments || false;
    const citationStyle = body.citationStyle || "apa";
    const template = body.template || "academic";
    const journalTemplate = body.journalTemplate || "";

    // Use authenticated user ID
    const userId = request.user?.id;

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Project IDs are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "User ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate format
    const validFormats = [
      "pdf",
      "docx",
      "txt",
      "latex",
      "rtf",
      "xlsx",
      "csv",
      "zip",
    ];
    if (!validFormats.includes(format)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Invalid format. Supported formats: ${validFormats.join(", ")}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Batch export the projects
    const result = await BatchExportService.exportProjects(projectIds, userId, {
      format,
      includeCitations,
      includeComments,
      citationStyle,
      template,
      journalTemplate,
      journalReady: !!journalTemplate, // Enable journal-ready formatting if template is selected
    });

    // Set appropriate headers for file download
    const headers = new Headers();
    headers.set("Content-Type", result.mimeType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );
    headers.set("Content-Length", result.fileSize.toString());

    // Convert Buffer to Uint8Array for Response
    const uint8Array = new Uint8Array(result.buffer);

    return new Response(uint8Array, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    logger.error("Error batch exporting projects:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
