# SendGrid Email Service Setup Instructions

## Complete SendGrid Configuration for TruthLens

Your email system is currently failing with a 403 Forbidden error. This means your SendGrid API key doesn't have the proper permissions or configuration. Follow these steps exactly:

## Step 1: SendGrid Account Setup

1. **Go to SendGrid Dashboard**: https://app.sendgrid.com/
2. **Login** to your SendGrid account
3. If you don't have an account, create one at https://signup.sendgrid.com/

## Step 2: Create API Key with Correct Permissions

1. **Navigate to Settings → API Keys** in the SendGrid dashboard
2. **Click "Create API Key"**
3. **Choose "Restricted Access"** (NOT "Full Access" for security)
4. **Set the following permissions**:
   - **Mail Send**: Full Access ✅
   - **Marketing**: No Access
   - **Stats**: Read Access (optional)
   - **Suppressions**: Read Access (optional)
   - **User Account**: No Access
   - **Webhook**: No Access

5. **Name your API key**: "TruthLens Production" or similar
6. **Click "Create & View"**
7. **COPY THE API KEY IMMEDIATELY** - you won't see it again!

## Step 3: Verify Sender Identity

**THIS IS CRITICAL** - SendGrid requires sender verification:

### Option A: Single Sender Verification (Recommended for testing)
1. **Go to Settings → Sender Authentication → Single Sender Verification**
2. **Click "Create New Sender"**
3. **Fill in the form**:
   - **From Name**: TruthLens
   - **From Email**: Use YOUR email address (e.g., admin@yourdomain.com)
   - **Reply To**: Same as From Email
   - **Company Address**: Your address
4. **Click "Create"**
5. **Check your email** and click the verification link
6. **Wait for approval** (usually instant)

### Option B: Domain Authentication (Recommended for production)
1. **Go to Settings → Sender Authentication → Domain Authentication**
2. **Click "Authenticate Your Domain"**
3. **Enter your domain** (e.g., yourdomain.com)
4. **Follow DNS setup instructions** provided by SendGrid
5. **Verify DNS records** are properly configured

## Step 4: Configure Environment Variables

Add these to your Replit Secrets:

1. **SENDGRID_API_KEY**: Your API key from Step 2
2. **FROM_EMAIL**: The verified email from Step 3 (e.g., admin@yourdomain.com)
3. **BASE_URL**: Your deployment URL (e.g., https://your-app.replit.app)

## Step 5: Test Your Configuration

After setting up the environment variables:

1. **Restart your application**
2. **Check the health endpoint**: Visit `/api/health` in your browser
3. **Check email status**: Visit `/api/email/status` 
4. **Send a test email**: Use the `/api/email/test` endpoint

### Using the built-in test endpoints:

```bash
# Check email service status
curl https://your-app-url.replit.app/api/email/status

# Validate email configuration
curl -X POST https://your-app-url.replit.app/api/email/validate

# Send test email (requires authentication)
curl -X POST https://your-app-url.replit.app/api/email/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

## Step 6: Troubleshooting Common Issues

### 403 Forbidden Error
- **Cause**: API key lacks Mail Send permissions
- **Solution**: Recreate API key with "Mail Send: Full Access"

### 402 Payment Required
- **Cause**: SendGrid account needs payment method
- **Solution**: Add payment method in SendGrid dashboard

### Sender Identity Not Verified
- **Cause**: FROM_EMAIL not verified in SendGrid
- **Solution**: Complete Single Sender Verification or Domain Authentication

### DNS Issues (Domain Authentication)
- **Cause**: DNS records not properly configured
- **Solution**: Check DNS propagation with tools like https://dnschecker.org/

## Step 7: Production Deployment Checklist

Before deploying to production:

- [ ] API key has minimal required permissions (Mail Send only)
- [ ] Domain authentication configured (not single sender)
- [ ] FROM_EMAIL uses your verified domain
- [ ] BASE_URL points to production domain
- [ ] Email templates tested and working
- [ ] Rate limiting configured if needed
- [ ] Monitoring and alerting set up

## Step 8: Monitoring and Maintenance

Your TruthLens application includes built-in email monitoring:

- **Real-time status**: `/api/email/status`
- **Service validation**: `/api/email/validate`
- **Test emails**: `/api/email/test`
- **Health checks**: `/api/health`

Monitor these endpoints regularly to ensure email service reliability.

## Need Help?

If you're still having issues:

1. **Check the application logs** for detailed error messages
2. **Verify all environment variables** are set correctly
3. **Test with the built-in endpoints** to isolate the issue
4. **Contact SendGrid support** if API key issues persist

The email service now includes comprehensive error logging and monitoring to help you identify and resolve issues quickly.