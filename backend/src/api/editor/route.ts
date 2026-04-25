import { prisma } from "../../lib/prisma";
import logger from "../../monitoring/logger";
import { withHybridAuth } from "../../middleware/hybridAuth";
import { EditorService } from "../../services/editorService";
import { ProjectServiceEnhanced } from "../../services/projectServiceEnhanced";

// Get project content
export async function GET(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handleGET)(request);
}

async function handleGET(request: Request & { user?: any }) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use authenticated user ID
    const userId = request.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const project = await EditorService.getProjectContent(projectId, userId);

    return new Response(
      JSON.stringify({
        success: true,
        project: project,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error fetching project content:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Save project content
export async function PUT(request: Request) {
  // Wrap with hybrid authentication (requires write permission for API keys)
  return withHybridAuth(handlePUT)(request);
}

async function handlePUT(request: Request & { user?: any }) {
  try {
    const body = (await request.json()) as {
      projectId: string;
      content: any;
      title?: string;
      wordCount?: number;
    };
    const { projectId, content, title, wordCount } = body;

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use authenticated user ID
    const userId = request.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatedProject = await EditorService.saveProjectContent(
      projectId,
      userId,
      content,
      title,
      wordCount,
    );

    // Track editor activity
    await EditorService.trackEditorActivity(userId, projectId, "edit", {});

    return new Response(
      JSON.stringify({
        success: true,
        project: updatedProject,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error saving project content:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Phase 2: Update project metadata only (when Hocuspocus handles content)
export async function PATCH_METADATA(request: Request) {
  return withHybridAuth(handlePATCH_METADATA)(request);
}

async function handlePATCH_METADATA(request: Request & { user?: any }) {
  try {
    const body = (await request.json()) as {
      projectId: string;
      title?: string;
      wordCount?: number;
      citationStyle?: string;
    };
    const { projectId, ...metadata } = body;

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = request.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatedProject = await EditorService.updateProjectMetadata(
      projectId,
      userId,
      metadata,
    );

    return new Response(
      JSON.stringify({
        success: true,
        project: updatedProject,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error updating project metadata:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get document versions/history
export async function GET_VERSIONS(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handleGET_VERSIONS)(request);
}

async function handleGET_VERSIONS(request: Request & { user?: any }) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use authenticated user ID
    const userId = request.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const versions = await ProjectServiceEnhanced.getProjectDocumentVersions(
      projectId,
      userId,
    );

    return new Response(
      JSON.stringify({
        success: true,
        versions: versions,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error fetching document versions:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Add comment to document
export async function POST_COMMENT(request: Request) {
  // Wrap with hybrid authentication (requires write permission for API keys)
  return withHybridAuth(handlePOST_COMMENT)(request);
}

async function handlePOST_COMMENT(request: Request & { user?: any }) {
  try {
    const body = (await request.json()) as {
      projectId: string;
      content: string;
      position?: any;
    };
    const { projectId, content, position } = body;

    if (!projectId || !content) {
      return new Response(
        JSON.stringify({ error: "Project ID and content are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Use authenticated user ID
    const userId = request.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const comment = await EditorService.addComment(
      projectId,
      userId,
      content,
      position,
    );

    // Track editor activity
    await EditorService.trackEditorActivity(userId, projectId, "comment", {});

    return new Response(
      JSON.stringify({
        success: true,
        comment: comment,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error adding comment:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get comments for document
export async function GET_COMMENTS(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handleGET_COMMENTS)(request);
}

async function handleGET_COMMENTS(request: Request & { user?: any }) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use authenticated user ID
    const userId = request.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const comments = await EditorService.getComments(projectId, userId);

    return new Response(
      JSON.stringify({
        success: true,
        comments: comments,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error fetching comments:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Restore document version
export async function POST_RESTORE_VERSION(request: Request) {
  // Wrap with hybrid authentication (requires write permission for API keys)
  return withHybridAuth(handlePOST_RESTORE_VERSION)(request);
}

async function handlePOST_RESTORE_VERSION(request: Request & { user?: any }) {
  try {
    const body = (await request.json()) as {
      projectId: string;
      versionId: string;
    };
    const { projectId, versionId } = body;

    if (!projectId || !versionId) {
      return new Response(
        JSON.stringify({ error: "Project ID and Version ID are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Use authenticated user ID
    const userId = request.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const restoredProject = await ProjectServiceEnhanced.restoreDocumentVersion(
      projectId,
      versionId,
      userId,
    );

    return new Response(
      JSON.stringify({
        success: true,
        project: restoredProject,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error restoring document version:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get editor settings
export async function GET_SETTINGS(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handleGET_SETTINGS)(request);
}

async function handleGET_SETTINGS(request: Request & { user?: any }) {
  try {
    // Use authenticated user ID
    const userId = request.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const settings = await EditorService.getEditorSettings(userId);

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
    logger.error("Error fetching editor settings:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Update editor settings
export async function PUT_SETTINGS(request: Request) {
  // Wrap with hybrid authentication (requires write permission for API keys)
  return withHybridAuth(handlePUT_SETTINGS)(request);
}

async function handlePUT_SETTINGS(request: Request & { user?: any }) {
  try {
    const body = (await request.json()) as any;

    // Use authenticated user ID
    const userId = request.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const settings = await EditorService.updateEditorSettings(userId, body);

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
    logger.error("Error updating editor settings:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get editor analytics
export async function GET_ANALYTICS(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handleGET_ANALYTICS)(request);
}

async function handleGET_ANALYTICS(request: Request & { user?: any }) {
  try {
    // Use authenticated user ID
    const userId = request.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const analytics = await EditorService.getEditorActivity(userId);

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
    logger.error("Error fetching editor analytics:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Handle beacon draft requests
export async function POST_BEACON_DRAFT(request: Request) {
  // Wrap with hybrid authentication (requires write permission for API keys)
  return withHybridAuth(handlePOST_BEACON_DRAFT)(request);
}

async function handlePOST_BEACON_DRAFT(request: Request & { user?: any }) {
  try {
    const body = (await request.json()) as {
      id: string;
      title: string;
      contentHash: string;
      savedAt: number;
    };
    const { id, title, contentHash, savedAt } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use authenticated user ID
    const userId = request.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log the beacon receipt for analytics/debugging
    logger.info("Received draft beacon", {
      projectId: id,
      userId,
      title,
      contentHash,
      savedAt,
    });

    // For now, we just acknowledge receipt
    // In a full implementation, we might store this info for recovery purposes
    return new Response(
      JSON.stringify({
        success: true,
        message: "Draft beacon received",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error handling draft beacon:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Import document
export async function POST_IMPORT(request: Request) {
  // Wrap with hybrid authentication (requires write permission for API keys)
  return withHybridAuth(handlePOST_IMPORT)(request);
}

async function handlePOST_IMPORT(request: Request & { user?: any }) {
  try {
    const body = (await request.json()) as {
      fileData: {
        title: string;
        content: any;
        fileType: string;
        wordCount?: number;
      };
    };
    const { fileData } = body;

    if (!fileData) {
      return new Response(JSON.stringify({ error: "File data is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use authenticated user ID
    const userId = request.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate file type
    const validTypes = [
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/pdf",
    ];

    if (!validTypes.includes(fileData.fileType)) {
      return new Response(JSON.stringify({ error: "Invalid file type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const importedProject = await EditorService.importDocument(
      userId,
      fileData,
    );

    return new Response(
      JSON.stringify({
        success: true,
        project: importedProject,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error importing document:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Handle editor analytics events
export async function POST_EVENTS(request: Request) {
  // Wrap with hybrid authentication (requires write permission for API keys)
  return withHybridAuth(handlePOST_EVENTS)(request);
}

async function handlePOST_EVENTS(request: Request & { user?: any }) {
  try {
    const body = (await request.json()) as {
      events: any[];
    };
    const { events } = body;

    if (!events || !Array.isArray(events)) {
      return new Response(
        JSON.stringify({ error: "Events array is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Use authenticated user ID
    const userId = request.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Process editor events
    for (const event of events) {
      try {
        // Validate event structure
        if (!event.eventType || !event.projectId) {
          logger.warn("Skipping invalid editor event", { event });
          continue;
        }

        // Track the event using EditorService
        await EditorService.trackEditorEvent(
          userId,
          event.projectId,
          event.eventType,
          event.metadata,
        );
      } catch (eventError: any) {
        logger.error("Error processing editor event", {
          error: eventError,
          event,
        });
        // Continue processing other events even if one fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${events.length} events`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error handling editor events:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
