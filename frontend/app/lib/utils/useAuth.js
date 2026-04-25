import { useCallback } from "react";
import { supabase } from "../supabase/client";
import { useSupabaseUser } from "./useSupabaseUser";

function useAuth() {
  const callbackUrl =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("callbackUrl")
      : null;

  // Define all Supabase auth methods with useCallback (React rules)
  const signInWithCredentials = useCallback(
    async (options) => {
      const { email, password } = options;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Handle callback URL if provided
      if (callbackUrl || options.callbackUrl) {
        window.location.href = callbackUrl || options.callbackUrl;
      }

      return data;
    },
    [callbackUrl],
  );

  const signUpWithCredentials = useCallback(
    async (options) => {
      const { email, password, userData } = options;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) {
        throw error;
      }

      // Handle callback URL if provided
      if (callbackUrl || options.callbackUrl) {
        window.location.href = callbackUrl || options.callbackUrl;
      }

      return data;
    },
    [callbackUrl],
  );

  const signInWithGoogle = useCallback(
    async (options) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl || options.callbackUrl,
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    [callbackUrl],
  );

  const signInWithFacebook = useCallback(
    async (options) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: callbackUrl || options.callbackUrl,
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    [callbackUrl],
  );

  const signInWithTwitter = useCallback(
    async (options) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "twitter",
        options: {
          redirectTo: callbackUrl || options.callbackUrl,
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    [callbackUrl],
  );

  const signOutUser = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    // Clear only auth-related data instead of all localStorage
    localStorage.removeItem(
      "sb-" +
        process.env.NEXT_PUBLIC_SUPABASE_URL?.split(".")[0] +
        "-auth-token",
    );
    sessionStorage.removeItem(
      "sb-" +
        process.env.NEXT_PUBLIC_SUPABASE_URL?.split(".")[0] +
        "-auth-token",
    );

    // Redirect to login page to ensure user cannot go back
    // Only redirect if we're not already on the login page
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/login")
    ) {
      window.location.href = "/login";
    }
  }, []);

  const { user, loading, token } = useSupabaseUser();

  // Return appropriate methods based on configuration
  return {
    user,
    loading,
    token,
    signInWithCredentials,
    signUpWithCredentials,
    signInWithGoogle,
    signInWithFacebook,
    signInWithTwitter,
    signOut: signOutUser,
  };
}

export default useAuth;
