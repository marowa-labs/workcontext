import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { SecretsService } from "./secrets-service";
import logger from "../monitoring/logger";

export interface EmbeddingResult {
  vector: number[];
  dim: number;
}

/**
 * Provider-agnostic text embedding service.
 *
 * Primary provider is Gemini (the app's primary AI provider, no extra dependency
 * required) using `text-embedding-004` (768-dim). If Gemini is unavailable it
 * falls back to OpenAI `text-embedding-3-small` (1536-dim).
 *
 * The active provider is resolved deterministically from the configured keys, so a
 * given user consistently produces the same dimension. Each stored embedding records
 * its `dim` so similarity queries only compare vectors of the same dimension.
 */
export class EmbeddingService {
  private static geminiClient: GoogleGenerativeAI | null = null;
  private static openaiClient: OpenAI | null = null;

  private static getGeminiClient(apiKey: string): GoogleGenerativeAI {
    if (!this.geminiClient) {
      this.geminiClient = new GoogleGenerativeAI(apiKey);
    }
    return this.geminiClient;
  }

  private static getOpenAIClient(apiKey: string): OpenAI {
    if (!this.openaiClient) {
      this.openaiClient = new OpenAI({ apiKey });
    }
    return this.openaiClient;
  }

  /**
   * Embed a single text. Throws if no embedding provider is configured.
   */
  static async embed(text: string): Promise<EmbeddingResult> {
    const clean = (text || "").toString().slice(0, 8000).trim();
    if (!clean) {
      throw new Error("Cannot embed empty text");
    }

    // 1. Try Gemini (primary)
    try {
      const geminiKey = await SecretsService.getGeminiApiKey();
      if (geminiKey) {
        const model = this.getGeminiClient(geminiKey).getGenerativeModel({
          model: "text-embedding-004",
        });
        const result = await model.embedContent({
          contents: [{ parts: [{ text: clean }] }],
          taskType: "RETRIEVAL_DOCUMENT",
        } as any);
        const values = result.embedding.values;
        if (values && values.length) {
          return { vector: values, dim: values.length };
        }
      }
    } catch (error: any) {
      logger.warn("Gemini embedding failed, falling back to OpenAI", {
        error: error.message,
      });
    }

    // 2. Fall back to OpenAI
    const openAiKey = await SecretsService.getOpenAiApiKey();
    if (!openAiKey) {
      throw new Error(
        "No embedding provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY.",
      );
    }
    const response = await this.getOpenAIClient(openAiKey).embeddings.create({
      model: "text-embedding-3-small",
      input: clean,
    });
    const values = response.data[0]?.embedding;
    if (!values || !values.length) {
      throw new Error("OpenAI returned an empty embedding");
    }
    return { vector: values, dim: values.length };
  }
}
