import { Router, type Router as ExpressRouter } from "express";
import { authenticateExpressRequest } from "../../middleware/auth";
import logger from "../../monitoring/logger";
import { prisma } from "../../lib/prisma";
import { AIService } from "../../services/aiService";
import { UnifiedAIService } from "../../services/unifiedAIService";
import { plans } from "../../services/subscriptionService";
import { createNotification } from "../../services/notificationService";
import researchRouter from "./research-route";
import searchRouter from "./search-route";
import chatRouter from "./chat-route";

const router: ExpressRouter = Router();

// Process AI request (improve writing, fix grammar, etc.)
async function handlePostAIRequest(req: any, res: any) {
  try {
    const body = req.body;
    // Use authenticated user ID
    const userId = req.user?.id;
    const { action, text, context, preferences, model } = body;

    if (!action || !text || !userId) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: action, text, and userId are required",
      });
    }

    // Check usage limit
    const { hasLimit } = await AIService.checkUsageLimit(userId);

    if (hasLimit) {
      // Send notification about limit reached
      await createNotification(
        userId,
        "ai_limit",
        "AI Usage Limit Reached",
        "You've reached your AI usage limit for this month. Upgrade your plan for unlimited access.",
        { limitReached: true },
      );

      return res.status(429).json({
        success: false,
        message:
          "You've reached your AI usage limit. Upgrade for unlimited access.",
        limitReached: true,
      });
    }

    // Process the AI request
    // Mark grammar checking as automatic since it's typically system-initiated
    const result = await AIService.processAIRequest({
      action,
      text,
      context,
      preferences,
      userId,
      model, // Pass the model parameter
      isAutomatic: action === "fix_grammar", // Mark grammar checking as automatic
    });

    // Save to history
    await AIService.saveAIHistoryItem(userId, {
      action,
      originalText: text,
      suggestion: result.suggestion,
      isFavorite: false,
    });

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error: any) {
    logger.error("Error processing AI request:", error);

    // Handle specific error types
    if (error.message && error.message.includes("quota exceeded")) {
      return res.status(429).json({
        success: false,
        message:
          "AI service quota exceeded. Please try again later or upgrade your plan for more usage.",
      });
    } else if (
      error.message &&
      error.message.includes("authentication failed")
    ) {
      return res.status(401).json({
        success: false,
        message: "AI service authentication failed. Please contact support.",
      });
    } else if (error.message && error.message.includes("Invalid AI request")) {
      return res.status(400).json({
        success: false,
        message: "Invalid AI request. Please check your input and try again.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}

router.post("/process", authenticateExpressRequest, handlePostAIRequest);

// Get AI usage information
async function handleGetAIUsage(req: any, res: any) {
  try {
    // Use authenticated user ID
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Get user's subscription to determine limit
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });

    const planId = subscription?.plan || "free";
    const planLimits = plans[planId as keyof typeof plans].features;
    const limit = planLimits.aiRequests;

    // Get current usage
    const { remaining } = await AIService.checkUsageLimit(userId);

    return res.status(200).json({
      success: true,
      usage: {
        remaining,
        limit: limit === -1 || (limit as any) === -1 ? 1000000 : limit, // For unlimited, set a high number
      },
    });
  } catch (error: any) {
    logger.error("Error fetching AI usage:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

router.get("/usage", authenticateExpressRequest, handleGetAIUsage);

// Get AI usage history
async function handleGetAIUsageHistory(req: any, res: any) {
  try {
    // Use authenticated user ID
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Get usage history
    const usageHistory = await AIService.getUsageHistory(userId);

    return res.status(200).json({
      success: true,
      history: usageHistory,
    });
  } catch (error: any) {
    logger.error("Error fetching AI usage history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

router.get(
  "/usage/history",
  authenticateExpressRequest,
  handleGetAIUsageHistory,
);

// Get AI history
async function handleGetAIHistory(req: any, res: any) {
  try {
    // Use authenticated user ID
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get AI history
    const history = await AIService.getAIHistory(userId);

    return res.status(200).json({
      success: true,
      history,
    });
  } catch (error: any) {
    logger.error("Error fetching AI history:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.get("/history", authenticateExpressRequest, handleGetAIHistory);

// Update favorite status of AI history item
async function handlePutAIHistoryFavorite(req: any, res: any) {
  try {
    const body = req.body;
    // Use authenticated user ID
    const userId = req.user?.id;
    const { itemId, isFavorite } = body;

    if (!userId || !itemId) {
      return res.status(400).json({
        success: false,
        message: "User ID and item ID are required",
      });
    }

    // Update favorite status
    await AIService.updateAIHistoryFavorite(userId, itemId, isFavorite);

    return res.status(200).json({
      success: true,
      message: "Favorite status updated successfully",
    });
  } catch (error: any) {
    logger.error("Error updating AI history favorite status:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.put(
  "/history/favorite",
  authenticateExpressRequest,
  handlePutAIHistoryFavorite,
);

// Delete AI history item
async function handleDeleteAIHistoryItem(req: any, res: any) {
  try {
    const body = req.body;
    // Use authenticated user ID
    const userId = req.user?.id;
    const { itemId } = body;

    if (!userId || !itemId) {
      return res.status(400).json({
        success: false,
        message: "User ID and item ID are required",
      });
    }

    // Delete history item
    await AIService.deleteAIHistoryItem(userId, itemId);

    return res.status(200).json({
      success: true,
      message: "History item deleted successfully",
    });
  } catch (error: any) {
    logger.error("Error deleting AI history item:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.delete(
  "/history",
  authenticateExpressRequest,
  handleDeleteAIHistoryItem,
);

// Update user's preferred AI model
async function handlePutPreferredModel(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { model, preferences } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!model) {
      return res.status(400).json({
        success: false,
        message: "Model is required",
      });
    }

    // Validate that the model is supported
    const availableModels = Object.keys(AIService.getAvailableModels());
    if (!availableModels.includes(model)) {
      return res.status(400).json({
        success: false,
        message: "Invalid model specified",
      });
    }

    // Prepare update data
    const updateData: any = { preferred_ai_model: model };

    // Also update ai_preferences if it exists to keep them in sync
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { ai_preferences: true },
    });

    if (user?.ai_preferences) {
      const currentPrefs = user.ai_preferences as any;
      updateData.ai_preferences = {
        ...currentPrefs,
        model: model,
        preferredModel: model,
      };
    }

    // Update user's preferred model and preferences
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Preferred AI model updated successfully",
      preferredModel: updatedUser.preferred_ai_model,
    });
  } catch (error: any) {
    logger.error("Error updating preferred AI model:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Update user's AI preferences (including all settings)
async function handlePutAIUserPreferences(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { preferences } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!preferences) {
      return res.status(400).json({
        success: false,
        message: "Preferences are required",
      });
    }

    // Update user's AI preferences in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        preferred_ai_model:
          preferences.preferredModel || preferences.model || "gpt-4o-mini",
        ai_preferences: preferences,
      },
    });

    return res.status(200).json({
      success: true,
      message: "AI preferences updated successfully",
      preferences: updatedUser.ai_preferences,
    });
  } catch (error: any) {
    logger.error("Error updating AI user preferences:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.put(
  "/preferences",
  authenticateExpressRequest,
  handlePutAIUserPreferences,
);

// Get user's AI preferences
async function handleGetAIUserPreferences(req: any, res: any) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Get user's AI preferences
    const user: any = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferred_ai_model: true,
        ai_preferences: true,
      },
    });

    return res.status(200).json({
      success: true,
      preferences: {
        preferredModel: user?.preferred_ai_model || "gpt-4o-mini",
        ...user?.ai_preferences,
      },
    });
  } catch (error: any) {
    logger.error("Error fetching AI user preferences:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.get(
  "/preferences",
  authenticateExpressRequest,
  handleGetAIUserPreferences,
);

router.put(
  "/preferred-model",
  authenticateExpressRequest,
  handlePutPreferredModel,
);

// Get available AI models for the user
async function handleGetAvailableModels(req: any, res: any) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Get user's current model
    const user: any = await prisma.user.findUnique({
      where: { id: userId },
    });

    const currentModel = user?.preferred_ai_model || "gpt-4o-mini";

    // Get user's subscription to determine available models
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });

    const planId = subscription?.plan || "free";

    // Get actually available models based on configured API keys
    const actuallyAvailableModels =
      await AIService.getActuallyAvailableModels();
    const actuallyAvailableModelIds = Object.keys(actuallyAvailableModels);

    // Define available models per plan, filtered by actually available models
    const planModels: Record<string, string[]> = {
      free: [
        "gpt-4o-mini",
        "openai/gpt-oss-120b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
      ],
      onetime: [
        "gpt-4o-mini",
        "openai/gpt-oss-120b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
      ],
      student: [
        "gpt-4o-mini",
        "openai/gpt-oss-120b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "gpt-4o",
        "claude-3-haiku",
      ],
      researcher: [
        "gpt-4o-mini",
        "gpt-4o",
        "claude-3-haiku",
        "claude-3-5-sonnet",
        "gemini-2.5-flash",
        "gemini-3.1-flash-lite-preview",
        "openai/gpt-oss-120b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
      ],
      institutional: [
        "gpt-4o-mini",
        "gpt-4o",
        "claude-3-haiku",
        "claude-3-5-sonnet",
        "gemini-2.5-flash",
        "gemini-3.1-flash-lite-preview",
        "openai/gpt-oss-120b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
      ],
    };

    const availableModels = planModels[planId] || planModels.free;

    // Get model details for actually available models
    const models = availableModels.map((modelId) => {
      const model = actuallyAvailableModels[modelId];
      return {
        id: modelId,
        name: model.name,
        description: model.description,
        maxTokens: model.maxTokens,
        isCurrent: modelId === currentModel,
      };
    });

    return res.status(200).json({
      success: true,
      models,
      currentModel,
    });
  } catch (error: any) {
    logger.error("Error fetching available AI models:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.get(
  "/available-models",
  authenticateExpressRequest,
  handleGetAvailableModels,
);

// Document Summarization endpoint
async function handlePostAISummarize(req: any, res: any) {
  try {
    const body = req.body;
    // Use authenticated user ID
    const userId = req.user?.id;
    const { content, summaryType, model } = body;

    if (!content || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: content and userId are required",
      });
    }

    // Check usage limit
    const { hasLimit } = await AIService.checkUsageLimit(userId);

    if (hasLimit) {
      // Send notification about limit reached
      await createNotification(
        userId,
        "ai_limit",
        "AI Usage Limit Reached",
        "You've reached your AI usage limit for this month. Upgrade your plan for unlimited access.",
        { limitReached: true },
      );

      return res.status(429).json({
        success: false,
        message:
          "You've reached your AI usage limit. Upgrade for unlimited access.",
        limitReached: true,
      });
    }

    // Process the summarization request using UnifiedAIService
    const result = await UnifiedAIService.processAIRequest({
      userId,
      capability: "summarization",
      content,
      options: {
        summaryType: summaryType || "long_document",
        preferredModel: model,
      },
    });

    // Save to history
    await AIService.saveAIHistoryItem(userId, {
      action: "summarization",
      originalText: content,
      suggestion: result.result,
      isFavorite: false,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    logger.error("Error processing AI summarization request:", error);

    // Handle specific error types
    if (error.message && error.message.includes("quota exceeded")) {
      return res.status(429).json({
        success: false,
        message:
          "AI service quota exceeded. Please try again later or upgrade your plan for more usage.",
      });
    } else if (
      error.message &&
      error.message.includes("authentication failed")
    ) {
      return res.status(401).json({
        success: false,
        message: "AI service authentication failed. Please contact support.",
      });
    } else if (error.message && error.message.includes("Invalid AI request")) {
      return res.status(400).json({
        success: false,
        message: "Invalid AI request. Please check your input and try again.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}

router.post("/summarize", authenticateExpressRequest, handlePostAISummarize);

// Document Q&A endpoint
async function handlePostAIDocumentQA(req: any, res: any) {
  try {
    const body = req.body;
    // Use authenticated user ID
    const userId = req.user?.id;
    const { documentContent, question, model } = body;

    if (!documentContent || !question || !userId) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: documentContent, question, and userId are required",
      });
    }

    // Check usage limit
    const { hasLimit } = await AIService.checkUsageLimit(userId);

    if (hasLimit) {
      // Send notification about limit reached
      await createNotification(
        userId,
        "ai_limit",
        "AI Usage Limit Reached",
        "You've reached your AI usage limit for this month. Upgrade your plan for unlimited access.",
        { limitReached: true },
      );

      return res.status(429).json({
        success: false,
        message:
          "You've reached your AI usage limit. Upgrade for unlimited access.",
        limitReached: true,
      });
    }

    // Process the document Q&A request using UnifiedAIService
    const result = await UnifiedAIService.processAIRequest({
      userId,
      capability: "document_qa",
      content: question,
      options: {
        documentContent,
        preferredModel: model,
      },
    });

    // Save to history
    await AIService.saveAIHistoryItem(userId, {
      action: "document_qa",
      originalText: question,
      suggestion: result.result,
      isFavorite: false,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    logger.error("Error processing AI document QA request:", error);

    // Handle specific error types
    if (error.message && error.message.includes("quota exceeded")) {
      return res.status(429).json({
        success: false,
        message:
          "AI service quota exceeded. Please try again later or upgrade your plan for more usage.",
      });
    } else if (
      error.message &&
      error.message.includes("authentication failed")
    ) {
      return res.status(401).json({
        success: false,
        message: "AI service authentication failed. Please contact support.",
      });
    } else if (error.message && error.message.includes("Invalid AI request")) {
      return res.status(400).json({
        success: false,
        message: "Invalid AI request. Please check your input and try again.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}

router.post("/document-qa", authenticateExpressRequest, handlePostAIDocumentQA);

// Writing Project Assistant endpoint
async function handlePostAIWritingProject(req: any, res: any) {
  try {
    const body = req.body;
    // Use authenticated user ID
    const userId = req.user?.id;
    const {
      userRequest,
      projectDescription,
      action,
      projectType,
      researchTopic,
      model,
    } = body;

    if (!userRequest || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userRequest and userId are required",
      });
    }

    // Check usage limit
    const { hasLimit } = await AIService.checkUsageLimit(userId);

    if (hasLimit) {
      // Send notification about limit reached
      await createNotification(
        userId,
        "ai_limit",
        "AI Usage Limit Reached",
        "You've reached your AI usage limit for this month. Upgrade your plan for unlimited access.",
        { limitReached: true },
      );

      return res.status(429).json({
        success: false,
        message:
          "You've reached your AI usage limit. Upgrade for unlimited access.",
        limitReached: true,
      });
    }

    // Process the writing project request using UnifiedAIService
    const result = await UnifiedAIService.processAIRequest({
      userId,
      capability: "writing_project",
      content: userRequest,
      options: {
        projectDescription: projectDescription || "",
        action: action || "assist",
        projectType: projectType || "research_paper",
        researchTopic: researchTopic || "",
        preferredModel: model,
      },
    });

    // Save to history
    await AIService.saveAIHistoryItem(userId, {
      action: "writing_project",
      originalText: userRequest,
      suggestion: result.result,
      isFavorite: false,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    logger.error("Error processing AI writing project request:", error);

    // Handle specific error types
    if (error.message && error.message.includes("quota exceeded")) {
      return res.status(429).json({
        success: false,
        message:
          "AI service quota exceeded. Please try again later or upgrade your plan for more usage.",
      });
    } else if (
      error.message &&
      error.message.includes("authentication failed")
    ) {
      return res.status(401).json({
        success: false,
        message: "AI service authentication failed. Please contact support.",
      });
    } else if (error.message && error.message.includes("Invalid AI request")) {
      return res.status(400).json({
        success: false,
        message: "Invalid AI request. Please check your input and try again.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}

router.post(
  "/writing-project",
  authenticateExpressRequest,
  handlePostAIWritingProject,
);

// AI Autocomplete endpoint
async function handlePostAIAutocomplete(req: any, res: any) {
  try {
    const body = req.body;
    // Use authenticated user ID
    const userId = req.user?.id;
    const { text } = body;

    if (!text || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: text and userId are required",
      });
    }

    // Check usage limit
    const { hasLimit } = await AIService.checkUsageLimit(userId);

    if (hasLimit) {
      // Send notification about limit reached
      await createNotification(
        userId,
        "ai_limit",
        "AI Usage Limit Reached",
        "You've reached your AI usage limit for this month. Upgrade your plan for unlimited access.",
        { limitReached: true },
      );

      return res.status(429).json({
        success: false,
        message:
          "You've reached your AI usage limit. Upgrade for unlimited access.",
        limitReached: true,
      });
    }

    // Get autocomplete suggestion
    // Mark as automatic since this is triggered automatically as the user types
    const suggestion = await AIService.getAutocompleteSuggestion(
      text,
      userId,
      true,
    );

    // Save to history
    await AIService.saveAIHistoryItem(userId, {
      action: "autocomplete",
      originalText: text,
      suggestion: suggestion,
      isFavorite: false,
    });

    return res.status(200).json({
      success: true,
      suggestion,
    });
  } catch (error: any) {
    logger.error("Error processing AI autocomplete request:", error);

    // Handle specific error types
    if (error.message && error.message.includes("quota exceeded")) {
      return res.status(429).json({
        success: false,
        message:
          "AI service quota exceeded. Please try again later or upgrade your plan for more usage.",
      });
    } else if (
      error.message &&
      error.message.includes("authentication failed")
    ) {
      return res.status(401).json({
        success: false,
        message: "AI service authentication failed. Please contact support.",
      });
    } else if (error.message && error.message.includes("Invalid AI request")) {
      return res.status(400).json({
        success: false,
        message: "Invalid AI request. Please check your input and try again.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}

router.post(
  "/autocomplete",
  authenticateExpressRequest,
  handlePostAIAutocomplete,
);

// AI Feedback endpoint
async function handlePostAIFeedback(req: any, res: any) {
  try {
    const body = req.body;
    // Use authenticated user ID
    const userId = req.user?.id;
    const { action, originalText, suggestion, feedback, isHelpful } = body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Validate required fields
    if (
      !action ||
      !originalText ||
      !suggestion ||
      typeof isHelpful !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: action, originalText, suggestion, and isHelpful are required",
      });
    }

    // Save feedback to database
    const feedbackRecord = await prisma.aIFeedback.create({
      data: {
        user_id: userId,
        action,
        original_text: originalText,
        suggestion,
        is_helpful: isHelpful,
        feedback_text: feedback || null,
        created_at: new Date(),
      },
    });

    // Log the feedback for analytics
    logger.info("AI feedback received", {
      userId,
      action,
      isHelpful,
      feedbackLength: feedback?.length || 0,
    });

    return res.status(200).json({
      success: true,
      message: "Feedback recorded successfully",
      feedbackId: feedbackRecord.id,
    });
  } catch (error: any) {
    logger.error("Error recording AI feedback:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.post("/feedback", authenticateExpressRequest, handlePostAIFeedback);

// Mount research routes
router.use("/research", researchRouter);

// Mount search routes
router.use("/search", searchRouter);

// Get AI analytics
async function handleGetAIAnalytics(req: any, res: any) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const analytics = await AIService.getAIAnalytics(userId);

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    logger.error("Error fetching AI analytics:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.get("/analytics", authenticateExpressRequest, handleGetAIAnalytics);

// Mount chat routes
router.use("/chat", chatRouter);

export default router;
