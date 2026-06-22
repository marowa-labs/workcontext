# Plunk Email Service Setup Guide

## Quick Start

### 1. Create Plunk Account
Visit https://useplunk.com and sign up for a free account.

### 2. Get Your API Keys

Plunk provides **two types** of API keys:

| Key Type | Prefix | Use Case | Location |
|----------|--------|----------|----------|
| **Secret API Key** | `sk_` | Backend email sending | ✅ **USE THIS** |
| **Public API Key** | `pk_` | Client-side tracking | ❌ Don't use for backend |

**To get your Secret API Key:**
1. Log in to Plunk dashboard
2. Click on **Settings** (gear icon)
3. Navigate to **API Keys**
4. Copy the **Secret API Key** (starts with `sk_`)

### 3. Add to Environment Variables

Create or update your `backend/.env` file:

```bash
# ✅ CORRECT - Secret API Key
PLUNK_API_KEY=sk_1234567890abcdefghijklmnopqrstuvwxyz

# ❌ WRONG - Don't use Public API Key
# PLUNK_API_KEY=pk_1234567890abcdefghijklmnopqrstuvwxyz
```

### 4. Install Dependencies

```bash
cd backend
npm install --legacy-peer-deps
```

### 5. Test the Integration

Start your backend server:
```bash
npm run dev
```

Test email sending:
```bash
# Test signup (sends OTP email)
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","fullName":"Test User","password":"password123"}'
```

## API Key Security ⚠️

### DO ✅
- Use Secret API Key (`sk_`) for backend
- Store in `.env` file (never commit to git)
- Keep it private and secure
- Rotate if compromised

### DON'T ❌
- Use Public API Key (`pk_`) for backend
- Expose Secret API Key in frontend code
- Commit API keys to version control
- Share API keys publicly

## Domain Configuration (Optional)

To send emails from your own domain (`email.WorkContext.ai`):

### Step 1: Add Domain in Plunk
1. Go to Plunk dashboard → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `email.WorkContext.ai`

### Step 2: Add DNS Records
Add these DNS records to your domain:

```
Type: TXT
Host: email.WorkContext.ai
Value: [Provided by Plunk]

Type: CNAME
Host: plunk._domainkey.email.WorkContext.ai
Value: [Provided by Plunk]

Type: MX
Host: email.WorkContext.ai
Value: [Provided by Plunk]
```

### Step 3: Verify
- Wait for DNS propagation (5-30 minutes)
- Click **Verify** in Plunk dashboard
- Once verified, emails will show as from `noreply@email.WorkContext.ai`

## Troubleshooting

### Issue: "Plunk client not initialized"
**Solution:** Make sure `PLUNK_API_KEY` is set in your `.env` file and the server is restarted.

### Issue: "Invalid API Key"
**Solution:** 
1. Verify you're using the **Secret API Key** (starts with `sk_`)
2. Check for extra spaces or quotes in `.env`
3. Restart the server after updating `.env`

### Issue: Emails not sending
**Solution:**
1. Check server logs for errors
2. Verify API key is correct
3. Check Plunk dashboard for delivery status
4. Ensure recipient email is valid

### Issue: Emails going to spam
**Solution:**
1. Verify your sending domain
2. Add SPF, DKIM, and DMARC records
3. Warm up your sending domain gradually
4. Use consistent "from" addresses

## Monitoring

### Check Email Delivery
1. Log in to Plunk dashboard
2. Go to **Emails** section
3. View delivery status, opens, clicks
4. Check bounce and spam reports

### Dashboard Metrics
- **Sent:** Total emails sent
- **Delivered:** Successfully delivered
- **Opened:** Emails opened by recipients
- **Clicked:** Links clicked in emails
- **Bounced:** Failed deliveries
- **Complained:** Spam reports

## API Usage Limits

Plunk free tier includes:
- **3,000 emails/month**
- Unlimited contacts
- All features included

For higher volumes, upgrade to a paid plan.

## Support Resources

- **Documentation:** https://docs.useplunk.com
- **Dashboard:** https://app.useplunk.com
- **Support Email:** support@useplunk.com
- **Status Page:** https://status.useplunk.com

## Migration Checklist

- [ ] Sign up for Plunk account
- [ ] Get Secret API Key (starts with `sk_`)
- [ ] Add `PLUNK_API_KEY` to `backend/.env`
- [ ] Run `npm install --legacy-peer-deps`
- [ ] Restart backend server
- [ ] Test signup email flow
- [ ] Test password reset email
- [ ] (Optional) Configure custom domain
- [ ] (Optional) Verify domain in Plunk
- [ ] Monitor email delivery in dashboard

---

**Last Updated:** 2026-05-30

