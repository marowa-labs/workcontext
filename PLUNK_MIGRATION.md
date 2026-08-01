# Email Service: Plunk + React Email + EmailOctopus

## Overview
WorkContext sends transactional email via **Plunk** (using the Plunk SDK) with templates built in **react-email**. Signup contacts are synced to the **EmailOctopus** marketing list as a separate, independent side-channel (no mail provider is configured for EmailOctopus inside Supabase). Supabase handles auth emails via its own SMTP (`noreply@workcontext.me`).

## Architecture

```
Transactional emails  →  Plunk SDK (@plunk/node)  +  react-email templates
                         FROM: noreply@workcontext.me (Plunk verified domain)

Marketing/newsletter →  EmailOctopus contact API (POST /lists/:listId/contacts)
                         Fired on signup (email + first/last name), independent of Plunk/Supabase

Supabase auth emails →  Supabase SMTP (noreply@workcontext.me) - unchanged
```

## Changes Made

### 1. Package Dependencies
**File:** `backend/package.json`
- ✅ Added: `@plunk/node@^3.0.3`
- ✅ Added: `@react-email/components@^1.0.12`
- ✅ Added: `@react-email/render@^2.1.0`

### 2. Email Templates (react-email)
**Directory:** `backend/src/templates/emails/`

| Template | Purpose |
|----------|---------|
| `EmailLayout.tsx` | Shared layout (header image, heading, body, footer) + `CTAButton`, `BodyText`, `SmallNote` |
| `OTPEmailTemplate.tsx` | Verification codes |
| `WelcomeEmailTemplate.tsx` | New user welcome |
| `NotificationEmailTemplate.tsx` | General notifications |
| `TeamInvitationEmailTemplate.tsx` | Team invites |
| `SecurityEmailTemplate.tsx` | Security alerts (new device, password/email change) |

- `backend/src/templates/renderEmail.ts` - renders a template to final HTML (also `renderPreview`/`renderPlainText`)

### 3. Email Service Implementation
**File:** `backend/src/services/emailService.ts`
- Uses Plunk SDK with `from: noreply@workcontext.me` and `name: "WorkContext"`
- Renders react-email templates via `renderEmail`
- Fixed race condition: Plunk client is initialized once (`plunkPromise`) and awaited before each send (`getPlunk()`)
- Removed dead payment/subscription methods that never existed in the codebase

### 4. EmailOctopus Service
**File:** `backend/src/services/emailOctopusService.ts`
- `addContactToList({ emailAddress, firstName, lastName, tags, status })`
- Calls `POST https://emailoctopus.com/api/1.6/lists/:listId/contacts`
- Skips gracefully if `EMAILOCTOPUS_API_KEY`/`EMAILOCTOPUS_LIST_ID` not configured
- Treats `MEMBER_EXISTS_WITH_EMAIL_ADDRESS` as expected (log at info, return true)

### 5. Signup Integration
**File:** `backend/src/api/auth/hybrid-route.ts`
- On signup completion, full name is split into first/last and pushed to EmailOctopus (fire-and-forget, alongside the Plunk welcome email)

### 6. Team Invitations
**File:** `backend/src/api/workspaces/index.ts`
- `POST /api/workspaces/:id/invite` now sends via `EmailService.sendTeamInvitationEmail` (Plunk) instead of Supabase `inviteUserByEmail`

### 7. Security Notifications
**File:** `backend/src/services/securityNotificationService.ts`
- New-device / password-change / email-change alerts now render `SecurityEmailTemplate` via `sendSecurityAlertEmail` with structured details (Device, IP, Location, Time)

### 8. Environment Variables
```env
PLUNK_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAILOCTOPUS_API_KEY=your_emailoctopus_api_key
EMAILOCTOPUS_LIST_ID=your_emailoctopus_list_id
```

## Deployment Setup

### Step 1: Plunk Secret API Key
1. Sign up at https://useplunk.com
2. **Settings** → **API Keys** → copy the **Secret API Key** (`sk_...`), NOT the Public key (`pk_...`)

### Step 2: Configure Sending Domain
1. Plunk dashboard → **Settings** → **Domains**
2. Add `workcontext.me`, add required DNS records, wait for verification
3. Transactional sends use `noreply@workcontext.me`

**Note:** Without verification, emails send from Plunk's default domain.

### Step 3: EmailOctopus
1. Create a list in EmailOctopus
2. Copy the list ID and an API key
3. Add `EMAILOCTOPUS_API_KEY` and `EMAILOCTOPUS_LIST_ID` to env
4. Optional: set up a dedicated sending domain for marketing (recommended for deliverability)

### Step 4: Install Dependencies
```bash
cd backend
npm install
```

### Step 5: Restart Server
```bash
npm run dev  # Development
npm start    # Production
```

## Email Methods Available

| Method | Description |
|--------|-------------|
| `sendOTPEmail(to, otp, fullName)` | Verification codes |
| `sendWelcomeEmail(to, fullName)` | New user welcome |
| `sendNotificationEmail(to, fullName, subject, message, type)` | General notifications |
| `sendTeamInvitationEmail(to, inviterName, workspaceName, invitationLink, role)` | Team invites |
| `sendSecurityAlertEmail(to, subject, alertTitle, message, details, fullName)` | Security alerts |
| `sendCustomEmail(to, subject, htmlBody)` | Arbitrary pre-rendered HTML |

Removed (never existed as callable paths): `sendPaymentSuccessEmail`, `sendPaymentFailedEmail`, `sendPasswordResetEmail`, `sendProfileUpdateOTPEmail`, `sendSubscriptionConfirmationEmail`, `sendSubscriptionCancelledEmail`. Password resets and profile OTPs are handled by Supabase Auth directly.

## Plunk Send Shape

```typescript
const success = await plunk.emails.send({
  to,            // string | string[]
  subject,
  body,          // HTML from react-email render
  from,          // noreply@workcontext.me
  name,          // "WorkContext"
});
```
- Plunk returns `{ success: true }` on success; failures throw.

## Testing

```bash
cd backend
npm run dev
```

Test flows:
- `POST /api/auth/hybrid/complete-signup` → welcome email (Plunk) + EmailOctopus contact sync
- `POST /api/auth/signup` / OTP → OTP email (Plunk)
- `POST /api/workspaces/:id/invite` → team invitation (Plunk)
- Sign in from new device → security alert (Plunk)

## Verification Checklist

- [x] Plunk SDK installed and email service rewritten
- [x] react-email templates created and rendering
- [x] `from` address set to `noreply@workcontext.me`
- [x] Plunk race condition fixed (awaited client init)
- [x] Payment/subscription dead methods removed
- [x] EmailOctopus service created and wired at signup
- [x] Team invitations moved from Supabase to Plunk
- [x] `.env.example` updated
- [ ] Install dependencies (`npm install`)
- [ ] Verify `workcontext.me` in Plunk dashboard
- [ ] Configure EmailOctopus list + API key
- [ ] Test all email flows
- [ ] Monitor delivery rates
