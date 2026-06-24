import { Router, type Router as ExpressRouter } from "express";
import logger from "../../monitoring/logger";
import { authenticateExpressRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router: ExpressRouter = Router();

/**
 * GET /api/ai/pinned-comments/:attachmentId
 * Get all pinned comments for a specific attachment (for the authenticated user)
 */
router.get(
  "/:attachmentId",
  authenticateExpressRequest,
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      const { attachmentId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const comments = await prisma.pinnedComment.findMany({
        where: {
          user_id: userId,
          attachment_id: attachmentId,
        },
        orderBy: { created_at: "asc" },
      });

      return res.status(200).json({
        success: true,
        comments: comments.map((c: any) => ({
          id: c.id,
          text: c.selected_text,
          comment: c.comment,
          x: c.position_x,
          y: c.position_y,
          created_at: c.created_at.toISOString(),
        })),
      });
    } catch (error: any) {
      logger.error("Error fetching pinned comments:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },
);

/**
 * POST /api/ai/pinned-comments
 * Create a new pinned comment
 *
 * Body: { attachmentId, selectedText, comment, positionX, positionY }
 */
router.post("/", authenticateExpressRequest, async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { attachmentId, selectedText, comment, positionX, positionY } =
      req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!attachmentId || !selectedText || !comment) {
      logger.warn("Pinned comment validation failed", {
        hasAttachmentId: !!attachmentId,
        hasSelectedText: !!selectedText,
        hasComment: !!comment,
        bodyKeys: Object.keys(req.body),
      });
      return res.status(400).json({
        success: false,
        message: "attachmentId, selectedText, and comment are required",
        debug: {
          hasAttachmentId: !!attachmentId,
          hasSelectedText: !!selectedText,
          hasComment: !!comment,
        },
      });
    }

    const pinnedComment = await prisma.pinnedComment.create({
      data: {
        user_id: userId,
        attachment_id: attachmentId,
        selected_text: selectedText,
        comment,
        position_x: positionX || 0,
        position_y: positionY || 0,
      },
    });

    return res.status(201).json({
      success: true,
      comment: {
        id: pinnedComment.id,
        text: pinnedComment.selected_text,
        comment: pinnedComment.comment,
        x: pinnedComment.position_x,
        y: pinnedComment.position_y,
        created_at: pinnedComment.created_at.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error("Error creating pinned comment:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

/**
 * DELETE /api/ai/pinned-comments/:commentId
 * Delete a pinned comment (only by its owner)
 */
router.delete(
  "/:commentId",
  authenticateExpressRequest,
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      const { commentId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Verify ownership before deleting
      const existing = await prisma.pinnedComment.findFirst({
        where: { id: commentId, user_id: userId },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Comment not found or not authorized",
        });
      }

      await prisma.pinnedComment.delete({
        where: { id: commentId },
      });

      return res.status(200).json({
        success: true,
        message: "Comment deleted",
      });
    } catch (error: any) {
      logger.error("Error deleting pinned comment:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },
);

export default router;
