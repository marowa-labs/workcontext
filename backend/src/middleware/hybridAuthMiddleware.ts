import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from "express";
import { authenticateExpressRequest } from "./auth";
import logger from "../monitoring/logger";

/**
 * Authentication middleware for Supabase Auth
 */
export async function authenticateHybridRequest(
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
): Promise<void> {
  try {
    console.log("Hybrid authentication middleware called", {
      url: req.url,
      method: req.method,
    });

    console.log("Checking authorization header in hybrid middleware");
    console.log("All headers:", req.headers);
    // Get the authorization header
    const authHeader = req.headers.authorization;
    console.log("Authorization header:", authHeader);
    let token: string | null = null;

    if (authHeader) {
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
        console.log("Extracted Bearer token");
      } else if (!authHeader.includes(" ")) {
        token = authHeader;
        console.log("Using raw token");
      }
    }
    console.log("Final token:", token);

    // Also check for token in query parameters as fallback
    if (!token && req.query && typeof req.query.token === "string") {
      token = req.query.token;
    }

    if (!token) {
      console.log("Hybrid authentication failed: Authorization token missing");
      console.log("Request headers:", req.headers);
      console.log("Request query:", req.query);
      res.status(401).json({
        success: false,
        message: "Authorization token missing",
        debug: {
          hasAuthHeader: !!req.headers.authorization,
          authHeader: req.headers.authorization
            ? req.headers.authorization.substring(0, 20) + "..."
            : null,
          hasQueryToken: !!(req.query && typeof req.query.token === "string"),
          queryToken:
            req.query && typeof req.query.token === "string"
              ? req.query.token.substring(0, 10) + "..."
              : null,
        },
      });
      return;
    }

    console.log("Token extracted for authentication", {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 10) + "...",
    });

    // Try Supabase authentication
    try {
      logger.debug("Attempting Supabase authentication");
      await authenticateExpressRequest(req, res, next);
      return;
    } catch (error) {
      logger.error("Supabase authentication failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // If authentication fails
    res.status(401).json({
      success: false,
      message: "Authentication failed. Invalid token.",
    });
  } catch (error) {
    logger.error("Authentication error", {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      message: "Authentication error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalHybridAuth(
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    let token: string | null = null;

    if (authHeader) {
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      } else if (!authHeader.includes(" ")) {
        token = authHeader;
      }
    }

    if (!token) {
      // No token - continue without authentication
      console.log(
        "Optional auth: No token provided, continuing without authentication"
      );
      next();
      return;
    }

    // Try to authenticate with Supabase
    try {
      console.log("Optional auth: Attempting Supabase authentication");
      await authenticateExpressRequest(req, res, next);
      return;
    } catch (error) {
      console.log(
        "Optional auth: Supabase authentication failed, continuing without authentication",
        error
      );
      // Silently continue without authentication
      next();
    }
  } catch (error) {
    console.log(
      "Optional auth: Error occurred, continuing without authentication",
      error
    );
    // Continue even if optional auth fails
    next();
  }
}
