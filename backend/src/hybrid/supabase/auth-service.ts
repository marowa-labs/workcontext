import { createClient } from "@supabase/supabase-js";
import { SecretsService } from "../../services/secrets-service";

// Supabase client configuration - ensure consistency with frontend
let supabaseUrl: string | null = null;
let supabaseAnonKey: string | null = null;

// Initialize Supabase configuration
async function initializeSupabaseConfig() {
  supabaseUrl =
    (await SecretsService.getPublicSupabaseUrl()) ||
    (await SecretsService.getSupabaseUrl());
  supabaseAnonKey =
    (await SecretsService.getPublicSupabaseAnonKey()) ||
    (await SecretsService.getSupabaseAnonKey());
}

// Initialize the configuration
initializeSupabaseConfig();

// Create Supabase client with proper session persistence and auto-refresh settings
// Using async initialization to ensure secrets are loaded
let initialized = false;

async function getInitializedSupabaseClient() {
  // Wait a bit for initialization to complete
  while (!supabaseUrl || !supabaseAnonKey) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  initialized = true;

  console.log("Initializing Supabase client with:", {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
  });

  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      // Enable automatic token refresh
      autoRefreshToken: true,
      // Persist session in local storage
      persistSession: true,
      // Detect session changes
      detectSessionInUrl: true,
    },
  });
}

// Export a promise for the client
const supabasePromise = getInitializedSupabaseClient();

// Export functions to access the client
export async function getSupabase() {
  return supabasePromise;
}

// Create a default client instance (this will be a promise)
export const supabase = supabasePromise;

// Authentication service using Supabase Auth
export class AuthService {
  static supabase = supabase;

  // Sign up a new user
  static async signUp(email: string, password: string, userData: any) {
    console.log("AuthService.signUp called", { email });
    const client = await supabase;
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) {
      console.error("AuthService.signUp error", { error: error.message });
      throw new Error(error.message);
    }
    console.log("AuthService.signUp success", { userId: data.user?.id });
    return data;
  }

  // Sign in an existing user
  static async signIn(email: string, password: string) {
    console.log("AuthService.signIn called", { email });
    // The skipBrowserRedirect option is not available for signInWithPassword
    const client = await supabase;
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("AuthService.signIn error", { error: error.message });
      throw new Error(error.message);
    }
    console.log("AuthService.signIn success", { userId: data.user?.id });
    return data;
  }

  // Sign out current user
  static async signOut() {
    console.log("AuthService.signOut called");
    const client = await supabase;
    const { error } = await client.auth.signOut();
    if (error) {
      console.error("AuthService.signOut error", { error: error.message });
      throw new Error(error.message);
    }
    console.log("AuthService.signOut success");
  }

  // Get current user
  static async getCurrentUser() {
    console.log("AuthService.getCurrentUser called");
    const client = await supabase;
    const {
      data: { user },
      error,
    } = await client.auth.getUser();

    if (error) {
      console.error("AuthService.getCurrentUser error", {
        error: error.message,
      });
    } else {
      console.log("AuthService.getCurrentUser success", { userId: user?.id });
    }

    return user;
  }

  // Update user profile
  static async updateUserProfile(updates: any) {
    console.log("AuthService.updateUserProfile called");
    const client = await supabase;
    const { data, error } = await client.auth.updateUser({
      data: updates,
    });

    if (error) {
      console.error("AuthService.updateUserProfile error", {
        error: error.message,
      });
      throw new Error(error.message);
    }
    console.log("AuthService.updateUserProfile success");
    return data;
  }

  // Reset password
  static async resetPassword(email: string) {
    console.log("AuthService.resetPassword called", { email });
    const client = await supabase;
    const { data, error } = await client.auth.resetPasswordForEmail(email);
    if (error) {
      console.error("AuthService.resetPassword error", {
        error: error.message,
      });
      throw new Error(error.message);
    }
    console.log("AuthService.resetPassword success");
    return data;
  }

  // Resend email verification
  static async resendEmailVerification(email: string) {
    console.log("AuthService.resendEmailVerification called", { email });
    // Supabase doesn't have a direct resend verification method
    // We can simulate this by sending a password reset email
    // or by signing up again (which will send verification if not verified)
    const client = await supabase;
    const { error } = await client.auth.resend({
      type: "signup",
      email: email,
    });

    if (error) {
      console.error("AuthService.resendEmailVerification error", {
        error: error.message,
      });
      throw new Error(error.message);
    }
    console.log("AuthService.resendEmailVerification success");
    return { message: "Verification email resent successfully" };
  }
}
