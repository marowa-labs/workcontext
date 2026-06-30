import { supabase } from "../supabase/client";

// Simple API client wrapper
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl =
      baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  }

  private async getAuthToken() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }

  private async request(
    url: string,
    options: RequestInit = {},
    retryCount = 0, // DISABLE retries by default to prevent infinite loops
  ): Promise<any> {
    // Use relative URL to go through Next.js API route proxy
    const fullUrl = url.startsWith("/api") ? url : `${this.baseUrl}${url}`;

    console.log("Making API request to:", fullUrl);

    // Get auth token
    let token = await this.getAuthToken();
    console.log("Got token for request:", token ? "YES" : "NO");

    // Create AbortController for timeout handling
    const controller = new AbortController();
    // Increase timeout to 120 seconds for heavy backend operations
    const timeoutId = setTimeout(
      () => controller.abort(new Error("Request timed out")),
      120000,
    );

    const isFormData = options.body instanceof FormData;

    // Construct merged headers separately to avoid being overridden by ...options spread
    const mergedHeaders = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const defaultOptions: RequestInit = {
      signal: controller.signal,
      credentials: "include",
      ...options,
      headers: mergedHeaders, // Set headers AFTER spreading options to preserve them
    };

    console.log("Request headers being sent:", defaultOptions.headers);

    try {
      console.log(`Making request to: ${fullUrl}`, {
        method: options.method || "GET",
        hasToken: !!token,
        retryCount,
      });

      const response: Response = await fetch(fullUrl, defaultOptions);

      // Clear timeout since request completed
      clearTimeout(timeoutId);

      // Handle 401 errors by throwing an appropriate error
      if (response.status === 401) {
        console.log("Authentication failed - 401 response");
        const errorData = await response.json().catch(() => ({}));
        console.log("401 error details:", errorData);

        // If it's a token missing or invalid error, don't redirect immediately
        // Let the route components handle authentication state
        if (
          errorData.message === "Authorization token missing" ||
          errorData.message === "Invalid or missing authentication token" ||
          errorData.message === "Authentication required"
        ) {
          // Clear any stored data
          console.log("Clearing session due to auth error:", errorData.message);
          localStorage.clear();
          sessionStorage.clear();
        }

        throw new Error(errorData.message || "User not authenticated");
      }

      // Handle 429 (Too Many Requests / Rate Limited) with retry logic
      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        const retryAfter = response.headers.get("Retry-After");
        const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : null;

        console.log("Rate limited (429):", {
          message: errorData.message,
          retryAfter: retryAfterSeconds,
          remainingRetries: retryCount,
        });

        // Retry with exponential backoff if we have retries left
        if (retryCount > 0) {
          const delayMs = retryAfterSeconds
            ? retryAfterSeconds * 1000
            : 1000 * (4 - retryCount); // Exponential backoff: 3s, 2s, 1s

          console.log(
            `Retrying request to ${url} after ${delayMs}ms due to rate limit...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          return this.request(url, options, retryCount - 1);
        }

        throw new Error(
          errorData.message ||
            "Rate limit exceeded. Please wait a moment and try again.",
        );
      }

      // Special handling for 404 errors for affiliate record not found
      // This needs to be handled before checking response.ok
      if (response.status === 404) {
        console.error(`404 Not Found: ${fullUrl}`);
        try {
          const errorData = await response.json();
          if (errorData.message === "Affiliate record not found") {
            // Return a special response that the frontend can handle without throwing an error
            return {
              success: false,
              message: "Affiliate record not found",
            };
          }
          // For other 404 errors, we'll still throw
          throw new Error(
            errorData.message || `HTTP error! status: 404 for ${url}`,
          );
        } catch (parseError) {
          // If we can't parse the JSON, throw a generic error with URL
          throw new Error(`HTTP error! status: 404 for ${url}`);
        }
      }

      // If response is not ok, try to parse error message
      if (!response.ok) {
        try {
          const errorText = await response.text();
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorText);
          } catch {}
          console.error(
            `API Error ${response.status} for ${url}:`,
            errorData.message || errorText,
          );
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`,
          );
        } catch (parseError) {
          // If we can't parse the JSON, throw a generic error
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      // Verify content is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else {
        // If not JSON (likely HTML error page), return empty object or throw based on status
        console.warn(
          "Received non-JSON response:",
          await response.text().catch(() => "Unknown"),
        );
        return {};
      }
    } catch (error: any) {
      // Clear timeout since request completed or failed
      clearTimeout(timeoutId);

      console.error(`API request failed for ${url}:`, error);

      // Handle abort errors (timeouts vs cancellation)
      if (error.name === "AbortError") {
        if (controller.signal.reason?.message === "Request timed out") {
          console.log(
            `Request to ${url} timed out - NOT retrying to prevent infinite loop`,
          );
          throw new Error(
            "Request timeout - service may be temporarily unavailable. Please try again later.",
          );
        } else {
          // General cancellation (navigation, component unmount)
          console.log(`Request to ${url} was cancelled`);
          // Return valid-ish response to prevent crash, or rethrow handled cancellation
          // Throwing a specific error that React Query or SWR or manual try/catches often ignore
          throw new Error("Request cancelled");
        }
      }

      if (
        error.name === "TypeError" &&
        error.message.includes("signal is aborted")
      ) {
        // Handle "signal is aborted without reason" if it comes as TypeError
        console.log(`Request to ${url} aborted silently`);
        throw new Error("Request cancelled");
      }

      // Handle network errors specifically - ONLY retry on network errors, NOT timeouts
      if (
        error instanceof TypeError &&
        (error.message === "Failed to fetch" ||
          error.message?.includes("ERR_INSUFFICIENT_RESOURCES") ||
          error.message?.includes("NetworkError") ||
          error.message?.includes("ECONNREFUSED") ||
          error.message?.includes("ECONNRESET"))
      ) {
        // This is likely a network connectivity issue
        if (retryCount > 0) {
          console.log(
            `Retrying request to ${url} due to network error... (${retryCount} attempts left)`,
          );
          // Wait before retrying with exponential backoff (faster for auto-save recovery)
          const retryDelay = Math.min(3000 * (4 - retryCount), 5000);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return this.request(url, options, retryCount - 1);
        }

        // Check if this is an authentication issue (no token available)
        const authToken = await this.getAuthToken();
        if (!authToken) {
          throw new Error(
            "Authentication required - please sign in to access this feature",
          );
        }

        throw new Error(
          `Connection error: ${error.message || "Failed to reach server"}`,
        );
      }

      throw new Error(
        `Connection error: ${error.message || "Failed to reach server"}`,
      );
    } finally {
      // Clear timeout in case of error or completion
      clearTimeout(timeoutId);
    }
  }

  async get(url: string, options: RequestInit = {}) {
    // IMPORTANT: Dynamic routes like /api/projects and /api/billing/subscription must NOT retry
    // Only static resources can retry on network errors
    // Check if this is a dynamic API endpoint
    const isDynamicRoute = url.startsWith("/api/") || url.includes("?");
    const retries = isDynamicRoute ? 0 : 2; // No retries for dynamic routes
    return this.request(url, { ...options, method: "GET" }, retries);
  }

  async post(url: string, data: any, options: RequestInit = {}) {
    // IMPORTANT: Dynamic routes like /api/projects and /api/billing/subscription must NOT retry
    // Mutations should never retry to prevent duplicate operations
    return this.request(
      url,
      {
        ...options,
        method: "POST",
        body: JSON.stringify(data),
      },
      0,
    ); // Never retry POST requests
  }

  async postMultipart(
    url: string,
    formData: FormData,
    options: RequestInit = {},
  ) {
    // Mutations should never retry
    // We don't set Content-Type so the browser can set it with the correct boundary
    return this.request(
      url,
      {
        ...options,
        method: "POST",
        body: formData,
        headers: {
          ...options.headers,
        },
      },
      0,
    );
  }

  async put(url: string, data: any, options: RequestInit = {}) {
    // Allow 1 retry for PUT requests (e.g., auto-save) on network errors
    // but not on server errors to prevent duplicate operations
    return this.request(
      url,
      {
        ...options,
        method: "PUT",
        body: JSON.stringify(data),
      },
      1,
    ); // 1 retry for network errors only
  }

  async patch(url: string, data: any, options: RequestInit = {}) {
    // IMPORTANT: Dynamic routes like /api/projects and /api/billing/subscription must NOT retry
    // Mutations should never retry to prevent duplicate operations
    return this.request(
      url,
      {
        ...options,
        method: "PATCH",
        body: JSON.stringify(data),
      },
      0,
    ); // Never retry PATCH requests
  }

  async delete(url: string, data: any, options: RequestInit = {}) {
    // IMPORTANT: Dynamic routes like /api/projects and /api/billing/subscription must NOT retry
    // Mutations should never retry to prevent duplicate operations
    return this.request(
      url,
      {
        ...options,
        method: "DELETE",
        ...(data ? { body: JSON.stringify(data) } : {}),
      },
      0,
    ); // Never retry DELETE requests
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

export default apiClient;
