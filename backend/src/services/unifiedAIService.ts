import logger from "../monitoring/logger";
import { OpenAIService } from "./openaiService";
import { AnthropicService } from "./anthropicService";
import { GeminiService } from "./geminiService";
import { SubscriptionService } from "./subscriptionService";
import { prisma } from "../lib/prisma";
import { AIService } from "./aiService";

interface AIRequest {
  userId: string;
  capability:
    | "grammar_check"
    | "summarization"
    | "document_qa"
    | "writing_project";
  content: string;
  options?: {
    isAutomatic?: boolean;
    preferredModel?: string;
    [key: string]: any;
  };
}

interface AIResponse {
  result: string;
  tokensUsed: number;
  cost: number;
  modelUsed: string;
}

export class UnifiedAIService {
  // Process AI request based on capability and user subscription
  static async processAIRequest(request: AIRequest): Promise<AIResponse> {
    try {
      const { userId, capability, content, options = {} } = request;

      // Check user subscription plan
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      const planId = subscription?.plan || "free";

      // Check if user has access to the requested model
      const preferredModel = options.preferredModel;
      if (preferredModel) {
        const planModels: Record<string, string[]> = {
          free: ["gpt-4o-mini"], // Free plan: GPT-4o-mini only
          student: ["gpt-4o-mini", "gemini-2.5-flash", "claude-3-haiku"], // Student plan: GPT-4o-mini, Gemini 2.0 Flash, Claude 3.5 Haiku
          researcher: Object.keys(AIService.getAvailableModels()), // Researcher plan: All models
        };

        const availableModels = planModels[planId] || planModels.free;
        if (!availableModels.includes(preferredModel)) {
          throw new Error(
            `Model ${preferredModel} is not available for your ${planId} plan. Please upgrade your subscription or select a different model.`,
          );
        }
      }

      // Track usage before processing
      // Exempt automatic features from quota consumption
      const isAutomaticFeature = options?.isAutomatic === true;
      if (!isAutomaticFeature) {
        await this.trackAIUsage(userId, capability);
      }

      let result: any;
      let modelUsed: string;

      // Route to appropriate service based on capability and plan
      switch (capability) {
        case "grammar_check":
          // Grammar & Style Checking: GPT-4o-mini for grammar checking, chat, and quick tasks
          modelUsed = this.selectGrammarModel(planId, options.preferredModel);
          if (modelUsed.startsWith("gpt")) {
            result = await OpenAIService.checkGrammarAndStyle(
              content,
              modelUsed as any,
            );
          } else {
            // For Claude models, we'll use the Anthropic service
            result = await AnthropicService.sendMessage(
              [
                {
                  role: "user",
                  content: `Check the following text for grammar, style, and clarity improvements:\n\n${content}`,
                },
              ],
              modelUsed,
              1500,
              0.3,
            );
          }
          break;

        case "summarization":
          // Document Summarization: Claude 3.5 Sonnet for long documents, research, and summarization tasks
          modelUsed = this.selectSummarizationModel(
            planId,
            options.preferredModel,
          );
          result = await AnthropicService.summarizeDocument(
            content,
            options.summaryType,
            modelUsed,
          );
          break;

        case "document_qa":
          // AI Chat Assistant for Document Q&A: GPT-4o for complex writing and deep analysis
          modelUsed = this.selectQAModel(planId, options.preferredModel);
          if (modelUsed.startsWith("gpt")) {
            // For OpenAI models, we'll adapt the Anthropic service interface
            const messages = [
              {
                role: "user" as const,
                content: `Document content:
${options.documentContent}

Question:
${content}`,
              },
            ];
            result = await OpenAIService.sendCompletion(
              messages[0].content,
              modelUsed,
              2048,
              0.5,
            );
          } else {
            result = await AnthropicService.answerDocumentQuestion(
              options.documentContent,
              content,
              modelUsed as any,
            );
          }
          break;

        case "writing_project":
          // Writing Project AI Assistant: Gemini models for reasoning, coding, and multimodal tasks
          modelUsed = this.selectWritingProjectModel(
            planId,
            options.preferredModel,
          );
          if (options.action === "outline") {
            result = await GeminiService.generateProjectOutline(
              content,
              options.projectType,
              modelUsed,
            );
          } else if (options.action === "research") {
            result = await GeminiService.provideResearchAssistance(
              options.researchTopic,
              content,
              modelUsed,
            );
          } else {
            result = await GeminiService.assistWithWritingProject(
              options.projectDescription,
              content,
              modelUsed,
            );
          }
          break;

        default:
          throw new Error(`Unsupported AI capability: ${capability}`);
      }

      // Track usage after successful processing
      // Exempt automatic features from usage tracking
      if (!isAutomaticFeature) {
        await this.trackAIUsage(userId, capability, {
          model: modelUsed,
          tokensUsed: result.tokensUsed,
          cost: result.cost,
        });
      }

      return {
        result: result.content,
        tokensUsed: result.tokensUsed,
        cost: result.cost,
        modelUsed,
      };
    } catch (error: any) {
      logger.error(
        `Error processing AI request for capability ${request.capability}:`,
        error,
      );
      throw new Error(`AI request failed: ${error.message}`);
    }
  }

  // Select appropriate model for grammar checking based on plan
  private static selectGrammarModel(
    planId: string,
    preferredModel?: string,
  ): string {
    // Define available models per plan
    const planModels: Record<string, string[]> = {
      free: ["gpt-4o-mini"],
      onetime: ["gpt-4o-mini", "gemini-2.5-flash"],
      student: ["gpt-4o-mini", "gemini-2.5-flash", "claude-3-haiku"],
      researcher: [
        "gpt-4o-mini",
        "gpt-4o",
        "claude-3-haiku",
        "claude-3-5-sonnet",
        "gemini-2.5-flash",
        "gemini-3.1-flash-lite-preview",
      ],
      // institutional: [
      //   "gpt-4o-mini",
      //   "gpt-4o",
      //   "claude-3-haiku",
      //   "claude-3-5-sonnet",
      //   "gemini-2.5-flash",
      //   "gemini-3.1-flash-lite-preview",
      // ],
    };

    // Filter by actually available models
    const actuallyAvailableModels = Object.keys(AIService.getAvailableModels());
    const availableModels =
      planModels[planId]?.filter((model) =>
        actuallyAvailableModels.includes(model),
      ) ||
      planModels.free.filter((model) =>
        actuallyAvailableModels.includes(model),
      );

    // If user has a preferred model and it's available, use it
    if (preferredModel && availableModels.includes(preferredModel)) {
      return preferredModel;
    }

    // Otherwise, use the best available model for the plan
    return availableModels.length > 0 ? availableModels[0] : "gpt-4o-mini";
  }

  // Select appropriate model for document Q&A based on plan
  private static selectQAModel(
    planId: string,
    preferredModel?: string,
  ): string {
    // Define available models per plan
    const planModels: Record<string, string[]> = {
      free: ["gpt-4o-mini"],
      onetime: ["gpt-4o-mini", "gemini-2.5-flash"],
      student: ["gpt-4o-mini", "gemini-2.5-flash", "claude-3-haiku"],
      researcher: [
        "gpt-4o-mini",
        "gpt-4o",
        "claude-3-haiku",
        "claude-3-5-sonnet",
        "gemini-2.5-flash",
        "gemini-3.1-flash-lite-preview",
      ],
      // institutional: [
      //   "gpt-4o-mini",
      //   "gpt-4o",
      //   "claude-3-haiku",
      //   "claude-3-5-sonnet",
      //   "gemini-2.5-flash",
      //   "gemini-3.1-flash-lite-preview",
      // ],
    };

    // Filter by actually available models
    const actuallyAvailableModels = Object.keys(AIService.getAvailableModels());
    const availableModels =
      planModels[planId]?.filter((model) =>
        actuallyAvailableModels.includes(model),
      ) ||
      planModels.free.filter((model) =>
        actuallyAvailableModels.includes(model),
      );

    // If user has a preferred model and it's available, use it
    if (preferredModel && availableModels.includes(preferredModel)) {
      return preferredModel;
    }

    // Otherwise, use the best available model for the plan
    return availableModels.length > 0 ? availableModels[0] : "gpt-4o-mini";
  }

  // Select appropriate model for writing project based on plan
  private static selectWritingProjectModel(
    planId: string,
    preferredModel?: string,
  ): string {
    // Define available models per plan
    const planModels: Record<string, string[]> = {
      free: ["gpt-4o-mini"],
      onetime: ["gpt-4o-mini", "gemini-2.5-flash"],
      student: ["gpt-4o-mini", "gemini-2.5-flash", "claude-3-haiku"],
      researcher: [
        "gpt-4o-mini",
        "gpt-4o",
        "claude-3-haiku",
        "claude-3-5-sonnet",
        "gemini-2.5-flash",
        "gemini-3.1-flash-lite-preview",
      ],
      // institutional: [
      //   "gpt-4o-mini",
      //   "gpt-4o",
      //   "claude-3-haiku",
      //   "claude-3-5-sonnet",
      //   "gemini-2.5-flash",
      //   "gemini-3.1-flash-lite-preview",
      // ],
    };

    // Filter by actually available models
    const actuallyAvailableModels = Object.keys(AIService.getAvailableModels());
    const availableModels =
      planModels[planId]?.filter((model) =>
        actuallyAvailableModels.includes(model),
      ) ||
      planModels.free.filter((model) =>
        actuallyAvailableModels.includes(model),
      );

    // If user has a preferred model and it's available, use it
    if (preferredModel && availableModels.includes(preferredModel)) {
      return preferredModel;
    }

    // Otherwise, use the best available model for the plan
    return availableModels.length > 0 ? availableModels[0] : "gpt-4o-mini";
  }

  // Select appropriate model for structured tasks and fast responses
  private static selectStructuredTaskModel(
    planId: string,
    preferredModel?: string,
  ): string {
    // Define available models per plan
    const planModels: Record<string, string[]> = {
      free: ["gpt-4o-mini"],
      onetime: ["gpt-4o-mini", "gemini-2.5-flash"],
      student: ["gpt-4o-mini", "gemini-2.5-flash", "claude-3-haiku"],
      researcher: [
        "gpt-4o-mini",
        "gpt-4o",
        "claude-3-haiku",
        "claude-3-5-sonnet",
        "gemini-2.5-flash",
        "gemini-3.1-flash-lite-preview",
      ],
      // institutional: [
      //   "gpt-4o-mini",
      //   "gpt-4o",
      //   "claude-3-haiku",
      //   "claude-3-5-sonnet",
      //   "gemini-2.5-flash",
      //   "gemini-3.1-flash-lite-preview",
      // ],
    };

    // Filter by actually available models
    const actuallyAvailableModels = Object.keys(AIService.getAvailableModels());
    const availableModels =
      planModels[planId]?.filter((model) =>
        actuallyAvailableModels.includes(model),
      ) ||
      planModels.free.filter((model) =>
        actuallyAvailableModels.includes(model),
      );

    // If user has a preferred model and it's available, use it
    if (preferredModel && availableModels.includes(preferredModel)) {
      return preferredModel;
    }

    // Otherwise, use the best available model for the plan
    return availableModels.length > 0 ? availableModels[0] : "gpt-4o-mini";
  }

  // Select appropriate model for summarization based on plan
  private static selectSummarizationModel(
    planId: string,
    preferredModel?: string,
  ): string {
    // Define available models per plan
    const planModels: Record<string, string[]> = {
      free: ["gpt-4o-mini"],
      onetime: ["gpt-4o-mini", "gemini-2.5-flash"],
      student: ["gpt-4o-mini", "gemini-2.5-flash", "claude-3-haiku"],
      researcher: [
        "gpt-4o-mini",
        "gpt-4o",
        "claude-3-haiku",
        "claude-3-5-sonnet",
        "gemini-2.5-flash",
        "gemini-3.1-flash-lite-preview",
      ],
      // institutional: [
      //   "gpt-4o-mini",
      //   "gpt-4o",
      //   "claude-3-haiku",
      //   "claude-3-5-sonnet",
      //   "gemini-2.5-flash",
      //   "gemini-3.1-flash-lite-preview",
      // ],
    };

    // Filter by actually available models
    const actuallyAvailableModels = Object.keys(AIService.getAvailableModels());
    const availableModels =
      planModels[planId]?.filter((model) =>
        actuallyAvailableModels.includes(model),
      ) ||
      planModels.free.filter((model) =>
        actuallyAvailableModels.includes(model),
      );

    // If user has a preferred model and it's available, use it
    if (preferredModel && availableModels.includes(preferredModel)) {
      return preferredModel;
    }

    // Otherwise, use the best available model for the plan
    return availableModels.length > 0 ? availableModels[0] : "gpt-4o-mini";
  }

  // Track AI usage for billing and analytics
  static async trackAIUsage(
    userId: string,
    capability: string,
    metadata?: { model?: string; tokensUsed?: number; cost?: number },
  ) {
    try {
      // Get current usage for the user this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const usage: any = await prisma.aIUsage.findUnique({
        where: {
          user_id_month_year: {
            user_id: userId,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        },
      });

      // Prepare update data based on capability
      const updateData: any = { updated_at: new Date() };

      switch (capability) {
        case "grammar_check":
          updateData.grammar_check_count = usage?.grammar_check_count
            ? usage.grammar_check_count + 1
            : 1;
          break;
        case "summarization":
          updateData.summarization_count = usage?.summarization_count
            ? usage.summarization_count + 1
            : 1;
          break;
        case "document_qa":
          updateData.document_qa_count = usage?.document_qa_count
            ? usage.document_qa_count + 1
            : 1;
          break;
        case "writing_project":
          updateData.writing_project_count = usage?.writing_project_count
            ? usage.writing_project_count + 1
            : 1;
          break;
        default:
          updateData.request_count = usage?.request_count
            ? usage.request_count + 1
            : 1;
      }

      let usageRecord;
      if (usage) {
        // Update existing usage record
        usageRecord = await prisma.aIUsage.update({
          where: { id: usage.id },
          data: updateData,
        });
      } else {
        // Create new usage record with initial values
        const createData: any = {
          user_id: userId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          request_count: 0,
          grammar_check_count: 0,
          summarization_count: 0,
          document_qa_count: 0,
          writing_project_count: 0,
          chat_message_count: 0,
          image_generation_count: 0,
          web_search_count: 0,
          deep_search_count: 0,
        };

        // Set the appropriate count to 1 for the current capability
        switch (capability) {
          case "grammar_check":
            createData.grammar_check_count = 1;
            break;
          case "summarization":
            createData.summarization_count = 1;
            break;
          case "document_qa":
            createData.document_qa_count = 1;
            break;
          case "writing_project":
            createData.writing_project_count = 1;
            break;
          default:
            createData.request_count = 1;
        }

        usageRecord = await prisma.aIUsage.create({
          data: createData,
        });
      }

      // If metadata is provided, update tokens and cost
      if (metadata) {
        const costUpdateData: any = {
          updated_at: new Date(),
        };

        if (metadata.tokensUsed) {
          costUpdateData.total_tokens_used = usage?.total_tokens_used
            ? usage.total_tokens_used + metadata.tokensUsed
            : metadata.tokensUsed;
        }

        if (metadata.cost) {
          costUpdateData.total_cost = usage?.total_cost
            ? usage.total_cost + metadata.cost
            : metadata.cost;
        }

        await prisma.aIUsage.update({
          where: { id: usageRecord.id },
          data: costUpdateData,
        });
      }

      logger.info("AI usage tracked", {
        userId,
        capability,
        metadata,
      });
    } catch (error) {
      logger.error("Error tracking AI usage:", error);
    }
  }

  // Check if user has reached their AI usage limit
  static async checkUsageLimit(userId: string, capability: string) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      const planId = subscription?.plan || "free";

      // Define limits per plan (requests per month)
      const limits: Record<string, Record<string, number>> = {
        free: {
          grammar_check: 50,
          summarization: 10,
          document_qa: 20,
          writing_project: 5,
        },
        student: {
          grammar_check: 500,
          summarization: 100,
          document_qa: 200,
          writing_project: 50,
        },
        researcher: {
          grammar_check: -1, // Unlimited
          summarization: -1, // Unlimited
          document_qa: -1, // Unlimited
          writing_project: -1, // Unlimited
        },
      };

      const planLimits = limits[planId] || limits.free;
      const limit = planLimits[capability] || 0;

      if (limit === -1) {
        return { hasLimit: false, remaining: 1000000 }; // Unlimited
      }

      // Get current usage
      const now = new Date();
      const usage: any = await prisma.aIUsage.findUnique({
        where: {
          user_id_month_year: {
            user_id: userId,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        },
      });

      if (!usage) {
        return { hasLimit: limit > 0, remaining: limit };
      }

      let used = 0;
      switch (capability) {
        case "grammar_check":
          used = usage.grammar_check_count || 0;
          break;
        case "summarization":
          used = usage.summarization_count || 0;
          break;
        case "document_qa":
          used = usage.document_qa_count || 0;
          break;
        case "writing_project":
          used = usage.writing_project_count || 0;
          break;
        default:
          used = usage.request_count || 0;
      }

      const remaining = limit - used;
      return {
        hasLimit: remaining <= 0,
        remaining: remaining > 0 ? remaining : 0,
      };
    } catch (error) {
      logger.error("Error checking AI usage limit:", error);
      return { hasLimit: false, remaining: 1000000 };
    }
  }
}
