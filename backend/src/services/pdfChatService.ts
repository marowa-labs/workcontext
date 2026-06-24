import pdfParse from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { OpenRouter } from "@openrouter/sdk";
import logger from "../monitoring/logger";
import { BYOKService } from "./byokService";

/**
 * Extracts text content from a PDF buffer.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error: any) {
    logger.error("Error extracting PDF text:", error);
    throw new Error(`Failed to extract PDF text: ${error.message}`);
  }
}

/**
 * Downloads a PDF from a URL and extracts its text.
 */
export async function downloadAndExtractPdf(fileUrl: string): Promise<string> {
  try {
    logger.info("Downloading PDF for chat", {
      urlPreview: fileUrl.substring(0, 80) + "...",
    });

    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to download PDF: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    logger.info("PDF downloaded", {
      sizeBytes: buffer.length,
      sizeMB: (buffer.length / (1024 * 1024)).toFixed(2),
    });

    const text = await extractPdfText(buffer);

    logger.info("PDF text extracted", {
      textLength: text.length,
      pages: text.length > 0 ? "extracted" : "empty",
    });

    return text;
  } catch (error: any) {
    logger.error("Error downloading/extracting PDF:", error);
    throw error;
  }
}

/**
 * Builds a system prompt that includes the PDF content and annotations context.
 */
export function buildPdfChatSystemPrompt(
  pdfText: string,
  annotations: Array<{ text: string; color: string }>,
  fileName: string,
): string {
  const annotationContext =
    annotations.length > 0
      ? `\n\nThe user has made the following annotations/highlights on this document:\n${annotations.map((a, i) => `${i + 1}. [${a.color}] ${a.text || "(highlighted region)"}`).join("\n")}`
      : "";

  // Truncate PDF text to avoid exceeding token limits (~50k chars safe for Gemini)
  const maxChars = 50000;
  const truncatedText =
    pdfText.length > maxChars
      ? pdfText.substring(0, maxChars) +
        "\n\n[Document truncated due to length...]"
      : pdfText;

  return `You are a helpful PDF Research Assistant analyzing a document called "${fileName}". 

Below is the full text content of the PDF document. Use this content to answer the user's questions accurately and thoroughly. When referencing specific parts of the document, quote or paraphrase the relevant sections.

=== DOCUMENT CONTENT START ===
${truncatedText}
=== DOCUMENT CONTENT END ===
${annotationContext}

Instructions:
- Answer questions based ONLY on the document content provided above
- If the answer is not in the document, say so clearly
- Be concise but thorough in your responses
- When relevant, reference specific sections or quotes from the document
- If the user asks about something outside the document scope, let them know
- Acknowledge the user's annotations when they are relevant to the question`;
}

/**
 * Sends a chat message using the user's preferred AI model/API key (BYOK pattern).
 * Supports: Gemini, OpenAI, Anthropic, OpenRouter
 */
export async function sendPdfChatMessage(params: {
  userId: string;
  modelName: string;
  systemPrompt: string;
  userMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
}): Promise<string> {
  const {
    userId,
    modelName: rawModelName,
    systemPrompt,
    userMessage,
    conversationHistory,
  } = params;

  // Normalize & validate model name
  const modelName = normalizeModelName(rawModelName);
  const provider = getModelProvider(modelName);

  // Check if user has a key for this provider
  const byokSettings = await BYOKService.getSettings(userId);
  const providerHasKey: Record<string, boolean> = {
    gemini: byokSettings.hasGoogleKey,
    openai: byokSettings.hasOpenAIKey,
    anthropic: byokSettings.hasClaudeKey,
    openrouter: byokSettings.hasOpenRouterKey,
  };

  if (!providerHasKey[provider]) {
    // Try to find a fallback model from available providers
    const availableModels = await BYOKService.getSettings(userId);
    const availableIds = Object.keys(availableModels);
    if (availableIds.length > 0) {
      const fallback = availableIds[0];
      logger.info("PDF chat: model provider key not found, falling back", {
        userId: userId.slice(0, 8),
        requested: modelName,
        requestedProvider: provider,
        fallback,
      });
      // Recurse with the fallback model
      return sendPdfChatMessage({
        ...params,
        modelName: fallback,
      });
    }
    throw new Error(
      `No API key configured for ${provider}. Please add your API key in Settings → AI API Keys.`,
    );
  }

  logger.info("PDF chat routing", {
    userId: userId.slice(0, 8),
    modelName,
    provider,
  });

  // Build the conversation context string from history
  const historyText = conversationHistory
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const fullPrompt = historyText
    ? `Previous conversation:\n${historyText}\n\nUser question: ${userMessage}`
    : userMessage;

  // Route to the correct provider based on user's configured API key
  switch (provider) {
    case "gemini": {
      const apiKey = await BYOKService.getDecryptedKey(userId, "google");
      if (!apiKey) throw new Error("Google API key not found.");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      });

      // Use generateContent (not startChat) to avoid Gemini's strict
      // chat-history role validation — matches AIService pattern
      const result = await model.generateContent(fullPrompt);
      const text = result.response?.text();
      if (!text) throw new Error("Gemini returned an empty response.");
      return text;
    }

    case "openai": {
      const apiKey = await BYOKService.getDecryptedKey(userId, "openai");
      if (!apiKey) throw new Error("OpenAI API key not found.");
      const client = new OpenAI({ apiKey });
      const openaiModel = modelName.replace("openai/", "");

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.map((m) => ({
          role: (m.role === "assistant" ? "assistant" : "user") as
            | "assistant"
            | "user",
          content: m.content,
        })),
        { role: "user", content: fullPrompt },
      ];

      const result = await (client as any).chat.completions.create({
        model: openaiModel,
        messages,
      });
      const text = result.choices[0]?.message?.content;
      if (!text) throw new Error("OpenAI returned an empty response.");
      return text;
    }

    case "anthropic": {
      const apiKey = await BYOKService.getDecryptedKey(userId, "anthropic");
      if (!apiKey) throw new Error("Anthropic API key not found.");
      const client = new Anthropic({ apiKey });

      const messages: Anthropic.MessageParam[] = [
        ...conversationHistory.map((m) => ({
          role: (m.role === "assistant" ? "assistant" : "user") as
            | "assistant"
            | "user",
          content: m.content,
        })),
        { role: "user", content: fullPrompt },
      ];

      const result = await client.messages.create({
        model: modelName.replace("anthropic/", ""),
        max_tokens: 4096,
        system: systemPrompt,
        messages,
      });
      const text =
        result.content[0]?.type === "text" ? result.content[0].text : null;
      if (!text) throw new Error("Anthropic returned an empty response.");
      return text;
    }

    case "openrouter": {
      const client = await getOpenRouterClient(userId);
      if (!client) throw new Error("OpenRouter API key not found.");

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...conversationHistory.map((m) => ({
          role: (m.role === "assistant" ? "assistant" : "user") as
            | "assistant"
            | "user",
          content: m.content,
        })),
        { role: "user" as const, content: fullPrompt },
      ];

      const result = await (client as any).chat.completions.create({
        model: modelName,
        messages,
      });
      const text = result.choices[0]?.message?.content;
      if (!text) throw new Error("OpenRouter returned an empty response.");
      return text;
    }

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

// ── Helper functions ────────────────────────────────────────────────────────

/**
 * Normalize model names to provider-prefixed format
 */
const normalizeModelName = (modelName: string): string => {
  if (modelName.includes("/")) return modelName;
  if (modelName.startsWith("gemini")) return modelName;
  if (/^(gpt-|o[134]-)/.test(modelName)) return "openai/" + modelName;
  if (modelName.startsWith("claude-")) return "anthropic/" + modelName;
  return modelName;
};

/**
 * Determine which provider to use based on model prefix
 */
const getModelProvider = (
  modelName: string,
): "gemini" | "openai" | "anthropic" | "openrouter" => {
  if (modelName.startsWith("gemini")) return "gemini";
  if (modelName.startsWith("openai/")) return "openai";
  if (modelName.startsWith("anthropic/") || modelName.startsWith("claude-"))
    return "anthropic";
  return "openrouter";
};

// ── OpenRouter client cache ────────────────────────────────────────────────────

const openRouterClients = new Map<string, OpenRouter>();

async function getOpenRouterClient(userId: string): Promise<OpenRouter | null> {
  const apiKey = await BYOKService.getDecryptedKey(userId, "openrouter");
  if (!apiKey) return null;
  if (openRouterClients.has(apiKey)) return openRouterClients.get(apiKey)!;
  const client = new OpenRouter({ apiKey });
  openRouterClients.set(apiKey, client);
  return client;
}

// ── Suggested questions ───────────────────────────────────────────────────────

/**
 * Generate document-specific suggested questions using the user's AI provider.
 * Returns an array of 5 question strings.
 */
export async function generateSuggestedQuestions(params: {
  userId: string;
  modelName: string;
  pdfText: string;
  fileName: string;
}): Promise<string[]> {
  const { userId, modelName, pdfText, fileName } = params;

  // Truncate to keep the suggestion request lightweight
  const maxChars = 8000;
  const truncatedText =
    pdfText.length > maxChars
      ? pdfText.substring(0, maxChars) + "\n\n[Document truncated...]"
      : pdfText;

  const systemPrompt = `You are an AI assistant that generates relevant questions about a document. Given the document content below, generate exactly 5 short, specific, and insightful questions a user might ask about this document.

Rules:
- Questions must be SPECIFIC to the document content, not generic
- Keep each question under 15 words
- Focus on key topics, findings, arguments, data, or concepts in the document
- Return ONLY a JSON array of strings, e.g. ["question 1", "question 2", ...]
- Do NOT include any other text, markdown, or explanation

Document: ${fileName}
Content:
${truncatedText}`;

  const userMessage =
    "Generate 5 specific questions about this document. Return only a JSON array.";

  try {
    const answer = await sendPdfChatMessage({
      userId,
      modelName,
      systemPrompt,
      userMessage,
      conversationHistory: [],
    });

    // Parse JSON array from the response
    const cleaned = answer
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const questions = JSON.parse(cleaned);
    if (Array.isArray(questions)) {
      return questions.slice(0, 5).map((q: string) => q.trim());
    }
    return fallbackQuestions();
  } catch (error: any) {
    logger.warn("Failed to generate suggested questions, using fallback", {
      error: error.message,
    });
    return fallbackQuestions();
  }
}

/** Generic fallback if AI generation fails */
function fallbackQuestions(): string[] {
  return [
    "What are the main topics in this document?",
    "Summarize the key findings",
    "What conclusions can be drawn?",
    "Explain the key concepts mentioned",
    "What data or evidence is presented?",
  ];
}
