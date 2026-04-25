"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { useUser } from "../../lib/utils/useUser";

const CallbackPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refetch: refreshUser } = useUser();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log("OAuth callback page loaded");

        // Get the code from URL parameters
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        // Handle OAuth errors
        if (error) {
          console.error("OAuth error:", error, errorDescription);
          setError(`OAuth error: ${errorDescription || error}`);
          setLoading(false);
          return;
        }

        // If no code, it might be a session refresh or already handled
        if (!code) {
          console.log("No code in URL, checking for existing session");

          // Get current session
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            console.error("Session error:", sessionError);
            setError("Authentication failed");
            setLoading(false);
            return;
          }

          if (session) {
            console.log("Session found, checking if OAuth signup");

            // Get the user info from the session
            const user = session.user;

            // Check if this is an OAuth user
            const provider = user.app_metadata?.provider;

            if (provider && provider === "google") {
              console.log("OAuth session detected, processing signup flow");
              console.log("User data:", {
                id: user.id,
                email: user.email,
                provider,
              });

              // Store OAuth user data temporarily in session storage
              const oauthUserData = {
                id: user.id,
                email: user.email,
                fullName:
                  user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  user.email?.split("@")[0],
                provider: provider,
              };

              console.log("Storing OAuth user data:", oauthUserData);
              sessionStorage.setItem(
                "oauthUserData",
                JSON.stringify(oauthUserData),
              );

              // Redirect to signup page with OAuth flag
              let redirectUrl = "/signup";
              const plan = searchParams.get("plan");
              const redirect = searchParams.get("redirect");

              const params = new URLSearchParams();
              if (plan) params.set("plan", plan);
              if (redirect) params.set("redirect", redirect);
              params.set("oauth", "true");

              if ([...params.keys()].length > 0) {
                redirectUrl += `?${params.toString()}`;
              }

              console.log("Redirecting to:", redirectUrl);
              router.push(redirectUrl);
              setLoading(false);
              return;
            } else {
              // Regular email user with session
              console.log("Regular email user, going to dashboard");
              await refreshUser();
              router.push("/dashboard");
              setLoading(false);
              return;
            }
          } else {
            // No session, redirect to login
            console.log("No session, redirecting to login");
            router.push("/login");
          }

          setLoading(false);
          return;
        }

        // Get the session to check if the user just signed up via OAuth
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setError("Authentication failed");
          setLoading(false);
          return;
        }

        if (session) {
          console.log("OAuth session established, getting user info");

          // Get the user info from the session
          const user = session.user;

          // Check if this is a new user (has email but might need to be registered in our database)
          if (user) {
            // The user has successfully authenticated with OAuth
            // We need to check if they exist in our database and handle accordingly
            // For new OAuth users, we'll redirect to the signup page with OAuth data
            // but in a way that continues the signup flow (OTP verification and survey)

            // Store OAuth user data temporarily in session storage
            const oauthUserData = {
              id: user.id,
              email: user.email,
              fullName:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split("@")[0],
              provider: user.app_metadata?.provider || "oauth",
            };

            sessionStorage.setItem(
              "oauthUserData",
              JSON.stringify(oauthUserData),
            );

            // Redirect to signup page - it will detect the OAuth data and handle the rest of the flow
            let redirectUrl = "/signup";
            const plan = searchParams.get("plan");
            const redirect = searchParams.get("redirect");

            const params = new URLSearchParams();
            if (plan) params.set("plan", plan);
            if (redirect) params.set("redirect", redirect);
            params.set("oauth", "true"); // Flag to indicate this is an OAuth signup

            if ([...params.keys()].length > 0) {
              redirectUrl += `?${params.toString()}`;
            }

            router.push(redirectUrl);
            return;
          }
        }

        // If no session was established, redirect to login
        router.push("/login");
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError("Authentication failed");
      } finally {
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [searchParams, refreshUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Completing authentication...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Authentication Error
          </h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default CallbackPage;
