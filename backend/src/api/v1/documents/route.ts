import { prisma } from "../../../lib/prisma";
import logger from "../../../monitoring/logger";
import { SubscriptionService } from "../../../services/subscriptionService";

// Get all documents for a project
export async function GET(request: any, projectId: string) {
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
        }
      );
    }

    // Check if user has API access permission
    const permissionCheck = await SubscriptionService.canPerformAction(
      userId,
      "access_api"
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
        }
      );
    }

    // Check if project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        user_id: userId,
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
        }
      );
    }

    // Get all document versions for the project
    const documentVersions = await prisma.documentVersion.findMany({
      where: {
        project_id: projectId,
      },
      select: {
        id: true,
        version: true,
        content: true,
        created_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Transform the data to match the API documentation format
    const formattedDocuments = documentVersions.map((doc: any) => ({
      id: doc.id,
      version: doc.version,
      content: doc.content,
      createdAt: doc.created_at,
    }));

    return new Response(
      JSON.stringify({
        documents: formattedDocuments,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    logger.error("Error fetching documents:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to fetch documents",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Get a specific document by ID
export async function GET_BY_ID(request: any, documentId: string) {
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
        }
      );
    }

    // Check if user has API access permission
    const permissionCheck = await SubscriptionService.canPerformAction(
      userId,
      "access_api"
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
        }
      );
    }

    // Get the document version
    const document = await prisma.documentVersion.findUnique({
      where: {
        id: documentId,
      },
      select: {
        id: true,
        project_id: true,
        version: true,
        content: true,
        created_at: true,
        project: {
          select: {
            user_id: true,
          },
        },
      },
    });

    if (!document) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Document not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if the document belongs to a project owned by the user
    if (document.project.user_id !== userId) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Access denied",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Transform the data to match the API documentation format
    const formattedDocument = {
      id: document.id,
      version: document.version,
      content: document.content,
      createdAt: document.created_at,
    };

    return new Response(JSON.stringify(formattedDocument), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error("Error fetching document:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to fetch document",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Create a new document version
export async function POST(request: any, projectId: string) {
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
        }
      );
    }

    // Check if user has API access permission
    const permissionCheck = await SubscriptionService.canPerformAction(
      userId,
      "access_api"
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
        }
      );
    }

    const body = await request.json();
    const { content, version } = body;

    // Validate required fields
    if (!content) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Content is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        user_id: userId,
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
        }
      );
    }

    // Create a new document version
    const documentVersion = await prisma.documentVersion.create({
      data: {
        project_id: projectId,
        version: version || 1,
        content: content,
      },
      select: {
        id: true,
        project_id: true,
        version: true,
        content: true,
        created_at: true,
      },
    });

    // Transform the data to match the API documentation format
    const formattedDocument = {
      id: documentVersion.id,
      version: documentVersion.version,
      content: documentVersion.content,
      createdAt: documentVersion.created_at,
    };

    return new Response(JSON.stringify(formattedDocument), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error("Error creating document:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to create document",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Update an existing document version
export async function PUT(request: any, documentId: string) {
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
        }
      );
    }

    // Check if user has API access permission
    const permissionCheck = await SubscriptionService.canPerformAction(
      userId,
      "access_api"
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
        }
      );
    }

    const body = await request.json();
    const { content, version } = body;

    // Get the document version
    const document = await prisma.documentVersion.findUnique({
      where: {
        id: documentId,
      },
      select: {
        project: {
          select: {
            user_id: true,
          },
        },
      },
    });

    if (!document) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Document not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if the document belongs to a project owned by the user
    if (document.project.user_id !== userId) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Access denied",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update the document version
    const updatedDocument = await prisma.documentVersion.update({
      where: {
        id: documentId,
      },
      data: {
        version: version,
        content: content,
      },
      select: {
        id: true,
        project_id: true,
        version: true,
        content: true,
        created_at: true,
      },
    });

    // Transform the data to match the API documentation format
    const formattedDocument = {
      id: updatedDocument.id,
      version: updatedDocument.version,
      content: updatedDocument.content,
      createdAt: updatedDocument.created_at,
    };

    return new Response(JSON.stringify(formattedDocument), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error("Error updating document:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to update document",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Delete a document version
export async function DELETE(request: any, documentId: string) {
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
        }
      );
    }

    // Check if user has API access permission
    const permissionCheck = await SubscriptionService.canPerformAction(
      userId,
      "access_api"
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
        }
      );
    }

    // Get the document version
    const document = await prisma.documentVersion.findUnique({
      where: {
        id: documentId,
      },
      select: {
        project: {
          select: {
            user_id: true,
          },
        },
      },
    });

    if (!document) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Document not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if the document belongs to a project owned by the user
    if (document.project.user_id !== userId) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Access denied",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete the document version
    await prisma.documentVersion.delete({
      where: {
        id: documentId,
      },
    });

    return new Response(
      JSON.stringify({
        message: "Document deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    logger.error("Error deleting document:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to delete document",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
