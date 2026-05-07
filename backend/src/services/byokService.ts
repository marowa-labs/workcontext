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
    } catch (error: any) {
      logger.error("Error saving API key:", error);
      throw error;
    }
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
        model: "gemini-3.1-flash-lite-preview",
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
