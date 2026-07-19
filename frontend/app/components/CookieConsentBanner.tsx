"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "workcontext_cookie_consent";

export type CookieConsent = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  decidedAt: string;
};

function readConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CookieConsent) : null;
  } catch {
    return null;
  }
}

function persist(consent: CookieConsent) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  // Expose to server/middleware as a cookie (1 year)
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `workcontext_cookie_consent=${encodeURIComponent(
    JSON.stringify(consent),
  )}; path=/; max-age=${maxAge}; samesite=lax`;
}

export default function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [prefs, setPrefs] = useState({
    analytics: true,
    marketing: false,
    preferences: true,
  });

  useEffect(() => {
    setMounted(true);
    if (!readConsent()) setShow(true);

    const onOpen = () => {
      const existing = readConsent();
      if (existing) {
        setPrefs({
          analytics: existing.analytics,
          marketing: existing.marketing,
          preferences: existing.preferences,
        });
      }
      setCustomize(false);
      setShow(true);
    };
    window.addEventListener("workcontext:open-cookie-settings", onOpen);
    return () =>
      window.removeEventListener("workcontext:open-cookie-settings", onOpen);
  }, []);

  const decide = (
    analytics: boolean,
    marketing: boolean,
    preferences: boolean,
  ) => {
    persist({
      essential: true,
      analytics,
      marketing,
      preferences,
      decidedAt: new Date().toISOString(),
    });
    setShow(false);
  };

  if (!mounted || !show) return null;

  const Toggle = ({
    label,
    description,
    checked,
    disabled,
    onChange,
  }: {
    label: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex items-start justify-between gap-3 py-2">
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-purple-600"
      />
    </label>
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card/95 p-5 shadow-2xl backdrop-blur">
        {!customize ? (
          <>
            <h3 className="text-base font-semibold text-foreground">
              We value your privacy 🍪
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We use cookies to keep WorkContext working, remember your
              preferences, and understand how the product is used. Essential
              cookies are always on. You can accept all, reject non-essential, or
              fine-tune your choices.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setCustomize(true)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60"
              >
                Customize
              </button>
              <button
                onClick={() => decide(false, false, false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60"
              >
                Reject non-essential
              </button>
              <button
                onClick={() => decide(true, true, true)}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
              >
                Accept all
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-base font-semibold text-foreground">
              Manage cookie preferences
            </h3>
            <div className="mt-2 divide-y divide-border">
              <Toggle
                label="Essential"
                description="Required for the site to function. Always active."
                checked
                disabled
                onChange={() => {}}
              />
              <Toggle
                label="Analytics"
                description="Helps us understand usage to improve WorkContext."
                checked={prefs.analytics}
                onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
              />
              <Toggle
                label="Marketing"
                description="Used for campaign measurement and relevant messaging."
                checked={prefs.marketing}
                onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
              />
              <Toggle
                label="Preferences"
                description="Remembers your settings (e.g. theme, language)."
                checked={prefs.preferences}
                onChange={(v) => setPrefs((p) => ({ ...p, preferences: v }))}
              />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => decide(false, false, false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60"
              >
                Reject non-essential
              </button>
              <button
                onClick={() =>
                  decide(prefs.analytics, prefs.marketing, prefs.preferences)
                }
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
              >
                Save preferences
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
