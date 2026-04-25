import { Router } from "express";
import TeamChatService from "../../services/teamChatService";
import { authenticateExpressRequest } from "../../middleware/auth";

const router = Router();

// GET /api/team-chat - Fetch messages
router.get("/", authenticateExpressRequest, async (req: any, res) => {
  try {
    const workspaceId = (req.query.workspaceId as string) || undefined;
    const projectId = (req.query.projectId as string) || undefined;
    const parentId = (req.query.parentId as string) || undefined;
    const limit = parseInt((req.query.limit as string) || "50");
    const offset = parseInt((req.query.offset as string) || "0");

    const messages = await TeamChatService.getMessages(
      {
        workspaceId,
        projectId,
        parentId,
      },
      limit,
      offset,
    );

    res.status(200).json({ messages });
  } catch (error: any) {
    console.error("Error in Team Chat GET:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// POST /api/team-chat - Send a message
router.post("/", authenticateExpressRequest, async (req: any, res) => {
  try {
    const { content, workspaceId, projectId, parentId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const message = await TeamChatService.sendMessage(userId, content, {
      workspaceId,
      projectId,
      parentId,
    });

    res.status(201).json({ message });
  } catch (error: any) {
    console.error("Error in Team Chat POST:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// DELETE /api/team-chat - Delete a message
router.delete("/", authenticateExpressRequest, async (req: any, res) => {
  try {
    const messageId = req.query.id as string;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!messageId) {
      return res.status(400).json({ error: "Message ID is required" });
    }

    await TeamChatService.deleteMessage(messageId, userId);

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error in Team Chat DELETE:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
