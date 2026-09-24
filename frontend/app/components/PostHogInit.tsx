"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { CONSENT_CHANGED_EVENT, readConsent } from "../lib/cookieConsent";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

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
      api_host: POSTHOG_HOST,
      defaults: "2026-08-30",
      // Error tracking is enabled on the project, so capture unhandled
      // exceptions and rejections from the browser.
      capture_exceptions: true,
    });
    started = true;
    return;
  }

  posthog.opt_in_capturing();
}

function disableAnalytics() {
  if (started) posthog.opt_out_capturing();
}

// Starts PostHog only after the user grants analytics consent, and stops it
// again if they revoke it. Nothing is sent before the user opts in.
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
