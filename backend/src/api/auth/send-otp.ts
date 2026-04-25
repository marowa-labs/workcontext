import { OTPService } from "../../services/otpService";
import logger from "../../monitoring/logger";
import { Request, Response } from "express";

// Send OTP route - sends OTP to user's email or phone
export async function POST(req: Request, res: Response) {
  try {
    const { userId, method, email, fullName, phoneNumber } = req.body as {
      userId: string;
      method: string;
      email?: string;
      fullName?: string;
      phoneNumber?: string;
    };

    logger.info("Send OTP request received:", {
      userId,
      method,
      email,
      fullName,
      phoneNumber,
    });

    // Validate input
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!method) {
      return res.status(400).json({
        success: false,
        message: "OTP method is required",
      });
    }

    // Get user data from database
    let userPhoneNumber = phoneNumber || "";
    let userEmail = email || "";
    let userFullName = fullName || "";

    try {
      // Import Prisma client
      const { prisma } = await import("../../lib/prisma");

      // Get user data from database
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { phone_number: true, email: true, full_name: true },
      });

      if (dbUser) {
        userPhoneNumber = userPhoneNumber || dbUser.phone_number || "";
        userEmail = userEmail || dbUser.email || "";
        userFullName = userFullName || dbUser.full_name || "";
      } else {
        // If user not found in database, try to get from request body
        logger.warn("User not found in database, using data from request", {
          userId,
        });
        userPhoneNumber = userPhoneNumber || "";
        userEmail = userEmail || email || "";
        userFullName = userFullName || fullName || "";
      }
    } catch (getUserError: any) {
      logger.error("Error getting user data from database:", {
        error: getUserError.message,
        userId,
      });
      // If we can't get user data from database, use data from request
      userPhoneNumber = userPhoneNumber || phoneNumber || "";
      userEmail = userEmail || email || "";
      userFullName = userFullName || fullName || "";
    }

    // Send OTP using our custom service
    logger.info("Sending OTP for user:", {
      userId,
      method,
      email: userEmail,
      phone: userPhoneNumber,
      fullName: userFullName,
    });

    try {
      const success = await OTPService.sendOTP(
        userId,
        userEmail,
        userPhoneNumber,
        method,
        userFullName
      );

      if (success) {
        logger.info("OTP sent successfully", { userId, method });
        return res.status(200).json({
          success: true,
          message:
            method === "email"
              ? "OTP sent to your email address"
              : "OTP sent to your phone number",
        });
      } else {
        logger.error("Failed to send OTP", { userId, method });
        return res.status(500).json({
          success: false,
          message: "Failed to send verification code. Please try again.",
        });
      }
    } catch (otpError: any) {
      logger.error("Error sending OTP:", {
        error: otpError.message,
        userId,
        method,
        email: userEmail,
        phone: userPhoneNumber,
      });
      return res.status(500).json({
        success: false,
        message: `Failed to send verification code: ${otpError.message}`,
      });
    }
  } catch (error: any) {
    logger.error("Send OTP error:", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP",
    });
  }
}
