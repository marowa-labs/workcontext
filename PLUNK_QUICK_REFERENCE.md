# Plunk Email - Quick Reference Card

## 🔑 API Keys

```
Secret API Key (Backend)  → sk_xxxxxxxxxxxxx ✅ USE THIS
Public API Key (Frontend) → pk_xxxxxxxxxxxxx ❌ NOT for backend
```

## 📝 Environment Setup

**File:** `backend/.env`
```bash
PLUNK_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🚀 Installation

```bash
cd backend
npm install --legacy-peer-deps
npm run dev
```

## 📧 Available Email Methods

```typescript
// 1. OTP/Verification
await EmailService.sendOTPEmail(email, otp, fullName);

// 2. Welcome Email
await EmailService.sendWelcomeEmail(email, fullName);

// 3. Password Reset
await EmailService.sendPasswordResetEmail(email, resetLink, fullName);

// 4. Notifications
await EmailService.sendNotificationEmail(email, fullName, title, message);

// 5. Profile Update OTP
await EmailService.sendProfileUpdateOTPEmail(email, otp, isEmailChange);

// 6. Subscription Confirmed
await EmailService.sendSubscriptionConfirmationEmail(
  email, fullName, planName, amount, nextBillingDate, transactionId
);

// 7. Payment Success
await EmailService.sendPaymentSuccessEmail(
  email, fullName, planName, amount, transactionId
);

// 8. Payment Failed
await EmailService.sendPaymentFailedEmail(email, fullName, planName, amount);

// 9. Subscription Cancelled
await EmailService.sendSubscriptionCancelledEmail(
  email, fullName, planName, cancellationDate
);

// 10. Team Invitation
await EmailService.sendTeamInvitationEmail(
  email, inviterName, workspaceName, invitationLink
);
```

## 🔍 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Client not initialized" | Check `.env` has `PLUNK_API_KEY=sk_...` |
| "Invalid API key" | Use Secret Key (sk_), not Public Key (pk_) |
| Emails not sending | Check Plunk dashboard for status |
| Emails in spam | Verify domain in Plunk settings |

## 📊 Where to Find Things

- **Dashboard:** https://app.useplunk.com
- **API Keys:** Dashboard → Settings → API Keys
- **Domains:** Dashboard → Settings → Domains
- **Email Logs:** Dashboard → Emails
- **Docs:** https://docs.useplunk.com

## 🎯 Free Tier Limits

- 3,000 emails/month
- Unlimited contacts
- All features included

## 📚 Documentation Files

- `PLUNK_SETUP_GUIDE.md` - Detailed setup instructions
- `PLUNK_MIGRATION.md` - Full migration guide
- `MIGRATION_SUMMARY.md` - Quick summary

---

**Need Help?** support@useplunk.com
