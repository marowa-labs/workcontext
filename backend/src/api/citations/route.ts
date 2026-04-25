import { prisma } from "../../lib/prisma";
import logger from "../../monitoring/logger";
import { withHybridAuth } from "../../middleware/hybridAuth";
import { CitationService } from "../../services/citationService";
import { CrossRefService } from "../../services/crossRefService";
import { CitationAccessControl } from "../../services/citationAccessControl";

// Helper function to convert Headers to object
function getHeadersAsObject(headers: Headers | any): Record<string, string> {
  const headersObj: Record<string, string> = {};

  // Try the forEach approach which is more widely supported
  if (headers && typeof headers.forEach === "function") {
    headers.forEach((value: string, key: string) => {
      headersObj[key] = value;
    });
  } else if (headers && typeof headers.get === "function") {
    // For objects that only have .get() method
    // We can't enumerate all headers in this case, so just get common ones
    const commonHeaders = ["authorization", "content-type", "user-agent"];
    for (const header of commonHeaders) {
      const value = headers.get(header);
      if (value) {
        headersObj[header] = value;
      }
    }
  } else if (headers) {
    // For plain objects
    Object.assign(headersObj, headers);
  }

  return headersObj;
}

// Get all citations for a project
export async function GET(request: Request) {
  // Log the incoming request for debugging
  logger.info("GET /api/citations called", {
    url: request.url,
    headers: getHeadersAsObject(request.headers),
  });

  // Wrap with hybrid authentication
  return withHybridAuth(handleGET)(request);
}

async function handleGET(request: Request & { auth?: any }) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Log authentication info
    logger.info("Citation GET request auth info", {
      userId: request.auth?.userId || (request as any).user?.id,
      authType: request.auth?.type,
      hasAuth: !!request.auth,
      url: request.url,
      projectId,
    });

    if (!projectId) {
      logger.warn("Project ID is required", {
        url: request.url,
      });
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use authenticated user ID
    // Check for user ID from hybrid server context (auth.userId) or regular auth context (user.id)
    const userId = request.auth?.userId || (request as any).user?.id;

    if (!userId) {
      logger.warn("User ID is required", {
        auth: request.auth,
        hasUserContext: !!(request as any).user?.id,
        url: request.url,
      });
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    logger.info("Fetching citations for user and project", {
      userId,
      projectId,
      search,
      type,
      sortBy,
      sortOrder,
    });

    const citations = await CitationService.getProjectCitations(
      projectId,
      userId,
      {
        search: search || undefined,
        type: type || undefined,
        sortBy,
        sortOrder,
      },
    );

    logger.info("Successfully fetched citations", {
      count: citations.length,
      userId,
      projectId,
    });

    // This should work fine even with an empty array
    return new Response(
      JSON.stringify({
        success: true,
        citations: citations,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error fetching citations:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url,
      projectId: new URL(request.url).searchParams.get("projectId"),
    });
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Create a new citation
export async function POST(request: Request) {
  // Wrap with hybrid authentication (requires write permission for API keys)
  return withHybridAuth(handlePOST)(request);
}

async function handlePOST(request: Request & { auth?: any }) {
  try {
    const body = await request.json();
    const { projectId, ...citationData } = body;

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use authenticated user ID
    // Check for user ID from hybrid server context (auth.userId) or regular auth context (user.id)
    const userId = request.auth?.userId || (request as any).user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Track citation creation activity
    await CitationService.trackCitationActivity(userId, projectId, "created", {
      citationType: citationData.type,
    });

    const citation = await CitationService.createCitation(
      projectId,
      userId,
      citationData,
    );

    // Send notification for citation creation
    await CitationService.sendCitationNotification(
      userId,
      projectId,
      "created",
      citation,
    );

    return new Response(
      JSON.stringify({
        success: true,
        citation: citation,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error creating citation:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Update a citation
export async function PUT(request: Request) {
  // Wrap with hybrid authentication (requires write permission for API keys)
  return withHybridAuth(handlePUT)(request);
}

async function handlePUT(request: Request & { auth?: any }) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Citation ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Use authenticated user ID
    // Check for user ID from hybrid server context (auth.userId) or regular auth context (user.id)
    const userId = request.auth?.userId || (request as any).user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get existing citation to track changes
    const existingCitation = await prisma.citation.findUnique({
      where: { id },
    });

    const citation = await CitationService.updateCitation(
      id,
      userId,
      updateData,
    );

    // Track citation update activity
    await CitationService.trackCitationActivity(
      userId,
      existingCitation?.project_id ?? null,
      "updated",
      {
        citationId: id,
        changes: Object.keys(updateData),
      },
    );

    // Send notification for citation update
    await CitationService.sendCitationNotification(
      userId,
      existingCitation?.project_id ?? null,
      "updated",
      citation,
    );

    return new Response(
      JSON.stringify({
        success: true,
        citation: citation,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error updating citation:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Delete a citation
export async function DELETE(request: Request) {
  // Wrap with hybrid authentication (requires write permission for API keys)
  return withHybridAuth(handleDELETE)(request);
}

async function handleDELETE(request: Request & { auth?: any }) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Citation ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Use authenticated user ID
    // Check for user ID from hybrid server context (auth.userId) or regular auth context (user.id)
    const userId = request.auth?.userId || (request as any).user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get citation before deletion for tracking
    const citation = await prisma.citation.findUnique({
      where: { id },
    });

    await CitationService.deleteCitation(id, userId);

    // Track citation deletion activity
    await CitationService.trackCitationActivity(
      userId,
      citation?.project_id ?? null,
      "deleted",
      {
        citationId: id,
      },
    );

    // Send notification for citation deletion
    await CitationService.sendCitationNotification(
      userId,
      citation?.project_id ?? null,
      "deleted",
      citation,
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Citation deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error deleting citation:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Import citation by DOI
export async function IMPORT_DOI(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handleIMPORT_DOI)(request);
}

async function handleIMPORT_DOI(request: Request & { auth?: any }) {
  try {
    const body = await request.json();
    const { doi } = body;

    if (!doi) {
      return new Response(JSON.stringify({ error: "DOI is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use authenticated user ID
    const userId = request.auth?.userId || (request as any).user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch citation data from CrossRef
    const citationData = await CrossRefService.getWorkByDOI(doi);

    // Track citation import activity
    await CitationService.trackCitationActivity(userId, null, "imported", {
      doi: doi,
    });

    return new Response(
      JSON.stringify({
        success: true,
        citation: citationData,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error importing citation by DOI:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Search external databases for citations
export async function SEARCH_EXTERNAL(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handleSEARCH_EXTERNAL)(request);
}

async function handleSEARCH_EXTERNAL(request: Request & { auth?: any }) {
  try {
    const body = await request.json();
    const { query, type } = body;

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Search query is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Use authenticated user ID
    const userId = request.auth?.userId || (request as any).user?.id;

    const results = await CitationService.searchExternal(query, type);

    // Track search activity
    await CitationService.trackCitationActivity(userId, null, "searched", {
      query,
      type,
      resultCount: results.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        results: results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error searching external databases:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get user citation settings
export async function GET_SETTINGS(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handleGET_SETTINGS)(request);
}

async function handleGET_SETTINGS(request: Request & { auth?: any }) {
  try {
    // Use authenticated user ID
    const userId = request.auth?.userId || (request as any).user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const settings = await CitationService.getUserCitationSettings(userId);

    return new Response(
      JSON.stringify({
        success: true,
        settings: settings,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error fetching citation settings:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Update user citation settings
export async function PUT_SETTINGS(request: Request) {
  // Wrap with hybrid authentication (requires write permission for API keys)
  return withHybridAuth(handlePUT_SETTINGS)(request);
}

async function handlePUT_SETTINGS(request: Request & { auth?: any }) {
  try {
    const body = await request.json();
    const { settings } = body;

    // Use authenticated user ID
    const userId = request.auth?.userId || (request as any).user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatedSettings = await CitationService.updateUserCitationSettings(
      userId,
      settings,
    );

    return new Response(
      JSON.stringify({
        success: true,
        settings: updatedSettings,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error updating citation settings:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get real-time citation trends
export async function GET_TRENDS(request: Request) {
  // No authentication required for public trends data
  return handleGET_TRENDS(request);
}

async function handleGET_TRENDS(request: Request) {
  try {
    const trends = await CitationService.getRealTimeCitationTrends();

    return new Response(
      JSON.stringify({
        success: true,
        trends: trends,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error fetching real-time citation trends:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get citation analytics
export async function GET_ANALYTICS(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handleGET_ANALYTICS)(request);
}
async function handleGET_ANALYTICS(request: Request & { auth?: any }) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all_time"; // all_time, 30d, 90d, 1y

    // Use authenticated user ID
    const userId = request.auth?.userId || (request as any).user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const analytics = await CitationService.getUserCitationAnalytics(
      userId,
      period,
    );

    return new Response(
      JSON.stringify({
        success: true,
        analytics: analytics,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error fetching citation analytics:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Share a citation
export async function POST_SHARE(request: Request) {
  // Wrap with hybrid authentication (requires write permission for API keys)
  return withHybridAuth(handlePOST_SHARE)(request);
}

async function handlePOST_SHARE(request: Request & { auth?: any }) {
  try {
    const body = await request.json();
    const { citationId, sharedToUserId, permission } = body;

    if (!citationId || !sharedToUserId) {
      return new Response(
        JSON.stringify({
          error: "Citation ID and shared user ID are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Use authenticated user ID (the user sharing the citation)
    const userId = request.auth?.userId || (request as any).user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const share = await CitationService.shareCitation(
      userId,
      sharedToUserId,
      citationId,
      permission,
    );

    // Track citation share activity
    await CitationService.trackCitationActivity(userId, null, "shared", {
      citationId,
      sharedToUserId,
      permission,
    });

    // Send notification for citation share
    await CitationService.sendCitationNotification(
      userId,
      null,
      "shared",
      { id: citationId },
      sharedToUserId,
    );

    return new Response(
      JSON.stringify({
        success: true,
        share: share,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error sharing citation:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get shared citations
export async function GET_SHARED(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handleGET_SHARED)(request);
}

async function handleGET_SHARED(request: Request & { auth?: any }) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "received"; // shared, received

    // Use authenticated user ID
    const userId = request.auth?.userId || (request as any).user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sharedCitations = await CitationService.getSharedCitations(
      userId,
      type,
    );

    return new Response(
      JSON.stringify({
        success: true,
        sharedCitations: sharedCitations,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error fetching shared citations:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Generate bibliography for citations
export async function POST_BIBLIOGRAPHY(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handlePOST_BIBLIOGRAPHY)(request);
}

async function handlePOST_BIBLIOGRAPHY(request: Request & { auth?: any }) {
  try {
    // Use authenticated user ID
    const userId = request.auth?.userId || (request as any).user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { citations, style } = body;

    if (!citations || !Array.isArray(citations)) {
      return new Response(
        JSON.stringify({ error: "Citations array is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // All users can now use any citation format - REMOVED ACCESS CONTROL CHECK

    const bibliography = CitationService.generateBibliography(
      citations,
      style,
      userId,
    );

    return new Response(
      JSON.stringify({
        success: true,
        bibliography: bibliography,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error generating bibliography:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Import citation from library
export async function POST_IMPORT_LIBRARY(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handlePOST_IMPORT_LIBRARY)(request);
}

async function handlePOST_IMPORT_LIBRARY(request: Request & { auth?: any }) {
  try {
    const body = await request.json();
    const { projectId, savedPaperId } = body;

    if (!projectId || !savedPaperId) {
      return new Response(
        JSON.stringify({ error: "Project ID and Saved Paper ID are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Use authenticated user ID
    const userId = request.auth?.userId || (request as any).user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const citation = await CitationService.importFromLibrary(
      projectId,
      savedPaperId,
      userId,
    );

    // Track activity
    await CitationService.trackCitationActivity(userId, projectId, "imported", {
      source: "library",
      citationId: citation.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        citation: citation,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error importing citation from library:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Export citations
export async function GET_EXPORT(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handleGET_EXPORT)(request);
}

async function handleGET_EXPORT(request: Request & { auth?: any }) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const format = searchParams.get("format") as "bibtex" | "ris";

    if (!projectId || !format) {
      return new Response(
        JSON.stringify({ error: "Project ID and format are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!["bibtex", "ris"].includes(format)) {
      return new Response(
        JSON.stringify({ error: "Invalid format. Use 'bibtex' or 'ris'" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Use authenticated user ID
    const userId = request.auth?.userId || (request as any).user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const exportData = await CitationService.exportCitations(
      projectId,
      userId,
      format,
    );

    return new Response(exportData, {
      status: 200,
      headers: {
        "Content-Type":
          format === "bibtex"
            ? "application/x-bibtex"
            : "application/x-research-info-systems",
        "Content-Disposition": `attachment; filename="citations.${format === "bibtex" ? "bib" : "ris"}"`,
      },
    });
  } catch (error: any) {
    logger.error("Error exporting citations:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get citation access for a project
export async function GET_CITATION_ACCESS(
  request: Request & { auth?: any },
  projectId: string,
) {
  return handleGET_CITATION_ACCESS(request, projectId);
}

async function handleGET_CITATION_ACCESS(
  request: Request & { auth?: any },
  projectId: string,
) {
  try {
    logger.info("GET /api/citations/access/:projectId called", {
      projectId,
      userId: request.auth?.userId,
    });

    const userId = request.auth?.userId;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has access to the project (is owner or collaborator)
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
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
    });

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found or access denied" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // Determine the user's access level in the project
    let accessLevel: "viewer" | "commenter" | "editor" | "admin" = "viewer";

    // Check if user is the owner
    if (project.user_id === userId) {
      accessLevel = "admin";
    } else {
      // Check collaborator permissions
      const collaborator = await prisma.CollaboratorPresence.findFirst({
        where: {
          project_id: projectId,
          user_id: userId,
        },
      });

      if (collaborator) {
        // Map collaborator permission to access level
        switch (collaborator.permission) {
          case "edit":
            accessLevel = "editor";
            break;
          case "comment":
            accessLevel = "commenter";
            break;
          case "view":
          default:
            accessLevel = "viewer";
            break;
        }
      }
    }

    // Define permissions based on access level
    const permissions = {
      canView: true, // All users can view citations
      canEdit: accessLevel === "editor" || accessLevel === "admin",
      canDelete: accessLevel === "editor" || accessLevel === "admin",
      canAdd: accessLevel === "editor" || accessLevel === "admin",
    };

    // Return the access information
    const accessInfo = {
      userId,
      projectId,
      accessLevel,
      permissions,
    };

    logger.info("Citation access info returned successfully", {
      userId,
      projectId,
      accessLevel,
    });

    return new Response(JSON.stringify({ access: accessInfo }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error("Error getting citation access:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
