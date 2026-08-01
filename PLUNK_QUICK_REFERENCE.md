# Plunk Email - Quick Reference Card

## 🔑 API Keys

```
Secret API Key (Backend)  → sk_xxxxxxxxxxxxx ✅ USE THIS
Public API Key (Frontend) → pk_xxxxxxxxxxxxx ❌ NOT for backend
```

## 📝 Environment Setup

**File:** `backend/.env`
```bash
# Transactional email (Plunk)
PLUNK_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Marketing list (EmailOctopus - separate side-channel from Plunk)
EMAILOCTOPUS_API_KEY=your_emailoctopus_api_key
EMAILOCTOPUS_LIST_ID=your_emailoctopus_list_id
```

All Plunk emails send from `noreply@workcontext.me` (`name: "WorkContext"`).

## 🚀 Installation

```bash
cd backend
npm install
npm run dev
```

## 📧 Available Email Methods

```typescript
// 1. OTP/Verification
await EmailService.sendOTPEmail(email, otp, fullName);

// 2. Welcome Email
await EmailService.sendWelcomeEmail(email, fullName);

// 3. Notifications
await EmailService.sendNotificationEmail(email, fullName, subject, message, type);

// 4. Team Invitation
await EmailService.sendTeamInvitationEmail(
  email, inviterName, workspaceName, invitationLink, role
);

// 5. Security Alert (new device, password/email change)
await EmailService.sendSecurityAlertEmail(
  to, subject, alertTitle, message, details, fullName
);

// 6. Custom HTML
await EmailService.sendCustomEmail(email, subject, htmlBody);
```

**Removed (never existed as callable paths):** `sendPasswordResetEmail`, `sendProfileUpdateOTPEmail`, `sendSubscriptionConfirmationEmail`, `sendPaymentSuccessEmail`, `sendPaymentFailedEmail`, `sendSubscriptionCancelledEmail`. Password resets / profile OTPs are handled by Supabase Auth directly.

## 📧 Marketing List (EmailOctopus)

```typescript
// Sync a signup to the EmailOctopus list (fire-and-forget)
await EmailOctopusService.addContactToList({
  emailAddress: "user@example.com",
  firstName: "Jane",
  lastName: "Doe",
});

// Stamp Last_Login_Date on login/activity (fire-and-forget, drives re-engagement automation)
await EmailOctopusService.updateContactLastLogin("user@example.com");

// Generic custom-field update (contact addressed by MD5 hash of lowercase email)
await EmailOctopusService.updateContactFields("user@example.com", {
  Last_Login_Date: "2026-08-01",
});
```

- Independent of Plunk and Supabase - no mail provider is configured for EmailOctopus in Supabase.
- Wired into signup completion in `backend/src/api/auth/hybrid-route.ts` (first/last name split from `fullName`).
- Wired into login (`PUT /api/auth/hybrid/signin` and `POST /api/auth/signin`) to update `Last_Login_Date`.
- Skips gracefully when `EMAILOCTOPUS_API_KEY` / `EMAILOCTOPUS_LIST_ID` are unset.

## 🔍 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Client not initialized" | Check `.env` has `PLUNK_API_KEY=sk_...` |
| "Invalid API key" | Use Secret Key (sk_), not Public Key (pk_) |
| Emails not sending | Check Plunk dashboard for status |
| Emails in spam | Verify `workcontext.me` in Plunk settings |
| No marketing sync | Check `EMAILOCTOPUS_API_KEY` + `EMAILOCTOPUS_LIST_ID` |

## 📊 Where to Find Things

- **Dashboard:** https://app.useplunk.com
- **API Keys:** Dashboard → Settings → API Keys
- **Domains:** Dashboard → Settings → Domains
- **Email Logs:** Dashboard → Emails
- **Docs:** https://docs.useplunk.com
- **EmailOctopus:** https://emailoctopus.com (Lists → your list → settings for List ID/API)

## 🎯 Free Tier Limits

- Plunk: 3,000 emails/month, unlimited contacts, all features included
- EmailOctopus: free tier (2,500 subscribers, 10,000 sends/month)

## 📚 Documentation Files

- `PLUNK_SETUP_GUIDE.md` - Detailed setup instructions
- `PLUNK_MIGRATION.md` - Full migration guide
- `MIGRATION_SUMMARY.md` - Quick summary

---

**Need Help?** support@useplunk.com
