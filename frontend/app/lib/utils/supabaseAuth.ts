import {
  supabase,
  configureSessionPersistence,
  sessionManager,
} from "../supabase/client";
import logger from "../../utils/logger";

/**
 * Supabase Authentication Utilities
 * Replaces supabase authentication
 */

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string,
  rememberMe: boolean = false
) {
  try {
    // Configure session persistence based on "Remember Me" option
    configureSessionPersistence(rememberMe);

    console.log("Sign in with rememberMe:", rememberMe);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error("Sign in error", { error: error.message, email });
      throw error;
    }

    logger.info("User signed in", { email, uid: data.user?.id, rememberMe });

    // Perform any additional session management
    sessionManager.handleSessionCleanup();

    return data;
  } catch (error: any) {
    logger.error("Sign in error", { error: error.message, email });
    throw error;
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  userData?: any
) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      logger.error("Sign up error", { error: error.message, email });
      throw error;
    }

    logger.info("User signed up", { email, uid: data.user?.id });
    return data;
  } catch (error: any) {
    logger.error("Sign up error", { error: error.message, email });
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error("Sign out error", { error: error.message });
      throw error;
    }
    logger.info("User signed out");
  } catch (error: any) {
    logger.error("Sign out error", { error: error.message });
    throw error;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      logger.error("Get user error", { error: error.message });
      return null;
    }
    return data.user;
  } catch (error: any) {
    logger.error("Get user error", { error: error.message });
    return null;
  }
}

/**
 * Get current user's ID token
 */
export async function getIdToken(
  forceRefresh: boolean = false
): Promise<string | null> {
  try {
    if (forceRefresh) {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        // Don't log AuthSessionMissingError as it's expected for unauthenticated users
        if (error.message?.includes("Auth session missing") || error.name === "AuthSessionMissingError") {
          return null;
        }
        logger.error("Refresh session error", { error: error.message });
        return null;
      }
      return data.session?.access_token || null;
    } else {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        // Don't log AuthSessionMissingError as it's expected for unauthenticated users
        if (error.message?.includes("Auth session missing") || error.name === "AuthSessionMissingError") {
          return null;
        }
        logger.error("Get session error", { error: error.message });
        return null;
      }
      return data.session?.access_token || null;
    }
  } catch (error: any) {
    // Don't log AuthSessionMissingError as it's expected for unauthenticated users
    if (error?.message?.includes("Auth session missing") || error?.name === "AuthSessionMissingError") {
      return null;
    }
    logger.error("Get ID token error", { error: error?.message });
    return null;
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      logger.error("Password reset error", { error: error.message, email });
      throw error;
    }
    logger.info("Password reset email sent", { email });
  } catch (error: any) {
    logger.error("Password reset error", { error: error.message, email });
    throw error;
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(newPassword: string): Promise<void> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      logger.error("Update password error", { error: error.message });
      throw error;
    }
    logger.info("Password updated");
  } catch (error: any) {
    logger.error("Update password error", { error: error.message });
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: {
  displayName?: string;
  photoURL?: string;
}) {
  try {
    const { error } = await supabase.auth.updateUser({
      data: updates,
    });
    if (error) {
      logger.error("Update profile error", { error: error.message });
      throw error;
    }
    logger.info("Profile updated", { updates });
  } catch (error: any) {
    logger.error("Update profile error", { error: error.message });
    throw error;
  }
}

/**
 * Send email verification
 */
export async function sendVerificationEmail(): Promise<void> {
  try {
    // Supabase automatically sends verification email on sign up
    // For existing users, we can resend by calling signUp again
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      logger.error("Get user error", { error: error.message });
      throw error;
    }

    if (data.user?.email) {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: data.user.email,
      });

      if (resendError) {
        logger.error("Send verification email error", {
          error: resendError.message,
        });
        throw resendError;
      }

      logger.info("Verification email sent");
    } else {
      throw new Error("No email found for current user");
    }
  } catch (error: any) {
    logger.error("Send verification email error", { error: error.message });
    throw error;
  }
}

/**
 * OAuth Sign In
 */
export async function signInWithProvider(
  provider: "google" | "github" | "azure"
) {
  try {
    let providerName: "google" | "github" | "azure" = provider;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: providerName,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      logger.error(`${provider} sign in error`, { error: error.message });
      throw error;
    }

    logger.info(`User signed in with ${provider}`, { url: data.url });
    return data;
  } catch (error: any) {
    logger.error(`${provider} sign in error`, { error: error.message });
    throw error;
  }
}

/**
 * Phone Authentication - Send OTP
 */
export async function sendOTP(
  phoneNumber: string,
  userId: string,
  method: string = "sms"
) {
  try {
    // Use the backend API to send OTP
    const response = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        phoneNumber,
        method,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return result;
    } else {
      throw new Error(result.message || "Failed to send OTP");
    }
  } catch (error: any) {
    logger.error("Send OTP error", { error: error.message });
    throw error;
  }
}

/**
 * Phone Authentication - Verify OTP
 */
export async function verifyOTP(userId: string, code: string) {
  try {
    // Use the backend API to verify OTP
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        otp: code,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return result;
    } else {
      throw new Error(result.message || "Failed to verify OTP");
    }
  } catch (error: any) {
    logger.error("Verify OTP error", { error: error.message });
    throw error;
  }
}
