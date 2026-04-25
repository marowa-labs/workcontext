import { getSupabaseAdminClient } from "../lib/supabase/client";
import logger from "../monitoring/logger";

// Service to retrieve secrets from environment variables
export class SecretsService {
  // Get a secret value by name
  static async getSecret(name: string): Promise<string | null> {
    try {
      // First, try to retrieve from environment variables
      // These should be configured as secrets in the deployment environment (Vercel, Railway, etc.)
      const envValue = process.env[name];

      if (envValue) {
        logger.debug(`Retrieved secret ${name} from environment variables`);
        return envValue;
      }

      // If not found in environment, log warning
      logger.warn(`Secret ${name} not found in environment variables`);

      return null;
    } catch (error) {
      logger.error(`Error retrieving secret ${name}:`, error);
      return null;
    }
  }

  // Get OpenAI API key
  static async getOpenAiApiKey(): Promise<string | null> {
    const apiKey = await this.getSecret("OPENAI_API_KEY");
    if (!apiKey) {
      logger.error("OPENAI_API_KEY not configured - AI features will not work");
    }
    return apiKey;
  }

  // Get Anthropic API key
  static async getAnthropicApiKey(): Promise<string | null> {
    const apiKey = await this.getSecret("ANTHROPIC_API_KEY");
    if (!apiKey) {
      logger.error(
        "ANTHROPIC_API_KEY not configured - AI features will not work",
      );
    }
    return apiKey;
  }

  // Get Gemini API key
  static async getGeminiApiKey(): Promise<string | null> {
    const apiKey = await this.getSecret("GEMINI_API_KEY");
    if (!apiKey) {
      logger.error("GEMINI_API_KEY not configured - AI features will not work");
    }
    return apiKey;
  }

  // Get Resend API key
  static async getResendApiKey(): Promise<string | null> {
    const apiKey = await this.getSecret("RESEND_API_KEY");
    if (!apiKey) {
      logger.error(
        "RESEND_API_KEY not configured - email sending will not work",
      );
    }
    return apiKey;
  }

  // Get Twilio API key
  static async getTwilioMessageServiceSid(): Promise<string | null> {
    const apiKey = await this.getSecret("TWILIO_MESSAGE_SERVICE_SID");
    if (!apiKey) {
      logger.error(
        "TWILIO_MESSAGE_SERVICE_SID not configured - SMS notifications will not work",
      );
    }
    return apiKey;
  }

  // Get Twilio Account SID
  static async getTwilioAccountSid(): Promise<string | null> {
    const accountSid = await this.getSecret("TWILIO_ACCOUNT_SID");
    if (!accountSid) {
      logger.error(
        "TWILIO_ACCOUNT_SID not configured - SMS notifications will not work",
      );
    }
    return accountSid;
  }

  // Get Twilio Auth Token
  static async getTwilioAuthToken(): Promise<string | null> {
    const authToken = await this.getSecret("TWILIO_AUTH_TOKEN");
    if (!authToken) {
      logger.error(
        "TWILIO_AUTH_TOKEN not configured - SMS notifications will not work",
      );
    }
    return authToken;
  }

  // Get Twilio Phone Number
  static async getTwilioPhoneNumber(): Promise<string | null> {
    const phoneNumber = await this.getSecret("TWILIO_PHONE_NUMBER");
    if (!phoneNumber) {
      logger.error(
        "TWILIO_PHONE_NUMBER not configured - SMS notifications will not work",
      );
    }
    return phoneNumber;
  }

  // Get Supabase configuration
  static async getSupabaseConfig(): Promise<{
    url: string | null;
    anonKey: string | null;
    serviceRoleKey: string | null;
  }> {
    const url =
      (await this.getSecret("NEXT_PUBLIC_SUPABASE_URL")) ||
      (await this.getSecret("SUPABASE_URL"));
    const anonKey =
      (await this.getSecret("NEXT_PUBLIC_SUPABASE_ANON_KEY")) ||
      (await this.getSecret("SUPABASE_ANON_KEY"));
    const serviceRoleKey = await this.getSecret("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !anonKey) {
      logger.error(
        "Supabase configuration not fully set - database operations will fail",
      );
    }

    return { url, anonKey, serviceRoleKey };
  }

  // Get CrossRef API key
  static async getCrossrefApiKey(): Promise<string | null> {
    const apiKey = await this.getSecret("CROSSREF_API_KEY");
    if (!apiKey) {
      logger.info(
        "CROSSREF_API_KEY not configured - using CrossRef 'Polite' pool (free tier)",
      );
    }
    return apiKey;
  }

  // Get SERP API key
  static async getSerpApiKey(): Promise<string | null> {
    const apiKey = await this.getSecret("SERPAPI_KEY");
    if (!apiKey) {
      logger.error(
        "SERPAPI_KEY not configured - citation features will not work",
      );
    }
    return apiKey;
  }

  // Get Semantic Scholar API key
  static async getSemanticScholarApiKey(): Promise<string | null> {
    const apiKey = await this.getSecret("SEMANTIC_SCHOLAR_API_KEY");
    if (!apiKey) {
      logger.error(
        "SEMANTIC_SCHOLAR_API_KEY not configured - citation features will not work",
      );
    }
    return apiKey;
  }

  // Get Admin user IDs
  static async getAdminUserIds(): Promise<string[]> {
    const adminUserIdsStr = await this.getSecret("ADMIN_USER_IDS");
    return adminUserIdsStr ? adminUserIdsStr.split(",") : [];
  }

  // Get feedback email
  static async getFeedbackEmail(): Promise<string> {
    return (
      (await this.getSecret("FEEDBACK_EMAIL")) || "feedback@scholarforge-ai.com"
    );
  }

  // Get contact admin email
  static async getContactAdminEmail(): Promise<string> {
    return (
      (await this.getSecret("CONTACT_ADMIN_EMAIL")) ||
      "hello@scholarforge-ai.com"
    );
  }

  // Get compliance email
  static async getComplianceEmail(): Promise<string> {
    return (
      (await this.getSecret("COMPLIANCE_EMAIL")) ||
      "compliance@scholarforge-ai.com"
    );
  }

  // Get additional compliance emails
  static async getAdditionalComplianceEmails(): Promise<string[]> {
    const additionalEmailsStr = await this.getSecret(
      "COMPLIANCE_ADDITIONAL_EMAILS",
    );
    return additionalEmailsStr ? additionalEmailsStr.split(",") : [];
  }

  // Get frontend URL
  static async getFrontendUrl(): Promise<string> {
    return (await this.getSecret("FRONTEND_URL")) || "http://localhost:3000";
  }

  // Get backend URL
  static async getBackendUrl(): Promise<string> {
    return (await this.getSecret("BACKEND_URL")) || "http://localhost:3001";
  }

  // Get app URL
  static async getAppUrl(): Promise<string> {
    return (await this.getSecret("APP_URL")) || "http://localhost:3000";
  }

  // Get public app URL
  static async getPublicAppUrl(): Promise<string | null> {
    return await this.getSecret("NEXT_PUBLIC_APP_URL");
  }

  // Get Node environment
  static async getNodeEnv(): Promise<string> {
    return (await this.getSecret("NODE_ENV")) || "development";
  }

  // Get preferred AI provider
  static async getPreferredAiProvider(): Promise<string | null> {
    return await this.getSecret("PREFERRED_AI_PROVIDER");
  }

  // Get Google CSE ID
  static async getGoogleCseId(): Promise<string | null> {
    return await this.getSecret("GOOGLE_CSE_ID");
  }

  // Get Google API key
  static async getGoogleApiKey(): Promise<string | null> {
    return await this.getSecret("GOOGLE_API_KEY");
  }

  // Get LemonSqueezy configuration
  static async getLemonSqueezyConfig(): Promise<{
    storeId: string | null;
    webhookSecret: string | null;
    studentProProductId: string | null;
    studentProVariantId: string | null;
    researcherProductId: string | null;
    researcherVariantId: string | null;
    onetimeProductId: string | null;
    onetimeVariantId: string | null;
    institutionalProductId: string | null;
    institutionalVariantId: string | null;
  }> {
    const config = {
      storeId: await this.getSecret("LEMONSQUEEZY_STORE_ID"),
      webhookSecret: await this.getSecret("LEMONSQUEEZY_WEBHOOK_SECRET"),
      studentProProductId: await this.getSecret(
        "LEMONSQUEEZY_STUDENT_PRO_PRODUCT_ID",
      ),
      studentProVariantId: await this.getSecret(
        "LEMONSQUEEZY_STUDENT_PRO_VARIANT_ID",
      ),
      researcherProductId: await this.getSecret(
        "LEMONSQUEEZY_RESEARCHER_PRODUCT_ID",
      ),
      researcherVariantId: await this.getSecret(
        "LEMONSQUEEZY_RESEARCHER_VARIANT_ID",
      ),
      onetimeProductId: await this.getSecret("LEMONSQUEEZY_ONETIME_PRODUCT_ID"),
      onetimeVariantId: await this.getSecret("LEMONSQUEEZY_ONETIME_VARIANT_ID"),
      institutionalProductId: await this.getSecret(
        "LEMONSQUEEZY_INSTITUTIONAL_PRODUCT_ID",
      ),
      institutionalVariantId: await this.getSecret(
        "LEMONSQUEEZY_INSTITUTIONAL_VARIANT_ID",
      ),
    };

    if (!config.storeId || !config.webhookSecret) {
      logger.error(
        "LemonSqueezy configuration not fully set - billing features will fail",
      );
    }

    return config;
  }

  // Get token encryption key
  static async getTokenEncryptionKey(): Promise<string> {
    return (await this.getSecret("TOKEN_ENCRYPTION_KEY")) || "";
  }

  // Get base URL
  static async getBaseUrl(): Promise<string> {
    return (await this.getSecret("BASE_URL")) || "http://localhost:3001";
  }

  // Get LemonSqueezy configuration values
  static async getLemonsqueezyApiKey(): Promise<string | null> {
    return this.getSecret("LEMONSQUEEZY_API_KEY");
  }

  static async getLemonsqueezyStoreId(): Promise<string | null> {
    return this.getSecret("LEMONSQUEEZY_STORE_ID");
  }

  static async getLemonsqueezyWebhookSecret(): Promise<string | null> {
    return this.getSecret("LEMONSQUEEZY_WEBHOOK_SECRET");
  }

  // Get Supabase configuration values
  static async getSupabaseUrl(): Promise<string | null> {
    return this.getSecret("SUPABASE_URL");
  }

  static async getPublicSupabaseUrl(): Promise<string | null> {
    return this.getSecret("NEXT_PUBLIC_SUPABASE_URL");
  }

  static async getSupabaseAnonKey(): Promise<string | null> {
    return this.getSecret("SUPABASE_ANON_KEY");
  }

  static async getPublicSupabaseAnonKey(): Promise<string | null> {
    return this.getSecret("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  static async getSupabaseServiceRoleKey(): Promise<string | null> {
    return this.getSecret("SUPABASE_SERVICE_ROLE_KEY");
  }

  // Get AI Detection configuration values
  static async getGptzeroApiKey(): Promise<string | null> {
    return this.getSecret("GPTZERO_API_KEY");
  }

  static async getOriginalityApiKey(): Promise<string | null> {
    return this.getSecret("ORIGINALITY_API_KEY");
  }

  // Get allowed origins for CORS
  static async getAllowedOrigins(): Promise<string | null> {
    return this.getSecret("ALLOWED_ORIGINS");
  }
}

export default SecretsService;
