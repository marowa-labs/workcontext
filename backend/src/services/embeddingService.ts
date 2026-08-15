import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { SecretsService } from "./secrets-service";
import { BYOKService } from "./byokService";
import logger from "../monitoring/logger";

export interface EmbeddingResult {
  vector: number[];
  dim: number;
}

/**
 * Provider-agnostic text embedding service.
 *
 * Primary provider is Gemini (the app's primary AI provider, no extra dependency
 * required) using `gemini-embedding-001` (768-dim). If Gemini is unavailable it
 * falls back to OpenAI `text-embedding-3-small` (1536-dim).
 *
 * Key resolution order per provider:
 *   1. System env key (GEMINI_API_KEY / OPENAI_API_KEY)
 *   2. User's BYOK key (Google / OpenAI) — used when the app runs BYOK-only
 *
 * The active provider is resolved deterministically from the configured keys, so a
 * given user consistently produces the same dimension. Each stored embedding records
 * its `dim` so similarity queries only compare vectors of the same dimension.
 */
export class EmbeddingService {
  // Clients are cached per API key so different users (BYOK) don't share clients.
  private static geminiClients = new Map<string, GoogleGenerativeAI>();
  private static openaiClients = new Map<string, OpenAI>();

  private static getGeminiClient(apiKey: string): GoogleGenerativeAI {
    let client = this.geminiClients.get(apiKey);
    if (!client) {
      client = new GoogleGenerativeAI(apiKey);
      this.geminiClients.set(apiKey, client);
    }
    return client;
  }

  private static getOpenAIClient(apiKey: string): OpenAI {
    let client = this.openaiClients.get(apiKey);
    if (!client) {
      client = new OpenAI({ apiKey });
      this.openaiClients.set(apiKey, client);
    }
    return client;
  }

  /**
   * Resolve the Gemini API key: system env first, then the user's BYOK Google key.
   */
  private static async resolveGeminiKey(
    userId?: string,
  ): Promise<string | null> {
    const systemKey = await SecretsService.getGeminiApiKey();
    if (systemKey) return systemKey;
    if (userId) {
      try {
        const byokKey = await BYOKService.getDecryptedKey(userId, "google");
        if (byokKey) return byokKey;
      } catch (error: any) {
        logger.warn("Failed to resolve BYOK Google key for embeddings", {
          error: error.message,
        });
      }
    }
    return null;
  }

  /**
   * Resolve the OpenAI API key: system env first, then the user's BYOK OpenAI key.
   */
  private static async resolveOpenAIKey(
    userId?: string,
  ): Promise<string | null> {
    const systemKey = await SecretsService.getOpenAiApiKey();
    if (systemKey) return systemKey;
    if (userId) {
      try {
        const byokKey = await BYOKService.getDecryptedKey(userId, "openai");
        if (byokKey) return byokKey;
      } catch (error: any) {
        logger.warn("Failed to resolve BYOK OpenAI key for embeddings", {
          error: error.message,
        });
      }
    }
    return null;
  }

  /**
   * Embed a single text. Throws if no embedding provider is configured.
   * Pass `userId` to fall back to the user's BYOK Google/OpenAI key when no
   * system-level embedding key is set.
   */
  static async embed(text: string, userId?: string): Promise<EmbeddingResult> {
    const clean = (text || "").toString().slice(0, 8000).trim();
    if (!clean) {
      throw new Error("Cannot embed empty text");
    }

    // 1. Try Gemini (primary)
    try {
      const geminiKey = await this.resolveGeminiKey(userId);
      if (geminiKey) {
        const model = this.getGeminiClient(geminiKey).getGenerativeModel({
          model: "gemini-embedding-001",
        });
        const result = await model.embedContent({
          content: { parts: [{ text: clean }] },
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
    const openAiKey = await this.resolveOpenAIKey(userId);
    if (!openAiKey) {
      throw new Error(
        "No embedding provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY, or add a Google/OpenAI key in Settings → AI.",
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

  /**
   * Split text into overlapping chunks for embedding.
   * Each chunk is ~chunkSize chars with ~overlapSize overlap.
   */
  static chunkText(text: string, chunkSize = 700, overlapSize = 150): string[] {
    const clean = (text || "").trim();
    if (!clean) return [];
    if (clean.length <= chunkSize) return [clean];

    const chunks: string[] = [];
    let start = 0;
    while (start < clean.length) {
      const end = Math.min(start + chunkSize, clean.length);
      chunks.push(clean.slice(start, end));
      if (end >= clean.length) break;
      start = end - overlapSize;
    }
    return chunks;
  }

  /**
   * Embed an array of texts in batches. Returns an array of results aligned
   * with the input. Empty/whitespace texts get `null` in their slot.
   *
   * Automatically retries on rate-limit (429) with exponential backoff.
   * Pass `userId` to fall back to the user's BYOK Google/OpenAI key when no
   * system-level embedding key is set.
   */
  static async embedBatch(
    texts: string[],
    batchSize = 32,
    userId?: string,
  ): Promise<(EmbeddingResult | null)[]> {
    const results: (EmbeddingResult | null)[] = new Array(texts.length).fill(
      null,
    );

    // Determine provider once for the whole batch
    let provider: "gemini" | "openai" | null = null;
    try {
      const geminiKey = await this.resolveGeminiKey(userId);
      if (geminiKey) provider = "gemini";
    } catch {}
    if (!provider) {
      try {
        const openAiKey = await this.resolveOpenAIKey(userId);
        if (openAiKey) provider = "openai";
      } catch {}
    }
    if (!provider) {
      throw new Error(
        "No embedding provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY, or add a Google/OpenAI key in Settings → AI.",
      );
    }

    // Process in batches
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const cleanBatch = batch.map((t) => (t || "").toString().trim());

      // Skip empty chunks
      const nonEmptyIndices: number[] = [];
      const nonEmptyTexts: string[] = [];
      for (let j = 0; j < cleanBatch.length; j++) {
        if (cleanBatch[j]) {
          nonEmptyIndices.push(j);
          nonEmptyTexts.push(cleanBatch[j]);
        }
      }
      if (nonEmptyTexts.length === 0) continue;

      // Retry logic for rate limits
      let attempt = 0;
      const maxRetries = 3;
      while (attempt <= maxRetries) {
        try {
          let batchResults: EmbeddingResult[];
          if (provider === "gemini") {
            batchResults = await this.embedBatchGemini(nonEmptyTexts, userId);
          } else {
            batchResults = await this.embedBatchOpenAI(nonEmptyTexts, userId);
          }
          // Map results back to original positions
          for (let k = 0; k < nonEmptyIndices.length; k++) {
            if (batchResults[k]) {
              results[i + nonEmptyIndices[k]] = batchResults[k];
            }
          }
          break;
        } catch (error: any) {
          const isRateLimit =
            error?.status === 429 ||
            error?.message?.includes("429") ||
            error?.message?.includes("rate limit");
          if (isRateLimit && attempt < maxRetries) {
            const delay = 1000 * Math.pow(2, attempt);
            logger.warn(`Embedding rate limited, retrying in ${delay}ms`, {
              batchStart: i,
              attempt,
            });
            await new Promise((r) => setTimeout(r, delay));
            attempt++;
          } else {
            // Non-retryable or exhausted — embed remaining one-by-one
            for (let k = 0; k < nonEmptyTexts.length; k++) {
              const idx = i + nonEmptyIndices[k];
              if (results[idx]) continue;
              try {
                results[idx] = await this.embed(nonEmptyTexts[k], userId);
              } catch (err2: any) {
                logger.warn("Single-text embedding fallback failed", {
                  error: err2.message,
                  textPreview: nonEmptyTexts[k].slice(0, 50),
                });
              }
            }
            break;
          }
        }
      }
    }

    return results;
  }

  /** Gemini batch embedding */
  private static async embedBatchGemini(
    texts: string[],
    userId?: string,
  ): Promise<EmbeddingResult[]> {
    const geminiKey = await this.resolveGeminiKey(userId);
    if (!geminiKey) throw new Error("Gemini API key not available");

    const model = this.getGeminiClient(geminiKey).getGenerativeModel({
      model: "gemini-embedding-001",
    });

    const result = await (model as any).batchEmbedContents({
      requests: texts.map((text) => ({
        content: { parts: [{ text: text.slice(0, 8000) }] },
        taskType: "RETRIEVAL_DOCUMENT",
      })),
    });

    return result.embeddings.map((e: any) => ({
      vector: e.values,
      dim: e.values.length,
    }));
  }

  /** OpenAI batch embedding */
  private static async embedBatchOpenAI(
    texts: string[],
    userId?: string,
  ): Promise<EmbeddingResult[]> {
    const openAiKey = await this.resolveOpenAIKey(userId);
    if (!openAiKey) throw new Error("OpenAI API key not available");

    const response = await this.getOpenAIClient(openAiKey).embeddings.create({
      model: "text-embedding-3-small",
      input: texts.map((t) => t.slice(0, 8000)),
    });

    // Sort by index to ensure alignment
    return response.data
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      .map((d) => ({
        vector: d.embedding,
        dim: d.embedding.length,
      }));
  }
}
