import Anthropic from "@anthropic-ai/sdk";
import logger from "../monitoring/logger";
import { SecretsService } from "./secrets-service";

// Initialize Anthropic client
let anthropic: Anthropic | null = null;

// Lazy initialization of Anthropic client
async function getAnthropicClient(): Promise<Anthropic> {
  if (!anthropic) {
    const apiKey = await SecretsService.getSecret("ANTHROPIC_API_KEY");

    if (!apiKey) {
      throw new Error("Anthropic API key not configured");
    }

    anthropic = new Anthropic({
      apiKey: apiKey,
    });
  }

  return anthropic;
}

interface ClaudeImageResponse {
  content: string;
  tokensUsed: number;
  cost: number;
}

export class ClaudeImageService {
  // Generate image description using Claude that can be used with external image generation services
  static async generateImageDescription(
    prompt: string,
    model: string = "claude-3-5-sonnet",
    maxTokens: number = 1024,
    temperature: number = 0.7,
  ): Promise<ClaudeImageResponse> {
    try {
      const client = await getAnthropicClient();

      const systemMessage = `You are an expert at creating detailed, vivid image descriptions that can be used for image generation. 
      Your task is to convert text prompts into rich, descriptive image generation prompts that include:
      1. Detailed visual elements (colors, textures, lighting, composition)
      2. Art style and medium (photography, digital art, painting, etc.)
      3. Specific details that make the image unique and compelling
      4. Technical specifications for image generation (resolution, aspect ratio if relevant)
      
      Create comprehensive, creative descriptions that will result in high-quality generated images.`;

      const response = await client.messages.create({
        model: model,
        max_tokens: maxTokens,
        temperature: temperature,
        system: systemMessage,
        messages: [
          {
            role: "user",
            content: `Create a detailed image generation prompt for: ${prompt}`,
          },
        ],
      });

      // Extract text content from the response
      let content = "";
      if (response.content && response.content.length > 0) {
        const firstBlock = response.content[0];
        // Type guard to check if it's a text block
        if ("text" in firstBlock) {
          content = firstBlock.text;
        } else {
          // Handle other block types or provide a default
          content = JSON.stringify(firstBlock);
        }
      }

      const tokensUsed =
        response.usage.input_tokens + response.usage.output_tokens;

      // Calculate cost based on Anthropic pricing (approximate)
      let inputCost = 0;
      let outputCost = 0;

      // Claude 3.5 Sonnet: $3.00/1M input tokens, $15.00/1M output tokens
      if (model === "claude-3-5-sonnet") {
        inputCost = (response.usage.input_tokens / 1000000) * 3.0;
        outputCost = (response.usage.output_tokens / 1000000) * 15.0;
      }

      const cost = inputCost + outputCost;

      return {
        content,
        tokensUsed,
        cost,
      };
    } catch (error: any) {
      logger.error("Error generating image description with Claude:", error);
      throw new Error(
        `Claude image description generation failed: ${error.message || error}`,
      );
    }
  }
}
