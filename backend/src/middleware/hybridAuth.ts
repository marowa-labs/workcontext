import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";
import { AuthService } from "../hybrid/supabase/auth-service";

export interface HybridAuthResult {
  userId: string;
  type: "jwt" | "hybrid_server";
}

/**
 * Authenticate requests using either JWT tokens or hybrid server auth
 * @param request The incoming request
 * @returns Authentication result or null if authentication failed
 */
export async function authenticateHybrid(
  request: Request & { user?: { id: string } }
): Promise<HybridAuthResult | null> {
  try {
    // Log the incoming request for debugging
    logger.info("authenticateHybrid called", {
      url: request.url,
      method: request.method,
      // Note: Headers might not be available in all environments
    });

    // First, check if we're in the hybrid server context where user is already attached
    if (request.user?.id) {
      logger.debug("User already attached to request", {
        userId: request.user.id,
      });
      return {
        userId: request.user.id,
        type: "hybrid_server",
      };
    }

    // Get the authorization header
    // Handle cases where headers might not be available (e.g., mock requests)
    let authHeader: string | null = null;

    if (request.headers && typeof request.headers.get === "function") {
      // This is for Edge functions where headers is a Headers object
      authHeader = request.headers.get("authorization");
    } else if (request.headers && typeof request.headers === "object") {
      // This is for Express where headers is a plain object
      authHeader =
        (request.headers as any)["authorization"] ||
        (request.headers as any)["Authorization"] ||
        null;
    }

    logger.debug("Authorization header check", {
      hasHeader: !!authHeader,
      headerValue: authHeader ? authHeader.substring(0, 20) + "..." : "none",
    });

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("No valid authorization header found", {
        authHeader: authHeader ? "Present but invalid format" : "Missing",
        url: request.url,
      });
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    logger.debug("Extracted token for authentication", {
      tokenLength: token.length,
      tokenStart: token.substring(0, 10) + "...",
    });

    // Authenticate as a JWT token
    try {
      logger.debug("Attempting JWT authentication");

      // Use the AuthService's supabase client which should be properly configured
      const client = await AuthService.supabase;
      const { data, error } = await client.auth.getUser(token);

      if (!error && data?.user) {
        // Successfully authenticated with JWT
        logger.debug("JWT authentication successful", { userId: data.user.id });
        return {
          userId: data.user.id,
          type: "jwt",
        };
      } else {
        logger.warn("JWT authentication failed", {
          error: error?.message,
          hasData: !!data,
          hasUser: !!data?.user,
          url: request.url,
        });

        // Log more detailed error information
        if (error) {
          logger.error("JWT authentication error details", {
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
          });
        }
      }
    } catch (jwtError) {
      // JWT authentication failed
      logger.warn("JWT authentication error", {
        error: jwtError instanceof Error ? jwtError.message : String(jwtError),
        url: request.url,
      });

      // Log detailed error information
      if (jwtError instanceof Error) {
        logger.error("JWT authentication exception", {
          errorName: jwtError.name,
          errorMessage: jwtError.message,
          errorStack: jwtError.stack,
        });
      }
    }

    // Authentication failed
    logger.warn("Authentication failed", {
      url: request.url,
    });
    return null;
  } catch (error) {
    logger.error("Hybrid authentication error:", error);
    return null;
  }
}

/**
 * Middleware to wrap API handlers with hybrid authentication
 * Supports JWT tokens and hybrid server authentication
 * @param handler The API handler function
 * @returns Wrapped handler function
 */
export function withHybridAuth(handler: Function) {
  return async function (request: Request) {
    logger.info("withHybridAuth called", {
      url: request.url,
      method: request.method,
    });

    const authResult = await authenticateHybrid(
      request as Request & { user?: { id: string } }
    );

    if (!authResult) {
      logger.warn("Authentication failed in withHybridAuth", {
        url: request.url,
        method: request.method,
      });

      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Invalid or missing authentication token",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Add auth result to request context
    const requestWithContext = {
      ...request,
      auth: authResult,
    };

    return handler(requestWithContext);
  };
}
