import { ProjectSettingsService } from "../../services/projectSettingsService";
import { EditorService } from "../../services/editorService";
import { ProjectServiceEnhanced } from "../../services/projectServiceEnhanced";
import { prisma } from "../../lib/prisma";
// Get all projects for a user
export async function GET(request: Request & { user?: any }) {
  return handleGET(request);
}

async function handleGET(request: Request & { user?: any }) {
  try {
    console.log("=== PROJECTS GET ROUTE DEBUG ===");
    console.log("Request user object:", request.user);
    console.log("Request URL:", request.url);

    // Validate and parse the URL
    let searchParams: URLSearchParams;
    try {
      const url = new URL(request.url);
      searchParams = url.searchParams;
    } catch (urlError) {
      console.error("Invalid URL provided:", request.url, urlError);
      // Fallback to empty search params if URL is invalid
      searchParams = new URLSearchParams();
    }

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id || searchParams.get("userId");
    const includeArchived = searchParams.get("includeArchived") === "true";
    const archivedOnly = searchParams.get("archivedOnly") === "true";
    const workspaceIdParam = searchParams.get("workspaceId");

    console.log("Extracted userId:", userId);
    console.log("Include archived:", includeArchived);
    console.log("Archived only:", archivedOnly);

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get projects using the enhanced service
    const projects = await ProjectServiceEnhanced.getUserProjects(
      userId,
      includeArchived,
      archivedOnly,
      workspaceIdParam === "null"
        ? null
        : workspaceIdParam === "not-null"
        ? "not-null"
        : workspaceIdParam || undefined
    );

    console.log("Database query result:", {
      hasData: !!projects,
      dataLength: projects.length,
    });

    // Prevent 304 responses by disabling caching for dynamic routes
    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    };

    return new Response(JSON.stringify({ projects }), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("=== ERROR FETCHING PROJECTS ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", (error as Error).message);
    console.error("Error stack:", (error as Error).stack);
    console.error("Full error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: (error as Error).message,
      stack: (error as Error).stack?.split('\n').slice(0, 5)
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get a specific project by ID
export async function GET_BY_ID(
  request: Request & { user?: any },
  projectId: string
) {
  return handleGET_BY_ID(request, projectId);
}

async function handleGET_BY_ID(
  request: Request & { user?: any },
  projectId: string
) {
  try {
    console.log("=== PROJECT GET BY ID ROUTE DEBUG ===");
    console.log("Request user object:", request.user);
    console.log("Project ID:", projectId);

    // Validate and parse the URL to get query params
    let searchParams: URLSearchParams;
    try {
      console.log("Parsing URL in GET_BY_ID:", request.url);
      const url = new URL(request.url);
      searchParams = url.searchParams;
      console.log("Parsed Search Params:", searchParams.toString());
      console.log("UserId param:", searchParams.get("userId"));
    } catch (urlError) {
      console.error(
        "Invalid URL provided to GET_BY_ID:",
        request.url,
        urlError
      );
      searchParams = new URLSearchParams();
    }

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    // Fallback to query param if middleware failed (matches GET list behavior)
    const userId = request.user?.id || searchParams.get("userId");

    console.log("Final Extracted userId:", userId);
    console.log(
      "Source:",
      request.user?.id
        ? "AuthMiddleware"
        : searchParams.get("userId")
        ? "QueryParam"
        : "None"
    );

    if (!userId) {
      console.error(
        "GET_BY_ID failed: User ID is required but missing specified"
      );
      return new Response(
        JSON.stringify({
          error: "User ID is required",
          debug: {
            hasAuthUser: !!request.user,
            url: request.url,
            queryParams: searchParams.toString(),
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get project using the enhanced service
    const project = await ProjectServiceEnhanced.getProjectById(
      projectId,
      userId
    );

    console.log("Project fetched successfully", {
      projectId,
      userId,
    });

    return new Response(JSON.stringify({ project }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching project by ID:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Create a new project
export async function POST(request: Request & { user?: any }) {
  return handlePOST(request);
}

async function handlePOST(request: Request & { user?: any }) {
  try {
    console.log("=== PROJECT CREATION DEBUG ===");
    console.log(
      "Project creation request received at:",
      new Date().toISOString()
    );
    console.log("Request count check:", Date.now());

    // Parse the request body
    const projectData = (await request.json()) as {
      title: string;
      type: string;
      citation_style: string;
      description?: string;
      content?: any;
      word_count?: number;
      due_date?: Date;
      status?: string;
      template_id?: string;
      workspace_id?: string;
    };

    console.log("Project data received:", projectData);

    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = request.user?.id;
    console.log("User ID from request:", userId);

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create project using the enhanced service
    const project = await ProjectServiceEnhanced.createProject(
      projectData,
      userId
    );

    console.log("Project created successfully:", project.id);
    return new Response(JSON.stringify({ project }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("=== ERROR CREATING PROJECT ===");
    console.error("Error message:", error.message || "Unknown error");
    console.error("Error stack:", error.stack);
    console.error("==================================");

    // Provide more specific error messages based on the error type
    let errorMessage = "Internal server error";
    let statusCode = 500;

    if (error.message && error.message.includes("User not found")) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (
      error.message &&
      error.message.includes("Foreign key constraint violated")
    ) {
      errorMessage =
        "Invalid user ID. Cannot create project for non-existent user.";
      statusCode = 400;
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Update a project
export async function PUT(request: Request & { user?: any }) {
  return handlePUT(request);
}

async function handlePUT(request: Request & { user?: any }) {
  try {
    const body = (await request.json()) as Record<string, any>;
    const { id, ...updateData } = body;

    console.log("Project update request received", {
      projectId: id,
      hasAuth: !!request.user,
      userId: request.user?.id,
    });

    if (!id) {
      console.warn("Project ID is required but not provided");
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;
    if (!userId) {
      console.warn("User ID is required but not provided");
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update project using the enhanced service
    const project = await ProjectServiceEnhanced.updateProject(
      id,
      updateData,
      userId
    );

    return new Response(JSON.stringify({ project }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Delete a project
export async function DELETE(request: Request & { user?: any }) {
  return handleDELETE(request);
}

async function handleDELETE(request: Request & { user?: any }) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("id");

    console.log("Project deletion request received", {
      projectId,
      hasAuth: !!request.user,
      userId: request.user?.id,
    });

    if (!projectId) {
      console.warn("Project ID is required but not provided");
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;
    if (!userId) {
      console.warn("User ID is required but not provided");
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete project using the enhanced service
    const result = await ProjectServiceEnhanced.deleteProject(
      projectId,
      userId
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    // Log the full error stack trace for debugging
    console.error("Full error stack:", (error as Error).stack);

    // Return a more specific error message
    const errorMessage = (error as Error).message || "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Export project
export async function GET_EXPORT(request: Request & { user?: any }) {
  return handleGET_EXPORT(request);
}

async function handleGET_EXPORT(request: Request & { user?: any }) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const format = searchParams.get("format") || "pdf";
    const includeCitations = searchParams.get("includeCitations") === "true";
    const includeComments = searchParams.get("includeComments") === "true";
    const citationStyle =
      (searchParams.get("citationStyle") as "apa" | "mla" | "chicago") || "apa";

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;

    console.log("Project export request received", {
      projectId,
      format,
      userId,
      hasAuth: !!request.user,
    });

    if (!projectId || !userId) {
      console.warn("Project ID and User ID are required for export", {
        projectId,
        userId,
      });
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

    // Validate format - allow all formats supported by ExportService
    const validFormats = [
      "pdf",
      "docx",
      "txt",
      "latex",
      "rtf",
      "journal-pdf",
      "journal-latex",
    ];
    if (!validFormats.includes(format)) {
      console.warn("Invalid export format requested", { format });
      return new Response(
        JSON.stringify({
          success: false,
          message: `Invalid format. Supported formats: ${validFormats.join(
            ", "
          )}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Export project using the enhanced service
    const result = await ProjectServiceEnhanced.exportProject(
      projectId,
      userId,
      {
        format: format as any,
        includeCitations,
        includeComments,
        citationStyle: citationStyle as "apa" | "mla" | "chicago",
      }
    );

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

    console.log("Project exported successfully", {
      projectId,
      format,
      userId,
      fileSize: result.fileSize,
    });

    return new Response(uint8Array, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Error exporting project:", error);

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

// Get project statistics
export async function GET_STATS(request: Request & { user?: any }) {
  return handleGET_STATS(request);
}

async function handleGET_STATS(request: Request & { user?: any }) {
  try {
    console.log("=== PROJECTS STATS ROUTE DEBUG ===");
    console.log("Request user object:", request.user);

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;

    console.log("Extracted userId:", userId);

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get stats using the enhanced service
    const stats = await ProjectServiceEnhanced.getProjectStats(userId);

    console.log("Stats result:", stats);

    return new Response(JSON.stringify({ stats }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching project stats:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Apply AI edit to project content
export async function POST_AI_EDIT(
  request: Request & { user?: any },
  projectId: string
) {
  return handlePOST_AI_EDIT(request, projectId);
}

async function handlePOST_AI_EDIT(
  request: Request & { user?: any },
  projectId: string
) {
  try {
    console.log("Apply AI edit to project request received", {
      projectId,
      hasAuth: !!request.user,
      userId: request.user?.id,
    });

    if (!projectId) {
      console.warn("Project ID is required but not provided");
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse the request body
    const editOptions = (await request.json()) as Record<string, any>;
    console.log("AI edit options received:", editOptions);

    if (!editOptions.text || !editOptions.action) {
      console.warn("Text and action are required for AI edit");
      return new Response(
        JSON.stringify({ error: "Text and action are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;
    if (!userId) {
      console.warn("User ID is required but not provided");
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Apply AI edit using the enhanced service
    const result = await ProjectServiceEnhanced.applyAIEdit(projectId, userId, {
      text: editOptions.text,
      action: editOptions.action,
      context: editOptions.context,
      preferences: editOptions.preferences,
    });

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error applying AI edit:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get AI edit history for project
export async function GET_AI_EDIT_HISTORY(
  request: Request & { user?: any },
  projectId: string
) {
  return handleGET_AI_EDIT_HISTORY(request, projectId);
}

async function handleGET_AI_EDIT_HISTORY(
  request: Request & { user?: any },
  projectId: string
) {
  try {
    console.log("Get AI edit history request received", {
      projectId,
      hasAuth: !!request.user,
      userId: request.user?.id,
    });

    if (!projectId) {
      console.warn("Project ID is required but not provided");
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;
    if (!userId) {
      console.warn("User ID is required but not provided");
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get AI edit history using the enhanced service
    const history = await ProjectServiceEnhanced.getAIEditHistory(
      projectId,
      userId
    );

    return new Response(JSON.stringify({ success: true, history }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting AI edit history:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get collaboration projects (projects where user is a collaborator but not owner)
export async function GET_COLLABORATION(request: Request & { user?: any }) {
  return handleGET_COLLABORATION(request);
}

async function handleGET_COLLABORATION(request: Request & { user?: any }) {
  try {
    console.log("=== PROJECTS COLLABORATION ROUTE DEBUG ===");
    console.log("Request user object:", request.user);

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;

    console.log("Extracted userId:", userId);

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get collaboration projects using the enhanced service
    const projects = await ProjectServiceEnhanced.getCollaborationProjects(
      userId
    );

    console.log("Database query result:", {
      hasData: !!projects,
      dataLength: projects.length,
    });

    return new Response(JSON.stringify({ projects }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching collaboration projects:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get project citations
export async function GET_CITATIONS(
  request: Request & { user?: any },
  projectId: string
) {
  return handleGET_CITATIONS(request, projectId);
}

async function handleGET_CITATIONS(
  request: Request & { user?: any },
  projectId: string
) {
  try {
    console.log("=== PROJECT CITATIONS ROUTE DEBUG ===");
    console.log("Request user object:", request.user);
    console.log("Project ID:", projectId);

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;

    console.log("Extracted userId:", userId);

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get citations using the enhanced service
    const citations = await ProjectServiceEnhanced.getProjectCitations(
      projectId,
      userId
    );

    console.log("Project citations fetched successfully", {
      projectId,
      userId,
    });

    return new Response(JSON.stringify({ citations }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching project citations:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get project plagiarism reports
export async function GET_PLAGIARISM_REPORTS(
  request: Request & { user?: any },
  projectId: string
) {
  return handleGET_PLAGIARISM_REPORTS(request, projectId);
}

async function handleGET_PLAGIARISM_REPORTS(
  request: Request & { user?: any },
  projectId: string
) {
  try {
    console.log("=== PROJECT PLAGIARISM REPORTS ROUTE DEBUG ===");
    console.log("Request user object:", request.user);
    console.log("Project ID:", projectId);

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;

    console.log("Extracted userId:", userId);

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Project plagiarism reports fetched successfully", {
      projectId,
      userId,
    });
  } catch (error: any) {
    console.error("Error fetching project plagiarism reports:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get project document versions
export async function GET_DOCUMENT_VERSIONS(
  request: Request & { user?: any },
  projectId: string
) {
  return handleGET_DOCUMENT_VERSIONS(request, projectId);
}

async function handleGET_DOCUMENT_VERSIONS(
  request: Request & { user?: any },
  projectId: string
) {
  try {
    console.log("=== PROJECT DOCUMENT VERSIONS ROUTE DEBUG ===");
    console.log("Request user object:", request.user);
    console.log("Project ID:", projectId);

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;

    console.log("Extracted userId:", userId);

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get document versions using the enhanced service
    const versions = await ProjectServiceEnhanced.getProjectDocumentVersions(
      projectId,
      userId
    );

    console.log("Project document versions fetched successfully", {
      projectId,
      userId,
    });

    return new Response(JSON.stringify({ versions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching project document versions:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Restore document version
export async function POST_RESTORE_VERSION(
  request: Request & { user?: any },
  projectId: string
) {
  return handlePOST_RESTORE_VERSION(request, projectId);
}

async function handlePOST_RESTORE_VERSION(
  request: Request & { user?: any },
  projectId: string
) {
  try {
    // Parse the request body
    const body = (await request.json()) as {
      versionId: string;
    };

    console.log("Restore document version request received", {
      projectId,
      versionId: body.versionId,
      hasAuth: !!request.user,
      userId: request.user?.id,
    });

    if (!projectId) {
      console.warn("Project ID is required but not provided");
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!body.versionId) {
      console.warn("Version ID is required");
      return new Response(JSON.stringify({ error: "Version ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;
    if (!userId) {
      console.warn("User ID is required but not provided");
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Restore document version using the enhanced service
    const result = await ProjectServiceEnhanced.restoreDocumentVersion(
      projectId,
      body.versionId,
      userId
    );

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error restoring document version:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get user project settings
export async function GET_SETTINGS(request: Request & { user?: any }) {
  return handleGET_SETTINGS(request);
}

async function handleGET_SETTINGS(request: Request & { user?: any }) {
  try {
    console.log("=== PROJECT SETTINGS GET ROUTE DEBUG ===");
    console.log("Request user object:", request.user);

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;

    console.log("Extracted userId:", userId);

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get project settings using the settings service
    const settings = await ProjectSettingsService.getUserProjectSettings(
      userId
    );

    console.log("Project settings fetched successfully", { userId });

    return new Response(JSON.stringify({ settings }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching project settings:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Update user project settings
export async function PUT_SETTINGS(request: Request & { user?: any }) {
  return handlePUT_SETTINGS(request);
}

async function handlePUT_SETTINGS(request: Request & { user?: any }) {
  try {
    // Parse the request body
    const settingsData = (await request.json()) as Record<string, any>;
    console.log("Project settings update request received", {
      settingsData,
      hasAuth: !!request.user,
      userId: request.user?.id,
    });

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;
    if (!userId) {
      console.warn("User ID is required but not provided");
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update project settings using the settings service
    const settings = await ProjectSettingsService.updateUserProjectSettings(
      userId,
      settingsData
    );

    return new Response(JSON.stringify({ settings }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating project settings:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Reset user project settings to defaults
export async function POST_RESET_SETTINGS(request: Request & { user?: any }) {
  return handlePOST_RESET_SETTINGS(request);
}

async function handlePOST_RESET_SETTINGS(request: Request & { user?: any }) {
  try {
    console.log("Project settings reset request received", {
      hasAuth: !!request.user,
      userId: request.user?.id,
    });

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;
    if (!userId) {
      console.warn("User ID is required but not provided");
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Reset project settings using the settings service
    const settings = await ProjectSettingsService.resetUserProjectSettings(
      userId
    );

    return new Response(JSON.stringify({ settings }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error resetting project settings:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Import a document
export async function POST_IMPORT(request: Request & { user?: any }) {
  return handlePOST_IMPORT(request);
}

async function handlePOST_IMPORT(request: Request & { user?: any }) {
  try {
    // Parse the request body
    const fileData = (await request.json()) as {
      title: string;
      content: any;
      fileType: string;
      wordCount?: number;
    };

    console.log("Document import request received", {
      fileData,
      hasAuth: !!request.user,
      userId: request.user?.id,
    });

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;
    if (!userId) {
      console.warn("User ID is required but not provided");
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Import document using the editor service
    const project = await EditorService.importDocument(userId, fileData);

    return new Response(JSON.stringify({ project }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error importing document:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get share settings for a project
export async function GET_SHARE_SETTINGS(
  request: Request & { user?: any },
  projectId: string
) {
  return handleGET_SHARE_SETTINGS(request, projectId);
}

async function handleGET_SHARE_SETTINGS(
  request: Request & { user?: any },
  projectId: string
) {
  try {
    console.log("=== PROJECT SHARE SETTINGS GET ROUTE DEBUG ===");
    console.log("Request user object:", request.user);
    console.log("Project ID:", projectId);

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;

    console.log("Extracted userId:", userId);

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has access to this project (owner or collaborator)
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { user_id: userId }, // User is the owner
          { collaborators: { some: { user_id: userId } } }, // User is a collaborator
        ],
      },
    });

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found or access denied" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get share settings from the database
    let shareSettings = await prisma.documentShareSettings.findUnique({
      where: { project_id: projectId },
    });

    // If no share settings exist, create default settings
    if (!shareSettings) {
      shareSettings = await prisma.documentShareSettings.create({
        data: {
          project_id: projectId,
          link_sharing_enabled: true,
          link_permission: "view",
          require_sign_in: true,
          allow_download: true,
          notify_on_view: false,
        },
      });
    }

    console.log("Project share settings fetched successfully", {
      projectId,
      userId,
    });

    return new Response(JSON.stringify({ settings: shareSettings }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching project share settings:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Update share settings for a project
export async function POST_SHARE_SETTINGS(
  request: Request & { user?: any },
  projectId: string
) {
  return handlePOST_SHARE_SETTINGS(request, projectId);
}

async function handlePOST_SHARE_SETTINGS(
  request: Request & { user?: any },
  projectId: string
) {
  try {
    console.log("=== PROJECT SHARE SETTINGS UPDATE ROUTE DEBUG ===");
    console.log("Request user object:", request.user);
    console.log("Project ID:", projectId);

    // Parse the request body
    const settingsData = (await request.json()) as Record<string, any>;
    console.log("Share settings update request received:", {
      settingsData,
      hasAuth: !!request.user,
      userId: request.user?.id,
    });

    // Use authenticated user ID - now from request.user.id (set by Express auth middleware)
    const userId = request.user?.id;
    if (!userId) {
      console.warn("User ID is required but not provided");
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has access to this project (owner or collaborator)
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { user_id: userId }, // User is the owner
          { collaborators: { some: { user_id: userId } } }, // User is a collaborator
        ],
      },
    });

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found or access denied" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update or create share settings in the database
    const updatedShareSettings = await prisma.documentShareSettings.upsert({
      where: { project_id: projectId },
      update: {
        link_sharing_enabled: settingsData.linkSharingEnabled,
        link_permission: settingsData.linkPermission,
        require_sign_in: settingsData.requireSignIn,
        allow_download: settingsData.allowDownload,
        notify_on_view: settingsData.notifyOnView,
        expiration: settingsData.expiration || null,
      },
      create: {
        project_id: projectId,
        link_sharing_enabled: settingsData.linkSharingEnabled ?? true,
        link_permission: settingsData.linkPermission ?? "view",
        require_sign_in: settingsData.requireSignIn ?? true,
        allow_download: settingsData.allowDownload ?? true,
        notify_on_view: settingsData.notifyOnView ?? false,
      },
    });

    console.log("Project share settings updated successfully", {
      projectId,
      userId,
    });

    return new Response(JSON.stringify({ settings: updatedShareSettings }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error updating project share settings:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
