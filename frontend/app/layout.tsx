"use client";

import { ThemeProvider } from "./contexts/ThemeContext";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import OnboardingModal from "./components/onboarding/OnboardingModal";
import CookieConsentBanner from "./components/CookieConsentBanner";
import { Toaster } from "./components/ui/toaster";
import { UpdateNotification } from "./components/UpdateNotification";
import AuthInitializer from "./components/auth/AuthInitializer";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
          integrity="sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn"
          crossOrigin="anonymous"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"
          defer
          strategy="afterInteractive"
          integrity="sha384-cpW21h6RZv/phavutF+AuVYrr+dA8xD9zs6FwLpaCct6O9ctzYFfFr4dgmgccOTx"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased`}
      >
        <ThemeProvider>
          <OnboardingProvider>
            <AuthInitializer>
              {children}
              <OnboardingModal />
              <CookieConsentBanner />
              <Toaster />
              <UpdateNotification />
            </AuthInitializer>
          </OnboardingProvider>
        </ThemeProvider>
        <Script
          src="https://va.vercel-scripts.com/v1/script.js"
          strategy="afterInteractive"
        />
        <Script
          id="emailoctopus-form"
          src="https://eocampaign1.com/form/fed3dc92-8dab-11f1-a702-9f06b570a5bb.js"
          data-form="fed3dc92-8dab-11f1-a702-9f06b570a5bb"
          strategy="afterInteractive"
        />
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-L6YH94GFC1"
          strategy="afterInteractive"
        />
        <Script id="google-gtag" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-L6YH94GFC1');`}
        </Script>
        <Script id="posthog-script" strategy="afterInteractive">
          {`
          !function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}p||((p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",p.onerror=function(){p=null},(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r));var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="al ol ll init Il Rl Tl Ml Ol za El Dl Sl capture getExtension Pl nl Hl calculateEventProperties Bl register register_once register_for_session unregister unregister_for_session Vl Cl zl getFeatureFlag getFeatureFlagPayload getFeatureFlagResult getAllFeatureFlags isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync Gl identify setPersonProperties unsetPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset Zl shutdown setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty Ul ql createPersonProfile setInternalOrTestUser Wl ul hl opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing $l debug Ua Jn getPageViewId captureTraceFeedback captureTraceMetric bl".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
          posthog.init('phc_osWzoK8LkwyqLV6c8NnyKd6gMR6HjArNhQ7mXtHeCvgo', {
              api_host: 'https://t.workcontext.me',
              ui_host: 'https://us.posthog.com',
              defaults: '2026-05-30',
              person_profiles: 'identified_only',
          })
          `}
        </Script>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
        <form action="/submit-form" method="POST">
          {/* Your existing input fields */}
          <input type="text" name="username" placeholder="Username" required />

          {/* Turnstile Widget Container */}
          <div
            className="cf-turnstile"
            data-sitekey="0x4AAAAAAE8xMaqmdgV1RuFO"
          ></div>

          <button type="submit">Submit</button>
        </form>
      </body>
    </html>
  );
}
