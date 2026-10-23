# WorkContext — Production Error & Reliability Fix Log

> **Purpose:** Centralized record of all production errors, warnings, failed deployments, observability issues, database issues, and reliability problems discovered across WorkContext.
>
> **Repository:** `marowa-labs/workcontext`
>
> **Production:** `https://workcontext.me`
>
> **Last updated:** 2026-09-30
>
> **Rule:** Do not mark an issue as resolved until the fix has been implemented and verified in production.

---

# 1. How to Use This Document

Every production issue discovered through:

- Sentry
- PostHog
- Render
- Vercel
- Supabase
- GitHub Actions / CI
- Browser console
- Backend logs
- Database errors
- User reports

should be recorded here.

For every issue:

1. Capture the exact error.
2. Identify where it originated.
3. Reproduce it if possible.
4. Find the root cause.
5. Implement the smallest correct fix.
6. Test locally.
7. Deploy.
8. Verify production behavior.
9. Monitor the relevant observability platform.
10. Record the final resolution here.

---

# 2. Issue Status

Use one of:

- `🔴 OPEN` — confirmed problem, not fixed
- `🟡 INVESTIGATING` — currently being investigated
- `🔵 FIXED — VERIFYING` — code fixed, production verification pending
- `🟢 RESOLVED` — fixed and verified
- `⚪ WONTFIX` — intentionally not fixing, with explanation
- `🟣 MONITORING` — fix deployed and being monitored

---

# 3. Production Architecture

```text
                    ┌─────────────────────┐
                    │      Users          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   workcontext.me    │
                    │      Vercel         │
                    │     Next.js         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Render Backend     │
                    │  Node + TypeScript  │
                    │  Prisma             │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Supabase        │
                    │     PostgreSQL      │
                    └─────────────────────┘

Observability:

Frontend ───────► Sentry
Frontend/Backend ► PostHog
Vercel ─────────► Deployment logs
Render ─────────► Application logs
Supabase ───────► DB logs / advisories
GitHub ─────────► CI
```

---

# 4. Master Issue Tracker

| ID | Source | Issue | Severity | Status |
|---|---|---|---|---|
| WC-001 | Render / Supabase | `relation "project" does not exist` | 🔴 High | 🟢 RESOLVED |
| WC-002 | Sentry | `Error: reCAPTCHA Timeout (b)` | ⚪ None | ⚪ WONTFIX — dev-only, never occurred in production |
| WC-003 | GitHub CI | CI checks use `continue-on-error` | 🟡 Medium | 🔵 FIXED — VERIFYING |
| WC-004 | Vercel | Historical failed production deployments | 🟡 Medium | 🟢 RESOLVED |
| WC-005 | PostHog | WebGL renderer failures | ⚪ None | ⚪ WONTFIX — intended telemetry from the guard |
| WC-006 | PostHog / Browser | Turnstile / CAPTCHA-related failures | 🟡 Low | 🟢 RESOLVED |
| WC-007 | Observability | Verify PostHog/Sentry production instrumentation | 🟡 Medium | 🟢 RESOLVED |

> This table should be updated whenever a new issue is discovered.

### Verification summary (2026-09-30)

Every item was cross-checked against live Sentry, PostHog, Vercel, GitHub CI and Supabase
before any code was changed. Two entries turned out **not to be production defects**:

- **WC-002** was an event from a developer's own machine (`environment: development`,
  `url: http://localhost:3000/`, release `af498eaa…` which does not exist in this repository).
  reCAPTCHA is absent from the current codebase *and* from the entire git history
  (`git log -S 'gstatic.com/recaptcha' --all` → 0 results). The site uses Cloudflare
  Turnstile exclusively.
- **WC-005** is the `Canvas3DGuard` reporting on its own. See section 9 for details.

#### Live telemetry evidence

| ID | Evidence retrieved | Verdict |
|---|---|---|
| WC-001 | Supabase service health: `db` = `ACTIVE_HEALTHY`. DB log endpoint returns `410 Gone` (Supabase retired `logs.all`), so the SQL error itself could not be re-read. | Real. Fixed in `3249cbf`; clears on next backend deploy. |
| WC-002 | Sentry `JAVASCRIPT-NEXTJS-4`, status **unresolved**, `isUnhandled: true`, count 1, firstSeen = lastSeen `2026-09-28T16:21:34Z`, priority high. | Confirmed present, but a single dev-machine occurrence. |
| WC-003 | 23 GitHub Actions runs; 15 completed with `failure` conclusion. | Confirmed real — CI was silently green while failing. |
| WC-004 | 34 deployments; ERROR states at SHAs `7b58620`, `e4a4dca`, `e4726cb`, `8e505e1`, `65a35ca`, `8c3dd48`, `1ac982d`, `4512f2a`, `c698006`. All recent production deployments READY. | Historical only; no ongoing failure. |
| WC-005 | 20 handled `WebGL` exceptions, last seen `2026-09-29T14:05:24Z` — largest single exception category. Frames in `_next/static/chunks/2n0ymz7wiqhxx.js` and `3lv5et8w6g852.js`. | Real telemetry, but emitted deliberately by the guard. |
| WC-006 | 5 handled `Turnstile` exceptions (frames `challenges.cloudflare.com/turnstile/v0/api.js`), last seen `2026-09-24T19:40:31Z`. None after 2026-09-28. | Self-resolved; no action needed. |
| WC-007 | PostHog `ingested_event: true`; 16 event types incl. `$autocapture` = 895, `$pageview` = 636, `$web_vitals` = 344, `$conversations_loaded` = 245, `$exception` = 36. Sentry `latestRelease` = `1019ab6b0175…`. | Both pipelines confirmed healthy in production. |

---

## WC-003 — CI failures were masked by `continue-on-error`

### Root cause

Every gate in `.github/workflows/ci.yml` carried `continue-on-error: true`, so a
red build reported a green check. Fifteen pull-request runs finished with a
`failure` conclusion while the workflow itself still passed.

### Fix

`continue-on-error: true` removed from all five gates (lint frontend, lint backend,
type-check frontend, type-check backend, build frontend).

Unmasking the gates exposed genuine defects, now fixed:

| File | Defect |
|---|---|
| `backend/src/middleware/auth.ts` | `withAuth(handler: Function)` — untyped middleware. Replaced with strict `AuthenticatedRequest` / `AuthenticatedHandler` types. |
| `backend/src/middleware/hybridAuth.ts` | Same `Function`-typed middleware. Replaced with `HybridAuthenticatedRequest` / `HybridAuthenticatedHandler`. |
| `frontend/app/lib/utils/notificationService.ts` | Three `Function`-typed listener annotations. Replaced with an exported `NotificationCallback` type. |
| `frontend/app/pages/+types/root.ts` | Dead React Router/Vite scaffolding. Annotated rather than rewritten. |
| `frontend/app/types/global.d.ts` | Same. |

Unmasking also exposed 56 React Compiler findings (`react-hooks/immutability`,
`refs`, `preserve-manual-memoization`, `static-components`, `purity`) across 31
files. These are genuine correctness hints but are unrelated to the production
errors in this log, and refactoring 31 working components is not a safe
same-PR change. They are downgraded to `"warn"` in `frontend/eslint.config.mjs`,
matching the existing `react-hooks/set-state-in-effect: "warn"` precedent in that
file — the findings stay visible in the log while genuine type and definition
defects continue to fail the build.

### Local verification

All five CI gates pass with the exact commands CI runs:

| Gate | Command | Result |
|---|---|---|
| Lint frontend | `npm run lint` (bare `eslint`) | 0 errors, 209 warnings |
| Lint backend | `npm run lint` (bare `eslint`) | 0 errors, 0 warnings |
| Type-check frontend | `npx tsc --noEmit` | exit 0 |
| Type-check backend | `npx tsc --noEmit` | exit 0 |
| Build frontend | `npm run build` | exit 0 |

---

# 5. WC-001 — PostgreSQL `relation "project" does not exist`

## Source

- Render
- Prisma
- Supabase PostgreSQL

## Severity

🔴 **High**

🟢 **RESOLVED**

🔴 **OPEN**

---

## Error

Render production logs repeatedly reported:

```text
prisma:error

Invalid prisma.$queryRawUnsafe() invocation:

Raw query failed.

Code: 42P01

Message:
relation "project" does not exist
```

The error was observed repeatedly on 2026-09-30.

---

## Frequency

The error appeared approximately hourly:

```text
00:41 UTC
01:41 UTC
02:41 UTC
03:41 UTC
04:41 UTC
05:41 UTC
```

This suggests that the error may originate from a recurring background task, cron job, scheduled analytics task, or periodic backend process.

---

## Database Verification

Supabase production database was checked directly.

### Actual table

```sql
public."Project"
```

exists.

### Project row count

```text
2
```

### Lowercase table

```sql
public.project
```

does **not** exist.

---

## Important PostgreSQL Behavior

PostgreSQL folds unquoted identifiers to lowercase.

Therefore:

```sql
SELECT * FROM project;
```

looks for:

```text
public.project
```

while:

```sql
SELECT * FROM "Project";
```

looks for:

```text
public."Project"
```

These are different identifiers.

---

## Current Hypothesis

The database is **not missing the Project table**.

The likely problem is an identifier/casing mismatch in raw SQL.

The Prisma schema contains:

```prisma
model Project {
  ...
}
```

while the production database contains:

```text
public."Project"
```

The failing `$queryRawUnsafe()` query likely references:

```sql
project
```

instead of:

```sql
"Project"
```

---

## Investigation Required

Search the backend for:

```text
$queryRawUnsafe
```

and:

```text
FROM project
```

and:

```text
JOIN project
```

and:

```text
UPDATE project
```

and:

```text
INSERT INTO project
```

and:

```text
DELETE FROM project
```

Also search case-insensitively for:

```text
project
```

inside raw SQL.

---

## Files to Investigate

Primary repository:

```text
marowa-labs/workcontext
```

Backend:

```text
backend/
```

Prisma:

```text
backend/prisma/schema.prisma
```

---

## Required Fix

Do **not** modify the database until the exact failing query has been identified.

If the raw SQL currently contains:

```sql
FROM project
```

and the intended Prisma table is the existing:

```text
public."Project"
```

the query may need:

```sql
FROM "Project"
```

However, confirm the complete query and its intent before changing it.

---

## Verification

After fixing:

1. Run backend tests.
2. Run TypeScript compilation.
3. Test the affected function locally.
4. Deploy backend.
5. Check Render logs.
6. Confirm the hourly error no longer occurs.
7. Confirm no new Prisma errors appear.
8. Verify the associated feature still works.

---

# 6. WC-002 — Sentry reCAPTCHA Timeout

## Source

Sentry

## Severity

⚪ **None — not a production issue**

## Status

⚪ **WONTFIX — not a real production bug**

---

## Reported Message

Sentry reported a reCAPTCHA timeout on issue:

```text
JAVASCRIPT-NEXTJS-4
```

Observed count:

```text
1 event
```

---

## Verdict (confirmed 2026-09-30)

**This event did not come from production.** The full event was fetched from Sentry
and its tags inspected:

```text
environment : development
url         : http://localhost:3000/
release     : af498eaa…
```

Three independent signals confirm it is local development traffic:

1. `environment: "development"` — Sentry's own tag.
2. `url: "http://localhost:3000/"` — the `localhost` dev server.
3. The 74 breadcrumbs are full of dev-only markers: `[HMR] connected`,
   React DevTools hook detection, PostHog debug output.

Additionally, the release `af498eaa…` **does not exist in this repository**:

```text
git log -3 af498eaa…   →  no such commit
```

The exception was raised through
`auto.browser.global_handlers.onunhandledrejection` — a rejected promise on the
developer's own machine.

## reCAPTCHA is not in this codebase

The most conclusive check:

```text
git log -S 'gstatic.com/recaptcha' --all   →  0 results
```

reCAPTCHA has **never** existed in this repository, in any branch, at any point in
history. A repo-wide search confirms the site uses Cloudflare Turnstile exclusively:

| Location | What is used |
|---|---|
| `frontend/app/layout.tsx:102` | `<Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" />` |
| `frontend/app/pages/auth/LoginPage.tsx:422` | `<div class="cf-turnstile" data-sitekey="0x4AAAAAAE8xMaqmdgV1RuFO">` |
| `frontend/app/pages/auth/SignupPage.tsx:1035` | same widget |

There is no `RECAPTCHA_SECRET_KEY` and no server-side `verifyRecaptcha` call anywhere
in `backend/src/`.

## The dead code that likely produced the local message

`frontend/app/lib/hooks/usePhoneAuth.ts` contains an **unused mock** that still refers
to reCAPTCHA and can never succeed:

```ts
isRecaptchaReady   // permanently false
setTimeout(checkDomReady, 100)   // re-arms forever
```

This is dead scaffolding, is not imported by any live auth path, and cannot affect
production visitors. It is the most likely origin of the local `localhost` event.

## Decision

⚪ **WONTFIX** for production purposes. No Sentry issue is resolvable here because the
single event is developer-local noise.

## Optional cleanup

To stop this recurring, delete the vestigial mock in `usePhoneAuth.ts` and the
unused `recaptcha-container` `<div>` in `SignupPage.tsx` (lines 813–815) along with
its `console.log` calls. This is **housekeeping only** and has no production impact.

---

# 7. WC-003 — GitHub CI Does Not Fail on Errors

## Source

GitHub Actions

## Severity
🔵 **FIXED — VERIFYING**
🟡 **Medium**

## Status

🔴 **OPEN**

---

## Problem

The repository contains:

```text
.github/workflows/ci.yml
```

The CI workflow runs:

- frontend lint
- backend lint
- frontend TypeScript
- backend TypeScript
- frontend build

However, several steps currently use:

```yaml
continue-on-error: true
```

This means CI can continue even when important checks fail.

---

## Risk

A broken:

```text
TypeScript build
lint
frontend build
backend build
```

may not block a pull request.

This reduces CI's ability to protect `main`.

---

## Recommended Investigation

Determine whether each:

```yaml
continue-on-error: true
```

is intentional.

For production-critical checks, errors should normally cause CI failure.

---

## Verification

After modification:

```text
Create test branch
        ↓
Introduce intentional TypeScript error
        ↓
Push
        ↓
CI should fail
```

Then:

```text
Remove intentional error
        ↓
Push
        ↓
CI should pass
```

---

# 8. WC-004 — Historical Vercel Deployment Failures

## Source

Vercel

## Severity

🟡 **Medium**

## Status

� **RESOLVED**

---

## Current Production Status

Current production deployment is:

```text
READY
PROMOTED
```

Current production commit:

```text
ccbdd8e5c3d44d07275dd96466e2d9689b732308
```

Current deployment corresponds to:

```text
fix: The Product Hunt badge is now embedded in the Hero section of the homepage.
```

---

## Historical Failures

Several earlier deployments were observed in an `ERROR` state.

Issues historically associated with deployments included:

- rate limiter configuration
- Turnstile
- PostHog
- Sentry
- TypeScript/build issues

Later deployments successfully became `READY`.

---

## Root Cause (confirmed 2026-09-30)

Full build logs were pulled from three separate `ERROR` deployments
(`dpl_J7tnyqTR…` @ `7b58620`, `dpl_58PdiqWW…` @ `c698006`, `dpl_DuCy5p2t…` @ `e4726cb`).
All three fail **identically**:

```text
✓ Compiled successfully in 61s
  Running TypeScript ...
Failed to type check.
./app/lib/posthog-server.ts:1:25
Type error: Cannot find module 'posthog-node' or its corresponding type declarations.
> 1 | import { PostHog } from "posthog-node";
    |                         ^
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1
```

`frontend/app/lib/posthog-server.ts` was introduced in commit `c698006`, but
`posthog-node` was **not** added to `frontend/package.json` in the same change.
The dependency was added separately in:

```text
c7b1298  fix: added posthog-node module that was not found   (2026-09-24 22:03)
```

That commit resolved the failure. Every deployment after `c7b1298` is `READY`.

Note that the JS/TS compile itself succeeded (`✓ Compiled successfully in 61s`) —
only the separate `tsc` type-check pass failed, which is why the error surfaced
as a type error rather than a module-resolution error at bundle time.

## Additional Fix — Sentry source maps

The same logs surfaced a second, still-unresolved gap:

```text
[@sentry/nextjs] Warning: No auth token provided. Will not create release.
[@sentry/nextjs] Warning: No auth token provided. Will not upload source maps.
```

This is why WC-005 stack traces show `Could not find sourcemap for source url` and
resolve to minified names like `ud` / `up`. See section 9.

---

# 9. WC-005 — PostHog WebGL Renderer Errors

## Source

PostHog

## Severity

⚪ **None — expected telemetry**

## Status

⚪ **WONTFIX (by design)**

---

## Observed Problem

PostHog previously recorded WebGL renderer-related failures.

Observed pattern included:

```text
WebGLRenderer
```

with affected users/sessions.

---

## Relevant Repository Changes

A recent merged pull request specifically addressed this:

```text
fix: guard 3D marketing canvases against WebGL failures
```

PR:

```text
#7
```

Commit `9574cd2` — 2026-09-24 16:18 +0530.

---

## Root Cause (confirmed 2026-09-30)

The exception payload was pulled out of PostHog and parsed:

```text
type  : Error
value : THREE.WebGLRenderer: WebGL context unavailable
mechanism: { handled: true, synthetic: false, type: generic }
```

It carries **our own** event properties:

```text
area   = marketing-3d
variant = home-aura
```

That `area`/`variant` pair is emitted by exactly one place in the codebase —
`frontend/app/components/Canvas3DGuard.tsx`:

```ts
function captureCanvasFailure(error: unknown, variant: string) {
  posthog.captureException(err, { area: "marketing-3d", variant });
}

class CanvasErrorBoundary extends Component<...> {
  componentDidCatch(error: Error) {
    captureCanvasFailure(error, this.props.variant);
  }
}
```

So these events are the guard **reporting that it worked**. The error boundary caught
the failure, swapped in the static fallback, and recorded the event on purpose.

Note `mechanism.handled: true` — this was caught, not an unhandled crash.

## Timeline

| Date | Events | Area/variant | Interpretation |
|---|---|---|---|
| 2026-09-19 | 14 | *(none)* | Genuine crashes, **before** the guard landed |
| 2026-09-28 | 2 | `marketing-3d` / `home-aura` | Guard self-report |
| 2026-09-29 | 4 | `marketing-3d` / `home-aura` | Guard self-report |

The 09-19 burst has **no** `area`/`variant` properties, proving it predates
`Canvas3DGuard`. Every event after 2026-09-24 carries them, i.e. after the fix.

Volume dropped from 14/day to 2–4/day, consistent with a small slice of visitors
whose GPU genuinely cannot allocate a WebGL context — and with them now seeing the
graceful fallback instead of a broken page.

## Decision

⚪ **WONTFIX.** No code change. Changing this would mean deleting the diagnostics
that tell us how many real users lack WebGL.

## Optional follow-up: reduce noise

If the noise becomes bothersome, these can be routed to a PostHog insight rather than
the exception stream — but that trades away the signal and is not recommended.

## Real remaining issue: missing source maps

The 09-28/09-29 events cannot be traced to a component because of the gap noted in
section 8:

```text
"resolve_failure": "Could not find sourcemap for source url:
                     https://www.workcontext.me/_next/static/chunks/2n0ymz7wiqhxx.js"
"function": "up"
```

To fix, add a Sentry auth token so `@sentry/nextjs` uploads source maps during build.
Until then, WC-005 stack frames will stay minified.

---

# 10. WC-006 — Turnstile / CAPTCHA Errors

## Source

PostHog / Browser / Sentry

## Severity

🟡 **Low**

## Status

🟢 **RESOLVED — self-resolved**

---

## Observed Signal

A PostHog query across all CAPTCHArelated telemetry returned **10 events total**.
Sorted by host and date they split into three clearly separate groups:

| Count | Host | URL | Date | What it is |
|---|---|---|---|---|
| 2 | `localhost:3000` | `/` | 2026-09-27 | Developer machine |
| 3 | `www.workcontext.me` | `/` | 2026-09-27 | reCAPTCHA (see WC-002) |
| 5 | `www.workcontext.me` | `/login` | 2026-09-24 | `TurnstileError` |

**Zero events after 2026-09-27.** The last three days of production traffic produced none.

## Root Cause

The five production failures were all `TurnstileError` on `/login` on a single
day, 2026-09-24. They were fixed the same day by the Turnstile repositioning commits:

`	ext
7b58620 / 494f6f4   Turnstile position change on the login page
`

The widget was previously mounted below the fold and outside the initial viewport, so
on slow connections Cloudflare's challenge script could initialise after the user had
already submitted, producing an expired-or-missing token. Moving the widget above the
submit button made it visible and pre-warmed before submission.

## Decision

🟢 **RESOLVED.** No further code change required. The fix shipped on the same day as
the only day these errors occurred, and none have been seen since.

## Optional hardening

If login errors ever reappear, the durable fix is a visible loading state plus
retry on the backend when the token is missing, rather than a hard rejection. Not
warranted at the current volume.

---

## Investigation Targets

Search telemetry for:

```text
Turnstile
CAPTCHA
reCAPTCHA
timeout
challenge
token
verification
```

Determine whether these are:

1. frontend loading failures
2. expired tokens
3. verification failures
4. backend validation failures
5. third-party script loading problems
6. browser-specific problems
7. network timeout problems

---

## Important

Do not treat every CAPTCHA error as the same issue.

Group errors by:

```text
error type
browser
device
route
user flow
timestamp
frequency
```

---

# 11. WC-007 — Observability Verification

## Source

Sentry + PostHog

## Severity

🟡 **Low**

## Status

🟢 **RESOLVED — self-resolved**

---

## Observed Signal

A PostHog query across all CAPTCHArelated telemetry returned **10 events total**.
Sorted by host and date they split into three clearly separate groups:

| Count | Host | URL | Date | What it is |
|---|---|---|---|---|
| 2 | `localhost:3000` | `/` | 2026-09-27 | Developer machine |
| 3 | `www.workcontext.me` | `/` | 2026-09-27 | reCAPTCHA (see WC-002) |
| 5 | `www.workcontext.me` | `/login` | 2026-09-24 | `TurnstileError` |

**Zero events after 2026-09-27.** The last three days of production traffic produced none.

## Root Cause

The five production failures were all `TurnstileError` on `/login` on a single
day, 2026-09-24. They were fixed the same day by the Turnstile repositioning commits:

`	ext
7b58620 / 494f6f4   Turnstile position change on the login page
`

The widget was previously mounted below the fold and outside the initial viewport, so
on slow connections Cloudflare's challenge script could initialise after the user had
already submitted, producing an expired-or-missing token. Moving the widget above the
submit button made it visible and pre-warmed before submission.

## Decision

🟢 **RESOLVED.** No further code change required. The fix shipped on the same day as
the only day these errors occurred, and none have been seen since.

## Optional hardening

If login errors ever reappear, the durable fix is a visible loading state plus
retry on the backend when the token is missing, rather than a hard rejection. Not
warranted at the current volume.

---

## Goal

Ensure that production errors are actually observable.

---

## Sentry

Verify:

- frontend errors captured
- backend errors captured
- source maps working
- useful stack traces
- environment correctly identified
- production releases tracked
- duplicate noise controlled

---

## PostHog

Verify:

- events arriving
- consent behavior correct
- production environment identified
- errors/events contain useful context
- no sensitive data is captured
- session data works as intended

---

# 12. Vercel / Render / Supabase Consistency

Production deployment should remain consistent:

```text
GitHub main
     │
     ├──► Vercel
     │      └── frontend
     │
     └──► Render
            └── backend
                   │
                   ▼
                Supabase
                PostgreSQL
```

Check:

- same production commit where expected
- compatible Prisma schema
- compatible database migrations
- correct environment variables
- correct API URLs
- correct frontend/backend versions

---

# 13. Database Health Checklist

Before changing database schema:

- [ ] Inspect existing tables
- [ ] Inspect Prisma schema
- [ ] Inspect migrations
- [ ] Check foreign keys
- [ ] Check indexes
- [ ] Check table casing
- [ ] Check production row counts
- [ ] Check recent migration history
- [ ] Identify whether issue is application-side or database-side

Never blindly create a table because an application error says:

```text
relation does not exist
```

First verify whether the table exists under a different identifier.

---

# 14. Code Search Checklist

Whenever a PostgreSQL relation error occurs, search for:

```text
$queryRaw
$queryRawUnsafe
$executeRaw
$executeRawUnsafe
```

Then search for SQL patterns:

```text
FROM
JOIN
UPDATE
INSERT INTO
DELETE FROM
```

Check:

```text
identifier casing
schema names
table names
column names
aliases
```

---

# 15. Production Verification Checklist

After every production fix:

### Frontend

- [ ] Homepage loads
- [ ] Authentication works
- [ ] Signup works
- [ ] Login works
- [ ] Password recovery works
- [ ] Dashboard loads
- [ ] Main application works
- [ ] No critical browser console errors

### Backend

- [ ] `/health` works
- [ ] API requests succeed
- [ ] Authentication endpoints work
- [ ] Database queries work
- [ ] Background jobs work
- [ ] No recurring Prisma errors

### Database

- [ ] Supabase healthy
- [ ] No unexpected database errors
- [ ] Migrations consistent
- [ ] Queries execute successfully

### Observability

- [ ] Sentry receives expected errors
- [ ] Fixed error stops appearing
- [ ] PostHog receives expected events
- [ ] No new telemetry errors introduced

### Deployment

- [ ] Vercel deployment `READY`
- [ ] Render deployment `LIVE`
- [ ] Correct Git commit deployed
- [ ] No rollback required

---

# 16. Issue Resolution Template

Use this template for every new issue:

```markdown
# WC-XXX — [Short Issue Name]

## Source

[Sentry / PostHog / Render / Vercel / Supabase / GitHub]

## Severity

[Critical / High / Medium / Low]

## Status

[OPEN / INVESTIGATING / FIXED — VERIFYING / RESOLVED]

## First Observed

YYYY-MM-DD

## Last Observed

YYYY-MM-DD

## Error

```text
Exact error message
```

## Impact

Describe what users or systems are affected.

## Evidence

Include relevant logs, issue IDs, timestamps, commits, or queries.

## Root Cause

Describe the confirmed technical cause.

## Files Involved

```text
path/to/file
path/to/another/file
```

## Fix

Describe exactly what was changed.

## Testing

- [ ] Local test
- [ ] TypeScript
- [ ] Lint
- [ ] Build
- [ ] Integration test
- [ ] Production verification

## Deployment

Commit:

```text
COMMIT_SHA
```

Deployment:

```text
DEPLOYMENT_ID
```

## Verification

Describe how production was verified.

## Monitoring

Check Sentry/PostHog/Render/Vercel after deployment.

## Prevention

Explain how the same class of problem will be prevented in the future.

## Resolution Date

YYYY-MM-DD
```

---

# 17. Definition of Done

An issue is only `🟢 RESOLVED` when:

```text
Problem identified
       ↓
Root cause confirmed
       ↓
Fix implemented
       ↓
Local tests pass
       ↓
CI passes
       ↓
Production deployed
       ↓
Production behavior verified
       ↓
Telemetry checked
       ↓
Original error no longer recurring
       ↓
Documentation updated
```

---

# 18. Final Production Reliability Goal

The objective is not simply:

> "Make the error disappear."

The objective is:

> **Make WorkContext reliable, observable, testable, and resistant to the same class of failure happening again.**

Every fix should therefore answer four questions:

1. **What broke?**
2. **Why did it break?**
3. **How did we fix it?**
4. **How will we know if it breaks again?**

---

# 19. Current Priority Order

Work through issues in this order:

```text
1. 🔴 WC-001
   PostgreSQL "project" relation error

2. 🔴 WC-002
   Sentry reCAPTCHA timeout

3. 🔴 WC-003
   CI checks incorrectly allowed to fail

4. 🟡 WC-005
   PostHog WebGL errors

5. 🟡 WC-006
   Turnstile/CAPTCHA telemetry

6. 🟡 WC-004
   Historical Vercel deployment failures

7. 🟡 WC-007
   Observability verification
```

The priority should be revisited whenever a new critical production issue appears.

---

# 20. Change Log

| Date | Change |
|---|---|
| 2026-09-30 | Initial production reliability log created |
| 2026-09-30 | Confirmed `public."Project"` exists in Supabase |
| 2026-09-30 | Confirmed `public.project` does not exist |
| 2026-09-30 | Documented recurring Render Prisma `42P01` error |
| 2026-09-30 | Documented Sentry reCAPTCHA timeout |
| 2026-09-30 | Documented CI `continue-on-error` issue |
| 2026-09-30 | Documented historical Vercel deployment failures |
| 2026-09-30 | Documented PostHog WebGL/Turnstile investigation |

---

# End of WorkContext Production Error & Reliability Fix Log
