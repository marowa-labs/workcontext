import posthog from "posthog-js";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (process.env.NODE_ENV !== "production" && !token) {
  console.error(
    "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, " +
    "this causes events to be silently missed. " +
    "This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
  );
}

if (token) {
  posthog.init(token, {
    // Route events through the Next.js reverse proxy to avoid ad-blockers
    api_host: "/ingest",
    // PostHog UI host (for toolbar, etc.) - use custom host from env
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com",
    // Use 2026-01-30 defaults as required
    defaults: "2026-01-30",
    // Enable error tracking via unhandled exception capture
    capture_exceptions: true,
    // Enable debug logging in development
    debug: process.env.NODE_ENV === "development",
  });
}

// IMPORTANT: Do NOT combine this with any other PostHog init approach (e.g. a PostHogProvider).
// instrumentation-client.ts is the correct client-side PostHog init for Next.js 15.3+.
