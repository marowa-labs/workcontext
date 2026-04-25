import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import fetch from "node-fetch";
import logger from "../monitoring/logger";
import { SecretsService } from "./secrets-service";

export interface MultiAIResponse {
  content: string;
  modelUsed?: string;
  tokensUsed?: number;
  cost?: number;
}

export class MultiAIService {
  private static instance: MultiAIService;
  private googleAI: any;
  private openAI: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private preferredProvider: "gemini" | "openai" | "anthropic" = "gemini"; // Default provider

  private constructor() {
    // Initialize the preferred provider based on environment or configuration
    // Since constructor can't be async, we set the default and initialize later
    this.preferredProvider = "gemini"; // default
    this.initializeProvider();
  }

  private async initializeProvider() {
    const provider = await SecretsService.getPreferredAiProvider();
    if (provider === "openai") {
      this.preferredProvider = "openai";
    } else if (provider === "anthropic" || provider === "claude") {
      this.preferredProvider = "anthropic";
    }
  }

  public static getInstance(): MultiAIService {
    if (!MultiAIService.instance) {
      MultiAIService.instance = new MultiAIService();
    }
    return MultiAIService.instance;
  }

  private async initializeGoogleAI(): Promise<any> {
    if (!this.googleAI) {
      const apiKey = await SecretsService.getSecret("GEMINI_API_KEY");
      if (!apiKey) {
        throw new Error("Gemini API key not configured");
      }
      this.googleAI = new GoogleGenerativeAI(apiKey);
    }
    return this.googleAI;
  }

  private async initializeOpenAI(): Promise<OpenAI> {
    if (!this.openAI) {
      const apiKey = await SecretsService.getOpenAiApiKey();
      if (!apiKey) {
        throw new Error("OpenAI API key not configured");
      }
      this.openAI = new OpenAI({ apiKey });
    }
    return this.openAI;
  }

  private async initializeAnthropic(): Promise<Anthropic> {
    if (!this.anthropic) {
      const apiKey = await SecretsService.getSecret("ANTHROPIC_API_KEY");
      if (!apiKey) {
        throw new Error("Anthropic API key not configured");
      }
      this.anthropic = new Anthropic({ apiKey });
    }
    return this.anthropic;
  }

  async generateContent(
    prompt: string,
    model: string = "gemini-3.1-flash-lite-preview",
    options: any = {},
  ): Promise<MultiAIResponse> {
    // Smart routing based on model name
    if (model.startsWith("openai/") || model.includes("gpt-oss")) {
      return this.generateWithOpenRouter(prompt, model, options);
    } else if (model.startsWith("gpt-") || model.startsWith("openai")) {
      return this.generateWithOpenAI(prompt, model, options);
    } else if (model.includes("claude") || model.startsWith("anthropic")) {
      return this.generateWithAnthropic(prompt, model, options);
    } else if (model.includes("gemini") || model.startsWith("google")) {
      return this.generateWithGemini(prompt, model, options);
    }

    // Default to preferred provider
    if (this.preferredProvider === "openai") {
      return this.generateWithOpenAI(prompt, model, options);
    } else if (this.preferredProvider === "anthropic") {
      return this.generateWithAnthropic(prompt, model, options);
    } else {
      return this.generateWithGemini(prompt, model, options);
    }
  }

  private async generateWithOpenRouter(
    prompt: string,
    model: string,
    options: any = {},
  ): Promise<MultiAIResponse> {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY not configured");
      }

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://scholarforge-ai.com",
            "X-Title": "ScholarForge AI",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: options.maxTokens || 2048,
            temperature: options.temperature || 0.3,
          }),
        },
      );

      const data: any = await response.json();
      if (!response.ok) {
        throw new Error(
          `OpenRouter Error: ${data.error?.message || response.statusText}`,
        );
      }

      const content = data.choices[0]?.message?.content || "";
      const tokensUsed = data.usage?.total_tokens || content.length;

      return {
        content,
        tokensUsed,
        modelUsed: model,
      };
    } catch (error: any) {
      logger.error("Error generating content with OpenRouter:", error);
      throw new Error(`OpenRouter API error: ${error.message || error}`);
    }
  }

  private async generateWithGemini(
    prompt: string,
    model: string,
    options: any,
  ): Promise<MultiAIResponse> {
    try {
      const client = await this.initializeGoogleAI();
      const genModel = client.getGenerativeModel({
        model: model,
      });

      const result = await genModel.generateContent(prompt);
      const content = result.response.text();

      return {
        content,
        modelUsed: model,
        tokensUsed: content.length, // Approximate token count
      };
    } catch (error: any) {
      // If we get a 429 error with Gemini, log it clearly
      if (error.message && error.message.includes("429")) {
        logger.error("Gemini Quota Exceeded (429)", { model });
      }
      logger.error("Error generating content with Gemini:", error);
      throw new Error(`Gemini API error: ${error.message || error}`);
    }
  }

  private async generateWithOpenAI(
    prompt: string,
    model: string = "gpt-4o-mini",
    options: any = {},
  ): Promise<MultiAIResponse> {
    try {
      const client = await this.initializeOpenAI();

      const response = await client.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.3,
      });

      const content = response.choices[0].message.content || "";
      const tokensUsed = response.usage?.total_tokens || content.length;

      return {
        content,
        tokensUsed,
        modelUsed: model,
      };
    } catch (error: any) {
      logger.error("Error generating content with OpenAI:", error);
      throw new Error(`OpenAI API error: ${error.message || error}`);
    }
  }

  private async generateWithAnthropic(
    prompt: string,
    model: string = "claude-3-5-sonnet",
    options: any = {},
  ): Promise<MultiAIResponse> {
    try {
      const client = await this.initializeAnthropic();

      const response = await client.messages.create({
        model: model,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.3,
        messages: [{ role: "user", content: prompt }],
      });

      const content =
        response.content &&
        Array.isArray(response.content) &&
        response.content[0]?.type === "text"
          ? response.content[0].text || ""
          : "";
      const tokensUsed = response.usage?.output_tokens || content.length;

      return {
        content,
        tokensUsed,
        modelUsed: model,
      };
    } catch (error: any) {
      logger.error("Error generating content with Anthropic:", error);
      throw new Error(`Anthropic API error: ${error.message || error}`);
    }
  }
}

export const multiAIService = MultiAIService.getInstance();
