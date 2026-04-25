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

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeResponse {
  content: string;
  tokensUsed: number;
  cost: number;
}

export class AnthropicService {
  // Send message to Claude
  static async sendMessage(
    messages: ClaudeMessage[],
    model: string = "claude-3-5-sonnet",
    maxTokens: number = 1024,
    temperature: number = 0.7,
  ): Promise<ClaudeResponse> {
    try {
      const client = await getAnthropicClient();

      const response = await client.messages.create({
        model: model,
        max_tokens: maxTokens,
        temperature: temperature,
        messages: messages,
      });

      // Extract text content from the response, handling different block types
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
      // Standardize other models to 0 or throw if strictly needed, but cleaner to just support sonnet primarily.

      const cost = inputCost + outputCost;

      return {
        content,
        tokensUsed,
        cost,
      };
    } catch (error: any) {
      logger.error("Error sending message to Claude:", error);
      throw new Error(`Anthropic API error: ${error.message || error}`);
    }
  }

  // Document summarization with Claude models
  static async summarizeDocument(
    content: string,
    summaryType:
      | "research_paper"
      | "article"
      | "long_document" = "long_document",
    model: string = "claude-3-5-sonnet",
  ): Promise<ClaudeResponse> {
    try {
      let prompt = "";

      switch (summaryType) {
        case "research_paper":
          prompt = `Summarize this research paper, extracting key points, main arguments, methodology, findings, and conclusions. Provide a concise but comprehensive summary suitable for academic review.`;
          break;
        case "article":
          prompt = `Summarize this article, identifying the main topic, key arguments, and important details. Provide a clear and concise summary.`;
          break;
        case "long_document":
        default:
          prompt = `Summarize this long document, extracting the key points, main arguments, and essential information. Provide a concise summary that captures the essence of the document.`;
          break;
      }

      const messages: ClaudeMessage[] = [
        {
          role: "user",
          content: `${prompt}\n\nDocument content:\n${content}`,
        },
      ];

      return await this.sendMessage(messages, model, 2048, 0.3);
    } catch (error: any) {
      logger.error("Error summarizing document with Claude:", error);
      throw new Error(`Document summarization failed: ${error.message}`);
    }
  }

  // AI Chat Assistant for Document Q&A with Claude models or GPT-4o
  static async answerDocumentQuestion(
    documentContent: string,
    question: string,
    model: "claude-3-5-sonnet" = "claude-3-5-sonnet",
  ): Promise<ClaudeResponse> {
    try {
      const messages: ClaudeMessage[] = [
        {
          role: "user",
          content: `You are an expert assistant answering questions about the following document. 
          Provide accurate, contextual answers based on the document content.
          
          Document content:
          ${documentContent}
          
          Question:
          ${question}
          
          Please provide a detailed, accurate answer based on the document content.`,
        },
      ];

      const modelName = "claude-3-5-sonnet";
      return await this.sendMessage(messages, modelName, 2048, 0.5);
    } catch (error: any) {
      logger.error("Error answering document question with Claude:", error);
      throw new Error(`Document Q&A failed: ${error.message}`);
    }
  }
}
