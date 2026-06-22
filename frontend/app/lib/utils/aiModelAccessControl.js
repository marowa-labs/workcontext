/**
 * AI Model Access Control Utility
 * All models and features are available to all users - no subscription gates
 */

class AIModelAccessControl {
  // All models available to all users
  static ALL_MODELS = [
    "gemini-3.1-flash-lite",
    "openai/gpt-oss-120b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  ];

  // Model details for UI display
  static MODEL_DETAILS = {
    "gemini-3.1-flash-lite": {
      name: "Gemini 2.5 Flash",
      description: "Fast and efficient Gemini model",
      planRequired: "free",
      maxTokens: 1048576,
    },
    "openai/gpt-oss-120b:free": {
      name: "GPT OSS 120B",
      description: "Free open-source 120B model via OpenRouter",
      planRequired: "free",
      maxTokens: 131072,
    },
    "nvidia/nemotron-3-super-120b-a12b:free": {
      name: "Nvidia Nemotron Super 120B",
      description: "Nvidia free 120B reasoning model via OpenRouter",
      planRequired: "free",
      maxTokens: 131072,
    },
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": {
      name: "Nemotron 3 Nano Omni",
      description: "Multimodal model for text, image, video, and audio",
      planRequired: "free",
      maxTokens: 300000,
    },
  };

  /**
   * Get available AI models - all models available to all users
   * @returns {Promise<Array>} Array of available model IDs
   */
  static async getAvailableModels() {
    return this.ALL_MODELS;
  }

  /**
   * Check if user has access to a specific AI model - all users have access
   * @param {string} modelId - The model ID to check
   * @returns {Promise<boolean>} Always true
   */
  static async hasModelAccess(_modelId) {
    return true;
  }

  /**
   * Get model details with access information - all accessible
   * @returns {Promise<Array>} Array of model details with access status
   */
  static async getModelsWithAccessInfo() {
    return Object.entries(this.MODEL_DETAILS).map(([modelId, details]) => ({
      id: modelId,
      ...details,
      hasAccess: true,
      isLocked: false,
      lockedMessage: "",
      planRequired: "free",
    }));
  }

  /**
   * Get user plan - all users are on the free open-source plan
   * @returns {Promise<string>} Always "free"
   */
  static async getUserPlan() {
    return "free";
  }

  /**
   * Check if user can make AI requests - all users can
   * @returns {Promise<Object>} Always allowed
   */
  static async canMakeAIRequest() {
    return { allowed: true };
  }

  /**
   * Get model accessibility attributes for UI
   * @param {string} modelId - The model ID
   * @returns {Object} Accessibility attributes
   */
  static getModelAccessibilityAttributes(_modelId) {
    return {
      "aria-disabled": false,
      "aria-label": "Available",
    };
  }
}

export default AIModelAccessControl;
