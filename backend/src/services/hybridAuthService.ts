import {
  getSupabaseClient,
  getSupabaseAdminClient,
} from "../lib/supabase/client";
import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";
import { SecretsService } from "./secrets-service";

/**
 * Authentication Service
 * Uses Supabase Authentication for authentication and Supabase for user data storage
 */
export class AuthService {
  /**
   * Verify Supabase ID token and get user data from Supabase
   */
  static async verifyTokenAndGetUser(accessToken: string): Promise<{
    supabaseUser: any;
    dbUser: any;
  }> {
    try {
      // Use regular client for token verification as admins check is less reliable for user tokens
      const supabase = await getSupabaseClient();

      // Retry logic for transient network failures
      let lastError: any = null;
      const maxRetries = 3;
      const baseDelay = 500;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser(accessToken);

        if (!userError && user) {
          // Get user data from database using Prisma
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
          });

          if (!dbUser) {
            logger.error(
              "User authenticated via Supabase but not found in Prisma database",
              {
                uid: user.id,
                email: user.email,
              },
            );
            throw new Error("User not found in database");
          }

          return {
            supabaseUser: user,
            dbUser,
          };
        }

        lastError = userError;

        // Only retry on network/DNS errors, not auth errors
        const isNetworkError =
          userError?.message?.includes("ENOTFOUND") ||
          userError?.message?.includes("ETIMEDOUT") ||
          userError?.message?.includes("ECONNREFUSED") ||
          userError?.message?.includes("fetch failed");

        if (!isNetworkError) {
          break; // Don't retry auth errors
        }

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          logger.warn(
            `Token verification attempt ${attempt + 1} failed, retrying in ${delay}ms`,
            {
              error: userError?.message,
            },
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      logger.error("Failed to verify user token via Supabase after retries", {
        error: lastError?.message,
        tokenLength: accessToken?.length,
        tokenPreview: accessToken
          ? `${accessToken.substring(0, 10)}...`
          : "NONE",
      });
      throw new Error("Invalid or expired token");
    } catch (error) {
      logger.error("AuthService.verifyTokenAndGetUser failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create a new user with Supabase Authentication and store data in Supabase
   */
  static async createUser(userData: {
    email: string;
    password: string;
    fullName?: string;
    phoneNumber?: string;
    userType?: string;
    fieldOfStudy?: string;
    otpMethod?: string;
  }): Promise<{
    supabaseUser: any;
    dbUser: any;
  }> {
    try {
      // Create user in Supabase Authentication
      const client = await getSupabaseClient();
      const sanitizedEmail = userData.email.trim();

      const { data, error: signUpError } = await client.auth.signUp({
        email: sanitizedEmail,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            phone_number: userData.phoneNumber,
            user_type: userData.userType,
            field_of_study: userData.fieldOfStudy,
            otp_method: userData.otpMethod || null,
          },
          emailRedirectTo: `${
            (await SecretsService.getSecret("APP_URL")) ||
            "http://localhost:3000"
          }/auth/callback`,
        },
      });

      if (signUpError) {
        logger.error("Failed to create user in Supabase Auth", {
          email: userData.email,
          error: signUpError.message,
        });
        // Check if user already exists - return specific error type for proper handling
        if (signUpError.message.includes("User already registered")) {
          const error: any = new Error(
            "User already registered. Please log in instead.",
          );
          error.code = "USER_EXISTS";
          error.statusCode = 409;
          throw error;
        }
        throw new Error(signUpError.message);
      }

      if (!data.user) {
        logger.error(
          "Failed to create user in Supabase Auth - no user returned",
          {
            email: userData.email,
          },
        );
        throw new Error("Failed to create user");
      }

      // Store additional user data in database using Prisma
      // Use upsert to handle retry scenarios where the user might already exist
      const dbUser = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          // Update fields in case of retry with same email but potentially different data
          id: data.user.id, // Ensure ID matches the Supabase Auth user
          full_name: userData.fullName,
          phone_number: userData.phoneNumber,
          user_type: userData.userType,
          field_of_study: userData.fieldOfStudy,
          otp_method: userData.otpMethod || null,
          updated_at: new Date().toISOString(),
        },
        create: {
          id: data.user.id,
          email: userData.email,
          full_name: userData.fullName,
          phone_number: userData.phoneNumber,
          user_type: userData.userType,
          field_of_study: userData.fieldOfStudy,
          otp_method: userData.otpMethod || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });

      // No error handling needed as Prisma will throw on failure

      logger.info("User created successfully", {
        uid: data.user.id,
        email: userData.email,
      });

      return {
        supabaseUser: data.user,
        dbUser,
      };
    } catch (error) {
      logger.error("Failed to create user", { error });
      throw error;
    }
  }

  /**
   * Create a user from OAuth provider data
   * This method is used for users who sign up via OAuth providers like Google
   */
  static async createOAuthUser(oauthData: {
    id: string;
    email: string;
    fullName?: string;
    provider: string;
  }): Promise<{
    supabaseUser: any;
    dbUser: any;
  }> {
    try {
      // First, check if user already exists in our database
      const existingUser = await prisma.user.findUnique({
        where: { id: oauthData.id },
      });

      if (existingUser) {
        // User already exists, return the existing user
        logger.info("OAuth user already exists in database", {
          uid: oauthData.id,
          email: oauthData.email,
        });

        // Get the user from Supabase Auth as well
        const client = await getSupabaseClient();
        const { data: supabaseUser, error: authError } =
          await client.auth.admin.getUserById(oauthData.id);

        if (authError) {
          logger.error("Failed to get OAuth user from Supabase Auth", {
            uid: oauthData.id,
            error: authError.message,
          });
          throw new Error(authError.message);
        }

        return {
          supabaseUser: supabaseUser.user,
          dbUser: existingUser,
        };
      }

      // User doesn't exist, create them in our database
      logger.info("Creating new OAuth user in database", {
        uid: oauthData.id,
        email: oauthData.email,
        provider: oauthData.provider,
      });

      // Store user data in database using Prisma
      const dbUser = await prisma.user.create({
        data: {
          id: oauthData.id,
          email: oauthData.email,
          full_name: oauthData.fullName,
          user_type: null, // Will be set during survey completion
          field_of_study: null, // Will be set during survey completion
          otp_method: null,
          survey_completed: false, // Explicitly set to false for new users
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });

      // Get the user from Supabase Auth
      const client = await getSupabaseClient();
      const { data: supabaseUser, error: authError } =
        await client.auth.admin.getUserById(oauthData.id);

      if (authError) {
        logger.error("Failed to get OAuth user from Supabase Auth", {
          uid: oauthData.id,
          error: authError.message,
        });
        // Clean up the database user since we couldn't get the auth user
        try {
          await prisma.user.delete({ where: { id: oauthData.id } });
        } catch (cleanupError) {
          logger.error("Failed to cleanup database user after auth error", {
            uid: oauthData.id,
            cleanupError,
          });
        }
        throw new Error(authError.message);
      }

      logger.info("OAuth user created successfully", {
        uid: oauthData.id,
        email: oauthData.email,
      });

      return {
        supabaseUser: supabaseUser.user,
        dbUser,
      };
    } catch (error) {
      logger.error("Failed to create OAuth user", { error });
      throw error;
    }
  }

  /**
   * Update user profile in both Supabase Auth and database
   */
  static async updateUserProfile(
    uid: string,
    updates: {
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      userType?: string;
      fieldOfStudy?: string;
      otpMethod?: string;
    },
  ): Promise<{
    supabaseUser: any;
    dbUser: any;
  }> {
    try {
      // Update user in Supabase Authentication
      const updateData: any = {};
      if (updates.email) updateData.email = updates.email;

      // Only update user metadata if there are changes
      const userData: any = {};
      if (updates.fullName) userData.full_name = updates.fullName;
      if (updates.phoneNumber) userData.phone_number = updates.phoneNumber;
      if (updates.userType) userData.user_type = updates.userType;
      if (updates.fieldOfStudy) userData.field_of_study = updates.fieldOfStudy;
      if (updates.otpMethod) userData.otp_method = updates.otpMethod;

      if (Object.keys(userData).length > 0) {
        updateData.data = userData;
      }

      let supabaseUser: any;
      if (Object.keys(updateData).length > 0) {
        const client = await getSupabaseClient();
        const { data, error: updateError } =
          await client.auth.admin.updateUserById(uid, updateData);

        if (updateError) {
          logger.error("Failed to update user in Supabase Auth", {
            uid,
            error: updateError.message,
          });
          throw new Error(updateError.message);
        }

        supabaseUser = data.user;
      } else {
        // If no auth updates, just get the current user
        const client = await getSupabaseClient();
        const {
          data: { user },
          error: userError,
        } = await client.auth.admin.getUserById(uid);
        if (userError) {
          logger.error("Failed to get user from Supabase Auth", {
            uid,
            error: userError.message,
          });
          throw new Error(userError.message);
        }
        supabaseUser = user;
      }

      // Update user data in Supabase database
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.fullName) dbUpdates.full_name = updates.fullName;
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.phoneNumber) dbUpdates.phone_number = updates.phoneNumber;
      if (updates.userType) dbUpdates.user_type = updates.userType;
      if (updates.fieldOfStudy) dbUpdates.field_of_study = updates.fieldOfStudy;
      if (updates.otpMethod) dbUpdates.otp_method = updates.otpMethod;

      const dbUser = await prisma.user.update({
        where: { id: uid },
        data: dbUpdates,
      });

      logger.info("User profile updated successfully", { uid });

      return {
        supabaseUser,
        dbUser,
      };
    } catch (error) {
      logger.error("Failed to update user profile", { error });
      throw error;
    }
  }

  /**
   * Delete user from both Supabase Auth and database
   */
  static async deleteUser(uid: string): Promise<void> {
    try {
      // Delete user from Supabase Authentication
      const client = await getSupabaseClient();
      const { error: deleteAuthError } =
        await client.auth.admin.deleteUser(uid);

      if (deleteAuthError) {
        logger.error("Failed to delete user from Supabase Auth", {
          uid,
          error: deleteAuthError.message,
        });
        throw new Error(
          `Failed to delete user from Auth: ${deleteAuthError.message}`,
        );
      }

      // Delete user data from database using Prisma
      await prisma.user.delete({
        where: { id: uid },
      });

      logger.info("User deleted successfully", { uid });
    } catch (error) {
      logger.error("Failed to delete user", { error });
      throw error;
    }
  }

  /**
   * Set custom claims for Supabase user (for role-based access control)
   */
  static async setCustomClaims(
    uid: string,
    claims: {
      role?: string;
      plan?: string;
      [key: string]: any;
    },
  ): Promise<void> {
    try {
      // Supabase doesn't have custom claims like supabase, so we'll store this in the user metadata
      const client = await getSupabaseAdminClient();

      if (!client) {
        throw new Error(
          "Supabase Admin Client not available (Service Role Key missing)",
        );
      }

      const { error } = await client.auth.admin.updateUserById(uid, {
        user_metadata: claims,
      });

      if (error) {
        logger.error("Failed to set custom claims", { uid, error });
        throw error;
      }

      logger.info("Custom claims set for Supabase user", { uid, claims });
    } catch (error) {
      logger.error("Failed to set custom claims", { uid, error });
      throw error;
    }
  }

  /**
   * Get custom claims for a Supabase user
   */
  static async getCustomClaims(
    uid: string,
  ): Promise<Record<string, any> | null> {
    try {
      const client = await getSupabaseClient();
      const {
        data: { user },
        error,
      } = await client.auth.admin.getUserById(uid);

      if (error) {
        logger.error("Failed to get user", { uid, error });
        return null;
      }

      return user?.user_metadata || null;
    } catch (error) {
      logger.error("Failed to get custom claims", { uid, error });
      return null;
    }
  }

  /**
   * Generate password reset link using Supabase
   */
  static async generatePasswordResetLink(email: string): Promise<string> {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${
          (await SecretsService.getSecret("APP_URL")) || "http://localhost:3000"
        }/reset-password`,
      });

      if (error) {
        logger.error("Failed to generate password reset link", {
          email,
          error,
        });
        throw error;
      }

      // Supabase doesn't return the actual link, it sends it via email
      // Return a generic message or URL where the user can check their email
      return "Password reset email sent. Please check your inbox.";
    } catch (error) {
      logger.error("Failed to generate password reset link", { email, error });
      throw error;
    }
  }

  /**
   * Generate email verification link using Supabase
   */
  static async generateEmailVerificationLink(email: string): Promise<string> {
    try {
      // Supabase automatically sends verification emails on signup
      // For existing users, we can resend the verification
      const client = await getSupabaseClient();
      const { error } = await client.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${
            (await SecretsService.getSecret("APP_URL")) ||
            "http://localhost:3000"
          }/verify-email`,
        },
      });

      if (error) {
        logger.error("Failed to generate email verification link", {
          email,
          error,
        });
        throw error;
      }

      return "Verification email sent. Please check your inbox.";
    } catch (error) {
      logger.error("Failed to generate email verification link", {
        email,
        error,
      });
      throw error;
    }
  }
}
