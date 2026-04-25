import { getSupabaseClient } from "../../../lib/supabase/client";
import { prisma } from "../../../lib/prisma";
import { ExportService } from "../../../services/exportService";
import logger from "../../../monitoring/logger";

// Export user data
export async function POST(request: Request) {
  try {
    // Get user from authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify the token with Supabase
    const supabase = await getSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { format, include } = body;

    // Log the export request
    logger.info("User data export request received", {
      userId: user.id,
      format,
      include,
    });

    // Get user data based on include options
    const userData: any = {
      exportedAt: new Date().toISOString(),
    };

    if (include.projects !== false) {
      userData.projects = await prisma.project.findMany({
        where: { user_id: user.id },
        include: {
          document_versions: true,
          citations: true,
          collaborators: true,
          footnotes: true,
          exports: true,
          share_settings: true,
        },
      });
    }

    if (include.citations !== false) {
      userData.citations = await prisma.citation.findMany({
        where: { project: { user_id: user.id } },
      });
    }

    if (include.comments !== false) {
      userData.comments = await prisma.comment.findMany({
        where: { project: { user_id: user.id } },
      });
    }

    if (include.activityHistory !== false) {
      userData.activityHistory = await prisma.activityLog.findMany({
        where: { user_id: user.id },
      });
    }

    if (include.deletedItems !== false) {
      userData.deletedItems = await prisma.recycledItem.findMany({
        where: { user_id: user.id },
      });
    }

    // Get user profile
    userData.user = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        created_at: true,
        institution: true,
        location: true,
        bio: true,
      },
    });

    // Handle different export formats
    if (format && format !== "json") {
      // Use ExportService to handle specific format exports
      try {
        let result;
        switch (format) {
          case "csv":
            // Convert user data to CSV format
            const csvContent = ExportService.convertToCSV(userData);
            const csvBuffer = Buffer.from(csvContent, "utf-8");

            return new Response(csvBuffer, {
              status: 200,
              headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename=user-data-${user.id}.csv`,
              },
            });

          case "zip":
            // Create a ZIP archive of user data
            const zipBuffer = await ExportService.createZipArchive(userData);

            return new Response(zipBuffer as any, {
              // Type assertion to allow Buffer for Response
              status: 200,
              headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename=user-data-${user.id}.zip`,
              },
            });

          default:
            return new Response(
              JSON.stringify({
                error: `Unsupported export format: ${format}`,
              }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              }
            );
        }
      } catch (exportError: any) {
        logger.error("Error in format-specific export:", exportError);
        return new Response(
          JSON.stringify({
            error: `Failed to export in ${format} format: ${exportError.message}`,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // Default to JSON format
      return new Response(
        JSON.stringify({
          success: true,
          data: userData,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error) {
    console.error("Error exporting user data:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
