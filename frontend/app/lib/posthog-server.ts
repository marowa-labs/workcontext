import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

/**
 * Returns a singleton PostHog server-side client.
 * Uses flushAt=1 and flushInterval=0 so events are sent immediately,
 * which is required for short-lived Next.js route handlers.
 */
export function getPostHogClient(): PostHog {
  if (!posthogClient) {
    const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (process.env.NODE_ENV !== "production" && !token) {
      console.error(
        "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, " +
          "this causes events to be silently missed. " +
          "This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
      );
    }

    posthogClient = new PostHog(token ?? "", {
      host,
      // flushAt=1 and flushInterval=0 ensure events are sent before the
      // handler returns (required for serverless / short-lived Next.js routes)
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

export async function shutdownPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown();
    posthogClient = null;
  }
}
