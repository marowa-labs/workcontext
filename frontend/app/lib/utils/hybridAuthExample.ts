/**
 * Example usage of the Authentication System
 * This file demonstrates how to use Supabase for authentication
 */

import { supabase } from "../supabase/client";
import { handleUserLogin } from "./hybridAuthService";

/**
 * Example: Sign in with Supabase
 */
export async function signInAndSync(email: string, password: string) {
  try {
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await handleUserLogin(data.user);
      console.log("User signed in");
      return data.user;
    }
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
}

/**
 * Example: Initialize the auth system
 */
export async function initializeApp() {
  try {
    // Listen for auth state changes
    const unsubscribe = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await handleUserLogin(session.user);
          console.log("User logged in:", session.user.id);
        }
      }
    );

    console.log("Auth system initialized");
    return unsubscribe;
  } catch (error) {
    console.error("Error initializing app:", error);
    throw error;
  }
}

export default {
  signInAndSync,
  initializeApp,
};
