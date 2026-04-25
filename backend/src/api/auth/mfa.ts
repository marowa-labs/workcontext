import { getSupabaseClient } from "../../lib/supabase/client";
import logger from "../../monitoring/logger";
import { Request, Response } from "express";

// Enroll a new MFA factor
export async function POST_ENROLL(req: Request, res: Response) {
  try {
    const { factorType } = req.body as {
      factorType: string;
    };

    // Get user from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message:
          "Missing or invalid authorization header, {factorType: " +
          factorType +
          "}",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify the token and get user
    const client = await getSupabaseClient();
    if (!client) {
      return res.status(401).json({
        success: false,
        message: "Supabase client not initialized",
      });
    }
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Enroll a new TOTP factor
    const enrollClient = await getSupabaseClient();
    if (!enrollClient) {
      return res.status(400).json({
        success: false,
        message: "Supabase client not initialized",
      });
    }
    const { data, error } = await enrollClient.auth.mfa.enroll({
      factorType: "totp",
    });

    if (error) {
      logger.error("MFA enrollment failed", {
        userId: user.id,
        error: error.message,
      });
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    logger.info("MFA factor enrolled", {
      userId: user.id,
      factorId: data.id,
    });

    return res.json({
      success: true,
      id: data.id,
      totp: {
        secret: data.totp?.secret,
        qr_code: data.totp?.qr_code,
      },
      friendlyName: data.friendly_name,
    });
  } catch (error: any) {
    logger.error("MFA enrollment error", { error: error.message });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to enroll MFA factor",
    });
  }
}

// Verify an MFA factor
export async function POST_VERIFY(req: Request, res: Response) {
  try {
    const { factorId, code, challengeId } = req.body as {
      factorId: string;
      code: string;
      challengeId: string;
    };

    // Get user from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify the token and get user
    const verifyClient = await getSupabaseClient();
    if (!verifyClient) {
      return res.status(401).json({
        success: false,
        message: "Supabase client not initialized",
      });
    }
    const {
      data: { user },
      error: userError,
    } = await verifyClient.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Verify the TOTP factor using challengeId
    const verifyMfaClient = await getSupabaseClient();
    if (!verifyMfaClient) {
      return res.status(400).json({
        success: false,
        message: "Supabase client not initialized",
      });
    }
    const { data, error } = await verifyMfaClient.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (error) {
      logger.error("MFA verification failed", {
        userId: user.id,
        factorId,
        challengeId,
        error: error.message,
      });
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    logger.info("MFA factor verified", {
      userId: user.id,
      factorId,
      challengeId,
    });

    // Return the response data directly since we're not sure about the exact property names
    return res.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    logger.error("MFA verification error", { error: error.message });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify MFA factor",
    });
  }
}

// Unenroll an MFA factor
export async function POST_UNENROLL(req: Request, res: Response) {
  try {
    const { factorId } = req.body as {
      factorId: string;
    };

    // Get user from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify the token and get user
    const unenrollVerifyClient = await getSupabaseClient();
    if (!unenrollVerifyClient) {
      return res.status(401).json({
        success: false,
        message: "Supabase client not initialized",
      });
    }
    const {
      data: { user },
      error: userError,
    } = await unenrollVerifyClient.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Unenroll the TOTP factor
    const unenrollClient = await getSupabaseClient();
    if (!unenrollClient) {
      return res.status(400).json({
        success: false,
        message: "Supabase client not initialized",
      });
    }
    const { error } = await unenrollClient.auth.mfa.unenroll({
      factorId,
    });

    if (error) {
      logger.error("MFA unenrollment failed", {
        userId: user.id,
        factorId,
        error: error.message,
      });
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    logger.info("MFA factor unenrolled", {
      userId: user.id,
      factorId,
    });

    return res.json({
      success: true,
      message: "MFA factor unenrolled successfully",
    });
  } catch (error: any) {
    logger.error("MFA unenrollment error", { error: error.message });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to unenroll MFA factor",
    });
  }
}

// List all MFA factors for a user
export async function GET_FACTORS(req: Request, res: Response) {
  try {
    // Get user from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify the token and get user
    const listVerifyClient = await getSupabaseClient();
    if (!listVerifyClient) {
      return res.status(401).json({
        success: false,
        message: "Supabase client not initialized",
      });
    }
    const {
      data: { user },
      error: userError,
    } = await listVerifyClient.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // List all factors
    const listClient = await getSupabaseClient();
    if (!listClient) {
      return res.status(400).json({
        success: false,
        message: "Supabase client not initialized",
      });
    }
    const { data, error } = await listClient.auth.mfa.listFactors();

    if (error) {
      logger.error("Failed to list MFA factors", {
        userId: user.id,
        error: error.message,
      });
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    logger.info("MFA factors retrieved", {
      userId: user.id,
      factorCount: data.all.length,
    });

    return res.json({
      success: true,
      factors: data.all,
    });
  } catch (error: any) {
    logger.error("MFA factors retrieval error", { error: error.message });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve MFA factors",
    });
  }
}

// Challenge an MFA factor (for login)
export async function POST_CHALLENGE(req: Request, res: Response) {
  try {
    const { factorId } = req.body as {
      factorId: string;
    };

    // Get user from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify the token and get user
    const challengeVerifyClient = await getSupabaseClient();
    if (!challengeVerifyClient) {
      return res.status(401).json({
        success: false,
        message: "Supabase client not initialized",
      });
    }
    const {
      data: { user },
      error: userError,
    } = await challengeVerifyClient.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Challenge the TOTP factor
    const challengeClient = await getSupabaseClient();
    if (!challengeClient) {
      return res.status(400).json({
        success: false,
        message: "Supabase client not initialized",
      });
    }
    const { data, error } = await challengeClient.auth.mfa.challenge({
      factorId,
    });

    if (error) {
      logger.error("MFA challenge failed", {
        userId: user.id,
        factorId,
        error: error.message,
      });
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    logger.info("MFA factor challenged", {
      userId: user.id,
      factorId,
      challengeId: data.id,
    });

    return res.json({
      success: true,
      id: data.id,
    });
  } catch (error: any) {
    logger.error("MFA challenge error", { error: error.message });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to challenge MFA factor",
    });
  }
}
