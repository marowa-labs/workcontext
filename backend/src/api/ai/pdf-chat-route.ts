import { Router, type Router as ExpressRouter } from "express";
import logger from "../../monitoring/logger";
import { authenticateExpressRequest } from "../../middleware/auth";
import { SubscriptionService } from "../../services/subscriptionService";
import { createNotification } from "../../services/notificationService";
import {
  downloadAndExtractPdf,
  buildPdfChatSystemPrompt,
  sendPdfChatMessage,
  generateSuggestedQuestions,
} from "../../services/pdfChatService";
import { BYOKService } from "../../services/byokService";
import { prisma } from "../../lib/prisma";

const router: ExpressRouter = Router();

/**
 * POST /api/ai/pdf-chat
 * Send a message to AI with PDF document context.
 *
 * Body: {
 *   fileUrl: string,       // URL of the PDF file
 *   fileName: string,      // Name of the PDF file
 *   message: string,       // User's question/message
 *   annotations: Array,    // User's annotations on the document
 *   conversationHistory: [] // Previous messages for context
 * }
 */
router.post("/", authenticateExpressRequest, async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const {
      fileUrl,
      fileName,
      message,
      annotations = [],
      conversationHistory = [],
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!fileUrl || !message) {
      return res.status(400).json({
        success: false,
        message: "fileUrl and message are required",
      });
    }

    // Check subscription limits
    const canPerform = await SubscriptionService.canPerformAction(
      userId,
      "ai_chat_message",
    );
    if (!canPerform.allowed) {
      await createNotification(
        userId,
        "ai_limit",
        "AI Chat Limit Reached",
        "You've reached your AI chat message limit for this month. Upgrade your plan for unlimited access.",
        { limitReached: true },
      );

      return res.status(429).json({
        success: false,
        message:
          canPerform.reason ||
          "You've reached your AI chat message limit. Upgrade for more.",
        limitReached: true,
      });
    }

    logger.info("PDF chat request", {
      userId: userId.substring(0, 8) + "...",
      fileName,
      messageLength: message.length,
      annotationCount: annotations.length,
    });

    // Step 1: Download and extract PDF text
    let pdfText: string;
    try {
      pdfText = await downloadAndExtractPdf(fileUrl);
    } catch (pdfError: any) {
      logger.error("Failed to process PDF:", pdfError);
      return res.status(422).json({
        success: false,
        message: `Failed to read PDF: ${pdfError.message}`,
      });
    }

    if (!pdfText || pdfText.trim().length === 0) {
      return res.status(422).json({
        success: false,
        message:
          "The PDF appears to be empty or contains only images. Text-based PDFs are required for AI analysis.",
      });
    }

    // Step 2: Get user's preferred AI model from database
    let user: any;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          preferred_ai_model: true,
        },
      });
    } catch (dbError: any) {
      logger.error("Failed to fetch user preferences:", dbError);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch user preferences",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Step 3: Determine which model to use
    const preferredModel = user.preferred_ai_model || "gemini-2.0-flash";

    // Step 4: Check if user has API keys configured for any provider
    const byokSettings = await BYOKService.getSettings(userId);
    const hasAnyKey =
      byokSettings.hasGoogleKey ||
      byokSettings.hasOpenAIKey ||
      byokSettings.hasClaudeKey ||
      byokSettings.hasOpenRouterKey;

    if (!hasAnyKey) {
      return res.status(401).json({
        success: false,
        message:
          "No AI API keys configured. Please add your API key in Settings → AI API Keys.",
      });
    }

    // Step 5: Build system prompt with PDF content
    const systemPrompt = buildPdfChatSystemPrompt(
      pdfText,
      annotations,
      fileName || "document.pdf",
    );

    // Step 6: Send to AI using user's preferred model/provider
    const aiResponse = await sendPdfChatMessage({
      userId,
      modelName: preferredModel,
      systemPrompt,
      userMessage: message,
      conversationHistory,
    });

    logger.info("PDF chat response generated", {
      userId: userId.substring(0, 8) + "...",
      responseLength: aiResponse.length,
    });

    return res.status(200).json({
      success: true,
      response: aiResponse,
    });
  } catch (error: any) {
    logger.error("Error in PDF chat:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

/**
 * POST /api/ai/pdf-suggest-questions
 * Generate suggested questions based on PDF content.
 *
 * Body: { fileUrl: string, fileName: string }
 */
router.post(
  "/suggest-questions",
  authenticateExpressRequest,
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      const { fileUrl, fileName } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!fileUrl) {
        return res.status(400).json({
          success: false,
          message: "fileUrl is required",
        });
      }

      // Check subscription limits
      const canPerform = await SubscriptionService.canPerformAction(
        userId,
        "ai_chat_message",
      );
      if (!canPerform.allowed) {
        return res.status(429).json({
          success: false,
          message:
            canPerform.reason ||
            "You've reached your AI message limit. Upgrade for more.",
          limitReached: true,
        });
      }

      // Extract PDF text
      let pdfText: string;
      try {
        pdfText = await downloadAndExtractPdf(fileUrl);
      } catch (pdfError: any) {
        logger.error("Failed to process PDF for suggestions:", pdfError);
        return res.status(422).json({
          success: false,
          message: `Failed to read PDF: ${pdfError.message}`,
        });
      }

      if (!pdfText || pdfText.trim().length === 0) {
        return res.status(422).json({
          success: false,
          message: "The PDF appears to be empty or contains only images.",
        });
      }

      // Get user's preferred model
      const user: any = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferred_ai_model: true },
      });
      const preferredModel = user?.preferred_ai_model || "gemini-2.0-flash";

      // Generate questions
      const questions = await generateSuggestedQuestions({
        userId,
        modelName: preferredModel,
        pdfText,
        fileName: fileName || "document.pdf",
      });

      return res.status(200).json({
        success: true,
        questions,
      });
    } catch (error: any) {
      logger.error("Error generating suggested questions:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },
);

export default router;
