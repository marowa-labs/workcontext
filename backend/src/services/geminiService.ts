import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from "../monitoring/logger";
import { SecretsService } from "./secrets-service";

// Initialize Google Generative AI client
let genAI: GoogleGenerativeAI | null = null;

// Lazy initialization of Google Generative AI client
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

interface GeminiResponse {
  content: string;
  tokensUsed: number;
  cost: number;
}

export class GeminiService {
  // Send message to Gemini
  static async sendMessage(
    prompt: string,
    model: string = "gemini-3.1-flash-lite-preview",
    maxTokens: number = 2048,
    temperature: number = 0.7,
  ): Promise<GeminiResponse> {
    try {
      const client = await getGeminiClient();
      const geminiModel = client.getGenerativeModel({ model: model });

      const result = await geminiModel.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: temperature,
        },
      });

      const response = result.response;
      const content = response.text();
      // Gemini doesn't provide exact token usage, so we approximate
      const tokensUsed = content.length;
      // Calculate cost based on Gemini pricing (approximate)
      let cost = 0;
      if (model === "gemini-3.1-flash-lite-preview") {
        // Gemini 3.1 Flash Lite: $1.25/1M input tokens, $10.00/1M output tokens
        cost = (tokensUsed / 1000000) * 1.25 + (tokensUsed / 1000000) * 10.0;
      } else if (model === "gemini-2.5-flash") {
        // Gemini 2.0 Flash: $0.075/1M input tokens, $0.30/1M output tokens
        cost = (tokensUsed / 1000000) * 0.075 + (tokensUsed / 1000000) * 0.3;
      } else {
        cost = (tokensUsed / 1000000) * 0.0005; // Default approximate cost
      }

      return {
        content,
        tokensUsed,
        cost,
      };
    } catch (error: any) {
      logger.error("Error sending message to Gemini:", error);
      throw new Error(`Gemini API error: ${error.message || error}`);
    }
  }

  // Writing project assistant with Gemini models
  static async assistWithWritingProject(
    projectDescription: string,
    userRequest: string,
    model: string = "gemini-3.1-flash-lite-preview",
  ): Promise<GeminiResponse> {
    try {
      const prompt = `You are an expert writing project assistant. Help the user with their writing project.
      
Project Description:
${projectDescription}

User Request:
${userRequest}

Provide comprehensive assistance including:
1. Project planning and structure suggestions
2. Content generation for specific sections
3. Research guidance and resources
4. Writing tips and best practices
5. Timeline and milestone recommendations

Be specific, actionable, and focused on academic writing excellence.`;

      return await this.sendMessage(prompt, model, 3000, 0.7);
    } catch (error: any) {
      logger.error("Error assisting with writing project using Gemini:", error);
      throw new Error(`Writing project assistance failed: ${error.message}`);
    }
  }

  // Generate project outline
  static async generateProjectOutline(
    projectTopic: string,
    projectType: string = "research_paper",
    model: string = "gemini-3.1-flash-lite-preview",
  ): Promise<GeminiResponse> {
    try {
      const prompt = `Create a detailed academic outline for a ${projectType} on the topic: "${projectTopic}".
      
Include:
1. Main sections with clear headings
2. Subsections with brief descriptions
3. Key points to cover in each section
4. Suggested word count for each section
5. Research sources and references to consider

Format the outline in a clear, hierarchical structure.`;

      return await this.sendMessage(prompt, model, 2000, 0.5);
    } catch (error: any) {
      logger.error("Error generating project outline using Gemini:", error);
      throw new Error(`Project outline generation failed: ${error.message}`);
    }
  }

  // Provide research assistance
  static async provideResearchAssistance(
    researchTopic: string,
    specificQuestion: string,
    model: string = "gemini-3.1-flash-lite-preview",
  ): Promise<GeminiResponse> {
    try {
      const prompt = `You are a research assistant helping with academic research on: "${researchTopic}".
      
Specific Question:
${specificQuestion}

Provide:
1. Relevant academic sources and references
2. Key concepts and terminology
3. Current research trends and findings
4. Methodology suggestions
5. Potential research gaps to explore

Focus on credible, peer-reviewed sources and academic best practices.`;

      return await this.sendMessage(prompt, model, 2500, 0.6);
    } catch (error: any) {
      logger.error("Error providing research assistance using Gemini:", error);
      throw new Error(`Research assistance failed: ${error.message}`);
    }
  }
}
