import { ExportService } from "../../services/exportService";
import logger from "../../monitoring/logger";
import { withHybridAuth } from "../../middleware/hybridAuth";

// Export project
export async function GET(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handleGET)(request);
}

async function handleGET(request: Request & { user?: any }) {
  try {
    console.log("Export request received:", { url: request.url });

    // Add validation for the URL
    try {
      const urlObj = new URL(request.url);
      console.log("Parsed URL object:", {
        origin: urlObj.origin,
        pathname: urlObj.pathname,
        search: urlObj.search,
        searchParams: Object.fromEntries(urlObj.searchParams),
      });

      // Log individual search parameters
      urlObj.searchParams.forEach((value, key) => {
        console.log(`URL Search Param: ${key} = ${value}`);
      });
    } catch (urlParseError) {
      console.error("Failed to parse request URL:", request.url, urlParseError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid request URL",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const formatParam = searchParams.get("format");

    // Fix: Ensure we're getting the format parameter correctly
    const format =
      (formatParam as
        | "pdf"
        | "docx"
        | "txt"
        | "latex"
        | "rtf"
        | "xlsx"
        | "csv"
        | "png"
        | "journal-pdf"
        | "journal-latex"
        | "overleaf") || "pdf";

    const includeCitations = searchParams.get("includeCitations") === "true";
    const includeComments = searchParams.get("includeComments") === "true";
    const citationStyle =
      (searchParams.get("citationStyle") as "apa" | "mla" | "chicago") || "apa";
    const template =
      (searchParams.get("template") as
        | "academic"
        | "publication"
        | "presentation"
        | "custom") || "academic";
    const journalTemplate = searchParams.get("journalTemplate") || "";
    const journalReady = !!journalTemplate; // Set journalReady flag if template is provided

    // Add detailed logging for all parameters
    console.log("Export parameters:", {
      projectId,
      format,
      formatParam, // Log the raw parameter
      formatType: typeof format,
      formatExists: searchParams.has("format"),
      formatValue: formatParam,
      includeCitations,
      includeComments,
      citationStyle,
      template,
      journalTemplate,
      journalReady,
      allParams: Object.fromEntries(searchParams),
    });

    // Use authenticated user ID
    const userId = request.user?.id;

    if (!projectId || !userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Project ID and User ID are required",
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
      "png",
      "journal-pdf",
      "journal-latex",
      "overleaf",
      "google-drive",
      "onedrive",
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

    // Export the project
    const result = await ExportService.exportProject(projectId, userId, {
      format,
      includeCitations,
      includeComments,
      citationStyle,
      template,
      journalTemplate,
      journalReady,
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
    logger.error("Error exporting project:", error);

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
