# Email Service Setup Guide

This guide will help you configure the email service to send real verification emails to users.

## 🚀 Quick Setup Options

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password:**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. **Set Environment Variables:**
   ```bash
   export SMTP_HOST=smtp.gmail.com
   export SMTP_PORT=587
   export SMTP_USER=your-email@gmail.com
   export SMTP_PASS=your-16-digit-app-password
   export SMTP_FROM="CUHK Course Planner <your-email@gmail.com>"
   ```

### Option 2: SendGrid (Recommended for Production)

1. **Create a SendGrid account** at https://sendgrid.com
2. **Verify your sender domain** or use single sender verification
3. **Generate an API key** with "Mail Send" permissions
4. **Set Environment Variables:**
   ```bash
   export SMTP_HOST=smtp.sendgrid.net
   export SMTP_PORT=587
   export SMTP_USER=apikey
   export SMTP_PASS=your-sendgrid-api-key
   export SMTP_FROM="CUHK Course Planner <noreply@yourdomain.com>"
   ```

### Option 3: AWS SES (Enterprise)

1. **Set up AWS SES** in your AWS account
2. **Verify your email domain** or individual email addresses
3. **Create SMTP credentials**
4. **Set Environment Variables:**
   ```bash
   export SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   export SMTP_PORT=587
   export SMTP_USER=your-ses-smtp-username
   export SMTP_PASS=your-ses-smtp-password
   export SMTP_FROM="CUHK Course Planner <noreply@yourdomain.com>"
   ```

## 📧 Environment Variables

Create a `.env` file in your server directory:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-or-api-key
SMTP_FROM="CUHK Course Planner <noreply@cuhk-course-planner.com>"

# Other configurations...
MONGODB_URI=mongodb://localhost:27017/cuhk-course-planner
JWT_SECRET=your-secret-key
```

## 🔧 Testing Email Service

Run the test script to verify your email configuration:

```bash
cd server
node -e "
const emailService = require('./services/emailService');
emailService.testConnection().then(result => {
  console.log('Connection test:', result ? 'PASSED' : 'FAILED');
  if (result) {
    emailService.sendVerificationEmail('test@example.com', 'test-token', 'http://localhost:3002')
      .then(res => console.log('Email test:', res.success ? 'PASSED' : 'FAILED'))
      .catch(err => console.error('Email test failed:', err.message));
  }
});
"
```

## 📊 Email Service Features

### ✅ **Production Ready**
- **Connection pooling** for high throughput
- **Rate limiting** to prevent spam flags
- **Error handling** and retry logic
- **HTML and text email templates**

### ✅ **Scalable**
- **Multiple SMTP providers** supported
- **Load balancing** ready
- **Monitoring** and logging

### ✅ **User Friendly**
- **Professional email templates**
- **Mobile responsive** design
- **Clear call-to-action** buttons

## 🛡️ Security Best Practices

1. **Use App Passwords** instead of regular passwords
2. **Enable 2FA** on your email account
3. **Use environment variables** for sensitive data
4. **Monitor email sending** for abuse
5. **Set up SPF/DKIM** records for your domain

## 📈 Monitoring and Logs

The email service provides detailed logging:

```javascript
// Successful email
✅ Verification email sent successfully to: user@example.com
📧 Message ID: <abc123@your-domain.com>

// Connection status
✅ Email service is ready and connected

// Errors
❌ Email service connection failed: Authentication failed
```

## 🔄 Email Templates

The system includes:
- **HTML email template** with professional design
- **Plain text fallback** for accessibility
- **Branded styling** with CUHK Course Planner colors
- **Mobile responsive** layout

## 🚀 Deployment Checklist

- [ ] SMTP credentials configured
- [ ] Email templates tested
- [ ] Rate limits configured
- [ ] Error handling tested
- [ ] Monitoring set up
- [ ] SPF/DKIM records configured (for production)

## 📞 Support

If you encounter issues:

1. **Check SMTP credentials** are correct
2. **Verify network connectivity** to SMTP server
3. **Check email provider limits** and quotas
4. **Review server logs** for detailed error messages
5. **Test with a simple email client** first

## 💡 Tips

- **Start with Gmail** for development and testing
- **Move to SendGrid/AWS SES** for production
- **Monitor email delivery rates** and bounce rates
- **Set up email analytics** to track engagement
- **Use a dedicated email domain** for production 