import { Request, Response } from "express";
import { ChatWithPapersService } from "../../services/chatWithPapersService";
import { prisma } from "../../lib/prisma";
import logger from "../../monitoring/logger";

// POST /api/research/chat
export async function POST_CHAT(req: Request, res: Response) {
  try {
    const { query, paperIds, history } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    if (!paperIds || !Array.isArray(paperIds) || paperIds.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one paper ID is required" });
    }

    // 1. Create or Get Session
    let session;
    const { sessionId, projectId, model } = req.body;

    if (sessionId) {
      session = await prisma.aIChatSession.findUnique({
        where: { id: sessionId },
      });
    }

    // Capture User ID
    let userId = (req as any).user?.id;

    // If no session found (or not provided)
    if (!session) {
      // 1. Resolve User ID if missing (e.g. via Project)
      // Note: In production, rely strictly on auth middleware.
      if (!userId && projectId) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { user_id: true },
        });
        if (project) {
          userId = project.user_id;
        }
      }

      if (!userId) {
        return res
          .status(401)
          .json({ error: "Authentication required to start chat" });
      }

      // 2. Create New Session
      session = await prisma.aIChatSession.create({
        data: {
          user_id: userId,
          project_id: projectId || null,
          title: query.substring(0, 50) + (query.length > 50 ? "..." : ""),
          is_active: true,
          last_message_at: new Date(),
        },
      });
    } else {
      // 3. Validate Ownership of existing session
      if (userId && session.user_id !== userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized access to this chat session" });
      }

      // Update timestamp
      await prisma.aIChatSession.update({
        where: { id: session.id },
        data: { last_message_at: new Date() },
      });
    }

    // 2. Save User Message
    await prisma.aIChatMessage.create({
      data: {
        session_id: session.id,
        user_id: session.user_id,
        content: query,
        role: "user",
        created_at: new Date(),
      },
    });

    const start = Date.now();
    const response = await ChatWithPapersService.chat(
      query,
      paperIds,
      history || [],
      projectId,
      model,
    );

    // 3. Save Assistant Message
    const aiMsg = await prisma.aIChatMessage.create({
      data: {
        session_id: session.id,
        user_id: session.user_id,
        content: response,
        role: "assistant",
        created_at: new Date(),
      },
    });

    logger.info("Chat request processed", {
      papers: paperIds.length,
      duration: Date.now() - start,
    });

    return res.json({
      data: response,
      sessionId: session.id,
      messageId: aiMsg.id,
    });
  } catch (error: any) {
    logger.error("Error processing chat request:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}

// GET /api/research/chat/:projectId
export async function GET_CHAT_HISTORY(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user?.id;

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Find the latest active session for this project and user
    const session = await prisma.aIChatSession.findFirst({
      where: {
        project_id: projectId,
        user_id: userId,
        is_active: true,
      },
      orderBy: {
        updated_at: "desc",
      },
      include: {
        messages: {
          orderBy: {
            created_at: "asc",
          },
        },
      },
    });

    if (!session) {
      return res.json({ session: null, messages: [] });
    }

    return res.json({
      session: {
        id: session.id,
        title: session.title,
      },
      messages: session.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
      })),
    });
  } catch (error: any) {
    logger.error("Error fetching chat history:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/research/chat/sessions/:projectId
export async function GET_CHAT_SESSIONS(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user?.id;

    if (!projectId || !userId) {
      return res.status(400).json({ error: "Project ID and User ID required" });
    }

    const sessions = await prisma.aIChatSession.findMany({
      where: {
        project_id: projectId,
        user_id: userId,
        is_active: true,
      },
      orderBy: {
        updated_at: "desc",
      },
      select: {
        id: true,
        title: true,
        created_at: true,
        updated_at: true,
      },
    });

    return res.json({ sessions });
  } catch (error: any) {
    logger.error("Error fetching chat sessions:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/research/chat/session/:sessionId
export async function GET_CHAT_SESSION(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user?.id;

    if (!sessionId || !userId) {
      return res.status(400).json({ error: "Session ID and User ID required" });
    }

    const session = await prisma.aIChatSession.findUnique({
      where: {
        id: sessionId,
      },
      include: {
        messages: {
          orderBy: {
            created_at: "asc",
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized access to session" });
    }

    return res.json({
      session: {
        id: session.id,
        title: session.title,
      },
      messages: session.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
      })),
    });
  } catch (error: any) {
    logger.error("Error fetching session:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/research/summarize - Generate summary without saving to chat history
export async function POST_SUMMARIZE(req: Request, res: Response) {
  try {
    const { sourceIds, projectId, model } = req.body;
    const userId = (req as any).user?.id;

    if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return res.status(400).json({ error: "At least one source ID is required" });
    }

    // Build a prompt for summarization
    const prompt = `Based on the following sources, provide a brief 2-3 sentence summary of what these sources collectively discuss, and suggest 3 relevant questions a researcher might ask about this topic.

Format your response ONLY as a JSON object with this exact structure:
{
  "summary": "Your summary here...",
  "questions": [
    "First question?",
    "Second question?",
    "Third question?"
  ]
}

Do not include any other text outside the JSON object.`;

    // Call chat service WITHOUT saving to history
    const rawResponse = await ChatWithPapersService.chat(
      prompt,
      sourceIds,
      [], // empty history
      projectId,
      model,
    );

    // Extract only the assistant's response (after ASSISTANT: if present)
    let response = rawResponse;
    const assistantMarker = "ASSISTANT:";
    const assistantIndex = rawResponse.lastIndexOf(assistantMarker);
    if (assistantIndex !== -1) {
      response = rawResponse.substring(assistantIndex + assistantMarker.length).trim();
    }
    // Also handle case where AI echoes back USER: section
    const userMarker = "USER:";
    const userIndex = response.indexOf(userMarker);
    if (userIndex !== -1) {
      response = response.substring(0, userIndex).trim();
    }

    // Parse the response (should now be just the JSON)
    let summary = "";
    let questions: string[] = [];
    
    try {
      // First, try to extract JSON that contains "summary" and "questions" fields
      // Look for pattern: {"summary": "...", "questions": [...]}
      const summaryPattern = /"summary"\s*:\s*"([^"]*)"|"summary"\s*:\s*"([\s\S]*?)"(?:,"|\})/i;
      const questionsPattern = /"questions"\s*:\s*(\[[^\]]*\])/i;
      
      // Try to find the JSON object with both fields
      const jsonMatch = response.match(/\{\s*"summary"[\s\S]*?"questions"[\s\S]*?\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        summary = parsed.summary || "";
        questions = Array.isArray(parsed.questions) ? parsed.questions : [];
      } else {
        // Fallback: try to extract summary text directly
        // Remove any prompt echo and use cleaned text as summary
        summary = response
          .replace(/Based on the following sources[\s\S]*?Format your response[\s\S]*?fields\./gi, '')
          .replace(/\{[\s\S]*?\}/g, '') // Remove any JSON-like blocks
          .replace(/USER:[\s\S]*$/gi, '') // Remove anything after USER:
          .replace(/ASSISTANT:/gi, '')
          .trim()
          .slice(0, 500);
        questions = [];
      }
    } catch (e) {
      // If JSON parsing fails, clean and use as plain text summary
      summary = response
        .replace(/Based on the following sources[\s\S]*?Format your response[\s\S]*?fields\./gi, '')
        .replace(/\{[\s\S]*?\}/g, '')
        .replace(/USER:[\s\S]*$/gi, '')
        .replace(/ASSISTANT:/gi, '')
        .trim()
        .slice(0, 500);
      questions = [];
    }

    return res.json({
      summary,
      questions,
    });
  } catch (error: any) {
    logger.error("Error generating summary:", error);
    return res.status(500).json({ error: "Failed to generate summary" });
  }
}
