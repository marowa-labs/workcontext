import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS) || 65000;
const MAX_RETRIES = 2;

async function fetchWithRetry(
  url: string,
  init: RequestInit,
): Promise<Response> {
  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Small backoff before each retry so a cold-starting backend (Render
    // free tier) has a chance to finish booting before we give up.
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 750 * attempt));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timer);

      // Transient gateway/backend errors — retry a couple of times.
      if (response.status >= 502 && response.status <= 504 && attempt < MAX_RETRIES) {
        await response.body?.cancel(); // free the stream before retrying
        continue;
      }

      return response;
    } catch (error: any) {
      clearTimeout(timer);
      lastError = error;
      // Only retry on network-ish failures (connection refused, timeout,
      // cold start). Aborts from the client are handled by the caller.
      if (error?.name === "AbortError" || attempt >= MAX_RETRIES) {
        throw error;
      }
    }
  }

  throw lastError;
}

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");
  const url = `${BACKEND_URL}/api/${path}${request.nextUrl.search}`;

  console.log(`[API Proxy] ${request.method} ${url}`);

  try {
    // Clone headers and add auth if available
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");

    // Read the body
    let body: BodyInit | undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      const contentType = request.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        body = await request.text();
      } else {
        body = await request.arrayBuffer();
      }
    }

    const response = await fetchWithRetry(url, {
      method: request.method,
      headers,
      body,
      credentials: "include",
    });

    // If the backend returned non-JSON (e.g. an HTML cold-start page) with an
    // error status, normalize it to a JSON error so the client never blows up
    // with "Unexpected token '<'".
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok && !contentType.includes("application/json")) {
      const text = (await response.text()).slice(0, 500);
      console.error(
        `[API Proxy] Backend returned ${response.status} (non-JSON) for ${url}:`,
        text,
      );
      return NextResponse.json(
        {
          success: false,
          message:
            response.status >= 500
              ? "Backend service temporarily unavailable. Please try again."
              : `Request failed with status ${response.status}`,
        },
        { status: response.status },
      );
    }

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    const responseBody = await response.arrayBuffer();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    const isTimeout = error?.name === "AbortError";
    console.error(
      `[API Proxy] Error (${isTimeout ? "timeout" : "connection"}):`,
      error.message,
    );
    return NextResponse.json(
      {
        success: false,
        message: isTimeout
          ? "The server took too long to respond. Please try again."
          : `Connection error: ${error.message || "Failed to reach server"}`,
      },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
export const HEAD = handler;
