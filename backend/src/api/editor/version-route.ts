import { prisma } from "../../lib/prisma";
import logger from "../../monitoring/logger";
import { withHybridAuth } from "../../middleware/hybridAuth";
import { EditorService } from "../../services/editorService";

// Create a new document version (separate from save operations)
export async function POST_VERSION(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handlePOST_VERSION)(request);
}

// Restore a document version (replaces current project content with version content)
export async function POST_RESTORE_VERSION(request: Request) {
  // Wrap with hybrid authentication
  return withHybridAuth(handlePOST_RESTORE_VERSION)(request);
}

async function handlePOST_VERSION(request: Request & { user?: any }) {
  try {
    const body = (await request.json()) as {
      projectId: string;
      content: any;
      wordCount?: number;
      force?: boolean;
    };
    const { projectId, content, wordCount, force } = body;

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

    // Check if we should create a new version based on our dual-threshold approach
    // OR if this is a forced version creation (manual save)
    // Note: We avoid prisma.$transaction here to prevent timeout issues
    // Version creation is a single atomic operation that doesn't need a transaction

    // If force is true, skip the threshold check
    const shouldCreate = force
      ? true
      : await EditorService.shouldCreateNewVersion(
          projectId,
          undefined,
          wordCount,
          content,
        );

    if (!shouldCreate) {
      // Return success but indicate no new version was created
      return new Response(
        JSON.stringify({
          success: true,
          message: "No new version created - thresholds not met",
          version: null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Create a new document version (no transaction needed for single create)
    const version = await EditorService.createDocumentVersion(
      projectId,
      userId,
      content,
      wordCount || 0,
    );

    return new Response(
      JSON.stringify({
        success: true,
        version: version,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error creating document version:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get document versions with enhanced information
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

    const versions = await EditorService.getDocumentVersions(projectId, userId);

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

// Restore a document version (replaces current project content with version content)
async function handlePOST_RESTORE_VERSION(request: Request & { user?: any }) {
  try {
    const body = (await request.json()) as {
      projectId: string;
      versionId: string;
    };
    const { projectId, versionId } = body;

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!versionId) {
      return new Response(JSON.stringify({ error: "Version ID is required" }), {
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

    // Find the version to restore
    const version = await prisma.documentVersion.findFirst({
      where: {
        id: versionId,
        project_id: projectId,
      },
    });

    if (!version) {
      return new Response(JSON.stringify({ error: "Version not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update the project with the version's content
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        content: version.content,
        word_count: version.word_count,
        updated_at: new Date(),
      },
      select: {
        id: true,
        content: true,
        word_count: true,
        updated_at: true,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Version restored successfully",
        project: updatedProject,
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
