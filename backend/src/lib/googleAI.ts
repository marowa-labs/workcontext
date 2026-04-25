import { GoogleGenerativeAI } from "@google/generative-ai";
import { SecretsService } from "../services/secrets-service";

// Initialize Google Generative AI client
let geminiClient: GoogleGenerativeAI | null = null;

// Lazy initialization of Google Generative AI client
async function getGeminiClient(): Promise<GoogleGenerativeAI> {
  if (!geminiClient) {
    const apiKey = await SecretsService.getSecret("GEMINI_API_KEY");

    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    geminiClient = new GoogleGenerativeAI(apiKey);
  }

  return geminiClient;
}

// Export genAI for direct use
export const genAI = {
  getGenerativeModel: (config: any) => {
    return getGeminiClient().then((client) =>
      client.getGenerativeModel(config)
    );
  },
};
