import { OTPService } from "../../services/otpService";
import { getSupabaseAdminClient } from "../../lib/supabase/client";
import logger from "../../monitoring/logger";
import { Request, Response } from "express";

// Verify OTP route - verifies OTP for user
export async function POST(req: Request, res: Response) {
  try {
    const { userId, otp } = req.body as {
      userId: string;
      otp: string;
    };

    logger.info("Verify OTP request received:", {
      userId,
      otp: otp ? "***" : "missing", // Don't log the actual OTP for security
    });

    // Validate input
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    // Verify OTP using our custom service
    logger.info("Verifying OTP for user:", userId);

    try {
      const isValid = await OTPService.verifyOTP(userId, otp);

      if (isValid) {
        logger.info("OTP verified successfully", { userId });

        // If verification is successful, update the user's status
        try {
          const adminClient = await getSupabaseAdminClient();
          if (adminClient) {
            // Update user metadata to indicate email/phone is verified
            const { data: user, error: userError } =
              await adminClient.auth.admin.getUserById(userId);

            if (!userError && user?.user) {
              const updates: any = {
                email_verified: true,
              };

              // Update user in Supabase Auth
              const { error: updateError } =
                await adminClient.auth.admin.updateUserById(userId, {
                  user_metadata: {
                    ...user.user.user_metadata,
                    ...updates,
                  },
                });

              if (updateError) {
                logger.warn(
                  "Failed to update user metadata after OTP verification",
                  {
                    userId,
                    error: updateError.message,
                  }
                );
              } else {
                logger.info("User metadata updated after OTP verification", {
                  userId,
                });
              }
            }
          }
        } catch (updateError: any) {
          logger.warn("Error updating user after OTP verification", {
            userId,
            error: updateError.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "OTP verified successfully",
        });
      } else {
        logger.warn("Invalid or expired OTP", { userId });
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification code",
        });
      }
    } catch (otpError: any) {
      logger.error("Error verifying OTP:", {
        error: otpError.message,
        userId,
      });
      return res.status(500).json({
        success: false,
        message: `Failed to verify code: ${otpError.message}`,
      });
    }
  } catch (error: any) {
    logger.error("Verify OTP error:", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify OTP",
    });
  }
}
