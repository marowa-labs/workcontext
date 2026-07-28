import { EditorService } from "../../services/editorService";
import { withHybridAuth } from "../../middleware/hybridAuth";
import logger from "../../monitoring/logger";
import prisma from "../../lib/prisma";
import { getNotificationServer } from "../../lib/notificationServer";

// ── Collaboration Log ──────────────────────────────────────────────────

export async function POST_LOG(request: Request) {
  return withHybridAuth(handlePOST_LOG)(request);
}

async function handlePOST_LOG(request: Request & { user?: any }) {
  try {
    const body = (await request.json()) as {
      sessionId: string;
      eventType: string;
      projectId: string;
      targetSection?: string;
      metadata?: any;
    };
    const { sessionId, eventType, projectId, targetSection, metadata } = body;
    const userId = request.user?.id;

    if (!sessionId || !eventType || !projectId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const log = await EditorService.logCollaborationEvent({
      sessionId,
      userId,
      eventType,
      projectId,
      targetSection,
      metadata,
    });

    try {
      getNotificationServer().broadcastToChannel(`project:${projectId}`, {
        type: "collaboration:log",
        log,
      });
    } catch (e) {
      // Broadcast is best-effort
    }

    return new Response(JSON.stringify({ success: true, log }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error("Error logging collaboration event:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET_LOG(request: Request) {
  return withHybridAuth(handleGET_LOG)(request);
}

async function handleGET_LOG(request: Request & { user?: any }) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "projectId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const result = await EditorService.getCollaborationLog(projectId, request.user?.id, {
      limit,
      offset,
    });

    return new Response(JSON.stringify({ success: true, logs: result.items, total: result.total }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error("Error fetching collaboration log:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ── Comments ───────────────────────────────────────────────────────────

export async function POST_COMMENT(request: Request) {
  return withHybridAuth(handlePOST_COMMENT)(request);
}

async function handlePOST_COMMENT(request: Request & { user?: any }) {
  try {
    const body = (await request.json()) as {
      projectId: string;
      content: string;
      sectionId?: string;
    };
    const { projectId, content, sectionId } = body;
    const userId = request.user?.id;

    if (!projectId || !content || !userId) {
      return new Response(
        JSON.stringify({ error: "projectId, content, and authentication are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const comment = await EditorService.addComment(projectId, userId, content, {
      sectionId,
    });

    try {
      getNotificationServer().broadcastToChannel(`project:${projectId}`, {
        type: "comment:created",
        comment,
      });
    } catch (e) {
      // Broadcast is best-effort
    }

    return new Response(JSON.stringify({ success: true, comment }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error("Error creating comment:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET_COMMENTS(request: Request) {
  return withHybridAuth(handleGET_COMMENTS)(request);
}

async function handleGET_COMMENTS(request: Request & { user?: any }) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const sectionId = searchParams.get("sectionId");
    const userId = request.user?.id;

    if (!projectId || !userId) {
      return new Response(
        JSON.stringify({ error: "projectId and authentication are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const comments = await EditorService.getComments(projectId, userId);

    const filtered = sectionId
      ? comments.filter((c: any) => c.section_id === sectionId && !c.parent_comment_id)
      : comments.filter((c: any) => !c.parent_comment_id);

    // Fetch replies for top-level comments
    const withReplies = await Promise.all(
      filtered.map(async (c: any) => {
        const replies = await prisma.comment.findMany({
          where: { parent_comment_id: c.id },
          include: {
            user: { select: { id: true, full_name: true, email: true } },
          },
          orderBy: { created_at: "asc" },
        });
        return { ...c, replies };
      }),
    );

    return new Response(JSON.stringify({ success: true, comments: withReplies }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error("Error fetching comments:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST_REPLY(request: Request) {
  return withHybridAuth(handlePOST_REPLY)(request);
}

async function handlePOST_REPLY(request: Request & { user?: any }) {
  try {
    const url = new URL(request.url);
    const commentId = url.pathname.split("/").pop();
    const body = (await request.json()) as { content: string };
    const userId = request.user?.id;

    if (!commentId || !body.content || !userId) {
      return new Response(
        JSON.stringify({ error: "commentId, content, and authentication are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const reply = await EditorService.addReply(commentId, userId, body.content);

    try {
      getNotificationServer().broadcastToChannel(`project:${reply.project_id}`, {
        type: "reply:created",
        reply,
      });
    } catch (e) {
      // Broadcast is best-effort
    }

    return new Response(JSON.stringify({ success: true, reply }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error("Error adding reply:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH_COMMENT(request: Request) {
  return withHybridAuth(handlePATCH_COMMENT)(request);
}

async function handlePATCH_COMMENT(request: Request & { user?: any }) {
  try {
    const url = new URL(request.url);
    const commentId = url.pathname.split("/").pop();
    const body = (await request.json()) as {
      content?: string;
      is_resolved?: boolean;
    };
    const userId = request.user?.id;

    if (!commentId || !userId) {
      return new Response(
        JSON.stringify({ error: "commentId and authentication are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const comment = await EditorService.updateComment(commentId, userId, body);

    return new Response(JSON.stringify({ success: true, comment }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error("Error updating comment:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
