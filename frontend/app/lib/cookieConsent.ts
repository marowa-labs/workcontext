const STORAGE_KEY = "workcontext_cookie_consent";

// Fired on `window` after the user saves a cookie choice, so listeners such as
// analytics can start or stop without a page reload.
export const CONSENT_CHANGED_EVENT = "workcontext:cookie-consent-changed";

export type CookieConsent = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  decidedAt: string;
};

export function readConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CookieConsent) : null;
  } catch {
    return null;
  }
}

export function persistConsent(consent: CookieConsent) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  // Expose to server/middleware as a cookie (1 year)
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${STORAGE_KEY}=${encodeURIComponent(
    JSON.stringify(consent),
  )}; path=/; max-age=${maxAge}; samesite=lax`;
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT));
}
