import { AuthService } from "../../services/hybridAuthService";
import { OTPService } from "../../services/otpService";
import { SubscriptionService } from "../../services/subscriptionService";
import { EmailService } from "../../services/emailService";
import { getSupabaseAdminClient } from "../../lib/supabase/client";
import logger from "../../monitoring/logger";
import { Request, Response } from "express";
import axios from "axios";

// Hybrid signup route - uses Supabase Auth for authentication and Supabase for user data
export async function POST(req: Request, res: Response) {
  try {
    const {
      email,
      password,
      full_name,
      phone_number,
      otp_method,
      user_type,
      field_of_study,
      selected_plan,
    } = req.body as {
      email: string;
      password: string;
      full_name: string;
      phone_number: string;
      otp_method: string;
      user_type: string;
      field_of_study: string;
      selected_plan: string;
    };

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const sanitizedEmail = email.trim();

    // Format phone number to E.164 format if it's a phone signup
    let formattedPhoneNumber = phone_number;
    if (otp_method === "sms" && phone_number) {
      // Remove all non-digit characters
      const cleanNumber = phone_number.replace(/\D/g, "");

      // If the number doesn't start with + and is 10 digits, assume it's US/Canada
      if (!phone_number.startsWith("+") && cleanNumber.length === 10) {
        formattedPhoneNumber = `+1${cleanNumber}`;
      }
      // If the number doesn't start with + but has country code, add the +
      else if (!phone_number.startsWith("+") && cleanNumber.length > 10) {
        formattedPhoneNumber = `+${cleanNumber}`;
      }
      // If it already starts with +, keep as is
      else if (phone_number.startsWith("+")) {
        formattedPhoneNumber = phone_number;
      }
    }

    logger.info("Hybrid signup request received:", {
      email: sanitizedEmail,
      full_name,
      phone_number: formattedPhoneNumber,
      otp_method,
      user_type,
      field_of_study,
      selected_plan,
    });

    // Create user using hybrid auth service
    let supabaseUser, dbUser;
    try {
      const result = await AuthService.createUser({
        email: sanitizedEmail,
        password,
        fullName: full_name,
        phoneNumber: formattedPhoneNumber,
        otpMethod: otp_method,
      });
      supabaseUser = result.supabaseUser;
      dbUser = result.dbUser;
    } catch (createUserError: any) {
      logger.error(
        "Failed to create user in hybrid auth service:",
        createUserError,
      );
      // If user already exists, return 409 Conflict status
      if (createUserError.code === "USER_EXISTS" || createUserError.message?.includes("User already registered")) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists. Please log in instead.",
          code: "USER_EXISTS",
        });
      }
      // If user creation fails, we should not proceed with the signup flow
      // Return an error response to prevent the frontend from continuing
      return res.status(500).json({
        success: false,
        message: createUserError.message || "Failed to create user account",
      });
    }

    // Set custom claims for role-based access
    await AuthService.setCustomClaims(supabaseUser.id, {
      role: user_type || "user",
      plan: selected_plan || "free",
    });

    // Create subscription if a plan was selected
    let subscriptionCreated = false;
    if (selected_plan) {
      try {
        const subscription = await SubscriptionService.syncSubscription({
          userId: supabaseUser.id,
          planId: selected_plan,
          status: "active",
          currentPeriodEnd:
            selected_plan !== "free"
              ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14-day trial
              : undefined,
        });
        logger.info("Subscription created/updated:", subscription);
        subscriptionCreated = true;
      } catch (subscriptionError) {
        logger.error("Error creating subscription:", subscriptionError);
        // If subscription creation fails, we should not proceed with the signup flow
        // Delete the Supabase Auth user and database user since we couldn't create the subscription
        try {
          const adminClient = await getSupabaseAdminClient();
          if (adminClient) {
            await adminClient.auth.admin.deleteUser(supabaseUser.id);
            logger.info(
              "Cleaned up Supabase Auth user after subscription failure",
              {
                userId: supabaseUser.id,
              },
            );
          }
          // Also delete the database user (delete related records first to avoid FK constraint)
          const { prisma } = await import("../../lib/prisma");
          // Delete subscription first if it exists
          await prisma.subscription.deleteMany({
            where: { user_id: supabaseUser.id },
          });
          // Delete OTPCode if it exists
          await prisma.oTPCode.deleteMany({
            where: { user_id: supabaseUser.id },
          });
          await prisma.user.delete({
            where: { id: supabaseUser.id },
          });
          logger.info("Cleaned up database user after subscription failure", {
            userId: supabaseUser.id,
          });
        } catch (deleteError) {
          logger.error("Failed to cleanup user after subscription error", {
            error:
              deleteError instanceof Error
                ? deleteError.message
                : String(deleteError),
            userId: supabaseUser.id,
          });
        }
        return res.status(500).json({
          success: false,
          message: "Failed to create subscription. Please try again.",
        });
      }
    }

    // Check if we have a valid database user before proceeding
    if (!dbUser) {
      // If we don't have a valid database user, clean up the Supabase Auth user
      try {
        const adminClient = await getSupabaseAdminClient();
        if (adminClient) {
          await adminClient.auth.admin.deleteUser(supabaseUser.id);
          logger.info(
            "Cleaned up Supabase Auth user due to missing database user",
            {
              userId: supabaseUser.id,
            },
          );
        }
      } catch (deleteError) {
        logger.error(
          "Failed to cleanup Supabase Auth user due to missing database user",
          {
            error:
              deleteError instanceof Error
                ? deleteError.message
                : String(deleteError),
            userId: supabaseUser.id,
          },
        );
      }
      return res.status(500).json({
        success: false,
        message: "Failed to create user account. Please try again.",
      });
    }

    // For both email and SMS, send OTP after signup
    let otpSent = false;

    // Send OTP using our custom service for both email and SMS
    logger.info("Sending OTP for user:", supabaseUser.id);
    try {
      otpSent = await OTPService.sendOTP(
        supabaseUser.id,
        email || "",
        formattedPhoneNumber || "", // Use the formatted phone number
        otp_method,
        full_name,
      );
      logger.info("OTP send result:", otpSent);

      // If OTP sending fails, we should not proceed with the signup
      if (!otpSent) {
        // Delete the Supabase Auth user and database user since we couldn't send the OTP
        try {
          const adminClient = await getSupabaseAdminClient();
          if (adminClient) {
            await adminClient.auth.admin.deleteUser(supabaseUser.id);
            logger.info("Cleaned up Supabase Auth user after OTP failure", {
              userId: supabaseUser.id,
            });
          }
          // Also delete the database user (delete related records first to avoid FK constraint)
          const { prisma } = await import("../../lib/prisma");
          // Delete subscription first if it exists
          await prisma.subscription.deleteMany({
            where: { user_id: supabaseUser.id },
          });
          // Delete OTPCode if it exists
          await prisma.oTPCode.deleteMany({
            where: { user_id: supabaseUser.id },
          });
          await prisma.user.delete({
            where: { id: supabaseUser.id },
          });
          logger.info("Cleaned up database user after OTP failure", {
            userId: supabaseUser.id,
          });
        } catch (deleteError) {
          logger.error("Failed to cleanup user after OTP error", {
            error:
              deleteError instanceof Error
                ? deleteError.message
                : String(deleteError),
            userId: supabaseUser.id,
          });
        }

        // Return an error response
        return res.status(500).json({
          success: false,
          message: "Failed to send verification code. Please try again.",
        });
      }
    } catch (otpError: any) {
      logger.error("Error sending OTP:", {
        error: otpError.message,
        userId: supabaseUser.id,
        email,
        phone_number,
        otp_method,
      });
      // Delete the Supabase Auth user and database user since we couldn't send the OTP
      try {
        const adminClient = await getSupabaseAdminClient();
        if (adminClient) {
          await adminClient.auth.admin.deleteUser(supabaseUser.id);
          logger.info("Cleaned up Supabase Auth user after OTP failure", {
            userId: supabaseUser.id,
          });
        }
        // Also delete the database user (delete related records first to avoid FK constraint)
        const { prisma } = await import("../../lib/prisma");
        // Delete subscription first if it exists
        await prisma.subscription.deleteMany({
          where: { user_id: supabaseUser.id },
        });
        // Delete OTPCode if it exists
        await prisma.oTPCode.deleteMany({
          where: { user_id: supabaseUser.id },
        });
        await prisma.user.delete({
          where: { id: supabaseUser.id },
        });
        logger.info("Cleaned up database user after OTP failure", {
          userId: supabaseUser.id,
        });
      } catch (deleteError) {
        logger.error("Failed to cleanup user after OTP error", {
          error:
            deleteError instanceof Error
              ? deleteError.message
              : String(deleteError),
          userId: supabaseUser.id,
        });
      }
      // Return an error response
      return res.status(500).json({
        success: false,
        message: `Failed to send verification code: ${otpError.message}`,
      });
    }

    // Return success response with proper flags for frontend
    const userData = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      displayName: (supabaseUser.user_metadata as any)?.full_name || null,
      phoneNumber: (supabaseUser.user_metadata as any)?.phone_number || null,
    };

    return res.status(200).json({
      success: true,
      message:
        "User created successfully. Please check your email for the verification code.",
      user: userData,
      otpSent: otpSent,
      needsVerification: true,
    });
  } catch (error: any) {
    logger.error("Hybrid signup error:", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create user",
    });
  }
}

// Function to send Discord webhook notification
async function sendDiscordWebhookNotification(
  userId: string,
  surveyData: any,
  selectedPlan: string,
) {
  try {
    const discordWebhookUrl = process.env.SIGNUP_SURVEY_DISCORD_WEBHOOK_URL;
    
    if (!discordWebhookUrl) {
      // Silently skip if no webhook configured
      return;
    }

    // Format the survey data for Discord
    const embed = {
      title: "New User Survey Submission",
      color: 0x00ff00, // Green color
      fields: [
        {
          name: "User ID",
          value: userId,
          inline: true,
        },
        {
          name: "Selected Plan",
          value: selectedPlan || "None",
          inline: true,
        },
        {
          name: "User Role",
          value: surveyData.userRole || "Not provided",
          inline: true,
        },
        {
          name: "Heard About Platform",
          value: surveyData.heardAboutPlatform || "Not provided",
          inline: true,
        },
        {
          name: "User Goal",
          value: surveyData.userGoal || "Not provided",
          inline: false,
        },
        {
          name: "Main Job",
          value: surveyData.mainJob || "Not provided",
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await axios.post(discordWebhookUrl, {
      embeds: [embed],
    });

    logger.info("Discord webhook notification sent successfully", { userId });
  } catch (error) {
    logger.error("Failed to send Discord webhook notification", {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    // Don't throw error as this is a non-critical notification
  }
}

// Hybrid complete signup route - updates user profile with survey data and creates subscription
export async function POST_COMPLETE_SIGNUP(req: Request, res: Response) {
  try {
    const { userId, surveyData, selectedPlan } = req.body as {
      userId: string;
      surveyData: {
        userRole: string;
        heardAboutPlatform: string;
        userGoal: string;
        mainJob: string;
        userType?: string;
        fieldOfStudy?: string;
      };
      selectedPlan: string;
    };

    logger.info("Complete signup request received:", {
      userId,
      surveyData,
      selectedPlan,
    });

    // Validate input
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Get Supabase admin client
    const adminClient = await getSupabaseAdminClient();
    if (!adminClient) {
      logger.error("Supabase admin client not initialized");
      throw new Error("Supabase service not properly configured");
    }

    // Update user profile with survey data in Supabase Auth
    const updateData: any = {
      data: {
        user_role: surveyData.userRole,
        heard_about_platform: surveyData.heardAboutPlatform,
        user_goal: surveyData.userGoal,
        main_job: surveyData.mainJob,
        user_type: surveyData.userType,
        field_of_study: surveyData.fieldOfStudy,
        survey_completed: true,
      },
    };

    const { data: updatedUser, error: updateError } =
      await adminClient.auth.admin.updateUserById(userId, updateData);

    if (updateError) {
      logger.error("Failed to update user profile:", updateError);
      return res.status(500).json({
        success: false,
        message: "Failed to update user profile",
      });
    }

    logger.info("User profile updated successfully:", updatedUser.user?.id);

    // Update user in database with survey data
    try {
      const { prisma } = await import("../../lib/prisma");

      await prisma.user.update({
        where: { id: userId },
        data: {
          user_role: surveyData.userRole,
          heard_about_platform: surveyData.heardAboutPlatform,
          user_goal: surveyData.userGoal,
          main_job: surveyData.mainJob,
          user_type: surveyData.userType,
          field_of_study: surveyData.fieldOfStudy,
          survey_completed: true,
          updated_at: new Date(),
        },
      });

      logger.info("User database record updated successfully:", userId);
    } catch (dbError: any) {
      logger.error("Failed to update user in database:", dbError);
      // Don't fail the whole request if database update fails, as Supabase Auth update succeeded
    }

    // Create subscription if a plan was selected
    let subscriptionCreated = false;
    if (selectedPlan) {
      try {
        const { SubscriptionService } =
          await import("../../services/subscriptionService");

        const subscription = await SubscriptionService.syncSubscription({
          userId: userId,
          planId: selectedPlan,
          status: "active",
          currentPeriodEnd:
            selectedPlan !== "free"
              ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14-day trial
              : undefined,
        });

        logger.info("Subscription created/updated:", subscription);
        subscriptionCreated = true;
      } catch (subscriptionError: any) {
        logger.error("Error creating subscription:", subscriptionError);
        // If subscription creation fails, return an error
        return res.status(500).json({
          success: false,
          message: "Failed to create subscription. Please try again.",
        });
      }
    } else {
      // If no plan was selected, consider it successful (free plan)
      subscriptionCreated = true;
    }

    // If we couldn't create a subscription, return an error
    if (selectedPlan && !subscriptionCreated) {
      return res.status(500).json({
        success: false,
        message: "Failed to create subscription. Please try again.",
      });
    }

    // Send Discord webhook notification
    sendDiscordWebhookNotification(userId, surveyData, selectedPlan);

    // Get user details to send welcome email
    try {
      const { data: userData, error: userError } =
        await adminClient.auth.admin.getUserById(userId);

      if (!userError && userData?.user) {
        const user = userData.user;
        const fullName =
          user.user_metadata?.full_name || user.email?.split("@")[0] || "there";
        const email = user.email;

        if (email) {
          // Send welcome email asynchronously (don't wait for it to complete)
          EmailService.sendWelcomeEmail(email, fullName).catch((error) => {
            logger.error("Failed to send welcome email:", {
              error: error.message,
              userId,
              email,
            });
          });
        }
      }
    } catch (userFetchError: any) {
      logger.error("Failed to fetch user for welcome email:", {
        error: userFetchError.message,
        userId,
      });
      // Don't fail the entire signup process if welcome email fails
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Signup completed successfully",
    });
  } catch (error: any) {
    logger.error("Complete signup error:", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to complete signup",
    });
  }
}

// Hybrid signin route - verifies ID token and returns user data
export async function PUT_SIGNIN(req: Request, res: Response) {
  try {
    const { idToken } = req.body as {
      idToken: string;
    };

    logger.info("Hybrid signin request received");

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "ID token is required",
      });
    }

    // Verify the ID token and get user data
    const { supabaseUser, dbUser } =
      await AuthService.verifyTokenAndGetUser(idToken);

    // Prepare user data to return to frontend
    const userData = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      full_name:
        dbUser?.full_name ||
        (supabaseUser.user_metadata as any)?.full_name ||
        null,
      phone_number:
        dbUser?.phone_number ||
        (supabaseUser.user_metadata as any)?.phone_number ||
        null,
      user_type:
        dbUser?.user_type ||
        (supabaseUser.user_metadata as any)?.user_type ||
        null,
      field_of_study:
        dbUser?.field_of_study ||
        (supabaseUser.user_metadata as any)?.field_of_study ||
        null,
      survey_completed: dbUser?.survey_completed || false,
      // For hybrid auth, we use our own verification system (OTP) instead of Supabase email confirmation
      // Users are considered verified once they complete signup and OTP verification
      email_verified: true, // In hybrid system, successful signin means user is verified
    };
    logger.info("Hybrid signin successful", { userId: supabaseUser.id });

    return res.status(200).json({
      success: true,
      message: "Signin successful",
      user: supabaseUser,
      userData: userData,
    });
  } catch (error: any) {
    logger.error("Hybrid signin error:", {
      error: error.message,
      stack: error.stack,
    });

    // Check if it's an email not confirmed error
    if (
      error.message &&
      error.message.toLowerCase().includes("email not confirmed")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email not confirmed. Please verify your email before signing in.",
        code: "EMAIL_NOT_CONFIRMED",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to sign in",
    });
  }
}

// Check email confirmation status using Supabase Admin
export async function POST_CHECK_EMAIL(req: Request, res: Response) {
  try {
    const { email } = req.body as { email: string };

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const adminClient = await getSupabaseAdminClient();
    if (!adminClient) {
      logger.error("Supabase admin client not initialized");
      return res
        .status(500)
        .json({ success: false, message: "Service not configured" });
    }

    // Import Prisma to check database
    const { prisma } = await import("../../lib/prisma");

    // Try to find user in Prisma database first
    let dbUser;
    try {
      dbUser = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          survey_completed: true,
        },
      });
    } catch (dbErr: any) {
      // If not found in app DB, user doesn't exist
      logger.warn("User not found in database for email check", {
        email,
        dbErr: dbErr.message,
      });
      return res
        .status(200)
        .json({ success: true, exists: false, confirmed: false });
    }

    if (!dbUser) {
      // User not found in database
      return res
        .status(200)
        .json({ success: true, exists: false, confirmed: false });
    }

    // Fetch user from Supabase Auth by id
    const { data: adminUser, error: adminErr } =
      await adminClient.auth.admin.getUserById(dbUser.id);
    if (adminErr) {
      logger.error("Failed to fetch user from Supabase Auth", {
        email,
        adminErr: adminErr.message,
      });
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch auth user" });
    }

    // User is fully confirmed only if:
    // 1. Email is confirmed in Supabase Auth (email_confirmed_at exists)
    // 2. Survey is completed in database (survey_completed is true)
    const emailConfirmed = !!adminUser.user?.email_confirmed_at;
    const surveyCompleted = !!dbUser.survey_completed;
    const fullyConfirmed = emailConfirmed && surveyCompleted;

    logger.info("Email check result:", {
      email,
      exists: true,
      emailConfirmed,
      surveyCompleted,
      confirmed: fullyConfirmed,
    });

    return res.status(200).json({
      success: true,
      exists: true,
      confirmed: fullyConfirmed, // Only true if BOTH email confirmed AND survey completed
      emailConfirmed,
      surveyCompleted,
    });
  } catch (error: any) {
    logger.error("Email confirmation check failed", { error: error.message });
    return res
      .status(500)
      .json({ success: false, message: error.message || "Email check failed" });
  }
}

// OAuth signup completion route - registers OAuth user in database and sends OTP
export async function POST_OAUTH_SIGNUP(req: Request, res: Response) {
  try {
    const { id, email, fullName, provider } = req.body as {
      id: string;
      email: string;
      fullName: string;
      provider: string;
    };

    logger.info("OAuth signup request received:", { id, email, provider });

    if (!id || !email) {
      return res.status(400).json({
        success: false,
        message: "User ID and email are required",
      });
    }

    // Import services
    const { prisma } = await import("../../lib/prisma");

    // Check if user already exists in database
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    let dbUser;

    if (existingUser) {
      // User already registered, check if survey completed
      if (existingUser.survey_completed) {
        logger.info("OAuth user already fully registered", { id });
        return res.json({
          success: true,
          message: "User already registered",
          alreadyRegistered: true,
        });
      }
      // User exists but hasn't completed survey, continue flow
      logger.info("OAuth user exists, continuing signup flow", { id });
      dbUser = existingUser;
    } else {
      // Create OAuth user in database
      const defaultPlan = "free";
      const storageLimit = 0.1; // 100MB for free plan

      dbUser = await prisma.user.create({
        data: {
          id: id,
          email: email,
          full_name: fullName || null,
          phone_number: null, // Will be collected if needed
          otp_method: "email", // OAuth users use email for OTP
          user_type: null, // Set during survey
          field_of_study: null, // Set during survey
          selected_plan: defaultPlan,
          storage_limit: storageLimit,
        },
      });

      logger.info("OAuth user created in database:", {
        id: dbUser.id,
        email: dbUser.email,
      });

      // Create subscription record
      try {
        const subscription = await SubscriptionService.syncSubscription({
          userId: id,
          planId: defaultPlan,
          status: "active",
          currentPeriodEnd: undefined, // No expiration for free plan
        });
        logger.info("Subscription created for OAuth user:", {
          userId: id,
          plan: defaultPlan,
        });
      } catch (subscriptionError: any) {
        logger.error("Error creating subscription:", subscriptionError);
        // Don't fail signup if subscription creation fails
      }
    }

    // Send OTP to email for verification
    try {
      logger.info("Sending OTP for OAuth user:", id);
      const otpSent = await OTPService.sendOTP(
        id,
        email,
        "", // No phone number for OAuth
        "email",
        fullName || email,
      );

      if (!otpSent) {
        logger.warn("OTP was not sent successfully for OAuth user", {
          userId: id,
          email,
        });
        return res.status(500).json({
          success: false,
          message: "Failed to send verification code",
        });
      }

      logger.info("OTP sent successfully to OAuth user");
    } catch (otpError: any) {
      logger.error("Error sending OTP:", otpError);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification code",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "OAuth user registered successfully. Please check your email for the verification code.",
      user: dbUser,
      otpSent: true,
      needsVerification: true,
    });
  } catch (error: any) {
    logger.error("OAuth signup completion failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: error.message || "OAuth signup completion failed",
    });
  }
}

// Get current user data - returns user info for authenticated requests
export async function GET_ME(req: Request, res: Response) {
  try {
    // Get user from request (set by auth middleware)
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    logger.info("Get user data request", { userId });

    // Get user from database
    const { prisma } = await import("../../lib/prisma");
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get Supabase user data for additional info
    const adminClient = await getSupabaseAdminClient();
    let supabaseUser = null;
    if (adminClient) {
      const { data } = await adminClient.auth.admin.getUserById(userId);
      supabaseUser = data?.user || null;
    }

    const userData = {
      id: dbUser.id,
      email: dbUser.email,
      full_name: dbUser.full_name,
      phone_number: dbUser.phone_number,
      user_type: dbUser.user_type,
      field_of_study: dbUser.field_of_study,
      survey_completed: dbUser.survey_completed,
      selected_plan: dbUser.selected_plan,
      storage_limit: dbUser.storage_limit,
      email_verified: supabaseUser?.email_confirmed_at ? true : false,
    };

    return res.status(200).json({
      success: true,
      user: userData,
    });
  } catch (error: any) {
    logger.error("Get user data error:", {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get user data",
    });
  }
}
