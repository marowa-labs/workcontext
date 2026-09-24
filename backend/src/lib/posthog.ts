import { PostHog, setupExpressRequestContext, setupExpressErrorHandler } from "posthog-node";
import type { Application } from "express";

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST;

let posthog: PostHog | null = null;

if (!POSTHOG_API_KEY) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "POSTHOG_API_KEY variable required by PostHog is missing or un-configured, " +
        "this causes events to be silently missed. " +
        "This error stops appearing once POSTHOG_API_KEY is configured.",
    );
  }
} else {
  posthog = new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_HOST,
    enableExceptionAutocapture: true,
  });
}

/**
 * Register PostHog request-context middleware and error handler on an Express app.
 * Call this after creating `app` but before mounting routes.
 */
export function setupPostHog(app: Application): void {
  if (!posthog) return;
  setupExpressRequestContext(posthog, app);
}

/**
 * Register the PostHog Express error handler.
 * Call this AFTER all routes are registered.
 */
export function setupPostHogErrorHandler(app: Application): void {
  if (!posthog) return;
  setupExpressErrorHandler(posthog, app);
}

/**
 * Gracefully flush and shut down the PostHog client.
 * Call on process exit.
 */
export async function shutdownPostHog(): Promise<void> {
  if (!posthog) return;
  await posthog.shutdown();
}

export { posthog };
