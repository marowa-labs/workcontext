"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase/client";

interface AuthInitializerProps {
  children: React.ReactNode;
}

// Context to provide auth initialization state
export const AuthInitContext = React.createContext({
  isInitialized: false,
});

const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(
          "Auth state changed in AuthInitializer:",
          event,
          session?.user?.id,
        );
        // Once we get any auth state change, we're initialized
        if (mounted && !isInitialized) {
          setIsInitialized(true);
        }
      },
    );

    // Also check initial session
    const checkInitialSession = async () => {
      try {
        // Get the current session to ensure Supabase has restored it
        const { error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting initial session:", error);
        }

        // Mark as initialized regardless of whether there's a session or not
        // This ensures that our route components don't redirect prematurely
        if (mounted && !isInitialized) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
        // Still mark as initialized to prevent hanging on errors
        if (mounted && !isInitialized) {
          setIsInitialized(true);
        }
      }
    };

    checkInitialSession();

    // Clean up
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [isInitialized]);

  return (
    <AuthInitContext.Provider value={{ isInitialized }}>
      {children}
    </AuthInitContext.Provider>
  );
};

export default AuthInitializer;
