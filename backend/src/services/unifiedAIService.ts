import logger from "../monitoring/logger";
import { GeminiService } from "./geminiService";
import { prisma } from "../lib/prisma";
import { AIService } from "./aiService";
import { BYOKService } from "./byokService";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Lazy initialization of OpenAI client — BYOK ONLY, no system fallback
async function getOpenAIClient(userId?: string): Promise<OpenAI | null> {
  if (!userId) return null;
  const byokKey = await BYOKService.getDecryptedKey(userId, "openai");
  if (!byokKey) return null;
  logger.info("Using BYOK OpenAI key for user", {
    userId: userId.slice(0, 8) + "...",
  });
  return new OpenAI({ apiKey: byokKey });
}

// Lazy initialization of Anthropic client — BYOK ONLY, no system fallback
async function getAnthropicClient(userId?: string): Promise<Anthropic | null> {
  if (!userId) return null;
  const byokKey = await BYOKService.getDecryptedKey(userId, "anthropic");
  if (!byokKey) return null;
  logger.info("Using BYOK Anthropic key for user", {
    userId: userId.slice(0, 8) + "...",
  });
  return new Anthropic({ apiKey: byokKey });
}

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

      // Check if user has BYOK keys — if so, skip plan-based model restrictions
      const byokSettings = await BYOKService.getSettings(userId);
      const hasBYOK =
        byokSettings.hasGoogleKey ||
        byokSettings.hasOpenAIKey ||
        byokSettings.hasClaudeKey ||
        byokSettings.hasOpenRouterKey;

      // Resolve the effective preferred model:
      // 1. Explicitly requested model (from frontend) — highest priority
      // 2. User's saved preferred_ai_model from DB — persistent preference
      // 3. null — falls through to pickDefaultModel in each select*Model
      const preferredModel =
        options.preferredModel || (await this.getUserPreferredModel(userId));
      if (preferredModel) {
        const availableModels = await AIService.getUserAvailableModels(userId);
        if (!availableModels[preferredModel]) {
          throw new Error(
            `Model ${preferredModel} is not available. Please configure the required API key in your AI settings or select a different model.`,
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
      let modelUsed: string | null;

      // Route to appropriate service based on capability — BYOK-aware model selection
      switch (capability) {
        case "grammar_check":
          modelUsed = await this.selectGrammarModel(userId, preferredModel);
          if (!modelUsed)
            throw new Error(
              "No AI model available. Please configure an API key in your AI settings.",
            );
          result = await this.routeToProvider(
            modelUsed,
            userId,
            `You are a professional language editor. Analyze the following text and return a JSON array of corrections. Return ONLY valid JSON — no explanations outside the JSON.

Format exactly like this:
[
  {"type": "grammar", "original": "exact text found", "suggestion": "corrected version", "reason": "Subject-verb agreement error"},
  {"type": "spelling", "original": "exact text found", "suggestion": "corrected spelling", "reason": "Misspelled word"},
  {"type": "tone", "original": "exact text found", "suggestion": "more formal version", "reason": "Too casual for academic writing"},
  {"type": "conciseness", "original": "exact text found", "suggestion": "shorter version", "reason": "Wordy — can be shortened"}
]

Rules:
- "original" MUST be the EXACT substring from the text below — character-for-character
- Only include real issues — ignore stylistic preferences that aren't clearly wrong
- Keep "suggestion" as a direct replacement
- Return [] if the text has no issues

Text to check:
${content}`,
            { maxTokens: 2000, temperature: 0.2 },
          );
          break;

        case "summarization":
          modelUsed = await this.selectSummarizationModel(
            userId,
            preferredModel,
          );
          if (!modelUsed)
            throw new Error(
              "No AI model available. Please configure an API key in your AI settings.",
            );
          result = await this.routeToProvider(
            modelUsed,
            userId,
            `Please provide a ${options.summaryType || "concise"} summary of the following content:\n\n${content}`,
            { maxTokens: 2000, temperature: 0.3 },
          );
          break;

        case "document_qa":
          modelUsed = await this.selectQAModel(userId, preferredModel);
          if (!modelUsed)
            throw new Error(
              "No AI model available. Please configure an API key in your AI settings.",
            );

          // Ground the answer with semantically related workspace items
          // ("workspace memory") when available.
          let workspaceContextBlock = "";
          if (
            Array.isArray(options.workspaceContext) &&
            options.workspaceContext.length > 0
          ) {
            const ctxLines = (options.workspaceContext as any[])
              .map(
                (r) =>
                  `- [${r.entity_type}] ${r.title || "(untitled)"}: ${(
                    r.content || ""
                  ).slice(0, 300)}`,
              )
              .join("\n");
            workspaceContextBlock = `\n\nWORKSPACE CONTEXT — related items from across the user's workspace (use only if relevant to the question):\n${ctxLines}`;
          }

          result = await this.routeToProvider(
            modelUsed,
            userId,
            `Document content:\n${options.documentContent}${workspaceContextBlock}\n\nQuestion:\n${content}`,
            { maxTokens: 2048, temperature: 0.5 },
          );
          break;

        case "writing_project":
          modelUsed = await this.selectWritingProjectModel(
            userId,
            preferredModel,
          );
          if (!modelUsed)
            throw new Error(
              "No AI model available. Please configure an API key in your AI settings.",
            );
          // Use GeminiService for Gemini models, routeToProvider for other providers
          if (modelUsed.startsWith("gemini")) {
            if (options.action === "outline") {
              result = await GeminiService.generateProjectOutline(
                content,
                options.projectType,
                modelUsed,
                userId,
              );
            } else if (options.action === "research") {
              result = await GeminiService.provideResearchAssistance(
                options.researchTopic,
                content,
                modelUsed,
                userId,
              );
            } else {
              result = await GeminiService.assistWithWritingProject(
                options.projectDescription,
                content,
                modelUsed,
                userId,
              );
            }
          } else {
            // Route non-Gemini models through routeToProvider
            let prompt: string;
            if (options.action === "outline") {
              prompt = `Create a detailed academic outline for a ${options.projectType || "research_paper"} on the topic: "${content}".\n\nInclude:\n1. Main sections with clear headings\n2. Subsections with brief descriptions\n3. Key points to cover in each section\n4. Suggested word count for each section\n5. Research sources and references to consider\n\nFormat the outline in a clear, hierarchical structure.`;
            } else if (options.action === "research") {
              prompt = `You are a research assistant helping with academic research on: "${content}".\n\nSpecific Question:\n${options.researchTopic}\n\nProvide:\n1. Relevant academic sources and references\n2. Key concepts and terminology\n3. Current research trends and findings\n4. Methodology suggestions\n5. Potential research gaps to explore\n\nFocus on credible, peer-reviewed sources and academic best practices.`;
            } else {
              prompt = `You are an expert writing project assistant. Help the user with their writing project.\n\nProject Description:\n${options.projectDescription}\n\nUser Request:\n${content}\n\nProvide comprehensive assistance including:\n1. Project planning and structure suggestions\n2. Content generation for specific sections\n3. Research guidance and resources\n4. Writing tips and best practices\n5. Timeline and milestone recommendations\n\nBe specific, actionable, and focused on academic writing excellence.`;
            }
            result = await this.routeToProvider(modelUsed, userId, prompt, {
              maxTokens: 3000,
              temperature: 0.7,
            });
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

  /**
   * Route a request to the appropriate AI provider based on model name.
   * Supports: Gemini (google/*), OpenAI (openai/*), Anthropic (anthropic/*), OpenRouter (openai/gpt-*, nvidia/*)
   */
  private static async routeToProvider(
    model: string,
    userId: string,
    prompt: string,
    options: { maxTokens: number; temperature: number },
  ): Promise<{ content: string; tokensUsed: number; cost: number }> {
    // Gemini models
    if (model.startsWith("gemini")) {
      return await GeminiService.sendMessage(
        prompt,
        model,
        options.maxTokens,
        options.temperature,
        userId,
      );
    }

    // OpenAI models (gpt-4o, gpt-4o-mini, etc.)
    if (model.startsWith("openai/") && !model.includes(":free")) {
      const openaiClient = await getOpenAIClient(userId);
      if (openaiClient) {
        const response = await openaiClient.chat.completions.create({
          model: model.replace("openai/", ""),
          messages: [{ role: "user", content: prompt }],
          max_tokens: options.maxTokens,
          temperature: options.temperature,
        });
        const content = response.choices[0]?.message?.content || "";
        const inputTokens = response.usage?.prompt_tokens || 0;
        const outputTokens = response.usage?.completion_tokens || 0;
        const totalTokens = inputTokens + outputTokens;
        // Approximate cost: GPT-4o ~$2.50/1M input, $10/1M output; GPT-4o-mini ~$0.15/1M input, $0.60/1M output
        const isMini = model.includes("mini");
        const cost = isMini
          ? (inputTokens / 1000000) * 0.15 + (outputTokens / 1000000) * 0.6
          : (inputTokens / 1000000) * 2.5 + (outputTokens / 1000000) * 10.0;
        return { content, tokensUsed: totalTokens, cost };
      }
      throw new Error(
        "OpenAI client not available. Please configure an OpenAI API key.",
      );
    }

    // Anthropic models (claude-*)
    if (model.startsWith("anthropic/") || model.startsWith("claude-")) {
      const anthropicClient = await getAnthropicClient(userId);
      if (anthropicClient) {
        const modelName = model.replace("anthropic/", "");
        const response = await anthropicClient.messages.create({
          model: modelName,
          max_tokens: options.maxTokens,
          messages: [{ role: "user", content: prompt }],
        });
        const content =
          response.content[0]?.type === "text" ? response.content[0].text : "";
        const inputTokens = response.usage.input_tokens || 0;
        const outputTokens = response.usage.output_tokens || 0;
        const totalTokens = inputTokens + outputTokens;
        // Approximate cost: Claude 3.5 Sonnet ~$3/1M input, $15/1M output
        const cost =
          (inputTokens / 1000000) * 3.0 + (outputTokens / 1000000) * 15.0;
        return { content, tokensUsed: totalTokens, cost };
      }
      throw new Error(
        "Anthropic client not available. Please configure an Anthropic API key.",
      );
    }

    // OpenRouter models (openai/gpt-*:free, nvidia/*:free, etc.)
    // Before falling back to OpenRouter, check if this is actually a Google model
    // (Google API may return models that don't start with "gemini-", e.g. "antigravity-preview-*")
    const byokSettings = await BYOKService.getSettings(userId);
    if (byokSettings.hasGoogleKey) {
      try {
        const googleModels = await BYOKService.getProviderModels(
          userId,
          "google",
        );
        const isGoogleModel =
          googleModels?.some((m) => m.id === model) ?? false;
        if (isGoogleModel) {
          logger.info("Routing non-prefixed model through GeminiService", {
            model,
            userId: userId.slice(0, 8) + "...",
          });
          return await GeminiService.sendMessage(
            prompt,
            model,
            options.maxTokens,
            options.temperature,
            userId,
          );
        }
      } catch (checkError) {
        logger.warn("Failed to check Google models for routing", {
          error: (checkError as Error).message,
        });
      }
    }

    // Fall back to AIService.processChatMessage which handles OpenRouter
    const chatResult = await AIService.processChatMessage({
      sessionId: `unified-${Date.now()}`,
      userId,
      content: prompt,
      model,
    });
    return {
      content: chatResult.content || "",
      tokensUsed: chatResult.content?.length || 0,
      cost: 0,
    };
  }

  /**
   * Read the user's saved preferred_ai_model from the database.
   * This is the persisted model preference (set by user in AI Settings).
   */
  private static async getUserPreferredModel(
    userId: string,
  ): Promise<string | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferred_ai_model: true },
      });
      return user?.preferred_ai_model || null;
    } catch {
      return null;
    }
  }

  /**
   * Pick the best default model from available IDs.
   * Provider-agnostic: doesn't hardcode a specific model family.
   * If a userId is provided, checks their configured providers to make
   * better default choices (e.g., gemini-first for Google key users).
   */
  private static async pickDefaultModel(
    availableIds: string[],
    userId?: string,
  ): Promise<string | null> {
    if (availableIds.length === 0) return null;

    if (userId) {
      try {
        const byokSettings = await BYOKService.getSettings(userId);
        // For Google users, prefer gemini- prefixed models
        if (byokSettings.hasGoogleKey) {
          const geminiModel = availableIds.find((id) =>
            id.startsWith("gemini-"),
          );
          if (geminiModel) return geminiModel;
        }
      } catch {
        // Fall through to first-available
      }
    }

    return availableIds[0];
  }

  // Select appropriate model for grammar checking — BYOK-aware
  private static async selectGrammarModel(
    userId: string,
    preferredModel?: string | null,
  ): Promise<string | null> {
    const availableModels = await AIService.getUserAvailableModels(userId);
    const availableIds = Object.keys(availableModels);
    if (preferredModel && availableIds.includes(preferredModel))
      return preferredModel;
    return this.pickDefaultModel(availableIds, userId);
  }

  // Select appropriate model for document Q&A — BYOK-aware
  private static async selectQAModel(
    userId: string,
    preferredModel?: string | null,
  ): Promise<string | null> {
    const availableModels = await AIService.getUserAvailableModels(userId);
    const availableIds = Object.keys(availableModels);
    if (preferredModel && availableIds.includes(preferredModel))
      return preferredModel;
    return this.pickDefaultModel(availableIds, userId);
  }

  // Select appropriate model for writing project — BYOK-aware
  private static async selectWritingProjectModel(
    userId: string,
    preferredModel?: string | null,
  ): Promise<string | null> {
    const availableModels = await AIService.getUserAvailableModels(userId);
    const availableIds = Object.keys(availableModels);
    if (preferredModel && availableIds.includes(preferredModel))
      return preferredModel;
    return this.pickDefaultModel(availableIds, userId);
  }

  // Select appropriate model for structured tasks — BYOK-aware
  private static async selectStructuredTaskModel(
    userId: string,
    preferredModel?: string | null,
  ): Promise<string | null> {
    const availableModels = await AIService.getUserAvailableModels(userId);
    const availableIds = Object.keys(availableModels);
    if (preferredModel && availableIds.includes(preferredModel))
      return preferredModel;
    return this.pickDefaultModel(availableIds, userId);
  }

  // Select appropriate model for summarization — BYOK-aware
  private static async selectSummarizationModel(
    userId: string,
    preferredModel?: string | null,
  ): Promise<string | null> {
    const availableModels = await AIService.getUserAvailableModels(userId);
    const availableIds = Object.keys(availableModels);
    if (preferredModel && availableIds.includes(preferredModel))
      return preferredModel;
    return this.pickDefaultModel(availableIds, userId);
  }

  // Track AI usage for billing and analytics with BYOK cost attribution
  static async trackAIUsage(
    userId: string,
    capability: string,
    metadata?: { model?: string; tokensUsed?: number; cost?: number },
  ) {
    try {
      // Get current usage for the user this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Check if user has BYOK keys for cost attribution
      const byokSettings = await BYOKService.getSettings(userId);
      const hasBYOK =
        byokSettings.hasGoogleKey ||
        byokSettings.hasOpenAIKey ||
        byokSettings.hasClaudeKey ||
        byokSettings.hasOpenRouterKey;

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

      // If metadata is provided, update tokens and cost with BYOK attribution
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
          costUpdateData.total_cost_estimate = usage?.total_cost_estimate
            ? usage.total_cost_estimate + metadata.cost
            : metadata.cost;

          // Track BYOK vs system cost attribution
          if (hasBYOK) {
            costUpdateData.byok_cost_estimate = usage?.byok_cost_estimate
              ? usage.byok_cost_estimate + metadata.cost
              : metadata.cost;
            costUpdateData.byok_request_count = usage?.byok_request_count
              ? usage.byok_request_count + 1
              : 1;
          } else {
            costUpdateData.system_cost_estimate = usage?.system_cost_estimate
              ? usage.system_cost_estimate + metadata.cost
              : metadata.cost;
            costUpdateData.system_request_count = usage?.system_request_count
              ? usage.system_request_count + 1
              : 1;
          }
        }

        await prisma.aIUsage.update({
          where: { id: usageRecord.id },
          data: costUpdateData,
        });
      }

      logger.info("AI usage tracked", {
        userId,
        capability,
        byok: hasBYOK,
        metadata,
      });
    } catch (error) {
      logger.error("Error tracking AI usage:", error);
    }
  }

  // Check if user has reached their AI usage limit — all users have unlimited access
  static async checkUsageLimit(userId: string, capability: string) {
    // No subscription-based limits — all features are fully open
    return { hasLimit: false, remaining: 1000000 };
  }

  // Legacy method — kept for compatibility but no longer enforces limits
  static async _checkUsageLimitLegacy(userId: string, capability: string) {
    try {
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
        return { hasLimit: false, remaining: 1000000 };
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

      const remaining = 1000000 - used;
      return {
        hasLimit: false,
        remaining: remaining > 0 ? remaining : 1000000,
      };
    } catch (error) {
      logger.error("Error checking AI usage limit:", error);
      return { hasLimit: false, remaining: 1000000 };
    }
  }
}
