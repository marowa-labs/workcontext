import {
  getSupabaseClient,
  getSupabaseAdminClient,
} from "../lib/supabase/client";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from "express";
import logger from "../monitoring/logger";

export async function authenticateRequest(
  request: Request,
): Promise<{ user: any; session: any } | null> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log(
        "Authentication failed: Missing or invalid Authorization header",
      );
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log("Token extracted for authentication", {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 10) + "...",
      hasValidPrefix: token.startsWith("sb-") || token.includes("."), // Check if it looks like a JWT
    });

    // Verify the token with Supabase using admin client for server-side verification
    const adminClient = await getSupabaseAdminClient();

    let data, error;

    if (adminClient) {
      // Use admin client if available
      console.log("Using admin client for token verification");
      const result = await adminClient.auth.getUser(token);
      data = result.data;
      error = result.error;
    } else {
      // Fallback to regular client if admin client is not available
      console.log("Admin client not available, falling back to regular client");
      const supabaseClient = await getSupabaseClient();
      if (!supabaseClient) {
        console.log("Authentication failed: Supabase client not available");
        return null;
      }

      const result = await supabaseClient.auth.getUser(token);
      data = result.data;
      error = result.error;
    }

    // Log the raw response for debugging
    console.log("Supabase auth response:", {
      hasData: !!data,
      hasUser: !!data?.user,
      hasError: !!error,
      error: error?.message,
      errorCode: error?.code,
      userId: data?.user?.id,
    });

    if (error || !data?.user) {
      console.log("Authentication failed: Supabase verification failed", {
        error: error?.message,
        hasUserData: !!data?.user,
      });
      return null;
    }

    // For server-side authentication, we return the user data directly
    // Session management is typically handled client-side
    return {
      user: data.user,
      session: null, // Sessions are managed client-side
    };
  } catch (error: any) {
    console.error("Authentication error:", error);

    // Check if it's a timeout or connection error
    if (error.cause && error.cause.code === "UND_ERR_CONNECT_TIMEOUT") {
      console.warn("Connection timeout during authentication");
    }

    return null;
  }
}

// Express middleware version
export async function authenticateExpressRequest(
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction,
): Promise<void> {
  try {
    // Extract token from authorization header
    const authHeader = req.headers.authorization || "";
    let token: string | null = null;

    if (authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (authHeader && !authHeader.includes(" ")) {
      token = authHeader.trim();
    }

    if (!token && req.query && typeof req.query.token === "string") {
      token = req.query.token;
    }

    if (!token) {
      logger.warn("Authentication required: Token missing", { url: req.url });
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    try {
      const adminClient = await getSupabaseAdminClient();
      if (!adminClient) {
        throw new Error("Supabase admin client not initialized");
      }

      const { data, error } = await adminClient.auth.getUser(token);

      if (error || !data?.user) {
        logger.warn("Authentication failed: Invalid or expired token", {
          error: error?.message || "No user data returned",
          url: req.url,
        });
        res.status(401).json({
          success: false,
          message: "Invalid or expired token",
          error: error?.message || "No user data returned",
        });
        return;
      }

      // Attach user to request object
      (req as any).user = data.user;
      next();
    } catch (networkError: any) {
      logger.error("Authentication error:", networkError);
      res.status(500).json({
        success: false,
        message: "Authentication service unavailable",
        error:
          networkError instanceof Error
            ? networkError.message
            : "Internal error",
      });
      return;
    }
  } catch (error) {
    logger.error("Unexpected authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export function withAuth(handler: Function) {
  return async function (request: Request) {
    const authResult = await authenticateRequest(request);

    if (!authResult) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Add user and session to request context
    const requestWithContext = {
      ...request,
      user: authResult.user,
      session: authResult.session,
    };

    return handler(requestWithContext);
  };
}
