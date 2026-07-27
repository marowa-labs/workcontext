// Environment configuration
import { SecretsService } from "../services/secrets-service";

interface Config {
  supabase: {
    url: string | null;
    anonKey: string | null;
    serviceRoleKey: string | null;
  };
  app: {
    url: string;
    environment: string;
  };
  cron: {
    jobSecret: string | null;
  };
}

export const config: Config = {
  // Supabase configuration
  supabase: {
    url: null,
    anonKey: null,
    serviceRoleKey: null,
  },

  // Application settings
  app: {
    url: process.env.FRONTEND_URL || "http://localhost:3000",
    environment: process.env.NODE_ENV || "development",
  },

  // Cron job authentication
  cron: {
    jobSecret: process.env.CRON_JOB_SECRET || null,
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

  // Application settings
  config.app.url =
    (await SecretsService.getAppUrl()) ||
    (await SecretsService.getPublicAppUrl()) ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000";
  config.app.environment = await SecretsService.getNodeEnv();
}

// Initialize the configuration
initializeConfig();

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
