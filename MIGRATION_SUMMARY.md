# Email System Summary

## Status: Rework Complete

Transactional email runs on **Plunk** with **react-email** templates. Marketing signups sync to **EmailOctopus** as an independent side-channel. Supabase auth emails are unchanged.

### Files Modified

1. **`backend/src/services/emailService.ts`**
   - Rewritten on the Plunk SDK with `from: noreply@workcontext.me` / `name: "WorkContext"`
   - Renders react-email templates; awaited Plunk client init (fixed race condition)
   - Removed dead payment/subscription methods

2. **`backend/src/services/emailOctopusService.ts`** (new)
   - `addContactToList()` → EmailOctopus contact API, graceful skip without config, dedup handled
   - `updateContactLastLogin()` / `updateContactFields()` → PUT update addressed by MD5 hash of lowercase email

3. **`backend/src/api/auth/hybrid-route.ts`**
   - Splits `fullName` into first/last and syncs new signups to EmailOctopus
   - On login, stamps `Last_Login_Date` via `updateContactLastLogin` (drives the re-engagement automation)

4. **`backend/src/api/workspaces/index.ts`**
   - Team invites now use `sendTeamInvitationEmail` (Plunk) instead of Supabase `inviteUserByEmail`

5. **`backend/src/services/securityNotificationService.ts`**
   - Security alerts render `SecurityEmailTemplate` via `sendSecurityAlertEmail`

6. **`backend/src/services/contactService.ts`**
   - Removed broken inline HTML body; uses notification template via Plunk

7. **`backend/src/services/secrets-service.ts`**
   - Removed stale `getResendApiKey()`; added `getEmailOctopusApiKey()` / `getEmailOctopusListId()`

8. **`backend/.env.example`**
   - Added `EMAILOCTOPUS_API_KEY`, `EMAILOCTOPUS_LIST_ID`

9. **`backend/package.json`**
   - Added `@react-email/components`, `@react-email/render` (Plunk already present)

### New Files

- `backend/src/templates/emails/EmailLayout.tsx` (shared layout + CTAButton/BodyText/SmallNote)
- `backend/src/templates/emails/OTPEmailTemplate.tsx`
- `backend/src/templates/emails/WelcomeEmailTemplate.tsx`
- `backend/src/templates/emails/NotificationEmailTemplate.tsx`
- `backend/src/templates/emails/TeamInvitationEmailTemplate.tsx`
- `backend/src/templates/emails/SecurityEmailTemplate.tsx`
- `backend/src/templates/renderEmail.ts`

### Email Methods

| Method | Purpose |
|--------|---------|
| `sendOTPEmail` | Verification codes |
| `sendWelcomeEmail` | New user welcome |
| `sendNotificationEmail` | General notifications |
| `sendTeamInvitationEmail` | Team invites |
| `sendSecurityAlertEmail` | Security alerts |
| `sendCustomEmail` | Arbitrary HTML |

Payment/subscription methods (`sendPaymentSuccessEmail`, etc.) never existed in the codebase and are removed.

### Next Steps

1. `npm install` in `backend` (updates `package-lock.json`)
2. Add `EMAILOCTOPUS_API_KEY` + `EMAILOCTOPUS_LIST_ID` to production env
3. Verify `workcontext.me` in the Plunk dashboard
4. Test signup (welcome + EmailOctopus), OTP, team invite, and security-alert flows

---

**Note:** docs claiming "10 methods migrated" were inaccurate — 4 of the listed methods never existed, and `sendTeamInvitationEmail` was previously dead code (invites went through Supabase). Both are now corrected.
