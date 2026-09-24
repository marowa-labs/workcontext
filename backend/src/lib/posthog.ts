import { PostHog, setupExpressRequestContext, setupExpressErrorHandler } from "posthog-node";
import type { Application } from "express";

const POSTHOG_API_KEY = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

let posthogClient: PostHog | null = null;

if (!POSTHOG_API_KEY) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, " +
      "this causes events to be silently missed. " +
      "This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured.",
    );
  }
} else {
  posthogClient = new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_HOST,
    enableExceptionAutocapture: true,
  });
}

/**
 * Register PostHog request-context middleware and error handler on an Express app.
 * Call this after creating `app` but before mounting routes.
 */
export function setupPostHog(app: Application): void {
  if (!posthogClient) return;
  setupExpressRequestContext(posthogClient, app);
}

/**
 * Register the PostHog Express error handler.
 * Call this AFTER all routes are registered.
 */
export function setupPostHogErrorHandler(app: Application): void {
  if (!posthogClient) return;
  setupExpressErrorHandler(posthogClient, app);
}

/**
 * Gracefully flush and shut down the PostHog client.
 * Call on process exit.
 */
export async function shutdownPostHog(): Promise<void> {
  if (!posthogClient) return;
  await posthogClient.shutdown();
}

export { posthogClient };
