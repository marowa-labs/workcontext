import OpenAI from "openai";
import logger from "../monitoring/logger";
import { SecretsService } from "./secrets-service";

// Initialize OpenAI client
let openai: OpenAI | null = null;

// Lazy initialization of OpenAI client
async function getOpenAIClient(): Promise<OpenAI> {
  if (!openai) {
    const apiKey = await SecretsService.getOpenAiApiKey();

    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  return openai;
}

interface OpenAIResponse {
  content: string;
  tokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

interface GrammarSuggestion {
  original: string;
  suggestion: string;
  type: "grammar" | "style" | "clarity";
  explanation: string;
}

export class OpenAIService {
  // Send completion request to OpenAI
  static async sendCompletion(
    prompt: string,
    model: string = "gpt-4o-mini",
    maxTokens: number = 1000,
    temperature: number = 0.3,
  ): Promise<OpenAIResponse> {
    try {
      const client = await getOpenAIClient();

      const response = await client.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: temperature,
      });

      const content = response.choices[0].message.content || "";
      const tokensUsed = response.usage?.total_tokens || content.length;
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;

      // Calculate cost based on OpenAI pricing (approximate)
      // GPT-4o-mini: $0.15/1M input tokens, $0.60/1M output tokens
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
      logger.error("Error sending completion to OpenAI:", error);
      throw new Error(`OpenAI API error: ${error.message || error}`);
    }
  }

  // Grammar and style checking with GPT-4o-mini
  static async checkGrammarAndStyle(
    text: string,
    model: "gpt-4o-mini" = "gpt-4o-mini",
  ): Promise<OpenAIResponse> {
    try {
      const modelName = "gpt-4o-mini";

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
      logger.error("Error checking grammar and style with OpenAI:", error);
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

      return await this.sendCompletion(prompt, "gpt-4o-mini", 1000, 0.5);
    } catch (error: any) {
      logger.error("Error generating writing suggestions with OpenAI:", error);
      throw new Error(
        `Writing suggestions generation failed: ${error.message}`,
      );
    }
  }

  // Generate image using DALL-E
  static async generateImage(
    prompt: string,
    size: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024",
    quality: "standard" | "hd" = "standard",
    style: "vivid" | "natural" = "vivid",
    model: "dall-e-3" | "dall-e-2" = "dall-e-3",
  ): Promise<{ url: string }> {
    try {
      const client = await getOpenAIClient();

      const response = await client.images.generate({
        model: model,
        prompt,
        n: 1,
        size,
        quality,
        style,
        response_format: "url",
      });

      if (!response.data || response.data.length === 0) {
        throw new Error("Failed to generate image");
      }

      const imageUrl = response.data[0].url;
      if (!imageUrl) {
        throw new Error("Failed to generate image");
      }

      return { url: imageUrl };
    } catch (error: any) {
      logger.error("Error generating image with DALL-E:", error);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }
}
