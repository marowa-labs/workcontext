import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "../supabase/client";
import { getIdToken } from "./supabaseAuth";

/**
 * Supabase User Hook
 * Replaces supabase useUser hook
 */
export function useSupabaseUser() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const initialized = useRef(false);
  // Create a ref to store the user object to prevent circular dependencies
  const userRef = useRef<any | null>(null);

  // Update the ref whenever user changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const fetchUser = useCallback(async () => {
    try {
      console.log("Fetching user from Supabase");
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        // Check if it's just a missing session (not logged in)
        if (
          error.name === "AuthSessionMissingError" ||
          error.message?.includes("Auth session missing")
        ) {
          console.log("No active session found (visitor)");
        } else {
          console.error("Error fetching user:", error);
        }
        setUser(null);
        setToken(null);
      } else {
        console.log("User fetched:", data.user?.id);
        setUser(data.user);
        userRef.current = data.user; // Update ref immediately

        if (data.user) {
          const idToken = await getIdToken();
          setToken(idToken);
        } else {
          setToken(null);
        }
      }
    } catch (error: any) {
      // Suppress expected "AuthSessionMissingError" which just means no user is logged in
      const errorMessage = error?.message || "";
      const errorName = error?.name || "";
      if (
        errorName === "AuthSessionMissingError" ||
        errorMessage.includes("AuthSessionMissingError") ||
        errorMessage.includes("Auth session missing")
      ) {
        console.log("No active session found (visitor)");
      } else {
        console.error("Error fetching user:", error);
      }
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
      if (!initialized.current) {
        initialized.current = true;
      }
    }
  }, []);

  const refetchUser = useCallback(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    try {
      // Listen for auth state changes
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("Auth state changed:", event, session?.user?.id);
          setUser(session?.user || null);
          userRef.current = session?.user || null; // Update ref immediately
          setLoading(false);

          if (session?.user) {
            const idToken = session.access_token;
            setToken(idToken);
          } else {
            setToken(null);
          }

          if (!initialized.current) {
            initialized.current = true;
          }
        },
      );

      // Fetch user immediately
      fetchUser();

      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up auth state listener:", error);
      setLoading(false);
    }
  }, [fetchUser]);

  // ✅ CRITICAL FIX: Memoize return object so it doesn't change every render
  // Use userRef.current instead of user to prevent circular dependencies
  return useMemo(
    () => ({
      user: userRef.current,
      data: userRef.current,
      loading,
      token,
      refetch: refetchUser,
    }),
    [loading, token, refetchUser],
  );
}

export { useSupabaseUser as useUser };
export default useSupabaseUser;
