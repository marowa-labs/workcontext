import { prisma } from "../lib/prisma";
import { EncryptionService } from "./encryptionService";
import logger from "../monitoring/logger";

export type BYOKProvider =
  | "google"
  | "anthropic"
  | "openai"
  | "openrouter"
  | null;

export interface BYOKSettings {
  enabled: boolean;
  provider: BYOKProvider;
  hasGoogleKey: boolean;
  hasClaudeKey: boolean;
  hasOpenAIKey: boolean;
  hasOpenRouterKey: boolean;
  keyVersion: number;
  maskedKeys: {
    google?: string;
    claude?: string;
    openai?: string;
    openrouter?: string;
  };
}

export interface BYOKKeyInput {
  provider: BYOKProvider;
  googleKey?: string;
  claudeKey?: string;
  openaiKey?: string;
  openrouterKey?: string;
}

/**
 * BYOK (Bring Your Own Key) Service
 * Manages user-provided API keys with secure encryption
 */
export class BYOKService {
  /**
   * Get BYOK settings for a user (without exposing full keys)
   */
  static async getSettings(userId: string): Promise<BYOKSettings> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          byok_enabled: true,
          byok_provider: true,
          byok_google_key_encrypted: true,
          byok_claude_key_encrypted: true,
          byok_openai_key_encrypted: true,
          byok_openrouter_key_encrypted: true,
          byok_key_version: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const maskedKeys: BYOKSettings["maskedKeys"] = {};

      // Mask keys for display if they exist
      if (user.byok_google_key_encrypted) {
        try {
          const fullKey = EncryptionService.decrypt(
            user.byok_google_key_encrypted,
          );
          maskedKeys.google = EncryptionService.maskApiKey(fullKey);
        } catch (e) {
          logger.error("Failed to mask Google key:", e);
        }
      }

      if (user.byok_claude_key_encrypted) {
        try {
          const fullKey = EncryptionService.decrypt(
            user.byok_claude_key_encrypted,
          );
          maskedKeys.claude = EncryptionService.maskApiKey(fullKey);
        } catch (e) {
          logger.error("Failed to mask Claude key:", e);
        }
      }

      if (user.byok_openai_key_encrypted) {
        try {
          const fullKey = EncryptionService.decrypt(
            user.byok_openai_key_encrypted,
          );
          maskedKeys.openai = EncryptionService.maskApiKey(fullKey);
        } catch (e) {
          logger.error("Failed to mask OpenAI key:", e);
        }
      }

      if (user.byok_openrouter_key_encrypted) {
        try {
          const fullKey = EncryptionService.decrypt(
            user.byok_openrouter_key_encrypted,
          );
          maskedKeys.openrouter = EncryptionService.maskApiKey(fullKey);
        } catch (e) {
          logger.error("Failed to mask OpenRouter key:", e);
        }
      }

      return {
        enabled: user.byok_enabled || false,
        provider: user.byok_provider as BYOKProvider,
        hasGoogleKey: !!user.byok_google_key_encrypted,
        hasClaudeKey: !!user.byok_claude_key_encrypted,
        hasOpenAIKey: !!user.byok_openai_key_encrypted,
        hasOpenRouterKey: !!user.byok_openrouter_key_encrypted,
        keyVersion: user.byok_key_version || 1,
        maskedKeys,
      };
    } catch (error: any) {
      logger.error("Error fetching BYOK settings:", error);
      throw new Error("Failed to fetch BYOK settings");
    }
  }

  /**
   * Save or update BYOK settings
   */
  static async saveSettings(
    userId: string,
    settings: {
      enabled?: boolean;
      provider?: BYOKProvider;
    },
  ): Promise<BYOKSettings> {
    try {
      const updateData: any = {};

      if (settings.enabled !== undefined) {
        updateData.byok_enabled = settings.enabled;
      }

      if (settings.provider !== undefined) {
        updateData.byok_provider = settings.provider;
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      return await this.getSettings(userId);
    } catch (error: any) {
      logger.error("Error saving BYOK settings:", error);
      throw new Error("Failed to save BYOK settings");
    }
  }

  /**
   * Save an encrypted API key for a specific provider
   */
  static async saveApiKey(
    userId: string,
    provider: "google" | "anthropic" | "openai" | "openrouter",
    apiKey: string,
  ): Promise<void> {
    try {
      // Validate key format (skip validation for OpenRouter as it can use various formats)
      if (
        provider !== "openrouter" &&
        !EncryptionService.validateApiKeyFormat(apiKey, provider)
      ) {
        throw new Error(`Invalid API key format for ${provider}`);
      }

      // Encrypt the key
      const encryptedKey = EncryptionService.encrypt(apiKey);

      // Update the appropriate field
      const fieldMap = {
        google: "byok_google_key_encrypted",
        anthropic: "byok_claude_key_encrypted",
        openai: "byok_openai_key_encrypted",
        openrouter: "byok_openrouter_key_encrypted",
      };

      await prisma.user.update({
        where: { id: userId },
        data: {
          [fieldMap[provider]]: encryptedKey,
          byok_key_version: { increment: 1 },
        },
      });

      logger.info(`BYOK key saved for user ${userId}, provider: ${provider}`);

      // Fetch and cache available models for this provider
      try {
        const models = await this.fetchProviderModels(provider, apiKey);
        if (models.length > 0) {
          await this.saveProviderModels(userId, provider, models);
        }
      } catch (modelError) {
        logger.warn(
          `Failed to fetch models for ${provider} after saving key:`,
          modelError,
        );
        // Don't throw — key is saved, models can be fetched later
      }
    } catch (error: any) {
      logger.error("Error saving API key:", error);
      throw error;
    }
  }

  /**
   * Fetch available models from a provider's API
   */
  static async fetchProviderModels(
    provider: "google" | "anthropic" | "openai" | "openrouter",
    apiKey: string,
  ): Promise<
    Array<{ id: string; name: string; description: string; maxTokens: number }>
  > {
    switch (provider) {
      case "openai": {
        const { default: OpenAI } = await import("openai");
        const client = new OpenAI({ apiKey });
        const response = await client.models.list();
        return response.data
          .filter(
            (m: any) =>
              m.id.startsWith("gpt-") ||
              m.id.startsWith("o1-") ||
              m.id.startsWith("o3-"),
          )
          .map((m: any) => ({
            id: `openai/${m.id}`,
            name: m.id.toUpperCase().replace(/-/g, " "),
            description: `OpenAI ${m.id} model`,
            maxTokens: m.id.includes("gpt-4o")
              ? 128000
              : m.id.includes("mini")
                ? 128000
                : 4096,
          }))
          .sort((a: any, b: any) => a.id.localeCompare(b.id));
      }

      case "anthropic": {
        // Anthropic has no public models.list API, but we can validate the key
        // and return the current lineup. This is kept up to date with Anthropic's available models.
        // Users can also type any valid Anthropic model ID directly in the chat.
        return [
          {
            id: "anthropic/claude-sonnet-4-20250514",
            name: "Claude Sonnet 4",
            description:
              "Anthropic's latest Sonnet — excellent reasoning, coding, and writing",
            maxTokens: 200000,
          },
          {
            id: "anthropic/claude-3-5-sonnet-20241022",
            name: "Claude 3.5 Sonnet",
            description:
              "Fast, capable model for complex tasks with extended context",
            maxTokens: 200000,
          },
          {
            id: "anthropic/claude-3-5-haiku-20241022",
            name: "Claude 3.5 Haiku",
            description:
              "Anthropic's fastest model — ideal for lightweight, responsive tasks",
            maxTokens: 200000,
          },
          {
            id: "anthropic/claude-3-opus-20240229",
            name: "Claude 3 Opus",
            description:
              "Anthropic's most powerful model for deep analysis and complex reasoning",
            maxTokens: 200000,
          },
          {
            id: "anthropic/claude-3-haiku-20240307",
            name: "Claude 3 Haiku",
            description:
              "Fast and cost-effective model for high-throughput tasks",
            maxTokens: 200000,
          },
        ];
      }

      case "google": {
        // Fetch available Gemini models from Google's models.list API
        try {
          const fetch = (await import("node-fetch")).default;
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
          );
          if (!response.ok) {
            throw new Error(`Google models API returned ${response.status}`);
          }
          const data = (await response.json()) as any;
          return (data.models || [])
            .filter(
              (m: any) =>
                m.supportedGenerationMethods &&
                m.supportedGenerationMethods.includes("generateContent"),
            )
            .map((m: any) => ({
              id: m.name.replace("models/", ""),
              name:
                m.displayName ||
                m.name.replace("models/", "").replace(/-/g, " "),
              description: m.description || `Google Gemini model: ${m.name}`,
              maxTokens: m.outputTokenLimit || 1048576,
            }))
            .sort((a: any, b: any) => {
              // Prioritize gemini- prefixed models first, then sort alphabetically
              const aIsGemini = a.id.startsWith("gemini-");
              const bIsGemini = b.id.startsWith("gemini-");
              if (aIsGemini && !bIsGemini) return -1;
              if (!aIsGemini && bIsGemini) return 1;
              return a.id.localeCompare(b.id);
            });
        } catch (error: any) {
          logger.warn(
            "Failed to fetch Gemini models dynamically, using fallback list",
            { error: error.message },
          );
          // Fallback to known Gemini models
          return [
            {
              id: "gemini-3.1-flash-lite",
              name: "Gemini 3.1 Flash Lite",
              description: "Google's fast multimodal model",
              maxTokens: 1048576,
            },
            {
              id: "gemini-2.0-flash",
              name: "Gemini 2.0 Flash",
              description: "Google's balanced multimodal model",
              maxTokens: 1048576,
            },
            {
              id: "gemini-2.5-pro",
              name: "Gemini 2.5 Pro",
              description: "Google's most capable reasoning model",
              maxTokens: 1048576,
            },
          ];
        }
      }

      case "openrouter": {
        // OpenRouter has a models endpoint
        const fetch = (await import("node-fetch")).default;
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!response.ok) throw new Error("Failed to fetch OpenRouter models");
        const data = (await response.json()) as any;
        return (data.data || [])
          .filter((m: any) => m.context_length > 0)
          .map((m: any) => ({
            id: m.id,
            name:
              m.id
                .split("/")
                .pop()
                ?.replace(/-/g, " ")
                .replace(/\b\w/g, (c: string) => c.toUpperCase()) || m.id,
            description: `${m.id} via OpenRouter`,
            maxTokens: m.context_length || 4096,
          }))
          .sort((a: any, b: any) =>
            a.id.includes(":free") ? -1 : b.id.includes(":free") ? 1 : 0,
          );
      }

      default:
        return [];
    }
  }

  /**
   * Save fetched provider models to the database for a user
   */
  static async saveProviderModels(
    userId: string,
    provider: string,
    models: Array<{
      id: string;
      name: string;
      description: string;
      maxTokens: number;
    }>,
  ): Promise<void> {
    try {
      const fieldMap: Record<string, string> = {
        google: "byok_google_models",
        anthropic: "byok_claude_models",
        openai: "byok_openai_models",
        openrouter: "byok_openrouter_models",
      };
      const field = fieldMap[provider];
      if (!field) return;

      await prisma.user.update({
        where: { id: userId },
        data: { [field]: models },
      });
      logger.info(
        `Saved ${models.length} models for user ${userId}, provider: ${provider}`,
      );
    } catch (error) {
      logger.error("Error saving provider models:", error);
    }
  }

  /**
   * Get cached provider models for a user
   */
  static async getProviderModels(
    userId: string,
    provider: string,
  ): Promise<Array<{
    id: string;
    name: string;
    description: string;
    maxTokens: number;
  }> | null> {
    try {
      const fieldMap: Record<string, string> = {
        google: "byok_google_models",
        anthropic: "byok_claude_models",
        openai: "byok_openai_models",
        openrouter: "byok_openrouter_models",
      };
      const field = fieldMap[provider];
      if (!field) return null;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { [field]: true },
      });

      return (user as any)?.[field] || null;
    } catch {
      return null;
    }
  }

  /**
   * Add a custom model for a provider (user manually entered model ID)
   */
  static async addCustomModel(
    userId: string,
    provider: string,
    model: { id: string; name: string; description: string; maxTokens: number },
  ): Promise<void> {
    const fieldMap: Record<string, string> = {
      google: "byok_google_models",
      anthropic: "byok_claude_models",
      openai: "byok_openai_models",
      openrouter: "byok_openrouter_models",
    };
    const field = fieldMap[provider];
    if (!field) throw new Error(`Invalid provider: ${provider}`);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { [field]: true },
    });
    const existingModels: any[] = (user as any)?.[field] || [];

    // Check if model with this ID already exists
    const existing = existingModels.find((m: any) => m.id === model.id);
    if (existing) {
      // Update the existing custom model
      Object.assign(existing, model, { custom: true });
    } else {
      existingModels.push({ ...model, custom: true });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { [field]: existingModels },
    });
    logger.info(
      `Added custom model "${model.id}" for user ${userId}, provider: ${provider}`,
    );
  }

  /**
   * Remove a custom model for a provider
   */
  static async removeCustomModel(
    userId: string,
    provider: string,
    modelId: string,
  ): Promise<void> {
    const fieldMap: Record<string, string> = {
      google: "byok_google_models",
      anthropic: "byok_claude_models",
      openai: "byok_openai_models",
      openrouter: "byok_openrouter_models",
    };
    const field = fieldMap[provider];
    if (!field) throw new Error(`Invalid provider: ${provider}`);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { [field]: true },
    });
    const existingModels: any[] = (user as any)?.[field] || [];

    const filtered = existingModels.filter(
      (m: any) => !(m.id === modelId && m.custom === true),
    );

    await prisma.user.update({
      where: { id: userId },
      data: { [field]: filtered },
    });
    logger.info(
      `Removed custom model "${modelId}" for user ${userId}, provider: ${provider}`,
    );
  }

  /**
   * Delete an API key for a specific provider
   */
  static async deleteApiKey(
    userId: string,
    provider: "google" | "anthropic" | "openai" | "openrouter",
  ): Promise<void> {
    try {
      const fieldMap = {
        google: "byok_google_key_encrypted",
        anthropic: "byok_claude_key_encrypted",
        openai: "byok_openai_key_encrypted",
        openrouter: "byok_openrouter_key_encrypted",
      };

      await prisma.user.update({
        where: { id: userId },
        data: {
          [fieldMap[provider]]: null,
          byok_key_version: { increment: 1 },
        },
      });

      logger.info(`BYOK key deleted for user ${userId}, provider: ${provider}`);
    } catch (error: any) {
      logger.error("Error deleting API key:", error);
      throw new Error("Failed to delete API key");
    }
  }

  /**
   * Get decrypted API key for a user and provider
   * This should only be called server-side when making API requests
   */
  static async getDecryptedKey(
    userId: string,
    provider: "google" | "anthropic" | "openai" | "openrouter",
  ): Promise<string | null> {
    try {
      const fieldMap = {
        google: "byok_google_key_encrypted",
        anthropic: "byok_claude_key_encrypted",
        openai: "byok_openai_key_encrypted",
        openrouter: "byok_openrouter_key_encrypted",
      };

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          [fieldMap[provider]]: true,
          byok_enabled: true,
        },
      });

      if (!user || !user.byok_enabled) {
        return null;
      }

      const encryptedKey = user[fieldMap[provider] as keyof typeof user] as
        | string
        | null;

      if (!encryptedKey) {
        return null;
      }

      return EncryptionService.decrypt(encryptedKey);
    } catch (error: any) {
      logger.error("Error decrypting API key:", error);
      return null;
    }
  }

  /**
   * Check if user has BYOK enabled and a valid key for the specified provider
   */
  static async hasValidKey(
    userId: string,
    provider: "google" | "anthropic" | "openai" | "openrouter",
  ): Promise<boolean> {
    const key = await this.getDecryptedKey(userId, provider);
    return !!key;
  }

  /**
   * Get key status for all providers (for connection status display)
   */
  static async getKeyStatuses(
    userId: string,
  ): Promise<Record<string, "valid" | "invalid" | "missing" | "error">> {
    const providers = ["google", "anthropic", "openai", "openrouter"] as const;
    const statuses: Record<string, "valid" | "invalid" | "missing" | "error"> =
      {};

    for (const provider of providers) {
      try {
        const hasKey = await this.hasValidKey(userId, provider);
        if (!hasKey) {
          // Check if key exists but is invalid
          const fieldMap = {
            google: "byok_google_key_encrypted",
            anthropic: "byok_claude_key_encrypted",
            openai: "byok_openai_key_encrypted",
            openrouter: "byok_openrouter_key_encrypted",
          };
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { [fieldMap[provider]]: true },
          });
          const encrypted = user?.[fieldMap[provider] as keyof typeof user];
          statuses[provider] = encrypted ? "invalid" : "missing";
        } else {
          statuses[provider] = "valid";
        }
      } catch {
        statuses[provider] = "error";
      }
    }

    return statuses;
  }

  /**
   * Test an API key to verify it works
   */
  static async testApiKey(
    provider: "google" | "anthropic" | "openai" | "openrouter",
    apiKey: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate format first (skip for OpenRouter)
      if (
        provider !== "openrouter" &&
        !EncryptionService.validateApiKeyFormat(apiKey, provider)
      ) {
        return {
          success: false,
          message: `Invalid API key format for ${provider}`,
        };
      }

      // Provider-specific test implementations would go here
      // For now, we just validate the format
      // In production, you'd make a small test request to verify the key works

      switch (provider) {
        case "google":
          // Test with a minimal Gemini request
          return await this.testGoogleKey(apiKey);
        case "anthropic":
          // Test with a minimal Claude request
          return await this.testAnthropicKey(apiKey);
        case "openai":
          // Test with a minimal OpenAI request
          return await this.testOpenAIKey(apiKey);
        default:
          return { success: false, message: "Unknown provider" };
      }
    } catch (error: any) {
      logger.error("Error testing API key:", error);
      return {
        success: false,
        message: `Test failed: ${error.message}`,
      };
    }
  }

  private static async testGoogleKey(
    apiKey: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite",
      });

      // Make a minimal test request
      const result = await model.generateContent("Hi");
      const response = await result.response;

      if (response.text()) {
        return {
          success: true,
          message: "Google AI Studio API key is valid and working",
        };
      }

      return {
        success: false,
        message: "Key appears valid but test request failed",
      };
    } catch (error: any) {
      if (error.message?.includes("API key not valid")) {
        return { success: false, message: "Invalid Google AI Studio API key" };
      }
      if (error.message?.includes("quota")) {
        return {
          success: true,
          message: "Key is valid (quota exceeded for test)",
        };
      }
      return { success: false, message: `Test failed: ${error.message}` };
    }
  }

  private static async testAnthropicKey(
    apiKey: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });

      // Make a minimal test request
      const response = await client.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }],
      });

      if (response.content && response.content.length > 0) {
        return {
          success: true,
          message: "Anthropic API key is valid and working",
        };
      }

      return {
        success: false,
        message: "Key appears valid but test request failed",
      };
    } catch (error: any) {
      if (error.message?.includes("authentication")) {
        return { success: false, message: "Invalid Anthropic API key" };
      }
      return { success: false, message: `Test failed: ${error.message}` };
    }
  }

  private static async testOpenAIKey(
    apiKey: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey });

      // Make a minimal test request
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 10,
      });

      if (response.choices && response.choices.length > 0) {
        return {
          success: true,
          message: "OpenAI API key is valid and working",
        };
      }

      return {
        success: false,
        message: "Key appears valid but test request failed",
      };
    } catch (error: any) {
      if (error.message?.includes("Incorrect API key")) {
        return { success: false, message: "Invalid OpenAI API key" };
      }
      return { success: false, message: `Test failed: ${error.message}` };
    }
  }
}

export default BYOKService;
