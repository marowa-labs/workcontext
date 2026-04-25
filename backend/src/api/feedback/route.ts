import { Router, type Router as ExpressRouter } from "express";
import { FeedbackService } from "../../services/feedbackService";
import logger from "../../monitoring/logger";
import { authenticateExpressRequest } from "../../middleware/auth";

const router: ExpressRouter = Router();

// Apply authentication middleware to all routes in this file
router.use(authenticateExpressRequest);

// Create a new feedback item
router.post("/", async (req, res) => {
  try {
    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;
    const feedbackData = req.body;

    // Validate required fields
    if (
      !feedbackData.type ||
      !feedbackData.title ||
      !feedbackData.description
    ) {
      return res.status(400).json({
        success: false,
        message: "Type, title, and description are required",
      });
    }

    const validTypes = ["feedback", "bug_report", "feature_request"];
    if (!validTypes.includes(feedbackData.type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback type",
      });
    }

    const validPriorities = ["low", "medium", "high", "critical"];
    if (
      feedbackData.priority &&
      !validPriorities.includes(feedbackData.priority)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority level",
      });
    }

    const feedback = await FeedbackService.createFeedback({
      user_id: userId || null,
      type: feedbackData.type,
      category: feedbackData.category || null,
      priority: feedbackData.priority || "medium",
      title: feedbackData.title,
      description: feedbackData.description,
      status: "open",
      attachment_urls: feedbackData.attachment_urls || [],
      browser_info: feedbackData.browser_info || null,
      os_info: feedbackData.os_info || null,
      screen_size: feedbackData.screen_size || null,
      user_plan: feedbackData.user_plan || null,
      admin_notes: feedbackData.admin_notes || null,
    });

    return res.json({ success: true, feedback });
  } catch (error) {
    logger.error("Error creating feedback:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create feedback",
    });
  }
});

// Get feedback items (admin only for all feedback, users see their own)
router.get("/", async (req, res) => {
  try {
    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { type, category, status, priority, limit } = req.query;

    const filters: any = {};
    if (type) filters.type = type as string;
    if (category) filters.category = category as string;
    if (status) filters.status = status as string;
    if (priority) filters.priority = priority as string;

    const feedbackItems = await FeedbackService.getFeedbackItems(
      userId,
      filters,
      limit ? parseInt(limit as string) : 50,
    );

    return res.json({ success: true, feedback: feedbackItems });
  } catch (error) {
    logger.error("Error fetching feedback items:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback items",
    });
  }
});

// Get feedback items for the authenticated user
router.get("/my", async (req, res) => {
  try {
    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const feedbackItems = await FeedbackService.getUserFeedback(userId);

    return res.json({ success: true, feedback: feedbackItems });
  } catch (error) {
    logger.error("Error fetching user feedback:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user feedback",
    });
  }
});

// Get a specific feedback item by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const feedback = await FeedbackService.getFeedbackById(userId, id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    return res.json({ success: true, feedback });
  } catch (error: any) {
    if (error.message === "Unauthorized access to feedback") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    logger.error("Error fetching feedback by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback",
    });
  }
});

// Update feedback status (admin only)
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses = ["open", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const feedback = await FeedbackService.updateFeedbackStatus(
      userId,
      id,
      status,
      adminNotes,
    );

    return res.json({ success: true, feedback });
  } catch (error: any) {
    if (error.message === "Only administrators can update feedback status") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    logger.error("Error updating feedback status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update feedback status",
    });
  }
});

// Add a comment to feedback
router.post("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const commentData = req.body;

    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!commentData.content) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const comment = await FeedbackService.addFeedbackComment(userId, id, {
      user_id: userId || null,
      content: commentData.content,
      is_internal: commentData.is_internal || false,
    });

    return res.json({ success: true, comment });
  } catch (error: any) {
    if (error.message === "Unauthorized to comment on this feedback") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    logger.error("Error adding feedback comment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add feedback comment",
    });
  }
});

// Get comments for a feedback item
router.get("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Check if user should see internal comments (admins only)
    const isAdmin = await FeedbackService.isUserAdmin(userId);
    const includeInternal = isAdmin && req.query.include_internal === "true";

    const comments = await FeedbackService.getFeedbackComments(
      userId,
      id,
      includeInternal,
    );

    return res.json({ success: true, comments });
  } catch (error: any) {
    if (error.message === "Unauthorized to view comments on this feedback") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    logger.error("Error fetching feedback comments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback comments",
    });
  }
});

// Get feedback statistics (admin only)
router.get("/stats/summary", async (req, res) => {
  try {
    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const stats = await FeedbackService.getFeedbackStats(userId);

    return res.json({ success: true, stats });
  } catch (error: any) {
    if (error.message === "Only administrators can view feedback statistics") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    logger.error("Error fetching feedback stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback statistics",
    });
  }
});

export default router;
