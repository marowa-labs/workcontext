import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenRouter } from "@openrouter/sdk";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import logger from "../monitoring/logger";
import { prisma } from "../lib/prisma";
import { createNotification } from "./notificationService";
import { aiPerformanceMonitor } from "../monitoring/aiPerformance";
import { SearchService } from "./searchService";
import { BYOKService } from "./byokService";
import { SubscriptionService, plans } from "./subscriptionService";
import { AIPerformanceMetric, AIUsage } from "@prisma/client";

// OpenRouter client (lazy initialized) - keyed by API key
const openRouterClients: Map<string, OpenRouter> = new Map();

/**
 * Get OpenRouter client — BYOK ONLY, no system fallback
 */
const getOpenRouterClient = async (
  userId?: string,
): Promise<OpenRouter | null> => {
  try {
    if (!userId) return null;

    const apiKey = await BYOKService.getDecryptedKey(userId, "openrouter");
    if (!apiKey) return null;

    logger.info("Using BYOK OpenRouter key for user", {
      userId: userId.slice(0, 8) + "...",
    });

    // Use cached client if available for this key
    if (openRouterClients.has(apiKey)) {
      return openRouterClients.get(apiKey)!;
    }

    // Create new client
    const client = new OpenRouter({ apiKey });
    openRouterClients.set(apiKey, client);
    return client;
  } catch (error) {
    logger.error("Error getting OpenRouter client:", error);
    return null;
  }
};

// Helper function to get Gemini AI instance — BYOK ONLY, no system fallback
const getGenAI = async (
  userId?: string,
): Promise<GoogleGenerativeAI | null> => {
  if (!userId) return null;

  const byokKey = await BYOKService.getDecryptedKey(userId, "google");
  if (!byokKey) return null;

  logger.info("Using BYOK Google API key for user", {
    userId: userId.slice(0, 8) + "...",
  });
  return new GoogleGenerativeAI(byokKey);
};

// Lazy initialization of OpenAI client — BYOK ONLY, no system fallback
const getOpenAIDirectClient = async (
  userId?: string,
): Promise<OpenAI | null> => {
  if (!userId) return null;
  const byokKey = await BYOKService.getDecryptedKey(userId, "openai");
  if (!byokKey) return null;
  logger.info("Using BYOK OpenAI key for direct chat", {
    userId: userId.slice(0, 8) + "...",
  });
  return new OpenAI({ apiKey: byokKey });
};

// Lazy initialization of Anthropic client — BYOK ONLY, no system fallback
const getAnthropicDirectClient = async (
  userId?: string,
): Promise<Anthropic | null> => {
  if (!userId) return null;
  const byokKey = await BYOKService.getDecryptedKey(userId, "anthropic");
  if (!byokKey) return null;
  logger.info("Using BYOK Anthropic key for direct chat", {
    userId: userId.slice(0, 8) + "...",
  });
  return new Anthropic({ apiKey: byokKey });
};

// Pure model-routing helpers (kept dependency-free for unit testing)
import { normalizeModelName, getModelProvider } from "./aiModelRouting";
export { normalizeModelName, getModelProvider };

// Track session time for autocomplete restrictions
const sessionStartTime = new Map<string, number>(); // userId -> session start time
const SESSION_TIMEOUT = 6 * 60 * 1000; // 6 minutes in milliseconds

interface AIModel {
  name: string;
  description: string;
  maxTokens: number;
  custom?: boolean; // true if user manually added this model
}

// Define available AI models
const AI_MODELS: Record<string, AIModel> = {
  "gemini-3.1-flash-lite": {
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
    description:
      "Multimodal model for text, image, video, and audio inputs. Built for enterprise agent systems with 300K context and 16K reasoning budget.",
    maxTokens: 300000,
  },

  // OpenAI models (require OpenAI API key)
  "openai/gpt-4o": {
    name: "GPT-4o",
    description: "OpenAI's most capable multimodal model",
    maxTokens: 128000,
  },
  "openai/gpt-4o-mini": {
    name: "GPT-4o Mini",
    description: "Fast and affordable OpenAI model for lightweight tasks",
    maxTokens: 128000,
  },

  // Anthropic models (require Anthropic API key)
  "anthropic/claude-sonnet-4-20250514": {
    name: "Claude Sonnet 4",
    description: "Anthropic's latest Sonnet model with excellent reasoning",
    maxTokens: 200000,
  },
  "anthropic/claude-3-5-haiku-20241022": {
    name: "Claude 3.5 Haiku",
    description: "Anthropic's fastest model for quick tasks",
    maxTokens: 200000,
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
  /**
   * Detect provider rate-limit / credit-exhaustion errors and return a user-friendly message.
   * Returns null if the error is not rate-limit-related.
   */
  private static detectProviderRateLimitError(error: any): string | null {
    const msg = (error?.message || error?.toString() || "").toLowerCase();
    const status = error?.status || error?.statusCode || error?.code || 0;

    // HTTP 429 is universal rate-limit code
    if (status === 429 || status === "429") {
      return `Your API provider is rate-limiting requests (HTTP 429). Wait a moment and try again, or check your provider's dashboard for quota limits.`;
    }

    // Google Gemini quota/resource exhausted
    if (
      msg.includes("quota") &&
      (msg.includes("exceeded") || msg.includes("exhausted"))
    ) {
      return `Your Google Gemini API quota has been exceeded. Check your Google AI Studio billing dashboard or wait for quota to reset.`;
    }
    if (
      msg.includes("resource_exhausted") ||
      msg.includes("resource has been exhausted")
    ) {
      return `Your Google Gemini API quota is exhausted. Visit https://aistudio.google.com to check your quota or upgrade your plan.`;
    }

    // OpenAI quota / billing errors
    if (
      msg.includes("exceeded your current quota") ||
      msg.includes("insufficient_quota")
    ) {
      return `Your OpenAI API credit has run out or quota exceeded. Please check your billing at https://platform.openai.com/account/billing or add funds.`;
    }
    if (
      msg.includes("rate_limit") &&
      (msg.includes("openai") || msg.includes("gpt"))
    ) {
      return `OpenAI is rate-limiting your requests. Wait a moment and try again, or check your usage tier at https://platform.openai.com/account/limits.`;
    }

    // Anthropic rate limit / overload
    if (msg.includes("overloaded") && msg.includes("anthropic")) {
      return `Anthropic's servers are currently overloaded. Please wait and try again in a few seconds.`;
    }
    if (
      (msg.includes("rate") || msg.includes("limit")) &&
      msg.includes("anthropic")
    ) {
      return `Your Anthropic API key has hit a rate limit. Check your usage at https://console.anthropic.com or wait and retry.`;
    }

    // OpenRouter errors — HTTP 429 from any upstream provider
    if (msg.includes("openrouter")) {
      if (msg.includes("credit") || msg.includes("insufficient")) {
        return `Your OpenRouter credits are insufficient. Please add credits at https://openrouter.ai/credits.`;
      }
      if (
        msg.includes("429") ||
        msg.includes("rate") ||
        msg.includes("limit")
      ) {
        return `OpenRouter is rate-limiting requests. Wait a moment and try again, or check your OpenRouter dashboard at https://openrouter.ai/settings/keys.`;
      }
      if (
        msg.includes("provider") &&
        (msg.includes("error") || msg.includes("down"))
      ) {
        return `OpenRouter's upstream provider returned an error. Try again or switch to a different model via OpenRouter.`;
      }
    }
    // OpenRouter credit exhaustion (even without "openrouter" in the text)
    if (msg.includes("insufficient credits") || msg.includes("no credits")) {
      return `Your OpenRouter credits have run out. Please add credits at https://openrouter.ai/credits.`;
    }
    // OpenRouter key invalid
    if (
      msg.includes("invalid api key") &&
      (msg.includes("openrouter") || error?.name === "OpenRouterError")
    ) {
      return `Your OpenRouter API key is invalid. Check your key at https://openrouter.ai/settings/keys.`;
    }

    // Generic billing / payment
    if (
      msg.includes("billing") ||
      msg.includes("payment required") ||
      msg.includes("insufficient funds")
    ) {
      return `Your API provider requires payment or has a billing issue. Please check your provider's billing dashboard.`;
    }

    // Generic quota
    if (msg.includes("quota") || msg.includes("limit reached")) {
      return `You've reached your API provider's rate limit or quota. Check your provider dashboard for limits and billing status.`;
    }

    return null;
  }
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

        // Track BYOK vs system cost attribution
        const byokSettings = await BYOKService.getSettings(userId);
        const hasBYOK =
          byokSettings.hasGoogleKey ||
          byokSettings.hasOpenAIKey ||
          byokSettings.hasClaudeKey ||
          byokSettings.hasOpenRouterKey;

        if (hasBYOK) {
          updateData.byok_cost_estimate =
            (usage?.byok_cost_estimate || 0) + metadata.cost;
          updateData.byok_request_count = (usage?.byok_request_count || 0) + 1;
        } else {
          updateData.system_cost_estimate =
            (usage?.system_cost_estimate || 0) + metadata.cost;
          updateData.system_request_count =
            (usage?.system_request_count || 0) + 1;
        }
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
          grammar_check_count: 0,
          summarization_count: 0,
          document_qa_count: 0,
          writing_project_count: 0,
          byok_request_count: 0,
          system_request_count: 0,
          byok_cost_estimate: 0,
          system_cost_estimate: 0,
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

      return usageRecord;
    } catch (error) {
      logger.error("Error tracking AI usage:", error);
      return false;
    }
  }

  // Get the appropriate model for a user — BYOK-first approach
  // If user has BYOK keys, they can use any model from their configured providers
  // Otherwise, fall back to plan-based model restrictions
  static async getUserModel(
    userId: string,
    preferredModel?: string,
    context?: { action?: string; contentLength?: number },
  ): Promise<string | null> {
    try {
      // Get user's preferred model setting
      const user: any = await prisma.user.findUnique({
        where: { id: userId },
      });

      const userModel = preferredModel || user?.["preferred_ai_model"] || null;
      if (!userModel) return null;

      // Check if user has any BYOK keys configured
      const byokSettings = await BYOKService.getSettings(userId);
      const hasBYOK =
        byokSettings.hasGoogleKey ||
        byokSettings.hasOpenAIKey ||
        byokSettings.hasClaudeKey ||
        byokSettings.hasOpenRouterKey;

      if (!hasBYOK) return null;

      // Delegate to getUserAvailableModels (which fetches from provider APIs live if needed)
      const availableModels = await this.getUserAvailableModels(userId);
      const modelIds = Object.keys(availableModels);

      // Normalize userModel to match available model keys
      const normalizedUserModel = normalizeModelName(userModel);
      if (modelIds.includes(normalizedUserModel)) return normalizedUserModel;
      if (modelIds.includes(userModel)) return userModel;

      // Selected model not found in available models — fall back to same provider only
      const selectedProvider = getModelProvider(normalizedUserModel);
      const sameProviderModels = modelIds.filter(
        (m) => getModelProvider(m) === selectedProvider,
      );

      if (sameProviderModels.length > 0) {
        // Fall back to another model from the same provider
        logger.info("Falling back to same provider model", {
          userId: userId.slice(0, 8),
          requested: userModel,
          provider: selectedProvider,
          fallback: sameProviderModels[0],
        });
        return sameProviderModels[0];
      }

      // No models from the same provider — try any available model from a provider with a configured key
      const providerHasKey: Record<string, boolean> = {
        gemini: byokSettings.hasGoogleKey,
        openai: byokSettings.hasOpenAIKey,
        anthropic: byokSettings.hasClaudeKey,
        openrouter: byokSettings.hasOpenRouterKey,
      };

      const keyedProviderModels = modelIds.filter(
        (m) => providerHasKey[getModelProvider(m)],
      );

      if (keyedProviderModels.length > 0) {
        logger.warn("Falling back to different provider model", {
          userId: userId.slice(0, 8),
          requested: userModel,
          requestedProvider: selectedProvider,
          fallback: keyedProviderModels[0],
          fallbackProvider: getModelProvider(keyedProviderModels[0]),
        });
        return keyedProviderModels[0];
      }

      // Last resort: any available model
      if (modelIds.length > 0) {
        logger.warn("Falling back to any available model", {
          userId: userId.slice(0, 8),
          requested: userModel,
          fallback: modelIds[0],
        });
        return modelIds[0];
      }

      return null;
    } catch (error) {
      logger.error("Error getting user model:", error);
      return null;
    }
  }

  // Helper: context-aware model selection from a pool of available models
  private static selectModelFromPool(
    pool: string[],
    context?: { action?: string; contentLength?: number },
  ): string | null {
    if (!context) return null;

    // For long content, prefer models with higher token limits
    if (context.contentLength && context.contentLength > 10000) {
      const highTokenModels = pool.filter(
        (model) => (AI_MODELS[model]?.maxTokens || 0) > 100000,
      );
      if (highTokenModels.length > 0) return highTokenModels[0];
    }

    // For specific actions, prefer appropriate models
    if (context.action) {
      if (
        ["research_topic", "suggest_sources", "compare_arguments"].includes(
          context.action,
        )
      ) {
        const researchModels = pool.filter((m) => m.startsWith("gemini"));
        if (researchModels.length > 0) return researchModels[0];
      }
      if (
        ["continue_writing", "expand", "generate_outline"].includes(
          context.action,
        )
      ) {
        const creativeModels = pool.filter((m) => m.startsWith("gemini"));
        if (creativeModels.length > 0) return creativeModels[0];
      }
      if (["fix_grammar", "summarize", "simplify"].includes(context.action)) {
        const fastModels = pool.filter((m) => m.includes("flash"));
        if (fastModels.length > 0) return fastModels[0];
      }
    }

    return null;
  }

  // Check if user has reached their AI usage limit
  static async checkUsageLimit(
    userId: string,
  ): Promise<{ hasLimit: boolean; remaining: number }> {
    // All users have unlimited access — no subscription-based limits
    return { hasLimit: false, remaining: 1000000 };
  }

  // Process AI request based on action type
  static async processAIRequest(request: AIRequest) {
    const { action, text, context, preferences, userId, model } = request;
    const startTime = Date.now();

    // Track AI usage
    const isAutomatic = request.isAutomatic === true;
    if (action !== "fix_grammar" && !isAutomatic) {
      await this.trackAIUsage(userId);
    }

    // Get user's preferred model and AI preferences
    const user: any = await prisma.user.findUnique({
      where: { id: userId },
    });
    const preferredModel = user?.["preferred_ai_model"] || model || null;

    // Validate requested model against BYOK-aware available models
    if (model) {
      const availableModels = await this.getUserAvailableModels(userId);
      if (!availableModels[model]) {
        throw new Error(
          `Model ${model} is not available. Please configure the required API key in your AI settings or select a different model.`,
        );
      }
    }

    // Get the appropriate model for the user (BYOK-first, no hard-coded fallback)
    const selectedModel = await this.getUserModel(
      userId,
      preferredModel || model,
      {
        action,
        contentLength: text?.length,
      },
    );
    if (!selectedModel) {
      throw new Error(
        "No AI model available. Please configure an API key in your AI settings and select a model.",
      );
    }
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

    const modelName = normalizeModelName(selectedModel);
    let tokensUsed = 0;
    let success = false;
    let responseText = "";

    try {
      const provider = getModelProvider(modelName);
      logger.info("Routing AI request", { modelName, provider, userId });

      switch (provider) {
        case "gemini": {
          const genAI = await getGenAI(userId);
          if (!genAI) {
            throw new Error(
              "Google Gemini API key not configured. Please add your Google API key in AI Settings.",
            );
          }
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemMessage,
          });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          responseText = response.text();
          if (response.usageMetadata) {
            tokensUsed =
              response.usageMetadata.promptTokenCount +
              response.usageMetadata.candidatesTokenCount;
            if (!isAutomatic) {
              const estimatedCost = this.estimateCost(modelName, tokensUsed);
              this.trackAIUsage(userId, "request_tokens", {
                model: modelName,
                inputTokens: response.usageMetadata.promptTokenCount,
                outputTokens: response.usageMetadata.candidatesTokenCount,
                tokensUsed,
                cost: estimatedCost,
              }).catch((err: any) =>
                logger.error("Error tracking token usage", err),
              );
            }
          }
          success = true;
          break;
        }

        case "openai": {
          const openaiClient = await getOpenAIDirectClient(userId);
          if (!openaiClient) {
            throw new Error(
              "OpenAI API key not configured. Please add your OpenAI API key in AI Settings.",
            );
          }
          const openaiModelName = modelName.replace("openai/", "");
          const completion = await openaiClient.chat.completions.create({
            model: openaiModelName,
            messages: [
              { role: "system", content: systemMessage },
              { role: "user", content: prompt },
            ],
          });
          responseText = completion.choices[0]?.message?.content || "";
          tokensUsed =
            (completion.usage?.prompt_tokens || 0) +
            (completion.usage?.completion_tokens || 0);
          success = true;
          if (!isAutomatic) {
            this.trackAIUsage(userId, "request_tokens", {
              model: modelName,
              tokensUsed,
            }).catch((err: any) =>
              logger.error("Error tracking token usage", err),
            );
          }
          break;
        }

        case "anthropic": {
          const anthropicClient = await getAnthropicDirectClient(userId);
          if (!anthropicClient) {
            throw new Error(
              "Anthropic API key not configured. Please add your Anthropic API key in AI Settings.",
            );
          }
          const anthropicModelName = modelName.replace("anthropic/", "");
          const msg = await anthropicClient.messages.create({
            model: anthropicModelName,
            max_tokens: 4096,
            messages: [
              { role: "user", content: systemMessage + "\n\n" + prompt },
            ],
          });
          responseText =
            msg.content[0]?.type === "text" ? msg.content[0].text : "";
          tokensUsed =
            (msg.usage.input_tokens || 0) + (msg.usage.output_tokens || 0);
          success = true;
          break;
        }

        case "openrouter":
        default: {
          const openRouter = await getOpenRouterClient(userId);
          if (!openRouter) {
            throw new Error(
              "OpenRouter API key not configured. Please add your OpenRouter API key in AI Settings.",
            );
          }
          const result: any = await (openRouter as any).chat.send({
            chatRequest: {
              model: modelName,
              messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt },
              ],
              maxTokens: 4096,
              stream: false,
            },
          });
          responseText = result?.choices?.[0]?.message?.content || "";
          tokensUsed = result?.usage?.totalTokens || 0;
          success = true;
          if (!isAutomatic) {
            const estimatedCost = this.estimateCost(modelName, tokensUsed);
            this.trackAIUsage(userId, "request_tokens", {
              model: modelName,
              inputTokens: result?.usage?.promptTokens || 0,
              outputTokens: result?.usage?.completionTokens || 0,
              tokensUsed,
              cost: estimatedCost,
            }).catch((err: any) =>
              logger.error("Error tracking token usage", err),
            );
          }
          break;
        }
      }

      success = true;

      // Parse and return result
      const parsedResult = this.parseAIResponse(
        action,
        request.text,
        responseText,
      );

      const responseTime = Date.now() - startTime;

      // Record performance metric to database
      await this.recordPerformanceMetric({
        userId,
        action,
        model: modelName,
        success: true,
        tokensUsed,
        responseTime,
      });

      return parsedResult;
    } catch (error) {
      logger.error("Error executing AI request:", error);

      const responseTime = Date.now() - startTime;

      // Record failed performance metric
      await this.recordPerformanceMetric({
        userId,
        action,
        model: modelName,
        success: false,
        tokensUsed: 0,
        responseTime,
        error: (error as Error).message,
      });

      const providerError = this.detectProviderRateLimitError(error);
      throw new Error(
        providerError ||
          `AI processing failed: ${(error as Error).message || "Unknown error"}`,
      );
    }
  }

  // Estimate cost based on model and token usage
  private static estimateCost(model: string, tokens: number): number {
    // Cost per 1K tokens (approximate rates)
    const costRates: Record<string, number> = {
      "gemini-3.1-flash-lite": 0.000075, // $0.075 per 1M tokens
      "openai/gpt-oss-120b:free": 0,
      "nvidia/nemotron-3-super-120b-a12b:free": 0,
    };

    const rate = costRates[model] || 0.00015; // Default to gemini-3.1-flash-lite rate
    return (tokens / 1000) * rate;
  }

  // Record performance metric to database for analytics
  private static async recordPerformanceMetric({
    userId,
    action,
    model,
    success,
    tokensUsed,
    responseTime,
    error,
  }: {
    userId: string;
    action: string;
    model: string;
    success: boolean;
    tokensUsed: number;
    responseTime?: number;
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
          response_time: responseTime || 0,
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
      metadataDetails: metadata,
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

    // Get session context — pass through to getDocumentContext
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
    const preferredModel = user?.["preferred_ai_model"] || model || null;
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

    // Build project context — prefer LIVE document content from the frontend
    // over stale database content, so the AI reads what the user is actually writing
    let projectContext = "";
    const liveContent = metadata?.liveDocumentContent || "";
    const cursorContext = metadata?.cursorContext || "";
    const docTitle = metadata?.documentTitle || "";

    if (liveContent) {
      // Use LIVE content from the editor — what the user is currently typing
      projectContext = `
Project Context:
Title: ${docTitle || session?.project?.title || "(untitled)"}
Type: ${session?.project?.type || "document"}

// LIVE DOCUMENT CONTENT — this is what the user is currently writing:
Document Content: ${liveContent}

// Context before cursor — use this to understand what the user wants to complete:
Text before cursor: ${cursorContext || "(none)"}`;
    } else if (session?.project) {
      // Fallback to database content
      const docContent = session.project.content
        ? JSON.stringify(session.project.content)
        : "(empty)";
      projectContext = `
Project Context:
Title: ${docTitle || session.project.title}
Type: ${session.project.type}
Document Content: ${docContent}`;
    }

    // Append semantically related workspace items ("workspace memory") so the
    // AI can answer questions that span the whole workspace, not just this doc.
    const wsCtx = (metadata as any)?.workspaceContext;
    if (Array.isArray(wsCtx) && wsCtx.length > 0) {
      const relatedText = wsCtx
        .map(
          (r: any) =>
            `- [${r.entity_type}] ${r.title || "(untitled)"}: ${(
              r.content || ""
            ).slice(0, 300)}`,
        )
        .join("\n");
      projectContext += `\n\nRelated workspace items (semantic matches — use only if relevant to the question):\n${relatedText}`;
    }

    // MODE-SPECIFIC SYSTEM PROMPT — context-aware based on whether a document is open
    const mode = metadata?.chatMode || "general";
    const hasDocument = !!session?.project;
    let prompt = "";
    let systemMessage = "";

    if (mode === "autocomplete") {
      systemMessage = `You are an intelligent autocomplete engine. Return ONLY the continuation text — no explanations, no markers, no commentary. Read the text before the cursor and continue it naturally. Match the tone, style, and formatting of the existing text. Never repeat what's already written.`;
    } else if (mode === "research") {
      systemMessage = `You are WorkContext in RESEARCH mode — an analytical assistant that reads documents deeply and provides insights. You can read the full document content. Your role is to:
- Analyze document structure, arguments, and completeness
- Identify gaps, weaknesses, and areas for improvement
- Explain complex concepts found in the document
- Suggest improvements and rewrites when asked

CRITICAL RULE: Only use editor markers when the user explicitly asks you to write, edit, or modify content. For analysis, questions, or suggestions, respond naturally WITHOUT markers.

When the user DOES ask to modify the document, use these markers:
1. INSERT: [INSERT_INTO_EDITOR]content[/INSERT_INTO_EDITOR]
2. DELETE: [DELETE_IN_EDITOR]exact text[/DELETE_IN_EDITOR]
3. REPLACE: [REPLACE_IN_EDITOR]old|||new[/REPLACE_IN_EDITOR]

Keep responses insightful but concise.${userName ? ` You are assisting ${userName}.` : ""}`;
    } else if (hasDocument) {
      // EDITOR CONTEXT: intelligent assistant with document access
      // Only use editor markers when the user explicitly asks to write, edit, delete, or modify the document.
      // For general questions, conversation, or analysis, respond naturally WITHOUT any editor markers.
      systemMessage = `You are WorkContext, an intelligent assistant with access to the user's current document.${userName ? ` You are assisting ${userName}.` : ""}

CRITICAL RULE: Only use editor markers when the user explicitly asks you to write, edit, delete, or modify content in the document. For general questions, conversation, analysis, or help, respond naturally WITHOUT any editor markers.

When the user DOES ask to modify the document, use these markers:
1. INSERT: [INSERT_INTO_EDITOR]content[/INSERT_INTO_EDITOR]
2. DELETE: [DELETE_IN_EDITOR]exact text[/DELETE_IN_EDITOR]
3. REPLACE: [REPLACE_IN_EDITOR]exact old text|||new text[/REPLACE_IN_EDITOR]

Keep chat brief — confirm, then markers. Don't announce your capabilities, just help naturally.`;
    } else {
      // GENERAL CHAT: like ChatGPT or Gemini — friendly, knowledgeable, conversational
      systemMessage = `You are WorkContext, a friendly and knowledgeable AI assistant. You can help with:
- Casual conversation and discussion
- Answering questions on any topic
- Brainstorming and creative thinking
- Academic writing and research advice
- Platform help (workspaces, projects, tasks) when asked

Be warm, conversational, and natural — like chatting with a knowledgeable friend. Don't force platform actions unless the user specifically asks. It's perfectly fine to just have a general discussion.${userName ? ` You are assisting ${userName}.` : ""}`;
    }

    // Apply user preferences
    if (aiPreferences.formalityLevel) {
      systemMessage += ` Maintain a ${aiPreferences.formalityLevel} tone.`;
    }
    if (aiPreferences.language) {
      systemMessage += ` Communicate in ${aiPreferences.language}.`;
    }

    if (mode === "autocomplete") {
      prompt = `${cursorContext || ""}`;
    } else if (messageType === "image" && imageUrl) {
      prompt = `User has sent an image. Please acknowledge it and ask what they'd like help with regarding this image.`;
    } else if (hasDocument) {
      prompt = `Conversation History:
${conversationContext}

${projectContext}

User Message: ${content}

Please provide a helpful response. Use editor markers if you need to modify the document.`;
    } else {
      prompt = `Conversation History:
${conversationContext}

User Message: ${content}

Please provide a helpful response.`;
    }

    // Determine the model name before try block so it's accessible in catch block
    const rawModelName = model || preferredModel;

    if (!rawModelName) {
      throw new Error(
        "No AI API key configured. Please add your API key in Settings → AI API Keys to start using AI features.",
      );
    }

    // Normalize short names
    const modelName = normalizeModelName(rawModelName);

    // Validate the user actually has a key for this model's provider, and fall back if not
    let finalModelName = modelName;
    const provider = getModelProvider(modelName);
    const byokSettings = await BYOKService.getSettings(userId);
    const providerHasKey: Record<string, boolean> = {
      gemini: byokSettings.hasGoogleKey,
      openai: byokSettings.hasOpenAIKey,
      anthropic: byokSettings.hasClaudeKey,
      openrouter: byokSettings.hasOpenRouterKey,
    };

    if (!providerHasKey[provider]) {
      // User doesn't have a key for this model's provider — find an alternative
      const availableModels = await this.getUserAvailableModels(userId);
      const availableIds = Object.keys(availableModels);
      if (availableIds.length > 0) {
        finalModelName = availableIds[0];
        logger.info(
          "Model provider key not found, falling back to available model",
          {
            userId: userId.slice(0, 8),
            requested: modelName,
            requestedProvider: provider,
            fallback: finalModelName,
          },
        );
      } else {
        throw new Error(
          `No API key configured for ${provider}. Please add your API key for this provider in AI Settings, or select a different model.`,
        );
      }
    }

    try {
      // Log model selection for debugging
      logger.info("Selected AI model", {
        userId,
        model: finalModelName,
        originalRequested: modelName,
      });

      // Route to the correct provider based on model prefix
      const routeProvider = getModelProvider(finalModelName);
      let responseText = "";
      let tokensUsed = 0;

      logger.info("Routing chat request", {
        modelName: finalModelName,
        provider: routeProvider,
        userId,
      });

      // If provider is "openrouter" but the user has a Google key, check if this
      // is actually a Google model (Google API may return models without "gemini-" prefix)
      let effectiveProvider = routeProvider;
      if (
        routeProvider === "openrouter" &&
        byokSettings.hasGoogleKey &&
        !byokSettings.hasOpenRouterKey
      ) {
        try {
          const googleModels = await BYOKService.getProviderModels(
            userId,
            "google",
          );
          const isGoogleModel =
            googleModels?.some((m) => m.id === finalModelName) ?? false;
          if (isGoogleModel) {
            effectiveProvider = "gemini";
            logger.info("Redirecting non-prefixed Google model to Gemini", {
              model: finalModelName,
              userId: userId.slice(0, 8) + "...",
            });
          }
        } catch (checkError) {
          logger.warn("Failed to check Google models for routing", {
            error: (checkError as Error).message,
          });
        }
      }

      switch (effectiveProvider) {
        case "gemini": {
          const currentGenAI = await getGenAI(userId);
          if (!currentGenAI) {
            throw new Error(
              "Google Gemini API key not configured. Please add your Google API key in AI Settings.",
            );
          }

          const geminiModel = currentGenAI.getGenerativeModel({
            model: finalModelName,
          });
          const result = await geminiModel.generateContent([
            systemMessage,
            prompt,
          ]);
          responseText = result.response?.text() || "";
          if (!responseText) {
            throw new Error(
              "AI service returned empty response. Please check your API keys and model configuration.",
            );
          }
          tokensUsed = responseText.length;

          aiPerformanceMonitor.recordAIRequestTiming(
            finalModelName,
            "chat_message",
            Date.now() - startTime,
          );
          aiPerformanceMonitor.recordAITokenUsage(
            finalModelName,
            "chat_message",
            tokensUsed,
          );
          aiPerformanceMonitor.recordAIResult(
            finalModelName,
            "chat_message",
            true,
          );
          await this.recordPerformanceMetric({
            userId,
            action: "chat_message",
            model: finalModelName,
            success: true,
            tokensUsed,
            responseTime: Date.now() - startTime,
          });
          break;
        }

        case "openai": {
          const openaiClient = await getOpenAIDirectClient(userId);
          if (!openaiClient) {
            throw new Error(
              "OpenAI API key not configured. Please add your OpenAI API key in AI Settings.",
            );
          }

          const openaiModelName = finalModelName.replace("openai/", "");
          const completion = await openaiClient.chat.completions.create({
            model: openaiModelName,
            messages: [
              { role: "system", content: systemMessage },
              { role: "user", content: prompt },
            ],
          });
          responseText = completion.choices[0]?.message?.content || "";
          tokensUsed =
            (completion.usage?.prompt_tokens || 0) +
            (completion.usage?.completion_tokens || 0);

          aiPerformanceMonitor.recordAIRequestTiming(
            finalModelName,
            "chat_message",
            Date.now() - startTime,
          );
          aiPerformanceMonitor.recordAITokenUsage(
            finalModelName,
            "chat_message",
            tokensUsed,
          );
          aiPerformanceMonitor.recordAIResult(
            finalModelName,
            "chat_message",
            true,
          );
          await this.recordPerformanceMetric({
            userId,
            action: "chat_message",
            model: finalModelName,
            success: true,
            tokensUsed,
            responseTime: Date.now() - startTime,
          });
          break;
        }

        case "anthropic": {
          const anthropicClient = await getAnthropicDirectClient(userId);
          if (!anthropicClient) {
            throw new Error(
              "Anthropic API key not configured. Please add your Anthropic API key in AI Settings.",
            );
          }

          const anthropicModelName = finalModelName.replace("anthropic/", "");
          const msg = await anthropicClient.messages.create({
            model: anthropicModelName,
            max_tokens: 4096,
            messages: [
              { role: "user", content: systemMessage + "\n\n" + prompt },
            ],
          });
          responseText =
            msg.content[0]?.type === "text" ? msg.content[0].text : "";
          tokensUsed =
            (msg.usage.input_tokens || 0) + (msg.usage.output_tokens || 0);

          aiPerformanceMonitor.recordAIRequestTiming(
            finalModelName,
            "chat_message",
            Date.now() - startTime,
          );
          aiPerformanceMonitor.recordAITokenUsage(
            finalModelName,
            "chat_message",
            tokensUsed,
          );
          aiPerformanceMonitor.recordAIResult(
            finalModelName,
            "chat_message",
            true,
          );
          await this.recordPerformanceMetric({
            userId,
            action: "chat_message",
            model: finalModelName,
            success: true,
            tokensUsed,
            responseTime: Date.now() - startTime,
          });
          break;
        }

        case "openrouter":
        default: {
          const openRouter = await getOpenRouterClient(userId);
          if (!openRouter) {
            throw new Error(
              "OpenRouter API key not configured. Please add your OpenRouter API key in AI Settings.",
            );
          }

          const result: any = await (openRouter as any).chat.send({
            chatRequest: {
              model: finalModelName,
              messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt },
              ],
              maxTokens: 4096,
              stream: false,
            },
          });

          responseText = result?.choices?.[0]?.message?.content || "";
          tokensUsed = result?.usage?.totalTokens || responseText.length;

          aiPerformanceMonitor.recordAIRequestTiming(
            finalModelName,
            "chat_message",
            Date.now() - startTime,
          );
          aiPerformanceMonitor.recordAITokenUsage(
            finalModelName,
            "chat_message",
            tokensUsed,
          );
          aiPerformanceMonitor.recordAIResult(
            finalModelName,
            "chat_message",
            true,
          );
          await this.recordPerformanceMetric({
            userId,
            action: "chat_message",
            model: finalModelName,
            success: true,
            tokensUsed,
            responseTime: Date.now() - startTime,
          });
          break;
        }
      }

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

      // Extract action markers from response
      const extractActions = (text: string) => {
        const actions: Record<string, any[]> = {
          navigate: [],
          createSpace: [],
          openDocument: [],
        };

        // Extract navigation markers
        const navMatches = text.match(/\[NAVIGATE\](.+?)\[\/NAVIGATE\]/g);
        if (navMatches) {
          navMatches.forEach((match) => {
            const route =
              match.match(/\[NAVIGATE\](.+?)\[\/NAVIGATE\]/)?.[1] || "";
            if (route) actions.navigate.push({ route: route.trim() });
          });
        }

        // Extract create space markers
        const createSpaceMatches = text.match(
          /\[CREATE_SPACE\](.+?)\[\/CREATE_SPACE\]/g,
        );
        if (createSpaceMatches) {
          createSpaceMatches.forEach((match) => {
            const content =
              match.match(/\[CREATE_SPACE\](.+?)\[\/CREATE_SPACE\]/)?.[1] || "";
            const parts = content.split("|").map((s) => s.trim());
            if (parts[0])
              actions.createSpace.push({
                name: parts[0],
                description: parts[1] || "",
              });
          });
        }

        // Extract open document markers
        const openDocMatches = text.match(
          /\[OPEN_DOCUMENT\](.+?)\[\/OPEN_DOCUMENT\]/g,
        );
        if (openDocMatches) {
          openDocMatches.forEach((match) => {
            const docId =
              match.match(/\[OPEN_DOCUMENT\](.+?)\[\/OPEN_DOCUMENT\]/)?.[1] ||
              "";
            if (docId) actions.openDocument.push({ documentId: docId.trim() });
          });
        }

        return Object.keys(actions).some((key) => actions[key].length > 0)
          ? actions
          : null;
      };

      const extractedActions = extractActions(responseText);

      // Remove action markers from response text before sending to client
      let cleanedResponseText = responseText;
      cleanedResponseText = cleanedResponseText.replace(
        /\[NAVIGATE\].+?\[\/NAVIGATE\]/g,
        "",
      );
      cleanedResponseText = cleanedResponseText.replace(
        /\[CREATE_SPACE\].+?\[\/CREATE_SPACE\]/g,
        "",
      );
      cleanedResponseText = cleanedResponseText.replace(
        /\[OPEN_DOCUMENT\].+?\[\/OPEN_DOCUMENT\]/g,
        "",
      );
      cleanedResponseText = cleanedResponseText.trim();

      // Determine the appropriate message type
      let finalMessageType = "text";

      // Always treat as text message

      return {
        content: cleanedResponseText,
        messageType: finalMessageType,
        imageUrl: undefined,
        fileUrl: undefined,
        metadata: extractedActions ? { actions: extractedActions } : undefined,
        sessionId,
        userId,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Record error in performance monitoring
      aiPerformanceMonitor.recordAIRequestTiming(
        finalModelName,
        "chat_message",
        responseTime,
      );
      aiPerformanceMonitor.recordAIError(
        finalModelName,
        "chat_message",
        (error as any).message || "unknown_error",
      );
      aiPerformanceMonitor.recordAIResult(
        finalModelName,
        "chat_message",
        false,
      );

      // Record failed metric to database
      await this.recordPerformanceMetric({
        userId,
        action: "chat_message",
        model: finalModelName,
        success: false,
        tokensUsed: 0,
        responseTime,
        error: (error as any).message || "unknown_error",
      });

      logger.error("Error processing chat message:", error);
      const providerError = this.detectProviderRateLimitError(error);
      throw new Error(
        providerError ||
          (error as any).message ||
          "Failed to process chat message",
      );
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
    const preferredModel = user?.["preferred_ai_model"] || model || null;
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

    // Build project context — prefer LIVE content from frontend over stale DB
    let projectContext = "";
    const liveContent = metadata?.liveDocumentContent || "";
    const cursorContext = metadata?.cursorContext || "";
    const docTitle = metadata?.documentTitle || "";

    if (liveContent) {
      projectContext = `
Project Context:
Title: ${docTitle || session?.project?.title || "(untitled)"}
Type: ${session?.project?.type || "document"}

// LIVE DOCUMENT CONTENT:
Document Content: ${liveContent}

// Context before cursor:
Text before cursor: ${cursorContext || "(none)"}`;
    } else if (session?.project) {
      projectContext = `
Project Context:
Title: ${docTitle || session.project.title}
Type: ${session.project.type}
Citation Style: ${session.project.citation_style}
Content: ${JSON.stringify(session.project.content)}`;
    }

    // Build prompt based on message type and metadata
    const mode = metadata?.chatMode || "general";
    const hasDocument = !!session?.project;
    let prompt = "";
    let systemMessage = "";

    if (mode === "autocomplete") {
      systemMessage = `You are an intelligent autocomplete engine. Return ONLY the continuation text — no explanations, no markers, no commentary. Read the text before the cursor and continue it naturally. Match the tone, style, and formatting of the existing text. Never repeat what's already written.`;
    } else if (mode === "research") {
      systemMessage = `You are WorkContext in RESEARCH mode — an analytical assistant that reads deeply and provides insights. Identify gaps, weaknesses, explain concepts, suggest rewrites. Use markers: [INSERT_INTO_EDITOR], [DELETE_IN_EDITOR], [REPLACE_IN_EDITOR]old|||new. Keep responses concise.${userName ? ` Assisting ${userName}.` : ""}`;
    } else if (hasDocument) {
      systemMessage = `You are WorkContext, an intelligent writing assistant with document access.${userName ? ` Assisting ${userName}.` : ""} Use markers to modify the document: [INSERT_INTO_EDITOR], [DELETE_IN_EDITOR], [REPLACE_IN_EDITOR]old|||new. Keep chat brief — confirm, then markers.`;
    } else {
      systemMessage = `You are WorkContext, a helpful workspace assistant. You help with writing, planning, brainstorming, and general questions. Be friendly, concise, and practical.${userName ? ` Assisting ${userName}.` : ""}`;
    }

    // Apply user preferences
    if (aiPreferences.formalityLevel) {
      systemMessage += ` Maintain a ${aiPreferences.formalityLevel} tone.`;
    }
    if (aiPreferences.language) {
      systemMessage += ` Communicate in ${aiPreferences.language}.`;
    }

    if (mode === "autocomplete") {
      prompt = `${cursorContext || ""}`;
    } else if (messageType === "image" && imageUrl) {
      prompt = `User has sent an image. Please acknowledge it and ask what they'd like help with regarding this image.`;
    } else if (hasDocument) {
      prompt = `Conversation History:
${conversationContext}

${projectContext}

User Message: ${content}

Please provide a helpful response. Use editor markers if you need to modify the document.`;
    } else {
      prompt = `Conversation History:
${conversationContext}

User Message: ${content}

Please provide a helpful response.`;
    }

    // Determine if this is an OpenRouter model
    const rawModelName = model || preferredModel;

    if (!rawModelName) {
      throw new Error(
        "No AI API key configured. Please add your API key in Settings → AI API Keys to start using AI features.",
      );
    }

    const modelName = normalizeModelName(rawModelName);
    const provider = getModelProvider(modelName);

    try {
      let fullResponse = "";
      let tokensUsed = 0;

      switch (provider) {
        case "gemini": {
          const currentGenAI = await getGenAI(userId);
          if (!currentGenAI) {
            throw new Error(
              "Google Gemini API key not configured. Please add your Google API key in AI Settings.",
            );
          }

          const geminiModel = currentGenAI.getGenerativeModel({
            model: modelName,
          });
          const result = await geminiModel.generateContentStream([
            systemMessage,
            prompt,
          ]);

          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            if (onToken) onToken(chunkText);
          }
          tokensUsed = fullResponse.length;
          break;
        }

        case "openai": {
          const openaiClient = await getOpenAIDirectClient(userId);
          if (!openaiClient) {
            throw new Error(
              "OpenAI API key not configured. Please add your OpenAI API key in AI Settings.",
            );
          }

          const openaiModelName = modelName.replace("openai/", "");
          const stream = await openaiClient.chat.completions.create({
            model: openaiModelName,
            messages: [
              { role: "system", content: systemMessage },
              { role: "user", content: prompt },
            ],
            stream: true,
          });

          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content || "";
            fullResponse += token;
            if (onToken) onToken(token);
          }
          tokensUsed = fullResponse.length;
          break;
        }

        case "anthropic": {
          const anthropicClient = await getAnthropicDirectClient(userId);
          if (!anthropicClient) {
            throw new Error(
              "Anthropic API key not configured. Please add your Anthropic API key in AI Settings.",
            );
          }

          const anthropicModelName = modelName.replace("anthropic/", "");
          const stream = await anthropicClient.messages.create({
            model: anthropicModelName,
            max_tokens: 4096,
            messages: [
              { role: "user", content: systemMessage + "\n\n" + prompt },
            ],
            stream: true,
          });

          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const token = event.delta.text;
              fullResponse += token;
              if (onToken) onToken(token);
            }
          }
          tokensUsed = fullResponse.length;
          break;
        }

        case "openrouter":
        default: {
          const openRouter = await getOpenRouterClient(userId);
          if (!openRouter) {
            throw new Error(
              "OpenRouter API key not configured. Please add your OpenRouter API key in AI Settings.",
            );
          }

          const stream: any = await (openRouter as any).chat.send({
            chatRequest: {
              model: modelName,
              messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt },
              ],
              maxTokens: 4096,
              stream: true,
            },
          });

          for await (const chunk of stream) {
            const token = chunk?.choices?.[0]?.delta?.content || "";
            fullResponse += token;
            if (onToken) onToken(token);
          }
          tokensUsed = fullResponse.length;
          break;
        }
      }

      const responseTime = Date.now() - startTime;

      // Record performance metrics to monitoring system
      aiPerformanceMonitor.recordAIRequestTiming(
        modelName,
        "chat_message_stream",
        responseTime,
      );
      aiPerformanceMonitor.recordAITokenUsage(
        modelName,
        "chat_message_stream",
        tokensUsed,
      );
      aiPerformanceMonitor.recordAIResult(
        modelName,
        "chat_message_stream",
        true,
      );

      // Record to database for analytics dashboard
      await this.recordPerformanceMetric({
        userId,
        action: "chat_message_stream",
        model: model || preferredModel,
        success: true,
        tokensUsed,
        responseTime,
      });

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

      // Extract action markers from response
      const extractActions = (text: string) => {
        const actions: Record<string, any[]> = {
          navigate: [],
          createSpace: [],
          openDocument: [],
        };

        // Extract navigation markers
        const navMatches = text.match(/\[NAVIGATE\](.+?)\[\/NAVIGATE\]/g);
        if (navMatches) {
          navMatches.forEach((match) => {
            const route =
              match.match(/\[NAVIGATE\](.+?)\[\/NAVIGATE\]/)?.[1] || "";
            if (route) actions.navigate.push({ route: route.trim() });
          });
        }

        // Extract create space markers
        const createSpaceMatches = text.match(
          /\[CREATE_SPACE\](.+?)\[\/CREATE_SPACE\]/g,
        );
        if (createSpaceMatches) {
          createSpaceMatches.forEach((match) => {
            const content =
              match.match(/\[CREATE_SPACE\](.+?)\[\/CREATE_SPACE\]/)?.[1] || "";
            const parts = content.split("|").map((s) => s.trim());
            if (parts[0])
              actions.createSpace.push({
                name: parts[0],
                description: parts[1] || "",
              });
          });
        }

        // Extract open document markers
        const openDocMatches = text.match(
          /\[OPEN_DOCUMENT\](.+?)\[\/OPEN_DOCUMENT\]/g,
        );
        if (openDocMatches) {
          openDocMatches.forEach((match) => {
            const docId =
              match.match(/\[OPEN_DOCUMENT\](.+?)\[\/OPEN_DOCUMENT\]/)?.[1] ||
              "";
            if (docId) actions.openDocument.push({ documentId: docId.trim() });
          });
        }

        return Object.keys(actions).some((key) => actions[key].length > 0)
          ? actions
          : null;
      };

      const extractedActions = extractActions(finalResponse);

      // Remove action markers from response text before sending to client
      let cleanedResponseText = finalResponse;
      cleanedResponseText = cleanedResponseText.replace(
        /\[NAVIGATE\].+?\[\/NAVIGATE\]/g,
        "",
      );
      cleanedResponseText = cleanedResponseText.replace(
        /\[CREATE_SPACE\].+?\[\/CREATE_SPACE\]/g,
        "",
      );
      cleanedResponseText = cleanedResponseText.replace(
        /\[OPEN_DOCUMENT\].+?\[\/OPEN_DOCUMENT\]/g,
        "",
      );
      cleanedResponseText = cleanedResponseText.trim();

      // Determine the appropriate message type
      let finalMessageType = "text";

      return {
        content: cleanedResponseText,
        messageType: finalMessageType,
        imageUrl: undefined,
        fileUrl: undefined,
        metadata: extractedActions ? { actions: extractedActions } : undefined,
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

      // Record failed metric to database
      await this.recordPerformanceMetric({
        userId,
        action: "chat_message_stream",
        model: model || preferredModel,
        success: false,
        tokensUsed: 0,
        responseTime,
        error: (error as Error).message || "unknown_error",
      });

      logger.error("Error processing chat message with streaming:", error);
      const providerError = this.detectProviderRateLimitError(error);
      throw new Error(
        providerError || "Failed to process chat message with streaming",
      );
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

  // Get models available for a specific user — dynamically fetched from provider APIs
  static async getUserAvailableModels(
    userId: string,
  ): Promise<Record<string, AIModel>> {
    const availableModels: Record<string, AIModel> = {};

    try {
      const byokSettings = await BYOKService.getSettings(userId);
      const hasAnyBYOK =
        byokSettings.hasGoogleKey ||
        byokSettings.hasOpenAIKey ||
        byokSettings.hasClaudeKey ||
        byokSettings.hasOpenRouterKey;

      if (hasAnyBYOK) {
        // For each provider the user has a key for, fetch dynamically-cached models
        const providerMap: Array<{
          hasKey: boolean;
          provider: "google" | "anthropic" | "openai" | "openrouter";
        }> = [
          { hasKey: byokSettings.hasGoogleKey, provider: "google" },
          { hasKey: byokSettings.hasOpenAIKey, provider: "openai" },
          { hasKey: byokSettings.hasClaudeKey, provider: "anthropic" },
          { hasKey: byokSettings.hasOpenRouterKey, provider: "openrouter" },
        ];

        for (const { hasKey, provider } of providerMap) {
          if (!hasKey) continue;

          // Get dynamically-fetched models from DB cache
          const cachedModels = await BYOKService.getProviderModels(
            userId,
            provider,
          );

          if (cachedModels && cachedModels.length > 0) {
            // Use the dynamically-fetched models (including custom user-added ones)
            for (const m of cachedModels) {
              availableModels[m.id] = {
                name: m.name,
                description: m.description,
                maxTokens: m.maxTokens,
                custom: (m as any).custom || false,
              };
            }
          } else {
            // No cached models yet — fetch live from provider API
            try {
              const apiKey = await BYOKService.getDecryptedKey(
                userId,
                provider,
              );
              if (apiKey) {
                const fetchedModels = await BYOKService.fetchProviderModels(
                  provider,
                  apiKey,
                );
                if (fetchedModels.length > 0) {
                  // Save for next time (fire-and-forget, don't await)
                  BYOKService.saveProviderModels(
                    userId,
                    provider,
                    fetchedModels,
                  ).catch(() => {});
                  for (const m of fetchedModels) {
                    availableModels[m.id] = {
                      name: m.name,
                      description: m.description,
                      maxTokens: m.maxTokens,
                      custom: (m as any).custom || false,
                    };
                  }
                }
              }
            } catch (fetchError) {
              logger.warn(
                `Failed to fetch models live for provider ${provider}`,
                {
                  userId: userId.slice(0, 8) + "...",
                  error: (fetchError as Error).message,
                },
              );
            }
          }
        }

        logger.info("Returning BYOK-based models for user", {
          userId: userId.slice(0, 8) + "...",
          modelCount: Object.keys(availableModels).length,
        });
        return availableModels;
      }
    } catch (error) {
      logger.warn("Error checking BYOK settings for user", { userId, error });
    }

    // No BYOK keys configured — no models available
    logger.info(
      "No BYOK keys configured for user, returning empty model list",
      {
        userId: userId?.slice(0, 8) + "...",
      },
    );
    return {};
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

      // Determine model — use user's preferred model, or fall back to any available model
      const userRecord: any = await prisma.user.findUnique({
        where: { id: userId },
      });
      const userModel = userRecord?.["preferred_ai_model"] || null;

      // Use getUserModel to find the best available model (respects BYOK keys)
      const model = userModel
        ? await this.getUserModel(userId, userModel)
        : await this.getUserModel(userId);

      if (!model) {
        throw new Error(
          "No AI model available. Please configure an API key in your AI settings and select a model.",
        );
      }

      // Prepare the prompt for autocomplete
      const prompt = `You are an AI writing assistant. Provide a concise and contextually appropriate continuation for the following text.
      Keep your response brief (1-3 sentences maximum) and relevant to the context.
      Do not repeat the existing text.
      Do not include any markdown formatting or special characters.
      Just provide the natural continuation of the text.

      Text to continue:
      "${text}"

      Continuation:`;

      // Route by provider prefix (no hardcoded AI_MODELS dependency)
      const normalizedModel = normalizeModelName(model);
      const provider = getModelProvider(normalizedModel);

      let suggestion = "";

      switch (provider) {
        case "gemini": {
          const currentGenAI = await getGenAI(userId);
          if (!currentGenAI)
            throw new Error(
              "Google Gemini API key not configured. Please add your Google API key in AI Settings.",
            );
          const geminiModel = currentGenAI.getGenerativeModel({
            model: normalizedModel,
          });
          const result = await geminiModel.generateContent(prompt);
          suggestion = result.response.text().trim();
          break;
        }

        case "openai": {
          const openaiClient = await getOpenAIDirectClient(userId);
          if (!openaiClient)
            throw new Error(
              "OpenAI API key not configured. Please add your OpenAI API key in AI Settings.",
            );
          const completion = await openaiClient.chat.completions.create({
            model: normalizedModel.replace("openai/", ""),
            messages: [{ role: "user", content: prompt }],
            max_tokens: 100,
          });
          suggestion = completion.choices[0]?.message?.content?.trim() || "";
          break;
        }

        case "anthropic": {
          const anthropicClient = await getAnthropicDirectClient(userId);
          if (!anthropicClient)
            throw new Error(
              "Anthropic API key not configured. Please add your Anthropic API key in AI Settings.",
            );
          const msg = await anthropicClient.messages.create({
            model: normalizedModel.replace("anthropic/", ""),
            max_tokens: 100,
            messages: [{ role: "user", content: prompt }],
          });
          suggestion =
            msg.content[0]?.type === "text" ? msg.content[0].text.trim() : "";
          break;
        }

        case "openrouter":
        default: {
          const orClient = await getOpenRouterClient(userId);
          if (!orClient)
            throw new Error(
              "OpenRouter API key not configured. Please add your OpenRouter API key in AI Settings.",
            );
          const stream = await (orClient as any).chat.send({
            chatRequest: {
              model: normalizedModel,
              messages: [{ role: "user", content: prompt }],
              maxTokens: 2048,
              stream: true,
            },
          });
          let orText = "";
          for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) orText += content;
          }
          suggestion = orText.trim();
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
