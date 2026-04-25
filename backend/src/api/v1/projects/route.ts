import { prisma } from "../../../lib/prisma";
import logger from "../../../monitoring/logger";
import { SubscriptionService } from "../../../services/subscriptionService";
import { ProjectServiceEnhanced } from "../../../services/projectServiceEnhanced";

// Get all projects for the authenticated user
export async function GET(request: any) {
  try {
    const userId = request.auth?.userId;
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Invalid or missing authentication token",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check if user has API access permission
    const permissionCheck = await SubscriptionService.canPerformAction(
      userId,
      "access_api",
    );

    if (!permissionCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: permissionCheck.reason,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const archived = searchParams.get("archived") === "true";

    const projects = await prisma.project.findMany({
      where: {
        user_id: userId,
        status: archived ? "archived" : { not: "archived" },
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        citation_style: true,
        word_count: true,
        due_date: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    // Transform the data to match the API documentation format
    const formattedProjects = projects.map((project: any) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      type: project.type,
      citationStyle: project.citation_style,
      wordCount: project.word_count,
      dueDate: project.due_date,
      status: project.status,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    }));

    return new Response(
      JSON.stringify({
        projects: formattedProjects,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error fetching projects:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to fetch projects",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Get a specific project by ID
export async function GET_BY_ID(request: any, projectId: string) {
  try {
    const userId = request.auth?.userId;
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Invalid or missing authentication token",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check if user has API access permission
    const permissionCheck = await SubscriptionService.canPerformAction(
      userId,
      "access_api",
    );

    if (!permissionCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: permissionCheck.reason,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        user_id: userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        citation_style: true,
        word_count: true,
        due_date: true,
        status: true,
        content: true,
        created_at: true,
        updated_at: true,
        collaborators: {
          select: {
            id: true,
            permission: true,
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
          },
        },
        citations: {
          select: {
            id: true,
            type: true,
            title: true,
            authors: true,
            year: true,
            journal: true,
            created_at: true,
          },
        },
        document_versions: {
          select: {
            id: true,
            version: true,
            created_at: true,
          },
        },
        ai_generated_images: {
          select: {
            id: true,
            prompt: true,
            image_url: true,
            created_at: true,
          },
        },
        offline_documents: {
          select: {
            id: true,
            title: true,
            word_count: true,
            last_modified: true,
          },
        },
      },
    });

    if (!project) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Project not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Transform the data to match the API documentation format
    const formattedProject = {
      id: project.id,
      title: project.title,
      description: project.description,
      type: project.type,
      citationStyle: project.citation_style,
      wordCount: project.word_count,
      dueDate: project.due_date,
      status: project.status,
      content: project.content,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      collaborators: project.collaborators.map((collaborator: any) => ({
        id: collaborator.id,
        permission: collaborator.permission,
        user: {
          id: collaborator.user.id,
          fullName: collaborator.user.full_name,
          email: collaborator.user.email,
        },
      })),
      citations: project.citations.map((citation: any) => ({
        id: citation.id,
        type: citation.type,
        title: citation.title,
        authors: citation.authors,
        year: citation.year,
        journal: citation.journal,
        createdAt: citation.created_at,
      })),
      documentVersions: project.document_versions.map((version: any) => ({
        id: version.id,
        version: version.version,
        createdAt: version.created_at,
      })),
      aiGeneratedImages: project.ai_generated_images.map((image: any) => ({
        id: image.id,
        prompt: image.prompt,
        imageUrl: image.image_url,
        createdAt: image.created_at,
      })),
      offlineDocuments: project.offline_documents.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        wordCount: doc.word_count,
        lastModified: doc.last_modified,
      })),
    };

    return new Response(JSON.stringify(formattedProject), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error("Error fetching project:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to fetch project",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Create a new project
export async function POST(request: any) {
  try {
    const userId = request.auth?.userId;
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Invalid or missing authentication token",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check if user has API access permission
    const permissionCheck = await SubscriptionService.canPerformAction(
      userId,
      "access_api",
    );

    if (!permissionCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: permissionCheck.reason,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      citationStyle,
      dueDate,
      status,
      content,
    } = body;

    // Validate required fields
    if (!title) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Title is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Create the project using the enhanced service
    const project = await ProjectServiceEnhanced.createProject(
      {
        title,
        description,
        type,
        citation_style: citationStyle,
        due_date: dueDate,
        status,
        content,
      },
      userId,
    );

    // Transform the data to match the API documentation format
    const formattedProject = {
      id: project.id,
      title: project.title,
      description: project.description,
      type: project.type,
      citationStyle: project.citation_style,
      wordCount: project.word_count,
      dueDate: project.due_date,
      status: project.status,
      content: project.content,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    };

    return new Response(JSON.stringify(formattedProject), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error("Error creating project:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to create project",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Update an existing project
export async function PUT(request: any, projectId: string) {
  try {
    const userId = request.auth?.userId;
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Invalid or missing authentication token",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check if user has API access permission
    const permissionCheck = await SubscriptionService.canPerformAction(
      userId,
      "access_api",
    );

    if (!permissionCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: permissionCheck.reason,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      citationStyle,
      dueDate,
      status,
      content,
    } = body;

    // Update the project using the enhanced service
    const project = await ProjectServiceEnhanced.updateProject(
      projectId,
      {
        title,
        description,
        type,
        citation_style: citationStyle,
        due_date: dueDate,
        status,
        content,
      },
      userId,
    );

    if (!project) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Project not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Transform the data to match the API documentation format
    const formattedProject = {
      id: project.id,
      title: project.title,
      description: project.description,
      type: project.type,
      citationStyle: project.citation_style,
      wordCount: project.word_count,
      dueDate: project.due_date,
      status: project.status,
      content: project.content,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    };

    return new Response(JSON.stringify(formattedProject), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error("Error updating project:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to update project",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Delete a project
export async function DELETE(request: any, projectId: string) {
  try {
    const userId = request.auth?.userId;
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Invalid or missing authentication token",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check if user has API access permission
    const permissionCheck = await SubscriptionService.canPerformAction(
      userId,
      "access_api",
    );

    if (!permissionCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: permissionCheck.reason,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Delete the project using the enhanced service
    const result = await ProjectServiceEnhanced.deleteProject(
      projectId,
      userId,
    );

    if (!result) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Project not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        message: "Project deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    logger.error("Error deleting project:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to delete project",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
