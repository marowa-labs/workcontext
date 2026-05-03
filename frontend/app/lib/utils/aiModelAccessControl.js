import BillingService from "./billingService";

/**
 * AI Model Access Control Utility
 * Handles subscription-based access control for AI models and requests
 */

class AIModelAccessControl {
  // Define available models per plan
  static PLAN_MODELS = {
    free: [
      "gemini-2.5-flash",
      "openai/gpt-oss-120b:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    ],
    onetime: [
      "gemini-2.5-flash",
      "openai/gpt-oss-120b:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    ],
    student: [
      "gemini-2.5-flash",
      "gemini-3.1-flash-lite-preview",
      "openai/gpt-oss-120b:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    ],
    researcher: [
      "gemini-2.5-flash",
      "gemini-3.1-flash-lite-preview",
      "openai/gpt-oss-120b:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    ],
    institutional: [
      "gemini-2.5-flash",
      "gemini-3.1-flash-lite-preview",
      "openai/gpt-oss-120b:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    ],
  };

  // Model details for UI display
  static MODEL_DETAILS = {
    "gemini-2.5-flash": {
      name: "Gemini 2.5 Flash",
      description: "Fast and efficient Gemini model",
      maxTokens: 1048576,
      planRequired: "free",
    },
    "gemini-3.1-flash-lite-preview": {
      name: "Gemini 3.1 Flash Lite",
      description: "Google's advanced multimodal model",
      maxTokens: 1048576,
      planRequired: "student",
    },
    "openai/gpt-oss-120b:free": {
      name: "GPT OSS 120B",
      description: "Free open-source 120B model via OpenRouter",
      maxTokens: 131072,
      planRequired: "free",
    },
    "nvidia/nemotron-3-super-120b-a12b:free": {
      name: "Nvidia Nemotron Super 120B",
      description: "Nvidia's free 120B reasoning model via OpenRouter",
      maxTokens: 131072,
      planRequired: "free",
    },
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": {
      name: "Nemotron 3 Nano Omni",
      description: "Multimodal model for text, image, video, and audio inputs. Built for enterprise agent systems with 300K context and 16K reasoning budget.",
      maxTokens: 300000,
      planRequired: "free",
    },
  };

  /**
   * Get user's subscription plan
   * @returns {Promise<string>} Plan ID (free, student, researcher, institutional)
   */
  static async getUserPlan() {
    try {
      const subscription = await BillingService.getCurrentSubscription();
      return subscription?.plan?.id || "free";
    } catch (error) {
      console.error("Error getting user plan:", error);
      return "free";
    }
  }

  /**
   * Get available AI models for the user's plan
   * @returns {Promise<Array>} Array of available model IDs
   */
  static async getAvailableModels() {
    try {
      const planId = await this.getUserPlan();
      return this.PLAN_MODELS[planId] || this.PLAN_MODELS.free;
    } catch (error) {
      console.error("Error getting available models:", error);
      return this.PLAN_MODELS.free;
    }
  }

  /**
   * Check if user has access to a specific AI model
   * @param {string} modelId - The model ID to check
   * @returns {Promise<boolean>} Whether the user has access
   */
  static async hasModelAccess(modelId) {
    try {
      const availableModels = await this.getAvailableModels();
      return availableModels.includes(modelId);
    } catch (error) {
      console.error("Error checking model access:", error);
      return false;
    }
  }

  /**
   * Get model details with access information
   * @returns {Promise<Array>} Array of model details with access status
   */
  static async getModelsWithAccessInfo() {
    try {
      const planId = await this.getUserPlan();
      const availableModels = await this.getAvailableModels();

      return Object.entries(this.MODEL_DETAILS).map(([modelId, details]) => ({
        id: modelId,
        ...details,
        hasAccess: availableModels.includes(modelId),
        isLocked: !availableModels.includes(modelId),
        lockedMessage: `Available with ${details.planRequired.charAt(0).toUpperCase() + details.planRequired.slice(1)} plan or higher`,
        planRequired: details.planRequired,
      }));
    } catch (error) {
      console.error("Error getting models with access info:", error);
      return [];
    }
  }

  /**
   * Check if user can make AI requests based on their plan and usage
   * @returns {Promise<Object>} Access status and reason if denied
   */
  static async canMakeAIRequest() {
    try {
      const subscription = await BillingService.getCurrentSubscription();
      const planId = subscription?.plan?.id || "free";

      // Check if user has any AI requests left
      const usage = subscription?.usage?.aiRequests;
      if (usage && usage.used >= usage.limit && usage.limit !== -1) {
        return {
          allowed: false,
          reason: `You've used all ${usage.limit} AI requests this month. Upgrade for more.`,
        };
      }

      // For free plan, check specific AI request limit
      if (planId === "free") {
        const aiRequestsUsed = usage?.used || 0;
        if (aiRequestsUsed >= 25) {
          // Free plan limit
          return {
            allowed: false,
            reason:
              "Free plan limit reached. Upgrade for unlimited AI requests.",
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error("Error checking AI request access:", error);
      return {
        allowed: false,
        reason: "Unable to verify access. Please try again.",
      };
    }
  }

  /**
   * Get accessibility attributes for AI model elements
   * @param {Object} model - Model information
   * @param {boolean} isSelected - Whether this model is currently selected
   * @returns {Object} Accessibility attributes
   */
  static getModelAccessibilityAttributes(model, isSelected = false) {
    return {
      "aria-label": `${model.name} - ${model.description}${model.isLocked ? " (locked)" : ""}`,
      "aria-disabled": model.isLocked ? "true" : "false",
      role: "button",
      tabIndex: model.isLocked ? "-1" : "0",
      ...(isSelected && { "aria-current": "true" }),
    };
  }
}

export default AIModelAccessControl;
