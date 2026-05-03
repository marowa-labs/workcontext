import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from "../monitoring/logger";
import { SecretsService } from "./secrets-service";

// Initialize Google Generative AI client
let genAI: GoogleGenerativeAI | null = null;

// Lazy initialization of Gemini client
async function getGeminiClient(): Promise<GoogleGenerativeAI> {
  if (!genAI) {
    const apiKey = await SecretsService.getSecret("GEMINI_API_KEY");

    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    genAI = new GoogleGenerativeAI(apiKey);
  }

  return genAI;
}

interface GeminiImageResponse {
  description: string;
  tokensUsed: number;
  cost: number;
}

export class GeminiImageService {
  // Generate image description using Gemini that can be used with external image generation services
  static async generateImageDescription(
    imageUrl: string,
    model: string = "gemini-2.5-flash",
  ): Promise<GeminiImageResponse> {
    try {
      const client = await getGeminiClient();
      const genModel = client.getGenerativeModel({ model });

      const result = await genModel.generateContent([
        `Describe this image in detail for academic/research purposes. Focus on any text, diagrams, charts, or visual elements that would be relevant for scholarly work.`,
        { inlineData: { data: imageUrl, mimeType: "image/png" } },
      ]);

      const response = result.response;
      const description = response.text();

      const tokensUsed = response.usageMetadata
        ? response.usageMetadata.promptTokenCount + response.usageMetadata.candidatesTokenCount
        : description.length;

      // Calculate cost based on Gemini pricing
      // Gemini 2.5 Flash: $0.15/1M input tokens, $0.60/1M output tokens
      const inputTokens = response.usageMetadata?.promptTokenCount || 0;
      const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
      const inputCost = (inputTokens / 1000000) * 0.15;
      const outputCost = (outputTokens / 1000000) * 0.6;
      const cost = inputCost + outputCost;

      return {
        description,
        tokensUsed,
        cost,
      };
    } catch (error: any) {
      logger.error("Error generating image description with Gemini:", error);
      throw new Error(`Image description generation failed: ${error.message}`);
    }
  }
}
