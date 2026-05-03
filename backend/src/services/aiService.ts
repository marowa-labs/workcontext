import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenRouter } from "@openrouter/sdk";
import logger from "../monitoring/logger";
import { prisma } from "../lib/prisma";
import { SubscriptionService, plans } from "./subscriptionService";
import { createNotification } from "./notificationService";
import { aiPerformanceMonitor } from "../monitoring/aiPerformance";
import { SearchService } from "./searchService";
import { SecretsService } from "./secrets-service";
import { AIPerformanceMetric, AIUsage } from "@prisma/client";

// OpenRouter client (lazy initialized)
let openRouterClient: OpenRouter | null = null;
const getOpenRouterClient = (): OpenRouter | null => {
  if (!openRouterClient) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (apiKey) {
      openRouterClient = new OpenRouter({ apiKey });
    }
  }
  return openRouterClient;
};

// Initialize Google Generative AI client
let genAI: GoogleGenerativeAI | null = null;

// Initialize the genAI instance
const initializeGenAI = async () => {
  const apiKey = await SecretsService.getSecret("GEMINI_API_KEY");
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

// Initialize at startup
initializeGenAI();

// Helper function to get initialized genAI instance
const getGenAI = async (): Promise<GoogleGenerativeAI | null> => {
  if (!genAI) {
    const apiKey = await SecretsService.getSecret("GEMINI_API_KEY");
    if (apiKey) {
      genAI = new GoogleGenerativeAI(apiKey);
    }
  }
  return genAI;
};

// Log Gemini API key status for debugging
const logGeminiStatus = async () => {
  const hasApiKey = !!(await SecretsService.getSecret("GEMINI_API_KEY"));
  const apiKeyLength = (await SecretsService.getSecret("GEMINI_API_KEY"))
    ?.length;

  logger.info("Gemini API Key Status", {
    hasApiKey,
    apiKeyLength,
  });
};

logGeminiStatus();

// Track session time for autocomplete restrictions
const sessionStartTime = new Map<string, number>(); // userId -> session start time
const SESSION_TIMEOUT = 6 * 60 * 1000; // 6 minutes in milliseconds

interface AIModel {
  name: string;
  description: string;
  maxTokens: number;
}

// Define available AI models
const AI_MODELS: Record<string, AIModel> = {
  "gemini-2.5-flash": {
    name: "Gemini 2.5 Flash",
    description: "Fast and efficient Gemini model",
    maxTokens: 1048576,
  },
  "gemini-3.1-flash-lite-preview": {
    name: "Gemini 3.1 Flash Lite",
    description: "Google's advanced multimodal model",
    maxTokens: 1048576,
  },
  "openai/gpt-oss-120b:free": {
    name: "GPT OSS 120B",
    description: "Free open-source 120B model via OpenRouter",
    maxTokens: 131072,
  },
  "nvidia/nemotron-3-super-120b-a12b:free": {
    name: "Nvidia Nemotron Super 120B",
    description: "Nvidia's free 120B reasoning model via OpenRouter",
    maxTokens: 131072,
  },
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": {
    name: "Nemotron 3 Nano Omni",
    description: "Multimodal model for text, image, video, and audio inputs. Built for enterprise agent systems with 300K context and 16K reasoning budget.",
    maxTokens: 300000,
  },
};

interface AIRequest {
  action: string;
  text: string;
  context?: string;
  preferences?: {
    tone?: string;
    formality?: string;
    field?: string;
    style?: string;
  };
  userId: string;
  imageUrl?: string;
  fileUrl?: string;
  metadata?: any;
  model?: string; // Add model parameter
  isAutomatic?: boolean; // Add isAutomatic parameter to identify automatic requests
}

interface AISuggestion {
  original: string;
  suggestion: string;
  changes: Array<{
    type: "addition" | "removal" | "modification";
    position: { start: number; end: number };
    original: string;
    suggested: string;
    explanation: string;
  }>;
  confidence: number;
  alternatives?: string[];
}

export class AIService {
  // Track AI usage for users with enhanced tracking
  static async trackAIUsage(
    userId: string,
    usageType: string = "request",
    metadata?: {
      model?: string;
      tokensUsed?: number;
      inputTokens?: number;
      outputTokens?: number;
      cost?: number;
    },
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

      // Prepare update data based on usage type
      const updateData: any = { updated_at: new Date() };

      switch (usageType) {
        case "chat_message":
          updateData.chat_message_count = usage?.chat_message_count
            ? usage.chat_message_count + 1
            : 1;
          break;
        case "image_generation":
          updateData.image_generation_count = usage?.image_generation_count
            ? usage.image_generation_count + 1
            : 1;
          break;
        case "web_search":
          updateData.web_search_count = usage?.web_search_count
            ? usage.web_search_count + 1
            : 1;
          break;
        case "deep_search":
          updateData.deep_search_count = usage?.deep_search_count
            ? usage.deep_search_count + 1
            : 1;
          break;
        default:
          updateData.request_count = usage?.request_count
            ? usage.request_count + 1
            : 1;
      }

      // Track tokens and cost if metadata provided
      if (metadata?.tokensUsed) {
        updateData.total_tokens_used =
          (usage?.total_tokens_used || 0) + metadata.tokensUsed;
      }
      if (metadata?.cost) {
        updateData.total_cost_estimate =
          (usage?.total_cost_estimate || 0) + metadata.cost;
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
          chat_message_count: 0,
          image_generation_count: 0,
          web_search_count: 0,
          deep_search_count: 0,
        };

        // Set the appropriate count to 1 for the current usage type
        switch (usageType) {
          case "chat_message":
            createData.chat_message_count = 1;
            break;
          case "image_generation":
            createData.image_generation_count = 1;
            break;
          case "web_search":
            createData.web_search_count = 1;
            break;
          case "deep_search":
            createData.deep_search_count = 1;
            break;
          default:
            createData.request_count = 1;
        }

        usageRecord = await prisma.aIUsage.create({
          data: createData,
        });
      }

      // Check if user is approaching or has reached their AI limit
      await this.checkAndNotifyAIUsageLimit(userId, usageRecord);

      return usageRecord;
    } catch (error) {
      logger.error("Error tracking AI usage:", error);
      return false;
    }
  }

  // Check AI usage and send notifications when approaching limits
  static async checkAndNotifyAIUsageLimit(userId: string, usageRecord: any) {
    try {
      // Get user's subscription
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      const planId = subscription?.plan || "free";
      const planLimits = plans[planId as keyof typeof plans].features;

      // Calculate total usage
      const totalUsage =
        (usageRecord?.request_count || 0) +
        (usageRecord?.chat_message_count || 0) +
        (usageRecord?.image_generation_count || 0) +
        (usageRecord?.web_search_count || 0) +
        (usageRecord?.deep_search_count || 0);

      const limit = planLimits.aiRequests as number;

      // Skip if unlimited
      if ((planLimits.aiRequests as any) === -1) return;

      // Calculate usage percentage
      const usagePercentage = (totalUsage / limit) * 100;

      // Send notification at 80% and 90% usage
      if (usagePercentage >= 80 && usagePercentage < 85) {
        await createNotification(
          userId,
          "ai_limit",
          "AI Usage Alert",
          `You've used 80% of your monthly AI requests (${totalUsage}/${limit}). Consider upgrading for unlimited access.`,
          { usagePercentage, totalUsage, limit },
        );
      } else if (usagePercentage >= 90 && usagePercentage < 95) {
        await createNotification(
          userId,
          "ai_limit",
          "AI Usage Alert",
          `You've used 90% of your monthly AI requests (${totalUsage}/${limit}). Upgrade now to avoid service interruption.`,
          { usagePercentage, totalUsage, limit },
        );
      } else if (usagePercentage >= 95) {
        await createNotification(
          userId,
          "ai_limit",
          "AI Usage Alert - Critical",
          `You've used 95% of your monthly AI requests (${totalUsage}/${limit}). Upgrade immediately to continue using AI features.`,
          { usagePercentage, totalUsage, limit },
        );
      }
    } catch (error) {
      logger.error("Error checking AI usage limit:", error);
    }
  }

  // Get the appropriate model for a user based on their subscription plan and context
  static async getUserModel(
    userId: string,
    preferredModel?: string,
    context?: { action?: string; contentLength?: number },
  ): Promise<string> {
    try {
      // Get user's subscription
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      const planId = subscription?.plan || "free";

      // Get user's preferred model
      const user: any = await prisma.user.findUnique({
        where: { id: userId },
      });

      const userModel =
        preferredModel || user?.["preferred_ai_model"] || "gemini-2.5-flash";

      // Define available models per plan based on subscription restrictions
      const planModels: Record<string, string[]> = {
        free: [
          "gemini-2.5-flash",
          "openai/gpt-oss-120b:free",
          "nvidia/nemotron-3-super-120b-a12b:free",
        ],
        onetime: [
          "gemini-2.5-flash",
          "openai/gpt-oss-120b:free",
          "nvidia/nemotron-3-super-120b-a12b:free",
        ],
        student: [
          "gemini-2.5-flash",
          "openai/gpt-oss-120b:free",
          "nvidia/nemotron-3-super-120b-a12b:free",
        ],
        researcher: Object.keys(AI_MODELS),
        institutional: Object.keys(AI_MODELS),
      };

      const availableModels = planModels[planId] || planModels.free;

      // If user's preferred model is available in their plan, use it
      if (availableModels.includes(userModel)) {
        return userModel;
      }

      // Context-aware model selection
      if (context) {
        // For long content, prefer models with higher token limits
        if (context.contentLength && context.contentLength > 10000) {
          // Prefer models with high token limits for long content
          const highTokenModels = availableModels.filter(
            (model) => AI_MODELS[model]?.maxTokens > 100000,
          );
          if (highTokenModels.length > 0) {
            return highTokenModels[0];
          }
        }

        // For specific actions, prefer appropriate models
        if (context.action) {
          // For research-related actions, prefer models with strong reasoning
          if (
            ["research_topic", "suggest_sources", "compare_arguments"].includes(
              context.action,
            )
          ) {
            const researchModels = availableModels.filter((model) =>
              ["gemini-2.5-flash", "gemini-3.1-flash-lite-preview"].includes(model),
            );
            if (researchModels.length > 0) {
              return researchModels[0];
            }
          }

          // For creative writing, prefer models with strong text generation
          if (
            ["continue_writing", "expand", "generate_outline"].includes(
              context.action,
            )
          ) {
            const creativeModels = availableModels.filter((model) =>
              ["gemini-2.5-flash", "gemini-3.1-flash-lite-preview"].includes(model),
            );
            if (creativeModels.length > 0) {
              return creativeModels[0];
            }
          }

          // For quick tasks, prefer faster models
          if (
            ["fix_grammar", "summarize", "simplify"].includes(context.action)
          ) {
            const fastModels = availableModels.filter((model) =>
              ["gemini-2.5-flash"].includes(model),
            );
            if (fastModels.length > 0) {
              return fastModels[0];
            }
          }
        }
      }

      // Otherwise, fall back to the default model for their plan
      return availableModels[0] || "gemini-2.5-flash";
    } catch (error) {
      logger.error("Error getting user model:", error);
      return "gemini-2.5-flash"; // Default fallback
    }
  }

  // Check if user has reached their AI usage limit
  static async checkUsageLimit(
    userId: string,
  ): Promise<{ hasLimit: boolean; remaining: number }> {
    try {
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

      // Check if user can perform AI request based on their subscription
      const canPerform = await SubscriptionService.canPerformAction(
        userId,
        "ai_request",
      );

      if (!canPerform.allowed) {
        return { hasLimit: true, remaining: 0 };
      }

      // Default limit is based on subscription
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      const planId = subscription?.plan || "free";
      const planLimits = plans[planId as keyof typeof plans].features;

      const limit = planLimits.aiRequests;
      const used =
        (usage?.request_count || 0) +
        (usage?.chat_message_count || 0) +
        (usage?.image_generation_count || 0) +
        (usage?.web_search_count || 0) +
        (usage?.deep_search_count || 0);
      const remaining =
        limit === -1 || (limit as any) === -1 ? 1000000 : limit - used; // For unlimited, set a high number

      return {
        hasLimit: remaining <= 0,
        remaining: remaining > 0 ? remaining : 0,
      };
    } catch (error) {
      logger.error("Error checking AI usage limit:", error);
      return { hasLimit: false, remaining: 1000000 };
    }
  }

  // Process AI request based on action type
  static async processAIRequest(request: AIRequest) {
    const { action, text, context, preferences, userId, model } = request;
    const startTime = Date.now();

    // Check if user can perform this action
    // Exempt grammar checking and automatic features from quota consumption
    const isAutomatic = request.isAutomatic === true;
    if (action !== "fix_grammar" && !isAutomatic) {
      const canPerform = await SubscriptionService.canPerformAction(
        userId,
        "ai_request",
      );
      if (!canPerform.allowed) {
        throw new Error(canPerform.reason || "AI request limit reached");
      }
    }

    // Track AI usage
    // Exempt grammar checking and automatic features from usage tracking
    if (action !== "fix_grammar" && !isAutomatic) {
      await this.trackAIUsage(userId);
    }

    // Get the appropriate model for the user based on context and optimization
    // Get user's subscription plan
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });
    const planId = subscription?.plan || "free";

    // Check if user has access to the requested model
    if (model) {
      const planModels: Record<string, string[]> = {
        free: [
          "gemini-2.5-flash",
          "openai/gpt-oss-120b:free",
          "nvidia/nemotron-3-super-120b-a12b:free",
        ],
        onetime: [
          "gemini-2.5-flash",
          "openai/gpt-oss-120b:free",
          "nvidia/nemotron-3-super-120b-a12b:free",
        ],
        student: [
          "gemini-2.5-flash",
          "openai/gpt-oss-120b:free",
          "nvidia/nemotron-3-super-120b-a12b:free",
        ],
        researcher: Object.keys(AI_MODELS),
        institutional: Object.keys(AI_MODELS),
      };

      const availableModels = planModels[planId] || planModels.free;
      if (!availableModels.includes(model)) {
        throw new Error(
          `Model ${model} is not available for your ${planId} plan. Please upgrade your subscription or select a different model.`,
        );
      }
    }

    // Get user's preferred model and AI preferences
    const user: any = await prisma.user.findUnique({
      where: { id: userId },
    });
    const preferredModel = user?.["preferred_ai_model"] || "gemini-2.5-flash";
    const aiPreferences = user?.["ai_preferences"] || {};

    // Merge user preferences with request preferences
    const mergedPreferences = {
      ...aiPreferences,
      ...preferences,
    };

    // Define prompts based on action type and user preferences
    let prompt = "";
    let systemMessage = `You are a human academic editor and writing collaborator. Your suggestions should reflect natural human editing:

CRITICAL ANTI-DETECTION RULES:
1. Write like a human colleague, not an AI
2. Use varied sentence structures (short + long, simple + complex)
3. Include natural imperfections: occasional contractions, informal transitions when appropriate
4. Avoid AI-typical patterns: lists of exactly 3 items, overly structured responses, formulaic phrasing
5. Use authentic academic voice with personality, not robotic perfection
6. Add subtle variety: different synonyms, varied transition words, mixed paragraph lengths
7. Never be overly comprehensive - humans edit selectively, focusing on key improvements
8. Include occasional informal language when appropriate to field and context

Your goal: Provide editing that could plausibly come from a knowledgeable human expert, not an AI tool.`;

    // Apply user preferences to system message
    if (mergedPreferences.formalityLevel) {
      systemMessage += ` Maintain a ${mergedPreferences.formalityLevel} level of formality.`;
    }

    if (mergedPreferences.vocabularyLevel) {
      systemMessage += ` Use ${mergedPreferences.vocabularyLevel} vocabulary.`;
    }

    if (mergedPreferences.voicePreference) {
      systemMessage += ` Use ${mergedPreferences.voicePreference} voice.`;
    }

    if (mergedPreferences.language) {
      systemMessage += ` Communicate in ${mergedPreferences.language}.`;
    }

    if (mergedPreferences.fieldOfStudy) {
      systemMessage += ` Focus on ${mergedPreferences.fieldOfStudy} field.`;

      // Add field-specific natural language patterns
      const fieldPatterns: Record<string, string> = {
        "Computer Science":
          ' Use terms like "basically," "essentially" when explaining - CS professionals communicate conversationally.',
        Medicine:
          ' Be clinical but conversational. Use "typically," "generally," "in most cases" naturally.',
        Law: " Be precise but not robotic. Legal professionals debate and discuss, they don't just state facts.",
        Literature:
          ' Use interpretive language naturally: "could be," "might suggest," "arguably," "it seems."',
        History:
          ' Use narrative voice with personality: "It\'s interesting that..." "One could argue..." "Notably,"',
        Business:
          " Be professional but direct. Business writing is clear and actionable, not flowery.",
        Engineering:
          " Technical but practical. Engineers explain clearly with real examples.",
        Psychology:
          ' Use nuanced language: "tends to," "often," "may indicate," "in many cases."',
      };

      if (fieldPatterns[mergedPreferences.fieldOfStudy]) {
        systemMessage += fieldPatterns[mergedPreferences.fieldOfStudy];
      }
    }

    switch (action) {
      case "improve_writing":
        prompt = `As a human editor, improve this text naturally:

Text: "${text}"

Context: "${context || "No context"}"

Edit Guidelines:
- Make changes a human editor would make (selective, not every sentence)
- Vary your edits: some sentences heavily revised, others lightly touched or unchanged
- Maintain the author's voice while improving clarity
- Don't over-perfect - leave some natural variation and personality
- Mix formal/informal appropriately for academic ${mergedPreferences?.field || "writing"}
- Use natural transitions, not formulaic ones (avoid "Furthermore," "Moreover" - use "Also," "Plus," "And")
- Explain changes conversationally, not as bullet points

Provide improved text that feels human-edited, not AI-polished.`;
        break;

      case "fix_grammar":
        prompt = `As a human proofreader, fix grammar naturally:

Text: "${text}"

Fix Guidelines:
- Correct obvious errors (grammar, spelling, punctuation)
- Don't over-correct - humans miss minor stylistic variations
- Preserve the author's writing style and voice
- For complex fixes, suggest 2-3 alternatives (humans aren't always 100% certain)
- Use natural explanations: "Changed 'there' to 'their' - possessive" not clinical grammar terminology
- Focus on actual errors, not stylistic preferences

Provide corrections that feel like human proofreading, not AI perfection.`;
        break;

      case "simplify":
        prompt = `As a human editor, simplify this text naturally:

Text: "${text}"

Simplification Guidelines:
- Break down complex ideas into clearer language
- Use shorter sentences where appropriate, but vary length
- Replace jargon with accessible terms (unless field-specific)
- Maintain meaning and nuance - don't oversimplify
- Keep some personality - simple doesn't mean robotic
- Explain changes conversationally

Provide simplified text that feels naturally accessible, not dumbed down.`;
        break;

      case "expand":
        prompt = `As a human co-author, expand this text naturally:

Text: "${text}"

Context: "${context || "No context"}"

Expansion Guidelines:
- Add detail that a knowledgeable person would naturally include
- Use specific examples, not generic placeholders
- Vary sentence structure (don't default to a pattern)
- Add transitions that flow naturally from the existing text
- Include relevant evidence or reasoning naturally woven in
- Don't over-explain - trust the reader's intelligence

Provide expanded text that feels like natural development, not padding.`;
        break;

      case "summarize":
        prompt = `Summarize the following text concisely while preserving key points and meaning.
        
Text: "${text}"

Provide a clear, condensed summary.`;
        break;

      case "academic_tone":
        prompt = `Convert the following text to academic tone. Use formal language, technical vocabulary, and objective voice.
        
Text: "${text}"

Field: ${mergedPreferences?.field || "general"}

Provide the academic version and note key changes made.`;
        break;

      case "paraphrase":
        prompt = `As a human writer, paraphrase this text naturally:

Text: "${text}"

Paraphrasing Guidelines:
- Reword genuinely, don't just swap synonyms robotically
- Change sentence structure meaningfully
- Maintain the core meaning and nuance
- Use your own natural phrasing, not formulaic restructuring
- Vary the approach (some sentences heavily changed, others moderately)
- Keep it readable and natural, not awkwardly reworded

Provide paraphrased text that sounds like a different person wrote it, not an AI tool altered it.`;
        break;

      case "continue_writing":
        prompt = `As a human co-author, continue this text naturally:

Text: "${text}"

Context: "${context || "No context"}"

Writing Guidelines:
- Match the author's existing style and voice precisely
- Vary sentence structure naturally (don't fall into a pattern)
- Include natural transitions that flow from the previous text
- Add realistic, specific details (not generic academic filler)
- Mix sentence lengths: some short and punchy, some longer and complex
- Use vocabulary that fits the field but isn't showily complex
- Write like you're genuinely contributing to their work

Provide 3 distinct continuation options, each with a different approach or emphasis. Each should feel genuinely human-written.`;
        break;

      case "generate_outline":
        prompt = `Generate a detailed outline for an academic paper based on the following topic or text:
        
Topic/Text: "${text}"

Context: "${context || "No additional context provided"}"

Field: ${mergedPreferences?.field || "general"}

Create a structured outline with main sections, subsections, and brief descriptions of what each section should cover.`;
        break;

      case "suggest_sources":
        prompt = `Suggest relevant academic sources for the following topic or research area:
        
Topic: "${text}"

Context: "${context || "No additional context provided"}"

Field: ${mergedPreferences?.field || "general"}

Provide a list of 5-10 relevant sources with brief descriptions of their relevance. Include a mix of foundational works and recent publications.`;
        break;

      default:
        prompt = `Process the following request:
        
Text: "${text}"

Context: "${context || "No additional context provided"}"

Provide a helpful response.`;
    }

    let modelName = request.model || "gemini-2.5-flash";
    let tokensUsed = 0;
    let success = false;

    try {
      // Execute based on provider preference (currently defaulting to Gemini)
      const genAI = await getGenAI();

      if (!genAI) {
        throw new Error(
          "AI service is not configured. Please check your API keys.",
        );
      }

      // Get the model
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemMessage,
      });

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Track token usage if available
      if (response.usageMetadata) {
        const inputTokens = response.usageMetadata.promptTokenCount;
        const outputTokens = response.usageMetadata.candidatesTokenCount;
        tokensUsed = inputTokens + outputTokens;

        // Asynchronously track usage details
        if (!isAutomatic) {
          const estimatedCost = this.estimateCost(modelName, tokensUsed);
          this.trackAIUsage(userId, "request_tokens", {
            model: modelName,
            inputTokens,
            outputTokens,
            tokensUsed,
            cost: estimatedCost,
          }).catch((err: any) =>
            logger.error("Error tracking token usage", err),
          );
        }
      }

      success = true;

      // Parse and return result
      const parsedResult = this.parseAIResponse(action, request.text, text);

      // Record performance metric to database
      await this.recordPerformanceMetric({
        userId,
        action,
        model: modelName,
        success: true,
        tokensUsed,
      });

      return parsedResult;
    } catch (error) {
      logger.error("Error executing AI request:", error);

      // Record failed performance metric
      await this.recordPerformanceMetric({
        userId,
        action,
        model: modelName,
        success: false,
        tokensUsed: 0,
        error: (error as Error).message,
      });

      throw new Error(
        `AI processing failed: ${(error as Error).message || "Unknown error"}`,
      );
    }
  }

  // Estimate cost based on model and token usage
  private static estimateCost(model: string, tokens: number): number {
    // Cost per 1K tokens (approximate rates)
    const costRates: Record<string, number> = {
      "gemini-2.5-flash": 0.00015, // $0.15 per 1M tokens
      "gemini-3.1-flash-lite-preview": 0.000075, // $0.075 per 1M tokens
      "openai/gpt-oss-120b:free": 0,
      "nvidia/nemotron-3-super-120b-a12b:free": 0,
    };

    const rate = costRates[model] || 0.00015; // Default to gemini-2.5-flash rate
    return (tokens / 1000) * rate;
  }

  // Record performance metric to database for analytics
  private static async recordPerformanceMetric({
    userId,
    action,
    model,
    success,
    tokensUsed,
    error,
  }: {
    userId: string;
    action: string;
    model: string;
    success: boolean;
    tokensUsed: number;
    error?: string;
  }) {
    try {
      await prisma.aIPerformanceMetric.create({
        data: {
          user_id: userId,
          action,
          model,
          success,
          tokens_used: tokensUsed,
          error_message: error || null,
          timestamp: new Date(),
        },
      });
    } catch (err) {
      logger.error("Error recording AI performance metric:", err);
    }
  }

  // Parse AI response based on action type with enhanced change tracking
  private static parseAIResponse(
    action: string,
    originalText: string,
    aiResponse: string,
  ): AISuggestion {
    let changes: AISuggestion["changes"] = [];
    let alternatives: string[] | undefined;
    let suggestionText = aiResponse;

    // For continue_writing action, extract alternatives
    if (action === "continue_writing") {
      // Enhanced parsing - look for numbered or bulleted options
      const optionRegex =
        /(?:\d+\.|\*|\-)\s*(.+?)(?=\n(?:\d+\.|\*|\-)|\n\s*\n|$)/;
      const matches = aiResponse.match(optionRegex);

      if (matches && matches.length > 0) {
        alternatives = matches
          .map((match) => {
            // Clean up the match by removing the prefix
            return match.replace(/^(?:\d+\.|\*|\-)\s*/, "").trim();
          })
          .filter((option) => option.length > 0);

        // Use the first alternative as the main suggestion if we have them
        if (alternatives.length > 0) {
          suggestionText = alternatives[0];
        }
      } else {
        // Fallback: split by double newlines or look for distinct sections
        const sections = aiResponse
          .split(/\n\s*\n/)
          .filter((section) => section.trim().length > 0);
        if (sections.length > 1) {
          alternatives = sections;
          suggestionText = sections[0];
        } else {
          // If we can't parse distinct alternatives, create variations
          alternatives = [
            aiResponse,
            this.generateVariation(aiResponse),
            this.generateVariation(aiResponse, true),
          ];
        }
      }
    }

    // Enhanced change tracking for grammar fixes and writing improvements
    if (action === "fix_grammar" || action === "improve_writing") {
      changes = this.extractChanges(originalText, aiResponse, action);
    }

    return {
      original: originalText,
      suggestion: suggestionText,
      changes: changes,
      confidence: 0.95,
      alternatives: alternatives,
    };
  }

  // Generate variations of text for alternatives
  private static generateVariation(
    text: string,
    moreDramatic: boolean = false,
  ): string {
    if (moreDramatic) {
      // More dramatic variation - change sentence structure
      return text.replace(/\b(is|are|was|were|have|has|had)\b/g, (match) => {
        const replacements: Record<string, string> = {
          is: "are",
          are: "is",
          was: "were",
          were: "was",
          have: "has",
          has: "have",
          had: "have",
        };
        return replacements[match] || match;
      });
    } else {
      // Subtle variation - add/remove some words
      return text.replace(/\b(very|really|quite)\b/g, "").trim();
    }
  }

  /**
   * Humanize AI response to reduce detection patterns
   */
  private static humanizeAIResponse(text: string, action: string): string {
    let humanized = text;

    // Remove overly AI-like patterns
    humanized = humanized
      // Replace formulaic transitions with natural ones
      .replace(/\bFurthermore,/g, () =>
        Math.random() > 0.5 ? "Also," : "Plus,",
      )
      .replace(/\bMoreover,/g, () =>
        Math.random() > 0.5 ? "Additionally," : "And,",
      )
      .replace(/\bIn conclusion,/g, () =>
        Math.random() > 0.5 ? "Overall," : "To sum up,",
      )
      .replace(/\bNevertheless,/g, () =>
        Math.random() > 0.5 ? "Still," : "Even so,",
      )
      .replace(/\bConsequently,/g, () =>
        Math.random() > 0.5 ? "So," : "As a result,",
      )
      // Remove overly formal "it is important to note that"
      .replace(/It is important to note that /gi, "")
      .replace(/It should be noted that /gi, "")
      .replace(/It is worth noting that /gi, "Notably, ");

    // For non-grammar actions, add natural variations
    if (action !== "fix_grammar") {
      // Occasionally combine short consecutive sentences (humans do this)
      humanized = humanized.replace(
        /(\w+)\.\s+(\w+)/g,
        (match, firstEnd, secondStart) => {
          const firstSentence = firstEnd;
          const secondSentence = secondStart;

          // 20% chance to combine if both parts are short
          if (Math.random() > 0.8 && firstSentence.length < 50 && secondStart) {
            return `${firstEnd}, and ${secondStart.toLowerCase()}`;
          }
          return match;
        },
      );
    }

    return humanized;
  }

  // Extract detailed changes between original and suggested text
  private static extractChanges(
    original: string,
    suggested: string,
    action: string,
  ): AISuggestion["changes"] {
    // Production-ready change detection algorithm
    // Uses word-level comparison for precise change tracking

    const changes: AISuggestion["changes"] = [];

    // If texts are significantly different, mark as modification
    if (original.trim() !== suggested.trim()) {
      // Try to identify specific changes
      const origWords = original.trim().split(/\s+/);
      const suggWords = suggested.trim().split(/\s+/);

      // Simple heuristic: if word count changed significantly, it's a modification
      if (Math.abs(origWords.length - suggWords.length) > 3) {
        changes.push({
          type: "modification",
          position: { start: 0, end: original.length },
          original: original,
          suggested: suggested,
          explanation:
            action === "fix_grammar"
              ? "Grammar and syntax improvements"
              : "Writing style and clarity enhancements",
        });
      } else {
        // For minor changes, try to find specific differences
        const minLength = Math.min(origWords.length, suggWords.length);
        let diffFound = false;

        for (let i = 0; i < minLength; i++) {
          if (origWords[i] !== suggWords[i]) {
            changes.push({
              type: "modification",
              position: {
                start: original.indexOf(origWords[i]),
                end: original.indexOf(origWords[i]) + origWords[i].length,
              },
              original: origWords[i],
              suggested: suggWords[i],
              explanation:
                action === "fix_grammar"
                  ? "Grammar correction"
                  : "Word choice improvement",
            });
            diffFound = true;
            break;
          }
        }

        // If no specific word difference found, treat as general modification
        if (!diffFound) {
          changes.push({
            type: "modification",
            position: { start: 0, end: original.length },
            original: original,
            suggested: suggested,
            explanation:
              action === "fix_grammar"
                ? "Grammar and syntax improvements"
                : "Writing style and clarity enhancements",
          });
        }
      }
    }

    return changes;
  }

  // Process chat message
  static async processChatMessage(request: {
    sessionId: string;
    userId: string;
    content: string;
    messageType?: string;
    imageUrl?: string;
    fileUrl?: string;
    metadata?: any;
    model?: string;
  }) {
    const {
      sessionId,
      userId,
      content,
      messageType,
      imageUrl,
      fileUrl,
      metadata,
      model,
    } = request;

    const startTime = Date.now();

    // Log request for debugging
    logger.info("Processing chat message", {
      sessionId,
      userId,
      contentLength: content?.length,
      messageType,
      hasImageUrl: !!imageUrl,
      hasFileUrl: !!fileUrl,
      hasMetadata: !!metadata,
      model,
      metadataDetails: metadata, // Log metadata details for debugging
    });

    // Check if user can perform this action
    const canPerform = await SubscriptionService.canPerformAction(
      userId,
      "ai_chat_message",
    );
    if (!canPerform.allowed) {
      throw new Error(canPerform.reason || "AI chat message limit reached");
    }

    // Track AI usage
    await this.trackAIUsage(userId, "chat_message");

    // Get session context
    const session = await (prisma as any).aIChatSession.findUnique({
      where: { id: sessionId },
      include: { project: true },
    });

    // Get user's subscription plan
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });
    const planId = subscription?.plan || "free";

    // Get user's preferred model and AI preferences
    const user: any = await prisma.user.findUnique({
      where: { id: userId },
    });
    const preferredModel = user?.["preferred_ai_model"] || "gemini-2.5-flash";
    const aiPreferences = user?.["ai_preferences"] || {};

    // Get user's name for personalization
    let userName = "";
    if (user?.raw_user_meta_data) {
      try {
        const metaData =
          typeof user.raw_user_meta_data === "string"
            ? JSON.parse(user.raw_user_meta_data)
            : user.raw_user_meta_data;
        userName =
          metaData?.name || metaData?.full_name || metaData?.first_name || "";
      } catch (e) {
        // If parsing fails, try to get name directly
        userName =
          user.raw_user_meta_data?.name ||
          user.raw_user_meta_data?.full_name ||
          user.raw_user_meta_data?.first_name ||
          "";
      }
    }

    // Get recent messages for context
    const recentMessages = await (prisma as any).aIChatMessage.findMany({
      where: { session_id: sessionId },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    // Build context from recent messages
    const conversationContext = recentMessages
      .reverse()
      .map((msg: any) => {
        return `${msg.role}: ${msg.content}`;
      })
      .join("\n");

    // Build project context if available
    let projectContext = "";
    if (session?.project) {
      projectContext = `
Project Context:
Title: ${session.project.title}
Type: ${session.project.type}
Citation Style: ${session.project.citation_style}
Content: ${JSON.stringify(session.project.content)}`;
    }

    // Build prompt based on message type and metadata
    let prompt = "";
    let systemMessage = `You are ScholarForge AI - THE CENTRAL INTELLIGENCE AND ENGINE of the entire ScholarForge platform. You are NOT just an assistant - you ARE the primary interface through which users interact with the platform. Users tell you what they want and YOU make it happen - creating, managing, navigating everything. Be conversational and empowering.

When creating tables, ALWAYS use proper markdown table syntax with pipes (|) and dashes (-) to create well-formed tables. For example:
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

Alternatively, you can use HTML table syntax when appropriate:
<table>
  <tr>
    <th>Header 1</th>
    <th>Header 2</th>
    <th>Header 3</th>
  </tr>
  <tr>
    <td>Data 1</td>
    <td>Data 2</td>
    <td>Data 3</td>
  </tr>
</table>

NEVER output raw pipe characters (|) without proper table formatting. Always create complete, well-structured tables with headers and proper alignment.${userName ? ` You are currently assisting ${userName}.` : ""}\n\n`;

    // Apply user preferences to system message
    if (aiPreferences.formalityLevel) {
      systemMessage += ` Maintain a ${aiPreferences.formalityLevel} level of formality.`;
    }

    if (aiPreferences.vocabularyLevel) {
      systemMessage += ` Use ${aiPreferences.vocabularyLevel} vocabulary.`;
    }

    if (aiPreferences.voicePreference) {
      systemMessage += ` Use ${aiPreferences.voicePreference} voice.`;
    }

    if (aiPreferences.language) {
      systemMessage += ` Communicate in ${aiPreferences.language}.`;
    }

    if (aiPreferences.fieldOfStudy) {
      systemMessage += ` Focus on ${aiPreferences.fieldOfStudy} field.`;
    }

    // Handle different AI modes based on metadata
    if (metadata) {
      // Handle AI mode (chat vs editor)
      if (metadata.aiMode === "editor") {
        systemMessage +=
          "\n\nYou are currently in EDITOR MODE. In this mode, you should:";
        systemMessage +=
          "\n1. Engage in conversation in the chat panel for planning and brainstorming";
        systemMessage +=
          "\n2. Provide content that can be directly inserted into the document editor";
        systemMessage +=
          "\n3. When providing content for the editor, format it clearly and indicate it's ready for insertion";
        systemMessage +=
          "\n4. For complex content, you can use the marker [INSERT INTO EDITOR]Content here[/INSERT INTO EDITOR]";
        systemMessage +=
          "\n5. Always provide well-structured, properly formatted content that can be directly inserted into a document";
        systemMessage +=
          "\n6. When responding with content for the editor, provide it in a clean format without markdown code blocks or special formatting unless specifically requested";
        systemMessage +=
          "\n7. Structure your response with clear paragraphs, headings, and lists as appropriate for academic writing";
        systemMessage +=
          "\n8. Do not include any explanatory text in your editor mode responses - only the content to be inserted";
      } else {
        systemMessage +=
          "\n\nYou are currently in CHAT MODE. In this mode, you should:";
        systemMessage +=
          "\n1. Engage in conversation exclusively within the chat panel";
        systemMessage +=
          "\n2. Provide responses directly in the chat interface";
        systemMessage +=
          "\n3. Do not generate content for direct insertion into documents";
        systemMessage +=
          "\n4. Do not use markers like [INSERT INTO EDITOR] as this content should stay in the chat";
      }

      // Handle web search feature
      if (metadata.webSearch) {
        systemMessage +=
          "\n\nWEB SEARCH is enabled. You can perform standard internet searches to gather information.";
        systemMessage +=
          "\nWhen using web search, indicate this by using the marker [WEB SEARCH]Query here[/WEB SEARCH]";
        systemMessage +=
          "\nProvide concise, relevant search queries that will yield useful results";
      }

      // Handle deep search feature
      if (metadata.deepSearch) {
        systemMessage +=
          "\n\nDEEP SEARCH is enabled. You can perform in-depth academic/professional database searches.";
        systemMessage +=
          "\nWhen using deep search, indicate this by using the marker [DEEP SEARCH]Query here[/DEEP SEARCH]";
        systemMessage +=
          "\nFocus on academic, scholarly, or professional sources for comprehensive research";
      }

      // Handle image generation feature
      if (metadata.imageGeneration) {
        systemMessage +=
          "\n\nIMAGE GENERATION is enabled. You can generate relevant images based on content needs.";
        systemMessage +=
          "\nWhen requesting image generation, indicate this by using the marker [IMAGE REQUEST]Image description here[/IMAGE REQUEST]";
        systemMessage +=
          "\nProvide clear, detailed descriptions of the images you want to generate";
      }

      // Ensure mutual exclusion between web search and deep search
      if (metadata.webSearch && metadata.deepSearch) {
        systemMessage +=
          "\n\nNOTE: Both WEB SEARCH and DEEP SEARCH are enabled, but only one should be used at a time. Please choose the most appropriate search method for each query.";
      }
    }

    if (messageType === "image" && imageUrl) {
      // For image messages, we would typically use a vision model
      // For now, we'll acknowledge the image
      prompt = `User has sent an image. Please acknowledge it and ask what they'd like help with regarding this image.`;
      systemMessage +=
        "The user has sent an image. Acknowledge it and be ready to help with questions about it.\n\n";
    } else {
      // Always treat as regular chat message
      prompt = `Conversation History:
${conversationContext}

${projectContext}

User Message: ${content}

Please provide a helpful response.`;
    }

    try {
      // Log model selection for debugging
      logger.info("Selected AI model", {
        userId,
        model: model || preferredModel,
        requestedModel: model,
      });

      // Call Google Generative AI with the selected model
      logger.info("Calling Google Generative AI", {
        model: model || preferredModel,
      });

      // Get the generative model with optimized parameters
      const currentGenAI = await getGenAI();
      if (!currentGenAI) {
        throw new Error("Gemini API not configured");
      }

      // Map model names to Gemini-compatible ones
      // User preferences may contain OpenAI model names like "gemini-2.5-flash"
      // We need to convert these to valid Gemini model names
      const geminiModelMap: Record<string, string> = {
        "gemini-2.5-flash": "gemini-2.5-flash",
        "gemini-3.1-flash-lite-preview": "gemini-3.1-flash-lite-preview",
      };

      const selectedModel = model || preferredModel;
      const geminiModelName = geminiModelMap[selectedModel] ||
        (selectedModel.startsWith("gemini") ? selectedModel : "gemini-2.5-flash");

      logger.info("Using Gemini model", { geminiModelName, originalModel: selectedModel });

      const geminiModel = currentGenAI.getGenerativeModel({
        model: geminiModelName,
      });

      // Generate content
      const result = await geminiModel.generateContent([systemMessage, prompt]);

      logger.info("Google Generative AI response", {
        hasResponse: !!result.response,
        hasText: !!result.response?.text(),
      });

      let responseText = result.response?.text();
      if (!responseText) {
        throw new Error("AI service returned empty response. Please check your API keys and model configuration.");
      }

      const responseTime = Date.now() - startTime;
      const tokensUsed = responseText.length; // Approximation

      // Record performance metrics
      aiPerformanceMonitor.recordAIRequestTiming(
        model || preferredModel,
        "chat_message",
        responseTime,
      );
      aiPerformanceMonitor.recordAITokenUsage(
        model || preferredModel,
        "chat_message",
        tokensUsed,
      );
      aiPerformanceMonitor.recordAIResult(
        model || preferredModel,
        "chat_message",
        true,
      );

      // Handle special markers in the response for different features
      if (metadata) {
        // Handle web search requests
        if (metadata.webSearch && responseText.includes("[WEB SEARCH]")) {
          const webSearchMatches = responseText.match(
            /\[WEB SEARCH\](.*?)\[\/WEB SEARCH\]/,
          );
          if (webSearchMatches) {
            for (const match of webSearchMatches) {
              const query =
                match
                  .match(/\[WEB SEARCH\](.*?)\[\/WEB SEARCH\]/)?.[1]
                  ?.trim() || "";
              if (query) {
                try {
                  const searchResults = await SearchService.webSearch(
                    userId,
                    query,
                    5,
                  );
                  const formattedResults = searchResults
                    .map(
                      (result) =>
                        `Title: ${result.title}\nURL: ${result.url}\nSnippet: ${result.snippet}\nRelevance: ${result.relevance}%`,
                    )
                    .join("\n\n");

                  const searchResponse = `

Web Search Results for "${query}":

${formattedResults}

`;
                  responseText = responseText.replace(match, searchResponse);
                } catch (searchError) {
                  logger.error("Web search failed:", searchError);
                  responseText = responseText.replace(
                    match,
                    `

[Web search for "${query}" failed]

`,
                  );
                }
              }
            }
          }
        }

        // Handle deep search requests
        if (metadata.deepSearch && responseText.includes("[DEEP SEARCH]")) {
          const deepSearchMatches = responseText.match(
            /\[DEEP SEARCH\](.*?)\[\/DEEP SEARCH\]/,
          );
          if (deepSearchMatches) {
            for (const match of deepSearchMatches) {
              const query =
                match
                  .match(/\[DEEP SEARCH\](.*?)\[\/DEEP SEARCH\]/)?.[1]
                  ?.trim() || "";
              if (query) {
                try {
                  // For deep search, we need to first do a web search to get sources
                  const initialResults = await SearchService.webSearch(
                    userId,
                    query,
                    3,
                  );
                  const urls = initialResults.map((r) => r.url);

                  const deepResults = await SearchService.deepSearch(
                    userId,
                    query,
                    urls,
                  );
                  const formattedResults = deepResults
                    .map(
                      (result) =>
                        `Title: ${result.title}\nURL: ${result.url}\nSummary: ${result.summary}\nRelevance: ${result.relevance}%`,
                    )
                    .join("\n\n");

                  const deepSearchResponse = `

Deep Search Results for "${query}":

${formattedResults}

`;
                  responseText = responseText.replace(
                    match,
                    deepSearchResponse,
                  );
                } catch (searchError) {
                  logger.error("Deep search failed:", searchError);
                  responseText = responseText.replace(
                    match,
                    `

[Deep search for "${query}" failed]

`,
                  );
                }
              }
            }
          }
        }

        // Handle image generation requests
        // Image generation is now handled entirely on the frontend to avoid duplication
        // We'll just remove the image request markers from the response text
        if (
          metadata.imageGeneration &&
          responseText.includes("[IMAGE REQUEST]")
        ) {
          responseText = responseText.replace(
            /\[IMAGE REQUEST\](.*?)\[\/IMAGE REQUEST\]/,
            "",
          );
        }
      }

      // Determine the appropriate message type
      let finalMessageType = "text";

      // Always treat as text message

      return {
        content: responseText,
        messageType: finalMessageType,
        imageUrl: undefined,
        fileUrl: undefined,
        metadata: undefined,
        sessionId,
        userId,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Record error in performance monitoring
      aiPerformanceMonitor.recordAIRequestTiming(
        model || preferredModel,
        "chat_message",
        responseTime,
      );
      aiPerformanceMonitor.recordAIError(
        model || preferredModel,
        "chat_message",
        (error as any).message || "unknown_error",
      );
      aiPerformanceMonitor.recordAIResult(
        model || preferredModel,
        "chat_message",
        false,
      );

      logger.error("Error processing chat message:", error);
      throw new Error("Failed to process chat message");
    }
  }

  // Process chat message with streaming support
  static async processChatMessageStream(request: {
    sessionId: string;
    userId: string;
    content: string;
    messageType?: string;
    imageUrl?: string;
    fileUrl?: string;
    metadata?: any;
    model?: string;
    onToken?: (token: string) => void;
  }) {
    const {
      sessionId,
      userId,
      content,
      messageType,
      imageUrl,
      fileUrl,
      metadata,
      model,
      onToken,
    } = request;

    const startTime = Date.now();

    // Log request for debugging
    logger.info("Processing chat message with streaming", {
      sessionId,
      userId,
      contentLength: content?.length,
      messageType,
      hasImageUrl: !!imageUrl,
      hasFileUrl: !!fileUrl,
      hasMetadata: !!metadata,
      model,
      metadataDetails: metadata, // Log metadata details for debugging
    });

    // Check if user can perform this action
    const canPerform = await SubscriptionService.canPerformAction(
      userId,
      "ai_chat_message",
    );
    if (!canPerform.allowed) {
      throw new Error(canPerform.reason || "AI chat message limit reached");
    }

    // Track AI usage
    await this.trackAIUsage(userId, "chat_message");

    // Get the appropriate model for the user based on optimization
    // Get user's subscription plan
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });
    const planId = subscription?.plan || "free";

    // Get user's preferred model and AI preferences
    const user: any = await prisma.user.findUnique({
      where: { id: userId },
    });
    const preferredModel = user?.["preferred_ai_model"] || "gemini-2.5-flash";
    const aiPreferences = user?.["ai_preferences"] || {};

    // Get user's name for personalization
    let userName = "";
    if (user?.raw_user_meta_data) {
      try {
        const metaData =
          typeof user.raw_user_meta_data === "string"
            ? JSON.parse(user.raw_user_meta_data)
            : user.raw_user_meta_data;
        userName =
          metaData?.name || metaData?.full_name || metaData?.first_name || "";
      } catch (e) {
        // If parsing fails, try to get name directly
        userName =
          user.raw_user_meta_data?.name ||
          user.raw_user_meta_data?.full_name ||
          user.raw_user_meta_data?.first_name ||
          "";
      }
    }

    // Get session context
    const session = await (prisma as any).aIChatSession.findUnique({
      where: { id: sessionId },
      include: { project: true },
    });

    // Get recent messages for context
    const recentMessages = await (prisma as any).aIChatMessage.findMany({
      where: { session_id: sessionId },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    // Build context from recent messages
    const conversationContext = recentMessages
      .reverse()
      .map((msg: any) => {
        return `${msg.role}: ${msg.content}`;
      })
      .join("\n");

    // Build project context if available
    let projectContext = "";
    if (session?.project) {
      projectContext = `
Project Context:
Title: ${session.project.title}
Type: ${session.project.type}
Citation Style: ${session.project.citation_style}
Content: ${JSON.stringify(session.project.content)}`;
    }

    // Build prompt based on message type and metadata
    let prompt = "";
    let systemMessage = `You are ScholarForge AI - THE CENTRAL INTELLIGENCE AND ENGINE of the entire ScholarForge platform. You are NOT just an assistant - you ARE the primary interface through which users interact with the platform. Users tell you what they want and YOU make it happen - creating, managing, navigating everything. Be conversational and empowering.

When creating tables, ALWAYS use proper markdown table syntax with pipes (|) and dashes (-) to create well-formed tables. For example:
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

Alternatively, you can use HTML table syntax when appropriate:
<table>
  <tr>
    <th>Header 1</th>
    <th>Header 2</th>
    <th>Header 3</th>
  </tr>
  <tr>
    <td>Data 1</td>
    <td>Data 2</td>
    <td>Data 3</td>
  </tr>
</table>

NEVER output raw pipe characters (|) without proper table formatting. Always create complete, well-structured tables with headers and proper alignment.${userName ? ` You are currently assisting ${userName}.` : ""}\n\n`;

    // Apply user preferences to system message
    if (aiPreferences.formalityLevel) {
      systemMessage += ` Maintain a ${aiPreferences.formalityLevel} level of formality.`;
    }

    if (aiPreferences.vocabularyLevel) {
      systemMessage += ` Use ${aiPreferences.vocabularyLevel} vocabulary.`;
    }

    if (aiPreferences.voicePreference) {
      systemMessage += ` Use ${aiPreferences.voicePreference} voice.`;
    }

    if (aiPreferences.language) {
      systemMessage += ` Communicate in ${aiPreferences.language}.`;
    }

    if (aiPreferences.fieldOfStudy) {
      systemMessage += ` Focus on ${aiPreferences.fieldOfStudy} field.`;
    }

    // Handle different AI modes based on metadata
    if (metadata) {
      // Handle AI mode (chat vs editor)
      if (metadata.aiMode === "editor") {
        systemMessage +=
          "\n\nYou are currently in EDITOR MODE. In this mode, you should:";
        systemMessage +=
          "\n1. Engage in conversation in the chat panel for planning ";
        systemMessage +=
          "\n2. Provide content that can be directly inserted into the document editor";
        systemMessage +=
          "\n3. When providing content for the editor, format it clearly and indicate it's ready for insertion";
        systemMessage +=
          "\n4. For complex content, you can use the marker [INSERT INTO EDITOR]Content here[/INSERT INTO EDITOR]";
        systemMessage +=
          "\n5. Always provide well-structured, properly formatted content that can be directly inserted into a document";
        systemMessage +=
          "\n6. When responding with content for the editor, provide it in a clean format without markdown code blocks or special formatting unless specifically requested";
        systemMessage +=
          "\n7. Structure your response with clear paragraphs, headings, and lists as appropriate for academic writing";
        systemMessage +=
          "\n8. Do not include any explanatory text in your editor mode responses - only the content to be inserted";
      } else {
        systemMessage +=
          "\n\nYou are currently in CHAT MODE. In this mode, you should:";
        systemMessage +=
          "\n1. Engage in conversation exclusively within the chat panel";
        systemMessage +=
          "\n2. Provide responses directly in the chat interface";
        systemMessage +=
          "\n3. Do not generate content for direct insertion into documents";
      }

      // Handle web search feature
      if (metadata.webSearch) {
        systemMessage +=
          "\n\nWEB SEARCH is enabled. You can perform standard internet searches to gather information.";
        systemMessage +=
          "\nWhen using web search, indicate this by using the marker [WEB SEARCH]Query here[/WEB SEARCH]";
        systemMessage +=
          "\nProvide concise, relevant search queries that will yield useful results";
      }

      // Handle deep search feature
      if (metadata.deepSearch) {
        systemMessage +=
          "\n\nDEEP SEARCH is enabled. You can perform in-depth academic/professional database searches.";
        systemMessage +=
          "\nWhen using deep search, indicate this by using the marker [DEEP SEARCH]Query here[/DEEP SEARCH]";
        systemMessage +=
          "\nFocus on academic, scholarly, or professional sources for comprehensive research";
      }

      // Handle image generation feature
      if (metadata.imageGeneration) {
        systemMessage +=
          "\n\nIMAGE GENERATION is enabled. You can generate relevant images based on content needs.";
        systemMessage +=
          "\nWhen requesting image generation, indicate this by using the marker [IMAGE REQUEST]Image description here[/IMAGE REQUEST]";
        systemMessage +=
          "\nProvide clear, detailed descriptions of the images you want to generate";
      }

      // Ensure mutual exclusion between web search and deep search
      if (metadata.webSearch && metadata.deepSearch) {
        systemMessage +=
          "\n\nNOTE: Both WEB SEARCH and DEEP SEARCH are enabled, but only one should be used at a time. Please choose the most appropriate search method for each query.";
      }
    }

    if (messageType === "image" && imageUrl) {
      // For image messages, we would typically use a vision model
      // For now, we'll acknowledge the image
      prompt = `User has sent an image. Please acknowledge it and ask what they'd like help with regarding this image.`;
      systemMessage +=
        "The user has sent an image. Acknowledge it and be ready to help with questions about it.\n\n";
    } else {
      prompt = `Conversation History:
${conversationContext}

${projectContext}

User Message: ${content}

Please provide a helpful response.`;
    }

    try {
      // Call Google Generative AI with streaming
      logger.info("Calling Google Generative AI with streaming", {
        model: model || preferredModel,
      });

      // Get the generative model with optimized parameters
      const currentGenAI = await getGenAI();
      if (!currentGenAI) {
        throw new Error("Gemini API not configured");
      }

      // Map model names to Gemini-compatible ones
      const geminiModelMap: Record<string, string> = {
        "gemini-2.5-flash": "gemini-2.5-flash",
        "gemini-3.1-flash-lite-preview": "gemini-3.1-flash-lite-preview",
      };

      const selectedModel = model || preferredModel;
      const geminiModelName = geminiModelMap[selectedModel] ||
        (selectedModel.startsWith("gemini") ? selectedModel : "gemini-2.5-flash");

      logger.info("Using Gemini model (streaming)", { geminiModelName, originalModel: selectedModel });

      const geminiModel = currentGenAI.getGenerativeModel({
        model: geminiModelName,
      });

      // Generate content with streaming
      const result = await geminiModel.generateContentStream([
        systemMessage,
        prompt,
      ]);

      logger.info("Google Generative AI streaming response initiated", {
        hasResponse: !!result.response,
      });

      // Collect all tokens for final response
      let fullResponse = "";

      // Process streaming response
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        if (onToken) {
          onToken(chunkText);
        }
      }

      const responseTime = Date.now() - startTime;
      const tokensUsed = fullResponse.length; // Approximation

      // Record performance metrics
      aiPerformanceMonitor.recordAIRequestTiming(
        model || preferredModel,
        "chat_message_stream",
        responseTime,
      );
      aiPerformanceMonitor.recordAITokenUsage(
        model || preferredModel,
        "chat_message_stream",
        tokensUsed,
      );
      aiPerformanceMonitor.recordAIResult(
        model || preferredModel,
        "chat_message_stream",
        true,
      );

      // Track AI usage with metadata
      await this.trackAIUsage(userId, "chat_message", {
        model: model || preferredModel,
        tokensUsed: tokensUsed,
      });

      // Handle special markers in the response for different features (post-processing)
      let finalResponse = fullResponse;
      if (metadata) {
        // Handle web search requests
        if (metadata.webSearch && finalResponse.includes("[WEB SEARCH]")) {
          const webSearchMatches = finalResponse.match(
            /\[WEB SEARCH\](.*?)\[\/WEB SEARCH\]/,
          );
          if (webSearchMatches) {
            for (const match of webSearchMatches) {
              const query =
                match
                  .match(/\[WEB SEARCH\](.*?)\[\/WEB SEARCH\]/)?.[1]
                  ?.trim() || "";
              if (query) {
                try {
                  const searchResults = await SearchService.webSearch(
                    userId,
                    query,
                    5,
                  );
                  const formattedResults = searchResults
                    .map(
                      (result) =>
                        `Title: ${result.title}\nURL: ${result.url}\nSnippet: ${result.snippet}\nRelevance: ${result.relevance}%`,
                    )
                    .join("\n\n");

                  const searchResponse = `

Web Search Results for \"${query}\":

${formattedResults}

`;
                  finalResponse = finalResponse.replace(match, searchResponse);
                } catch (searchError) {
                  logger.error("Web search failed:", searchError);
                  finalResponse = finalResponse.replace(
                    match,
                    `

[Web search for \"${query}\" failed]

`,
                  );
                }
              }
            }
          }
        }

        // Handle deep search requests
        if (metadata.deepSearch && finalResponse.includes("[DEEP SEARCH]")) {
          const deepSearchMatches = finalResponse.match(
            /\[DEEP SEARCH\](.*?)\[\/DEEP SEARCH\]/,
          );
          if (deepSearchMatches) {
            for (const match of deepSearchMatches) {
              const query =
                match
                  .match(/\[DEEP SEARCH\](.*?)\[\/DEEP SEARCH\]/)?.[1]
                  ?.trim() || "";
              if (query) {
                try {
                  // For deep search, we need to first do a web search to get sources
                  const initialResults = await SearchService.webSearch(
                    userId,
                    query,
                    3,
                  );
                  const urls = initialResults.map((r) => r.url);

                  const deepResults = await SearchService.deepSearch(
                    userId,
                    query,
                    urls,
                  );
                  const formattedResults = deepResults
                    .map(
                      (result) =>
                        `Title: ${result.title}\nURL: ${result.url}\nSummary: ${result.summary}\nRelevance: ${result.relevance}%`,
                    )
                    .join("\n\n");

                  const deepSearchResponse = `

Deep Search Results for \"${query}\":

${formattedResults}

`;
                  finalResponse = finalResponse.replace(
                    match,
                    deepSearchResponse,
                  );
                } catch (searchError) {
                  logger.error("Deep search failed:", searchError);
                  finalResponse = finalResponse.replace(
                    match,
                    `

[Deep search for \"${query}\" failed]

`,
                  );
                }
              }
            }
          }
        }

        // Handle image generation requests
        // Image generation is now handled entirely on the frontend to avoid duplication
        // We'll just remove the image request markers from the response text
        if (
          metadata.imageGeneration &&
          finalResponse.includes("[IMAGE REQUEST]")
        ) {
          finalResponse = finalResponse.replace(
            /\[IMAGE REQUEST\](.*?)\[\/IMAGE REQUEST\]/,
            "",
          );
        }
      }

      // Determine the appropriate message type
      let finalMessageType = "text";

      return {
        content: finalResponse,
        messageType: finalMessageType,
        imageUrl: undefined,
        fileUrl: undefined,
        metadata: undefined,
        sessionId,
        userId,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Record error in performance monitoring
      aiPerformanceMonitor.recordAIRequestTiming(
        model || preferredModel,
        "chat_message_stream",
        responseTime,
      );
      aiPerformanceMonitor.recordAIError(
        model || preferredModel,
        "chat_message_stream",
        (error as Error).message || "unknown_error",
      );
      aiPerformanceMonitor.recordAIResult(
        model || preferredModel,
        "chat_message_stream",
        false,
      );

      logger.error("Error processing chat message with streaming:", error);
      throw new Error("Failed to process chat message with streaming");
    }
  }

  // Process chat message with streaming support

  // Get user's AI usage history
  static async getUsageHistory(userId: string) {
    try {
      const usageHistory = await prisma.aIUsage.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: 12, // Last 12 months
      });

      return usageHistory;
    } catch (error) {
      logger.error("Error fetching AI usage history:", error);
      throw new Error("Failed to fetch usage history");
    }
  }

  // Save AI history item
  static async saveAIHistoryItem(
    userId: string,
    historyItem: {
      action: string;
      originalText: string;
      suggestion: string;
      isFavorite: boolean;
    },
  ) {
    try {
      const savedItem = await prisma.aIHistory.create({
        data: {
          user_id: userId,
          action: historyItem.action,
          original_text: historyItem.originalText,
          suggestion: historyItem.suggestion,
          is_favorite: historyItem.isFavorite,
          created_at: new Date(),
        },
      });

      return savedItem;
    } catch (error) {
      logger.error("Error saving AI history item:", error);
      throw new Error("Failed to save AI history item");
    }
  }

  // Get user's AI history
  static async getAIHistory(userId: string) {
    try {
      const history = await prisma.aIHistory.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
      });

      return history.map((item: any) => ({
        id: item.id,
        action: item.action,
        originalText: item.original_text,
        suggestion: item.suggestion,
        timestamp: item.created_at.toISOString(),
        isFavorite: item.is_favorite,
      }));
    } catch (error) {
      logger.error("Error fetching AI history:", error);
      throw new Error("Failed to fetch AI history");
    }
  }

  // Update favorite status of AI history item
  static async updateAIHistoryFavorite(
    userId: string,
    itemId: string,
    isFavorite: boolean,
  ) {
    try {
      const updatedItem = await prisma.aIHistory.update({
        where: {
          id: itemId,
          user_id: userId,
        },
        data: {
          is_favorite: isFavorite,
          updated_at: new Date(),
        },
      });

      return updatedItem;
    } catch (error) {
      logger.error("Error updating AI history favorite status:", error);
      throw new Error("Failed to update AI history favorite status");
    }
  }

  // Delete AI history item
  static async deleteAIHistoryItem(userId: string, itemId: string) {
    try {
      await prisma.aIHistory.delete({
        where: {
          id: itemId,
          user_id: userId,
        },
      });

      return { success: true };
    } catch (error) {
      logger.error("Error deleting AI history item:", error);
      throw new Error("Failed to delete AI history item");
    }
  }

  // Get available AI models
  static getAvailableModels(): Record<string, AIModel> {
    return AI_MODELS;
  }

  // Function to check which AI models are actually available based on configured API keys
  static async getActuallyAvailableModels(): Promise<Record<string, AIModel>> {
    const availableModels: Record<string, AIModel> = {};
    const { SecretsService } = await import("./secrets-service");

    // Check OpenAI availability
    try {
      const openAiKey = await SecretsService.getOpenAiApiKey();
      if (openAiKey) {
        // Add only the specific OpenAI models we're using
        // OpenAI key available but we use Gemini models now
        if (AI_MODELS["gemini-2.5-flash"])
          availableModels["gemini-2.5-flash"] = AI_MODELS["gemini-2.5-flash"];
      }
    } catch (error) {
      logger.info("OpenAI API key not configured");
    }

    // Anthropic no longer used - models replaced with Gemini equivalents

    // Check Gemini availability
    try {
      const geminiKey = await SecretsService.getSecret("GEMINI_API_KEY");
      if (geminiKey) {
        // Add only the specific Gemini models we're using
        if (AI_MODELS["gemini-3.1-flash-lite-preview"])
          availableModels["gemini-3.1-flash-lite-preview"] =
            AI_MODELS["gemini-3.1-flash-lite-preview"];
        if (AI_MODELS["gemini-2.5-flash"])
          availableModels["gemini-2.5-flash"] = AI_MODELS["gemini-2.5-flash"];
      }
    } catch (error) {
      logger.info("Gemini API key not configured");
    }

    // Check OpenRouter availability
    try {
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      if (openRouterKey) {
        if (AI_MODELS["openai/gpt-oss-120b:free"])
          availableModels["openai/gpt-oss-120b:free"] =
            AI_MODELS["openai/gpt-oss-120b:free"];
        if (AI_MODELS["nvidia/nemotron-3-super-120b-a12b:free"])
          availableModels["nvidia/nemotron-3-super-120b-a12b:free"] =
            AI_MODELS["nvidia/nemotron-3-super-120b-a12b:free"];
      }
    } catch (error) {
      logger.info("OpenRouter API key not configured");
    }

    return availableModels;
  }

  /**
   * Get AI autocomplete suggestion for text input
   * @param text The text before the cursor position
   * @param userId The user ID for tracking and limits
   * @returns Suggested text completion
   */
  // Start tracking session time for a user
  static startSessionTracking(userId: string): void {
    sessionStartTime.set(userId, Date.now());
  }

  // Check if user's session has timed out (6 minutes)
  static isSessionTimedOut(userId: string): boolean {
    const startTime = sessionStartTime.get(userId);
    if (!startTime) return false; // No session tracked yet

    const elapsed = Date.now() - startTime;
    return elapsed > SESSION_TIMEOUT;
  }

  static async getAutocompleteSuggestion(
    text: string,
    userId: string,
    isAutomatic: boolean = true,
  ): Promise<string> {
    try {
      // Check if session has timed out
      if (this.isSessionTimedOut(userId)) {
        throw new Error(
          "AI autocomplete session timed out. Please refresh the editor to continue using AI features.",
        );
      }

      // Track AI usage
      // Exempt automatic features from usage tracking
      if (!isAutomatic) {
        await this.trackAIUsage(userId, "autocomplete");
      }

      // Get user's subscription to determine model
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      const planId = subscription?.plan || "free";
      const plan = plans[planId as keyof typeof plans];

      // Determine model based on user's plan
      let model = "gemini-2.5-flash"; // Default fallback model
      if (planId === "researcher" || planId === "institutional") {
        // Use premium model for higher-tier plans
        model = "gemini-3.1-flash-lite-preview";
      } else if (planId === "student" || planId === "onetime") {
        // Use better model for paid plans
        model = "gemini-2.5-flash";
      }
      // Free plan uses the default fallback model

      // Prepare the prompt for autocomplete
      const prompt = `You are an AI writing assistant. Provide a concise and contextually appropriate continuation for the following text. 
      Keep your response brief (1-3 sentences maximum) and relevant to the context. 
      Do not repeat the existing text. 
      Do not include any markdown formatting or special characters.
      Just provide the natural continuation of the text.
      
      Text to continue:
      "${text}"
      
      Continuation:`;

      // Generate the autocomplete suggestion using the appropriate model
      let suggestion = "";

      switch (model) {
        case "gemini-2.5-flash":
        case "gemini-3.1-flash-lite-preview": {
          // Use Google Gemini
          const currentGenAI = await getGenAI();
          if (!currentGenAI) {
            throw new Error("Gemini API not configured");
          }
          const geminiModel = currentGenAI.getGenerativeModel({ model: model });
          const result = await geminiModel.generateContent(prompt);
          suggestion = result.response.text().trim();
          break;
        }

        case "openai/gpt-oss-120b:free":
        case "nvidia/nemotron-3-super-120b-a12b:free":
        case "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": {
          // Use native OpenRouter SDK for free open-source models
          const orClient = getOpenRouterClient();
          if (!orClient) {
            throw new Error("OpenRouter API not configured");
          }
          // @openrouter/sdk wraps the chat payload inside chatRequest
          const stream = await orClient.chat.send({
            chatRequest: {
              model: model, // use the actual model id from the switch
              messages: [{ role: "user", content: prompt }],
              stream: true,
            },
          });
          let orText = "";
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) orText += content;
          }
          suggestion = orText.trim();
          break;
        }

        default: {
          // Default to Gemini for any other model
          const currentGenAI = await getGenAI();
          if (!currentGenAI) {
            throw new Error("Gemini API not configured");
          }
          const geminiModel = currentGenAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await geminiModel.generateContent(prompt);
          suggestion = result.response.text().trim();
          break;
        }
      }

      // Clean up the suggestion to ensure it's appropriate for autocomplete
      // Remove any markdown, extra whitespace, or newlines
      suggestion = suggestion
        .replace(/\n+/g, " ") // Replace newlines with spaces
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .trim();

      // Limit suggestion length to prevent overly long completions
      if (suggestion.length > 200) {
        suggestion = suggestion.substring(0, 200) + "...";
      }

      return suggestion;
    } catch (error) {
      logger.error("Error generating autocomplete suggestion:", error);
      // Return empty string on error to avoid disrupting user experience
      return "";
    }
  }

  // Get AI analytics for a user
  static async getAIAnalytics(userId: string) {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Get usage for the current month
      const currentUsage = await prisma.aIUsage.findUnique({
        where: {
          user_id_month_year: {
            user_id: userId,
            month: currentMonth,
            year: currentYear,
          },
        },
      });

      // Get usage history for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 5);

      const usageHistory = await prisma.aIUsage.findMany({
        where: {
          user_id: userId,
          created_at: {
            gte: sixMonthsAgo,
          },
        },
        orderBy: {
          created_at: "asc",
        },
      });

      // Calculate totals
      const totalRequests =
        (currentUsage?.request_count || 0) +
        (currentUsage?.chat_message_count || 0) +
        (currentUsage?.image_generation_count || 0) +
        (currentUsage?.web_search_count || 0) +
        (currentUsage?.deep_search_count || 0);
      const totalTokensUsed = currentUsage?.total_tokens_used || 0;
      const costEstimate = currentUsage?.total_cost_estimate || 0;

      // Get success rate from performance metrics
      const performanceMetrics = await prisma.aIPerformanceMetric.findMany({
        where: {
          user_id: userId,
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 100,
      });

      const successfulRequests = performanceMetrics.filter(
        (m: AIPerformanceMetric) => m.success,
      ).length;

      // Calculate most used actions
      const actionCounts: Record<string, number> = {};
      performanceMetrics.forEach((m: AIPerformanceMetric) => {
        if (m.action) {
          actionCounts[m.action] = (actionCounts[m.action] || 0) + 1;
        }
      });

      // Calculate model usage
      const modelCounts: Record<string, number> = {};
      performanceMetrics.forEach((m: AIPerformanceMetric) => {
        if (m.model) {
          modelCounts[m.model] = (modelCounts[m.model] || 0) + 1;
        }
      });

      // Calculate peak usage hours
      const hourCounts: Record<string, number> = {};
      performanceMetrics.forEach((m: AIPerformanceMetric) => {
        const hour = new Date(m.timestamp).getHours().toString();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      // Get AI history for favorite features analysis
      const aiHistory = await prisma.aIHistory.findMany({
        where: {
          user_id: userId,
          created_at: {
            gte: sixMonthsAgo,
          },
        },
        orderBy: {
          created_at: "desc",
        },
        take: 100,
      });

      // Calculate favorite features (favorited items by action)
      const favoriteFeatures: Record<string, number> = {};
      aiHistory
        .filter((item: any) => item.is_favorite)
        .forEach((item: any) => {
          favoriteFeatures[item.action] =
            (favoriteFeatures[item.action] || 0) + 1;
        });

      return {
        totalRequests,
        successfulRequests,
        totalTokensUsed,
        costEstimate,
        mostUsedActions: actionCounts,
        modelUsage: modelCounts,
        favoriteFeatures,
        peakUsageHours: hourCounts,
        history: usageHistory.map((usage: AIUsage) => ({
          month: `${usage.year}-${String(usage.month).padStart(2, "0")}`,
          requests:
            usage.request_count +
            usage.chat_message_count +
            usage.image_generation_count +
            usage.web_search_count +
            usage.deep_search_count,
          tokens: usage.total_tokens_used,
        })),
        recentActivity: performanceMetrics
          .slice(0, 5)
          .map((m: AIPerformanceMetric) => ({
            action: m.action,
            model: m.model,
            timestamp: m.timestamp,
            tokens: m.tokens_used,
            success: m.success,
          })),
      };
    } catch (error) {
      logger.error("Error fetching AI analytics:", error);
      throw error;
    }
  }
}
