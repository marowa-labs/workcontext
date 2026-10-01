"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { CONSENT_CHANGED_EVENT, readConsent } from "../lib/cookieConsent";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const POSTHOG_UI_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

// posthog-js is a singleton, so init only runs once per page load.
let started = false;

function enableAnalytics() {
  if (!POSTHOG_KEY) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
      );
    }
    return;
  }

  if (!started) {
    posthog.init(POSTHOG_KEY, {
      // Route events through the Next.js reverse proxy to avoid ad-blockers.
      api_host: "/ingest",
      ui_host: POSTHOG_UI_HOST || "https://us.posthog.com",
      defaults: "2026-08-30",
      // Error tracking is enabled on the project, so capture unhandled
      // exceptions and rejections from the browser.
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    });
    started = true;
  }

  // The opt-out from an earlier rejection is persisted, so it survives a
  // reload and must be cleared when the user accepts again.
  if (posthog.has_opted_out_capturing()) {
    posthog.opt_in_capturing();
    posthog.startSessionRecording();
  }
}

function disableAnalytics() {
  if (!started) return;
  posthog.stopSessionRecording();
  posthog.opt_out_capturing();
}

// The only PostHog init path in the app. Starts PostHog only after the user
// grants analytics consent, and stops it again if they revoke it. Nothing is
// sent before the user opts in or after they reject.
export default function PostHogInit() {
  useEffect(() => {
    const sync = () => {
      if (readConsent()?.analytics) enableAnalytics();
      else disableAnalytics();
    };

    sync();
    window.addEventListener(CONSENT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, sync);
  }, []);

  return null;
}
