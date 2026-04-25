import { supabase } from "../supabase/client";
import logger from "../../utils/logger";

/**
 * Authentication Service
 * Uses Supabase authentication
 */

/**
 * Handle user login
 * @param supabaseUser - The Supabase user object
 */
export async function handleUserLogin(supabaseUser: any) {
  try {
    const userId = supabaseUser.id;
    return userId;
  } catch (error) {
    logger.error("Error handling user login", { error });
    throw error;
  }
}

/**
 * Initialize user session with Supabase
 */
export async function initializeUserSession() {
  try {
    // Get current Supabase user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      logger.error("Error getting Supabase user", { error });
      return null;
    }

    if (user) {
      return user;
    }

    return null;
  } catch (error) {
    logger.error("Error initializing user session", { error });
    throw error;
  }
}

export default {
  handleUserLogin,
  initializeUserSession,
};
