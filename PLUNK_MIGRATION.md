# Email Service Migration: Resend → Plunk

## Overview
The email service has been successfully migrated from **Resend** to **Plunk** email provider.

## Changes Made

### 1. Package Dependencies
**File:** `backend/package.json`
- ❌ Removed: `resend@^6.8.0`
- ✅ Added: `@plunk/node@^3.0.3`

### 2. Email Service Implementation
**File:** `backend/src/services/emailService.ts`
- Completely rewritten to use Plunk SDK instead of Resend
- All email methods now use Plunk's `emails.send()` API
- Email templates remain unchanged (same HTML structure)

### 3. Environment Variables
**Changed from:**
```env
RESEND_API_KEY=your_resend_key
```

**Changed to:**
```env
PLUNK_API_KEY=your_plunk_key
```

### 4. Documentation Updates
- `README.md` - Updated environment variables section
- `CODEBASE_ANALYSIS.md` - Updated notification system details
- `backend/.env.example` - Created with Plunk API key

## Migration Steps for Deployment

### Step 1: Get Plunk Secret API Key
1. Sign up for a Plunk account at https://useplunk.com
2. Navigate to your dashboard
3. Go to **Settings** → **API Keys**
4. Copy your **Secret API Key** (NOT the Public API Key)
   - ⚠️ **Important:** Use the Secret API Key for backend email sending
   - Public API Key is for client-side operations only

### Step 2: Update Environment Variables
Update your `.env` file in the backend:
```bash
# Remove old variable
# RESEND_API_KEY=...

# Add new variable - USE SECRET API KEY
PLUNK_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ Important:** 
- Use the **Secret API Key** (starts with `sk_`)
- Do NOT use the Public API Key (starts with `pk_`)
- Keep the Secret API Key private and never expose it in frontend code

### Step 3: Configure Sending Domain (Optional but Recommended)
1. In Plunk dashboard, go to **Settings** → **Domains**
2. Add your domain: `email.scholarforge.ai`
3. Add the required DNS records to verify ownership
4. Wait for verification

**Note:** Without domain verification, emails will be sent from Plunk's default domain.

### Step 4: Install Dependencies
```bash
cd backend
npm install --legacy-peer-deps
```

### Step 5: Restart Server
```bash
npm run dev  # Development
# or
npm start    # Production
```

## Email Methods Available

All previous email methods are preserved:

1. ✅ `sendOTPEmail(to, otp, fullName)` - Send verification codes
2. ✅ `sendWelcomeEmail(to, fullName)` - Welcome new users
3. ✅ `sendPasswordResetEmail(to, resetLink, fullName)` - Password reset
4. ✅ `sendNotificationEmail(to, fullName, title, message, type)` - General notifications
5. ✅ `sendProfileUpdateOTPEmail(to, otp, isEmailChange)` - Profile update verification
6. ✅ `sendSubscriptionConfirmationEmail(to, fullName, planName, amount, nextBillingDate, transactionId)` - Subscription confirmation
7. ✅ `sendPaymentSuccessEmail(to, fullName, planName, amount, transactionId)` - Payment success
8. ✅ `sendPaymentFailedEmail(to, fullName, planName, amount)` - Payment failure
9. ✅ `sendSubscriptionCancelledEmail(to, fullName, planName, cancellationDate)` - Cancellation
10. ✅ `sendTeamInvitationEmail(to, inviterName, workspaceName, invitationLink)` - Team invites

## API Differences: Resend vs Plunk

### Resend (Old)
```typescript
const { data, error } = await resend.emails.send({
  from: "ScholarForge AI<noreply@email.scholarforge.ai>",
  to: email,
  subject: "Subject",
  html: htmlContent,
});
```

### Plunk (New)
```typescript
const success = await plunk.emails.send({
  to: email,
  subject: "Subject",
  body: htmlContent,
});
```

**Key Differences:**
- Plunk doesn't require `from` field (uses project default or verified domain)
- Plunk returns boolean `success` instead of `{ data, error }` object
- Plunk uses `body` instead of `html` for content

## Testing

To test the email service:

```bash
# In backend directory
npm run dev
```

Test endpoints:
- POST `/api/auth/signup` - Triggers OTP email
- POST `/api/auth/forgot-password` - Triggers password reset email
- POST `/api/auth/verify-email` - Triggers verification email

## Benefits of Plunk

1. **Simpler API** - Less boilerplate code
2. **Better deliverability** - Modern email infrastructure
3. **Lower cost** - More generous free tier
4. **Better analytics** - Built-in email tracking
5. **Easier setup** - Simplified domain verification

## Rollback Plan

If you need to rollback to Resend:

1. Restore `backend/package.json`:
   ```bash
   npm install resend@^6.8.0 --legacy-peer-deps
   npm uninstall @plunk/node --legacy-peer-deps
   ```

2. Restore the old `emailService.ts` from git:
   ```bash
   git checkout HEAD -- backend/src/services/emailService.ts
   ```

3. Update environment variables back to `RESEND_API_KEY`

## Support

- **Plunk Documentation:** https://docs.useplunk.com
- **Plunk Support:** support@useplunk.com
- **Plunk Dashboard:** https://app.useplunk.com

## Verification Checklist

- [x] Package dependencies updated
- [x] Email service rewritten for Plunk
- [x] Environment variables updated
- [x] Documentation updated
- [x] .env.example created
- [ ] **TODO:** Install dependencies (`npm install`)
- [ ] **TODO:** Update production environment variables
- [ ] **TODO:** Verify domain in Plunk dashboard
- [ ] **TODO:** Test all email methods
- [ ] **TODO:** Monitor email delivery rates
