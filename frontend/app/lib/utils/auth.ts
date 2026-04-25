import { supabase } from "../supabase/client";

// Auth utility functions using Supabase implementation

/**
 * Get the current authentication token
 * @returns Promise resolving to the access token or null if not authenticated
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    console.log("Auth: Getting token from Supabase...");
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }

    if (!data.session) {
      console.warn("No active session found");
      return null;
    }

    // Check if token is about to expire (within 5 minutes)
    if (!data.session.expires_at) {
      console.warn("Session expires_at is missing, returning access token");
      return data.session.access_token;
    }

    const expirationTime = new Date(data.session.expires_at * 1000);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    console.log("Token expiration check:", {
      expiresAt: data.session.expires_at,
      expirationTime,
      now,
      fiveMinutesFromNow,
      isExpiringSoon: expirationTime < fiveMinutesFromNow,
      timeUntilExpiration: expirationTime.getTime() - now.getTime(),
      timeUntilRefresh: fiveMinutesFromNow.getTime() - now.getTime(),
    });

    if (expirationTime < fiveMinutesFromNow) {
      console.warn(
        "Token is about to expire or already expired, attempting to refresh",
      );
      // Try to refresh the session
      console.log("Attempting to refresh session in auth utils");
      const { data: refreshedData, error: refreshError } =
        await supabase.auth.refreshSession();
      if (refreshError) {
        console.error("Failed to refresh session:", refreshError);
        // If refresh fails, try to get a new session
        console.log("Trying to get new session after refresh failure");
        const { data: newData, error: newError } =
          await supabase.auth.getSession();
        if (newError || !newData.session) {
          console.error("Failed to get new session:", newError);
          return null;
        }
        const newToken = newData.session?.access_token || null;
        console.log(
          "Auth: New token data:",
          newToken ? `${newToken.substring(0, 10)}...` : "NONE",
        );
        return newToken;
      }
      const refreshedToken = refreshedData.session?.access_token || null;
      console.log(
        "Auth: Refreshed token data:",
        refreshedToken ? `${refreshedToken.substring(0, 10)}...` : "NONE",
      );
      return refreshedToken;
    }

    const token = data.session?.access_token || null;
    console.log(
      "Auth: Token data:",
      token ? `${token.substring(0, 10)}...` : "NONE",
    );
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

/**
 * Check if the user is currently authenticated
 * @returns Promise resolving to true if authenticated, false otherwise
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error checking authentication status:", error);
      return false;
    }
    return !!data.session;
  } catch (error) {
    console.error("Error checking authentication status:", error);
    return false;
  }
};

/**
 * Sign out the current user
 * @returns Promise resolving to true if successful, false otherwise
 */
export const signOut = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      return false;
    }

    // Clear any stored data
    localStorage.clear();
    sessionStorage.clear();
    return true;
  } catch (error) {
    console.error("Error signing out:", error);
    return false;
  }
};

/**
 * Refresh the current session
 * @returns Promise resolving to true if successful, false otherwise
 */
export const refreshSession = async (): Promise<boolean> => {
  try {
    // In Supabase, token refresh happens automatically
    // We can force a token refresh by getting a new session
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Error refreshing session:", error);
      return false;
    }
    return !!data.session;
  } catch (error) {
    console.error("Error refreshing session:", error);
    return false;
  }
};

/**
 * Force refresh the session
 * @returns Promise resolving to the new session or null
 */
export const forceRefreshSession = async (): Promise<any> => {
  try {
    // Force refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Error force refreshing session:", error);
      return null;
    }
    return data.session;
  } catch (error) {
    console.error("Error force refreshing session:", error);
    return null;
  }
};

// Create an auth object to avoid anonymous default export
const authUtils = {
  getAuthToken,
  isAuthenticated,
  signOut,
  refreshSession,
  forceRefreshSession,
};

export default authUtils;
