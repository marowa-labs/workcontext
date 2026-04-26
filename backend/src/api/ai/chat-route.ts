import { Router, type Router as ExpressRouter } from "express";
import { AIService } from "../../services/aiService";
import logger from "../../monitoring/logger";
import { authenticateExpressRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { SubscriptionService } from "../../services/subscriptionService";
import { createNotification } from "../../services/notificationService";

const router: ExpressRouter = Router();

// Create a new chat session
async function handlePostChatSession(req: any, res: any) {
  try {
    const body = req.body;
    const userId = req.user?.id;
    const { projectId, title } = body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Validate project exists if projectId is provided
    let projectExists = true;
    if (projectId) {
      try {
        const project = await prisma.project.findUnique({
          where: {
            id: projectId,
            user_id: userId,
          },
        });
        projectExists = !!project;
      } catch (projectError) {
        projectExists = false;
      }
    }

    // Create new chat session
    const session = await prisma.aIChatSession.create({
      data: {
        user_id: userId,
        project_id: projectExists ? projectId : null,
        title: title || "New Chat",
        updated_at: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      session,
    });
  } catch (error: any) {
    logger.error("Error creating chat session:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.post("/session", authenticateExpressRequest, handlePostChatSession);

// Get chat sessions for a user
async function handleGetChatSessions(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { projectId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Get chat sessions
    const sessions = await prisma.aIChatSession.findMany({
      where: {
        user_id: userId,
        project_id: projectId || undefined,
        is_active: true,
      },
      orderBy: {
        last_message_at: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      sessions,
    });
  } catch (error: any) {
    logger.error("Error fetching chat sessions:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.get("/sessions", authenticateExpressRequest, handleGetChatSessions);

// Get messages for a chat session
async function handleGetChatMessages(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "User ID and session ID are required",
      });
    }

    // Verify session belongs to user
    const session = await prisma.aIChatSession.findUnique({
      where: {
        id: sessionId,
        user_id: userId,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    // Get messages for the session
    const messages = await prisma.aIChatMessage.findMany({
      where: {
        session_id: sessionId,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error: any) {
    logger.error("Error fetching chat messages:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.get(
  "/session/:sessionId/messages",
  authenticateExpressRequest,
  handleGetChatMessages
);

// Send a message in a chat session
async function handlePostChatMessage(req: any, res: any) {
  try {
    const body = req.body;
    const userId = req.user?.id;
    const { sessionId, content, messageType, imageUrl, fileUrl, metadata } =
      body;

    if (!userId || !sessionId || !content) {
      return res.status(400).json({
        success: false,
        message: "User ID, session ID, and content are required",
      });
    }

    // Log request for debugging
    logger.info("Handling chat message request", {
      userId,
      sessionId,
      contentLength: content.length,
      messageType,
      hasImageUrl: !!imageUrl,
      hasFileUrl: !!fileUrl,
      hasMetadata: !!metadata,
    });

    // Verify session belongs to user
    const session = await prisma.aIChatSession.findUnique({
      where: {
        id: sessionId,
        user_id: userId,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    // Check if user can send chat messages based on their subscription
    const canPerform = await SubscriptionService.canPerformAction(
      userId,
      "ai_chat_message"
    );
    if (!canPerform.allowed) {
      // Send notification about limit reached
      await createNotification(
        userId,
        "ai_limit",
        "AI Chat Limit Reached",
        "You've reached your AI chat message limit for this month. Upgrade your plan for unlimited access.",
        { limitReached: true }
      );

      return res.status(429).json({
        success: false,
        message:
          canPerform.reason ||
          "You've reached your AI chat message limit. Upgrade for more.",
        limitReached: true,
      });
    }

    // Save user message
    const userMessage = await prisma.aIChatMessage.create({
      data: {
        session_id: sessionId,
        user_id: userId,
        content,
        role: "user",
        message_type: messageType || "text",
        image_url: imageUrl,
        file_url: fileUrl,
        metadata: metadata !== undefined ? metadata : undefined,
      },
    });

    // Update session last message timestamp
    await prisma.aIChatSession.update({
      where: { id: sessionId },
      data: { last_message_at: new Date() },
    });

    // Track AI usage
    await AIService.trackAIUsage(userId, "chat_message");

    // Process AI response with streaming support
    const aiResponse = await AIService.processChatMessage({
      sessionId,
      userId,
      content,
      messageType,
      imageUrl,
      fileUrl,
      metadata,
    });

    // Save AI response
    const aiMessage = await prisma.aIChatMessage.create({
      data: {
        session_id: sessionId,
        user_id: userId,
        content: aiResponse.content,
        role: "assistant",
        message_type: aiResponse.messageType || "text",
        image_url: aiResponse.imageUrl || null,
        file_url: aiResponse.fileUrl || null,
        metadata:
          aiResponse.metadata !== undefined ? aiResponse.metadata : undefined,
      },
    });

    // Update session last message timestamp again
    await prisma.aIChatSession.update({
      where: { id: sessionId },
      data: { last_message_at: new Date() },
    });

    // Send notification for long conversations
    const messageCount = await prisma.aIChatMessage.count({
      where: { session_id: sessionId },
    });

    if (messageCount === 10 || messageCount === 25 || messageCount === 50) {
      await createNotification(
        userId,
        "ai_suggestion",
        "Chat Milestone",
        `You've reached ${messageCount} messages in this chat session. Consider saving this conversation for future reference.`,
        { sessionId, messageCount }
      );
    }

    return res.status(200).json({
      success: true,
      userMessage,
      aiMessage,
    });
  } catch (error: any) {
    logger.error("Error sending chat message:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Stream a chat message
async function handlePostChatMessageStream(req: any, res: any) {
  try {
    const body = req.body;
    const userId = req.user?.id;
    const { sessionId, content, messageType, imageUrl, fileUrl, metadata } =
      body;

    if (!userId || !sessionId || !content) {
      return res.status(400).json({
        success: false,
        message: "User ID, session ID, and content are required",
      });
    }

    // Log request for debugging
    logger.info("Handling streaming chat message request", {
      userId,
      sessionId,
      contentLength: content.length,
      messageType,
      hasImageUrl: !!imageUrl,
      hasFileUrl: !!fileUrl,
      hasMetadata: !!metadata,
    });

    // Verify session belongs to user
    const session = await prisma.aIChatSession.findUnique({
      where: {
        id: sessionId,
        user_id: userId,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    // Check if user can send chat messages based on their subscription
    const canPerform = await SubscriptionService.canPerformAction(
      userId,
      "ai_chat_message"
    );
    if (!canPerform.allowed) {
      // Send notification about limit reached
      await createNotification(
        userId,
        "ai_limit",
        "AI Chat Limit Reached",
        "You've reached your AI chat message limit for this month. Upgrade your plan for unlimited access.",
        { limitReached: true }
      );

      return res.status(429).json({
        success: false,
        message:
          canPerform.reason ||
          "You've reached your AI chat message limit. Upgrade for more.",
        limitReached: true,
      });
    }

    // Save user message
    const userMessage = await prisma.aIChatMessage.create({
      data: {
        session_id: sessionId,
        user_id: userId,
        content,
        role: "user",
        message_type: messageType || "text",
        image_url: imageUrl,
        file_url: fileUrl,
        metadata: metadata !== undefined ? metadata : undefined,
      },
    });

    // Update session last message timestamp
    await prisma.aIChatSession.update({
      where: { id: sessionId },
      data: { last_message_at: new Date() },
    });

    // Track AI usage
    await AIService.trackAIUsage(userId, "chat_message");

    // Set response headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    // Process AI response with streaming
    const aiResponse = await AIService.processChatMessageStream({
      sessionId,
      userId,
      content,
      messageType,
      imageUrl,
      fileUrl,
      metadata,
      onToken: (token) => {
        // Send token to client
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      },
    });

    // Save AI response
    const aiMessage = await prisma.aIChatMessage.create({
      data: {
        session_id: sessionId,
        user_id: userId,
        content: aiResponse.content,
        role: "assistant",
        message_type: aiResponse.messageType || "text",
        image_url: aiResponse.imageUrl || null,
        file_url: aiResponse.fileUrl || null,
        metadata:
          aiResponse.metadata !== undefined ? aiResponse.metadata : undefined,
      },
    });

    // Update session last message timestamp again
    await prisma.aIChatSession.update({
      where: { id: sessionId },
      data: { last_message_at: new Date() },
    });

    // Send notification for long conversations
    const messageCount = await prisma.aIChatMessage.count({
      where: { session_id: sessionId },
    });

    if (messageCount === 10 || messageCount === 25 || messageCount === 50) {
      await createNotification(
        userId,
        "ai_suggestion",
        "Chat Milestone",
        `You've reached ${messageCount} messages in this chat session. Consider saving this conversation for future reference.`,
        { sessionId, messageCount }
      );
    }

    // Send completion message
    res.write(`data: ${JSON.stringify({ done: true, aiMessage })}\n\n`);
    res.end();
  } catch (error: any) {
    logger.error("Error sending streaming chat message:", error);
    // Send error to client
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}

router.post("/message", authenticateExpressRequest, handlePostChatMessage);
router.post(
  "/message/stream",
  authenticateExpressRequest,
  handlePostChatMessageStream
);

// Update chat session
async function handlePutChatSession(req: any, res: any) {
  try {
    const body = req.body;
    const userId = req.user?.id;
    const { sessionId, title, isActive } = body;

    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "User ID and session ID are required",
      });
    }

    // Verify session belongs to user
    const session = await prisma.aIChatSession.findUnique({
      where: {
        id: sessionId,
        user_id: userId,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    // Update session
    const updatedSession = await prisma.aIChatSession.update({
      where: { id: sessionId },
      data: {
        title: title !== undefined ? title : session.title,
        is_active: isActive !== undefined ? isActive : session.is_active,
        updated_at: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      session: updatedSession,
    });
  } catch (error: any) {
    logger.error("Error updating chat session:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.put("/session", authenticateExpressRequest, handlePutChatSession);

// Rename (update) a chat session
async function handlePatchChatSession(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;
    const { title } = req.body;

    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "User ID and session ID are required",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Verify session belongs to user
    const session = await prisma.aIChatSession.findUnique({
      where: {
        id: sessionId,
        user_id: userId,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    // Update session title
    const updatedSession = await prisma.aIChatSession.update({
      where: { id: sessionId },
      data: {
        title: title.trim(),
        updated_at: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      session: updatedSession,
    });
  } catch (error: any) {
    logger.error("Error updating chat session:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.patch(
  "/session/:sessionId",
  authenticateExpressRequest,
  handlePatchChatSession
);

// Delete chat session
async function handleDeleteChatSession(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "User ID and session ID are required",
      });
    }

    // Verify session belongs to user
    const session = await prisma.aIChatSession.findUnique({
      where: {
        id: sessionId,
        user_id: userId,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    // Soft delete by marking as inactive
    await prisma.aIChatSession.update({
      where: { id: sessionId },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Chat session deleted successfully",
    });
  } catch (error: any) {
    logger.error("Error deleting chat session:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.delete("/session/:sessionId", authenticateExpressRequest, handleDeleteChatSession);

// Delete chat message
async function handleDeleteChatMessage(req: any, res: any) {
  try {
    const body = req.body;
    const userId = req.user?.id;
    const { messageId } = body;

    if (!userId || !messageId) {
      return res.status(400).json({
        success: false,
        message: "User ID and message ID are required",
      });
    }

    // Verify message belongs to user
    const message = await prisma.aIChatMessage.findUnique({
      where: {
        id: messageId,
      },
      include: {
        session: true,
      },
    });

    if (!message || message.session.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: "Chat message not found or not owned by user",
      });
    }

    // Delete message
    await prisma.aIChatMessage.delete({
      where: { id: messageId },
    });

    return res.status(200).json({
      success: true,
      message: "Chat message deleted successfully",
    });
  } catch (error: any) {
    logger.error("Error deleting chat message:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.delete("/message", authenticateExpressRequest, handleDeleteChatMessage);

// Get all chat sessions with message counts for history
async function handleGetChatHistory(req: any, res: any) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Get all chat sessions for the user with message counts
    const sessions = await prisma.aIChatSession.findMany({
      where: {
        user_id: userId,
      },
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: {
        last_message_at: "desc",
      },
    });

    // Transform the data to match the frontend expectations
    const transformedSessions = sessions.map((session: any) => ({
      id: session.id,
      title: session.title,
      created_at: session.created_at,
      last_message_at: session.last_message_at,
      message_count: session._count.messages,
    }));

    return res.status(200).json({
      success: true,
      sessions: transformedSessions,
    });
  } catch (error: any) {
    logger.error("Error fetching chat history:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.get(
  "/sessions/history",
  authenticateExpressRequest,
  handleGetChatHistory
);

export default router;
