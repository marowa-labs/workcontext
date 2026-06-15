import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import logger from "../monitoring/logger";
import { SecretsService } from "./secrets-service";
import { BYOKService } from "./byokService";

// Initialize Google Generative AI client (fallback)
let genAI: GoogleGenerativeAI | null = null;

// Lazy initialization of Gemini client (with BYOK support for Google keys)
async function getGeminiClient(userId?: string): Promise<GoogleGenerativeAI> {
  // Check for BYOK key first
  if (userId) {
    const byokKey = await BYOKService.getDecryptedKey(userId, "google");
    if (byokKey) {
      logger.info("OpenAIService using BYOK Google key for user", {
        userId: userId.slice(0, 8) + "...",
      });
      return new GoogleGenerativeAI(byokKey);
    }
  }

  // Fall back to system key
  if (!genAI) {
    const apiKey = await SecretsService.getSecret("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// Lazy initialization of OpenAI client (with BYOK support)
async function getOpenAIClient(userId?: string): Promise<OpenAI | null> {
  // Check for BYOK key first
  if (userId) {
    const byokKey = await BYOKService.getDecryptedKey(userId, "openai");
    if (byokKey) {
      logger.info("OpenAIService using BYOK OpenAI key for user", {
        userId: userId.slice(0, 8) + "...",
      });
      return new OpenAI({ apiKey: byokKey });
    }
  }

  // Fall back to system key
  const apiKey = await SecretsService.getOpenAiApiKey();
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

// Check if user wants to use real OpenAI API (has BYOK key or system key available)
async function shouldUseOpenAI(userId?: string): Promise<boolean> {
  if (userId) {
    const byokKey = await BYOKService.getDecryptedKey(userId, "openai");
    if (byokKey) return true;
  }
  const systemKey = await SecretsService.getOpenAiApiKey();
  return !!systemKey;
}

interface OpenAIResponse {
  content: string;
  tokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

// Default Gemini model
const DEFAULT_MODEL = "gemini-3.1-flash-lite";

export class OpenAIService {
  // Send completion request using Gemini
  static async sendCompletion(
    prompt: string,
    model: string = DEFAULT_MODEL,
    maxTokens: number = 1000,
    temperature: number = 0.3,
  ): Promise<OpenAIResponse> {
    try {
      const client = await getGeminiClient();
      const genModel = client.getGenerativeModel({ model });
      const result = await genModel.generateContent(prompt);
      const response = result.response;
      const content = response.text();

      const inputTokens = response.usageMetadata?.promptTokenCount || 0;
      const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
      const tokensUsed = inputTokens + outputTokens;

      // Calculate cost based on Gemini pricing (approximate)
      // Gemini 2.5 Flash: $0.15/1M input tokens, $0.60/1M output tokens
      const inputCost = (inputTokens / 1000000) * 0.15;
      const outputCost = (outputTokens / 1000000) * 0.6;
      const cost = inputCost + outputCost;

      return {
        content,
        tokensUsed,
        inputTokens,
        outputTokens,
        cost,
      };
    } catch (error: any) {
      logger.error("Error sending completion via Gemini:", error);
      throw new Error(`Gemini API error: ${error.message || error}`);
    }
  }

  // Send message (chat-style) using Gemini
  static async sendMessage(
    messages: { role: string; content: string }[],
    model: string = DEFAULT_MODEL,
    maxTokens: number = 1000,
    temperature: number = 0.7,
  ): Promise<OpenAIResponse> {
    try {
      const client = await getGeminiClient();
      const genModel = client.getGenerativeModel({ model });

      // Build prompt from messages
      const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
      const result = await genModel.generateContent(prompt);
      const response = result.response;
      const content = response.text();

      const inputTokens = response.usageMetadata?.promptTokenCount || 0;
      const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
      const tokensUsed = inputTokens + outputTokens;

      const inputCost = (inputTokens / 1000000) * 0.15;
      const outputCost = (outputTokens / 1000000) * 0.6;
      const cost = inputCost + outputCost;

      return {
        content,
        tokensUsed,
        inputTokens,
        outputTokens,
        cost,
      };
    } catch (error: any) {
      logger.error("Error sending message via Gemini:", error);
      throw new Error(`Gemini API error: ${error.message || error}`);
    }
  }

  // Grammar and style checking with Gemini
  static async checkGrammarAndStyle(
    text: string,
    model: string = DEFAULT_MODEL,
  ): Promise<OpenAIResponse> {
    try {
      const modelName = DEFAULT_MODEL;

      const prompt = `You are an academic writing assistant. Check the following text for:
1. Grammar errors
2. Style improvements
3. Clarity enhancements
4. Academic tone suggestions

Provide specific suggestions with explanations. Format your response as a clear list of improvements.

Text to check:
${text}`;

      return await this.sendCompletion(prompt, modelName, 1500, 0.3);
    } catch (error: any) {
      logger.error("Error checking grammar and style with Gemini:", error);
      throw new Error(`Grammar and style check failed: ${error.message}`);
    }
  }

  // Generate writing suggestions
  static async generateWritingSuggestions(
    text: string,
    focusAreas: string[] = ["clarity", "flow", "structure"],
  ): Promise<OpenAIResponse> {
    try {
      const focus = focusAreas.join(", ");

      const prompt = `You are an expert writing coach. Analyze the following text and provide suggestions to improve:
${focus}

Focus on academic writing best practices. Provide specific, actionable suggestions.

Text to analyze:
${text}`;

      return await this.sendCompletion(prompt, DEFAULT_MODEL, 1000, 0.5);
    } catch (error: any) {
      logger.error("Error generating writing suggestions with Gemini:", error);
      throw new Error(
        `Writing suggestions generation failed: ${error.message}`,
      );
    }
  }

  // Generate image using Gemini (describes image for external generation)
  static async generateImage(
    prompt: string,
    size: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024",
    quality: "standard" | "hd" = "standard",
    style: "vivid" | "natural" = "vivid",
    model: string = DEFAULT_MODEL,
  ): Promise<{ url: string }> {
    try {
      // Use Gemini to generate a detailed image description
      // Actual image generation would require a dedicated image API
      const client = await getGeminiClient();
      const genModel = client.getGenerativeModel({ model });
      const result = await genModel.generateContent(
        `Generate a detailed image generation prompt for: ${prompt}. Size: ${size}, Quality: ${quality}, Style: ${style}`,
      );
      const description = result.response.text();

      // Return the description as a data URL placeholder
      // In production, this would call an actual image generation API
      return { url: `data:text/plain,${encodeURIComponent(description)}` };
    } catch (error: any) {
      logger.error("Error generating image with Gemini:", error);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }
}
