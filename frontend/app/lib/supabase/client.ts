import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase configuration:", {
  supabaseUrl: supabaseUrl ? "SET" : "MISSING",
  supabaseAnonKey: supabaseAnonKey ? "SET" : "MISSING",
  supabaseUrlValue: supabaseUrl?.substring(0, 20) + "...",
  supabaseAnonKeyValue: supabaseAnonKey?.substring(0, 20) + "...",
});

// Validate configuration
if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
}

// Store the initial client configuration
const initialSupabaseOptions = {
  auth: {
    // Enable automatic token refresh
    autoRefreshToken: true,
    // Persist session in local storage
    persistSession: true,
    // Detect session changes
    detectSessionInUrl: true,
  },
  realtime: {
    // Enable realtime connections
    connect: true,
    // Set heartbeat interval
    heartbeatIntervalMs: 30000,
    // Set timeout for reconnection attempts
    reconnectDelayMs: 1000,
    // Enable presence tracking
    presence: true,
  },
};

// Create Supabase client with proper session persistence and auto-refresh settings
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  initialSupabaseOptions
);
// Enhanced session management
class SessionManager {
  private static instance: SessionManager;
  private rememberMe: boolean = true; // Default to true (persistent session)

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public setRememberMe(rememberMe: boolean): void {
    this.rememberMe = rememberMe;
    console.log(
      "Session persistence set to:",
      rememberMe ? "persistent" : "session-only"
    );

    // Additional logic could be added here for more advanced session management
    if (!rememberMe) {
      // Could implement warnings or additional logic for non-persistent sessions
      console.log("Session will expire when browser tab is closed");
    }
  }

  public shouldRemember(): boolean {
    return this.rememberMe;
  }

  // Method to handle session cleanup based on rememberMe setting
  public handleSessionCleanup(): void {
    if (!this.rememberMe) {
      // For non-persistent sessions, we could add additional cleanup logic here
      // Note: Supabase automatically handles sessionStorage vs localStorage based on persistSession setting
      console.log("Performing session cleanup for non-persistent session");
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Function to configure session persistence based on "Remember Me" setting
export const configureSessionPersistence = (rememberMe: boolean) => {
  sessionManager.setRememberMe(rememberMe);
};

// Custom hook for Supabase auth
export const useSupabaseAuth = () => {
  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    return await supabase.auth.signOut();
  };

  const getUser = async () => {
    return await supabase.auth.getUser();
  };

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email);
  };

  const updatePassword = async (password: string) => {
    return await supabase.auth.updateUser({
      password,
    });
  };

  return {
    signIn,
    signUp,
    signOut,
    getUser,
    resetPassword,
    updatePassword,
    supabase,
  };
};
