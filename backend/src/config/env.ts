// Environment configuration
import { SecretsService } from "../services/secrets-service";

interface Config {
  supabase: {
    url: string | null;
    anonKey: string | null;
    serviceRoleKey: string | null;
  };
  lemonsqueezy: {
    apiKey: string | null;
    storeId: string | null;
    webhookSecret: string | null;
  };
  app: {
    url: string;
    environment: string;
  };
}

export const config: Config = {
  // Supabase configuration
  supabase: {
    url: null,
    anonKey: null,
    serviceRoleKey: null,
  },

  // LemonSqueezy for payments
  lemonsqueezy: {
    apiKey: null,
    storeId: null,
    webhookSecret: null,
  },

  // Application settings
  app: {
    url: "http://localhost:3000",
    environment: "development",
  },
};

// Initialize the config with async values
async function initializeConfig() {
  // Supabase configuration
  config.supabase.url =
    (await SecretsService.getSupabaseUrl()) ||
    (await SecretsService.getPublicSupabaseUrl());
  config.supabase.anonKey =
    (await SecretsService.getSupabaseAnonKey()) ||
    (await SecretsService.getPublicSupabaseAnonKey());
  config.supabase.serviceRoleKey =
    await SecretsService.getSupabaseServiceRoleKey();

  // LemonSqueezy for payments
  config.lemonsqueezy.apiKey = await SecretsService.getLemonsqueezyApiKey();
  config.lemonsqueezy.storeId = await SecretsService.getLemonsqueezyStoreId();
  config.lemonsqueezy.webhookSecret =
    await SecretsService.getLemonsqueezyWebhookSecret();

  // Application settings
  config.app.url =
    (await SecretsService.getAppUrl()) ||
    (await SecretsService.getPublicAppUrl()) ||
    "http://localhost:3000";
  config.app.environment = await SecretsService.getNodeEnv();
}

// Initialize the configuration
initializeConfig();

console.log("Environment configuration loaded:");
console.log("LemonSqueezy config:", {
  hasApiKey: !!config.lemonsqueezy.apiKey,
  hasStoreId: !!config.lemonsqueezy.storeId,
  hasWebhookSecret: !!config.lemonsqueezy.webhookSecret,
  apiKeyLength: config.lemonsqueezy.apiKey?.length,
  storeId: config.lemonsqueezy.storeId,
  webhookSecret: config.lemonsqueezy.webhookSecret ? "SET" : "NOT_SET",
});

// Validate required environment variables
export async function validateEnv() {
  const required: string[] = [];

  // Check for Supabase credentials
  const supabaseUrl = await SecretsService.getSupabaseUrl();
  const supabaseAnonKey = await SecretsService.getSupabaseAnonKey();
  const hasSupabase = supabaseUrl && supabaseAnonKey;

  if (!hasSupabase) {
    required.push("SUPABASE_URL and SUPABASE_ANON_KEY");
  }

  // Check for AI Detection API keys
  const gptzeroApiKey = await SecretsService.getGptzeroApiKey();
  const originalityApiKey = await SecretsService.getOriginalityApiKey();
  const hasGptZeroKey = gptzeroApiKey;
  const hasOriginalityKey = originalityApiKey;

  if (!hasGptZeroKey && !hasOriginalityKey) {
    required.push("At least one of GPTZERO_API_KEY or ORIGINALITY_API_KEY");
  }

  if (required.length > 0) {
    throw new Error(
      `Missing required environment variables: ${required.join(", ")}`,
    );
  }

  console.log("✅ Using Supabase Authentication");
}
