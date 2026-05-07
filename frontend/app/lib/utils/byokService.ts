import { apiClient } from "./apiClient";

export type BYOKProvider = "google" | "anthropic" | "openai" | "openrouter";

export interface BYOKSettings {
  enabled: boolean;
  provider: BYOKProvider | null;
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

export interface BYOKKeyTestResult {
  success: boolean;
  message: string;
}

/**
 * BYOK (Bring Your Own Key) Frontend Service
 * Manages user-provided API keys
 */
export class BYOKFrontendService {
  /**
   * Get current BYOK settings
   */
  static async getSettings(): Promise<BYOKSettings> {
    const response = await apiClient.get("/api/ai/byok/settings");
    console.log("BYOK getSettings response:", response);
    if (!response) {
      throw new Error("No response from server");
    }
    if (response.success === false) {
      throw new Error(response.message || "Failed to fetch BYOK settings");
    }
    return response.settings;
  }

  /**
   * Update BYOK settings (enable/disable, provider)
   */
  static async updateSettings(settings: {
    enabled?: boolean;
    provider?: BYOKProvider | null;
  }): Promise<BYOKSettings> {
    const response = await apiClient.put("/api/ai/byok/settings", settings);
    if (!response || response.success === false) {
      throw new Error(response?.message || "Failed to update BYOK settings");
    }
    return response.settings;
  }

  /**
   * Save an API key for a provider
   */
  static async saveApiKey(
    provider: BYOKProvider,
    apiKey: string
  ): Promise<{ message: string; testMessage: string }> {
    const response = await apiClient.post("/api/ai/byok/keys", {
      provider,
      apiKey,
    });
    if (!response || response.success === false) {
      throw new Error(response?.message || "Failed to save API key");
    }
    return {
      message: response.message,
      testMessage: response.testMessage,
    };
  }

  /**
   * Delete an API key for a provider
   */
  static async deleteApiKey(provider: BYOKProvider): Promise<string> {
    const response = await apiClient.delete(`/api/ai/byok/keys/${provider}`, {});
    if (!response || response.success === false) {
      throw new Error(response?.message || "Failed to delete API key");
    }
    return response.message;
  }

  /**
   * Test an API key without saving it
   */
  static async testApiKey(
    provider: BYOKProvider,
    apiKey: string
  ): Promise<BYOKKeyTestResult> {
    const response = await apiClient.post("/api/ai/byok/test", {
      provider,
      apiKey,
    });
    return {
      success: response?.success || false,
      message: response?.message || "Test failed",
    };
  }

  /**
   * Get provider display name
   */
  static getProviderDisplayName(provider: BYOKProvider): string {
    const names: Record<BYOKProvider, string> = {
      google: "Google AI Studio (Gemini)",
      anthropic: "Anthropic (Claude)",
      openai: "OpenAI (GPT)",
      openrouter: "OpenRouter (100+ models)",
    };
    return names[provider];
  }

  /**
   * Get provider icon/color info
   */
  static getProviderInfo(provider: BYOKProvider): {
    color: string;
    bgColor: string;
    borderColor: string;
  } {
    const info: Record<BYOKProvider, { color: string; bgColor: string; borderColor: string }> = {
      google: {
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      },
      anthropic: {
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
      },
      openai: {
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      },
      openrouter: {
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
      },
    };
    return info[provider];
  }

  /**
   * Validate API key format on client side (basic validation)
   */
  static validateKeyFormat(provider: BYOKProvider, key: string): boolean {
    if (!key || key.length < 10) return false;

    switch (provider) {
      case "google":
        // Google AI Studio keys typically start with AIza
        return key.startsWith("AIza") || key.length >= 39;
      case "anthropic":
        // Anthropic keys start with sk-ant-
        return key.startsWith("sk-ant-") || key.startsWith("sk-ant-api03-");
      case "openai":
        // OpenAI keys start with sk-
        return key.startsWith("sk-") && key.length >= 20;
      case "openrouter":
        // OpenRouter keys typically start with sk-or-
        return key.startsWith("sk-or-") && key.length >= 30;
      default:
        return false;
    }
  }

  /**
   * Get placeholder text for API key input
   */
  static getKeyPlaceholder(provider: BYOKProvider): string {
    const placeholders: Record<BYOKProvider, string> = {
      google: "AIza... (Google AI Studio API Key)",
      anthropic: "sk-ant-... (Claude API Key)",
      openai: "sk-... (OpenAI API Key)",
      openrouter: "sk-or-... (OpenRouter API Key - Access 100+ models)",
    };
    return placeholders[provider];
  }
}

export default BYOKFrontendService;
