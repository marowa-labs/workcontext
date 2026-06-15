import { Router, type Router as ExpressRouter } from "express";
import { authenticateExpressRequest } from "../../middleware/auth";
import logger from "../../monitoring/logger";
import { prisma } from "../../lib/prisma";
import { AIService } from "../../services/aiService";
import { UnifiedAIService } from "../../services/unifiedAIService";
import { plans } from "../../services/subscriptionService";
import { createNotification } from "../../services/notificationService";
import { BYOKService } from "../../services/byokService";
import { EncryptionService } from "../../services/encryptionService";
import researchRouter from "./research-route";
import searchRouter from "./search-route";
import chatRouter from "./chat-route";
import actionsRouter from "./actions/route";

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

    // Always save the user's model preference — runtime routing handles provider/key mismatches gracefully
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
        preferredModel: user?.preferred_ai_model || null,
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

// Get user's preferred AI model
async function handleGetPreferredModel(req: any, res: any) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user: any = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferred_ai_model: true },
    });

    return res.status(200).json({
      success: true,
      preferredModel: user?.preferred_ai_model || null,
    });
  } catch (error: any) {
    logger.error("Error fetching preferred AI model:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.get(
  "/preferred-model",
  authenticateExpressRequest,
  handleGetPreferredModel,
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

    const currentModel = user?.preferred_ai_model || null;

    // Get user's subscription to determine available models
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });

    const planId = subscription?.plan || "free";

    // Get BYOK-aware available models (user's keys first, then system keys)
    const availableModelsMap = await AIService.getUserAvailableModels(userId);
    const availableModelIds = Object.keys(availableModelsMap);

    // Check if user has BYOK keys for display purposes
    const byokSettings = await BYOKService.getSettings(userId);
    const hasBYOK =
      byokSettings.hasGoogleKey ||
      byokSettings.hasOpenAIKey ||
      byokSettings.hasClaudeKey ||
      byokSettings.hasOpenRouterKey;

    // Build model list
    const models = availableModelIds.map((modelId) => {
      const model = availableModelsMap[modelId];
      return {
        id: modelId,
        name: model.name,
        description: model.description,
        maxTokens: model.maxTokens,
        custom: model.custom || false,
        isCurrent: modelId === currentModel,
      };
    });

    return res.status(200).json({
      success: true,
      models,
      currentModel,
      byokEnabled: hasBYOK,
    });
  } catch (error: any) {
    logger.error("Error fetching available AI models:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// --- DEPRECATED: Old plan-based model filtering kept for reference ---
/*
    // Define available models per plan, filtered by actually available models
    const planModels: Record<string, string[]> = {
      free: [
        "gemini-3.1-flash-lite",
        "openai/gpt-oss-120b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      ],
      onetime: [
        "gemini-3.1-flash-lite",
        "openai/gpt-oss-120b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      ],
      student: [
        "gemini-3.1-flash-lite",
        "openai/gpt-oss-120b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      ],
      researcher: [
        "gemini-3.1-flash-lite",
        "gemini-3.1-flash-lite",
        "openai/gpt-oss-120b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      ],
      institutional: [
        "gemini-3.1-flash-lite",
        "gemini-3.1-flash-lite",
        "openai/gpt-oss-120b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      ],
    };
    
}
*/

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

// Mount action routes
router.use("/actions", actionsRouter);

// Mount chat routes
router.use("/chat", chatRouter);

// ==================== BYOK (Bring Your Own Key) Endpoints ====================

// Get BYOK settings
async function handleGetBYOKSettings(req: any, res: any) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const settings = await BYOKService.getSettings(userId);

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error: any) {
    logger.error("Error fetching BYOK settings:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Update BYOK settings (enable/disable, provider)
async function handleUpdateBYOKSettings(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { enabled, provider } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Validate provider if provided
    if (
      provider &&
      !["google", "anthropic", "openai", "openrouter", null].includes(provider)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid provider. Must be 'google', 'anthropic', 'openai', 'openrouter', or null",
      });
    }

    const settings = await BYOKService.saveSettings(userId, {
      enabled,
      provider: provider || null,
    });

    return res.status(200).json({
      success: true,
      message: "BYOK settings updated successfully",
      settings,
    });
  } catch (error: any) {
    logger.error("Error updating BYOK settings:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Save API key
async function handleSaveBYOKKey(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { provider, apiKey } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (
      !provider ||
      !["google", "anthropic", "openai", "openrouter"].includes(provider)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid provider required (google, anthropic, openai, or openrouter)",
      });
    }

    if (!apiKey || typeof apiKey !== "string") {
      return res.status(400).json({
        success: false,
        message: "API key is required",
      });
    }

    // Validate key format (skip for OpenRouter as it uses a different format)
    if (
      provider !== "openrouter" &&
      !EncryptionService.validateApiKeyFormat(apiKey, provider)
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid API key format for ${provider}`,
      });
    }

    // Test the key before saving
    const testResult = await BYOKService.testApiKey(provider, apiKey);

    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        message: `API key validation failed: ${testResult.message}`,
      });
    }

    // Save the encrypted key
    await BYOKService.saveApiKey(userId, provider, apiKey);

    return res.status(200).json({
      success: true,
      message: `${provider} API key saved and validated successfully`,
      testMessage: testResult.message,
    });
  } catch (error: any) {
    logger.error("Error saving BYOK key:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Delete API key
async function handleDeleteBYOKKey(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { provider } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!provider || !["google", "anthropic", "openai"].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: "Valid provider required (google, anthropic, or openai)",
      });
    }

    await BYOKService.deleteApiKey(userId, provider);

    return res.status(200).json({
      success: true,
      message: `${provider} API key deleted successfully`,
    });
  } catch (error: any) {
    logger.error("Error deleting BYOK key:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Test API key (without saving)
async function handleTestBYOKKey(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { provider, apiKey } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!provider || !["google", "anthropic", "openai"].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: "Valid provider required (google, anthropic, or openai)",
      });
    }

    if (!apiKey || typeof apiKey !== "string") {
      return res.status(400).json({
        success: false,
        message: "API key is required",
      });
    }

    const result = await BYOKService.testApiKey(provider, apiKey);

    return res.status(200).json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    logger.error("Error testing BYOK key:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// BYOK Routes
logger.info("Registering BYOK routes");
router.get("/byok/settings", authenticateExpressRequest, handleGetBYOKSettings);
router.put(
  "/byok/settings",
  authenticateExpressRequest,
  handleUpdateBYOKSettings,
);
router.post("/byok/keys", authenticateExpressRequest, handleSaveBYOKKey);
router.delete(
  "/byok/keys/:provider",
  authenticateExpressRequest,
  handleDeleteBYOKKey,
);
router.post("/byok/test", authenticateExpressRequest, handleTestBYOKKey);

// Get key status for all providers
async function handleGetKeyStatus(req: any, res: any) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }
    const statuses = await BYOKService.getKeyStatuses(userId);
    return res.status(200).json({ success: true, statuses });
  } catch (error: any) {
    logger.error("Error fetching key statuses:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
router.get("/byok/status", authenticateExpressRequest, handleGetKeyStatus);

// Refresh models for a specific provider (re-fetch from provider API)
async function handleRefreshModels(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { provider } = req.body;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }
    if (
      !provider ||
      !["google", "anthropic", "openai", "openrouter"].includes(provider)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid provider" });
    }

    // Get the user's decrypted key for this provider
    const encryptedFieldMap: Record<string, string> = {
      google: "byok_google_key_encrypted",
      anthropic: "byok_claude_key_encrypted",
      openai: "byok_openai_key_encrypted",
      openrouter: "byok_openrouter_key_encrypted",
    };
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { [encryptedFieldMap[provider]]: true },
    });
    const encryptedKey = user?.[
      encryptedFieldMap[provider] as keyof typeof user
    ] as string | null;
    if (!encryptedKey) {
      return res.status(400).json({
        success: false,
        message: `No API key configured for ${provider}`,
      });
    }

    const { EncryptionService } =
      await import("../../services/encryptionService");
    const apiKey = EncryptionService.decrypt(encryptedKey);

    // Fetch fresh models from provider
    const models = await BYOKService.fetchProviderModels(
      provider as any,
      apiKey,
    );
    if (models.length > 0) {
      await BYOKService.saveProviderModels(userId, provider, models);
    }

    return res.status(200).json({
      success: true,
      message: `Refreshed ${models.length} models for ${provider}`,
      models,
    });
  } catch (error: any) {
    logger.error("Error refreshing models:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to refresh models",
    });
  }
}
router.post(
  "/byok/refresh-models",
  authenticateExpressRequest,
  handleRefreshModels,
);

// Add a custom model for a provider
async function handleAddCustomModel(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { provider, modelId, modelName } = req.body;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    if (!provider || !modelId) {
      return res
        .status(400)
        .json({ success: false, message: "Provider and modelId are required" });
    }
    if (!["google", "anthropic", "openai", "openrouter"].includes(provider)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid provider" });
    }

    // Determine the full model ID (add provider prefix if missing)
    let fullId = modelId;
    if (
      !modelId.includes("/") &&
      !modelId.startsWith("gemini") &&
      !modelId.startsWith("claude-")
    ) {
      const prefixMap: Record<string, string> = {
        openai: "openai/",
        anthropic: "anthropic/",
        openrouter: "",
        google: "",
      };
      fullId = (prefixMap[provider] || "") + modelId;
    }

    const displayName =
      modelName ||
      modelId
        .replace(/^[a-z]+\//, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase());

    await BYOKService.addCustomModel(userId, provider, {
      id: fullId,
      name: displayName,
      description: `Custom model: ${displayName}`,
      maxTokens: 128000,
    });

    return res.status(200).json({
      success: true,
      message: `Custom model "${displayName}" added for ${provider}`,
      model: {
        id: fullId,
        name: displayName,
        description: `Custom model: ${displayName}`,
        maxTokens: 128000,
      },
    });
  } catch (error: any) {
    logger.error("Error adding custom model:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add custom model",
    });
  }
}
router.post(
  "/byok/custom-model",
  authenticateExpressRequest,
  handleAddCustomModel,
);

// Remove a custom model for a provider
async function handleRemoveCustomModel(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const { provider, modelId } = req.body;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    if (!provider || !modelId) {
      return res
        .status(400)
        .json({ success: false, message: "Provider and modelId are required" });
    }

    await BYOKService.removeCustomModel(userId, provider, modelId);

    return res.status(200).json({
      success: true,
      message: `Custom model removed from ${provider}`,
    });
  } catch (error: any) {
    logger.error("Error removing custom model:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove custom model",
    });
  }
}
router.post(
  "/byok/custom-model/remove",
  authenticateExpressRequest,
  handleRemoveCustomModel,
);

logger.info("BYOK routes registered successfully");

export default router;
