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

interface GeminiMessage {
  role: "user" | "assistant";
  content: string;
}

interface GeminiResponse {
  content: string;
  tokensUsed: number;
  cost: number;
}

// Default Gemini model
const DEFAULT_MODEL = "gemini-3.1-flash-lite-preview";

export class AnthropicService {
  // Send message using Gemini
  static async sendMessage(
    messages: GeminiMessage[],
    model: string = DEFAULT_MODEL,
    maxTokens: number = 1024,
    temperature: number = 0.7,
  ): Promise<GeminiResponse> {
    try {
      const client = await getGeminiClient();

      // Build prompt from messages
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");

      const genModel = client.getGenerativeModel({ model });
      const result = await genModel.generateContent(prompt);
      const response = result.response;
      const content = response.text();

      const tokensUsed = response.usageMetadata
        ? response.usageMetadata.promptTokenCount + response.usageMetadata.candidatesTokenCount
        : content.length;

      // Calculate cost based on Gemini pricing (approximate)
      // Gemini 3.1 Flash Lite: $0.075/1M tokens
      const cost = (tokensUsed / 1000000) * 0.075;

      return {
        content,
        tokensUsed,
        cost,
      };
    } catch (error: any) {
      logger.error("Error sending message via Gemini:", error);
      throw new Error(`Gemini API error: ${error.message || error}`);
    }
  }

  // Document summarization with Gemini models
  static async summarizeDocument(
    content: string,
    summaryType:
      | "research_paper"
      | "article"
      | "long_document" = "long_document",
    model: string = DEFAULT_MODEL,
  ): Promise<GeminiResponse> {
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

      const messages: GeminiMessage[] = [
        {
          role: "user",
          content: `${prompt}\n\nDocument content:\n${content}`,
        },
      ];

      return await this.sendMessage(messages, model, 2048, 0.3);
    } catch (error: any) {
      logger.error("Error summarizing document with Gemini:", error);
      throw new Error(`Document summarization failed: ${error.message}`);
    }
  }

  // AI Chat Assistant for Document Q&A with Gemini models
  static async answerDocumentQuestion(
    documentContent: string,
    question: string,
    model: string = DEFAULT_MODEL,
  ): Promise<GeminiResponse> {
    try {
      const messages: GeminiMessage[] = [
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

      return await this.sendMessage(messages, model, 2048, 0.5);
    } catch (error: any) {
      logger.error("Error answering document question with Gemini:", error);
      throw new Error(`Document Q&A failed: ${error.message}`);
    }
  }
}
