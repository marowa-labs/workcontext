import * as Sentry from "@sentry/nextjs";

// Sentry User Feedback integration (client-side only)
Sentry.init({
  dsn: "https://1f6ae299d41a7fc29dd459272f92b516@o4511580853108736.ingest.us.sentry.io/4511999687655424",
  integrations: [
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
      isNameRequired: true,
      isEmailRequired: true,
    }),
  ],
});

// Note: The User Feedback integration only needs to be added to your instrumentation-client.(js|ts) file.
// Adding it to any server-side configuration files (like instrumentation.(js|ts)) will break your build
// because the Feedback integration depends on Browser APIs.

// Do NOT initialize PostHog here. app/components/PostHogInit.tsx is the only
// PostHog init path, because it must wait for analytics cookie consent.
