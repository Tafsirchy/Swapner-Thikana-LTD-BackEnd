# Email Configuration Guide

## Required Environment Variables

Add the following variables to your `.env` file in the backend:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
FRONTEND_URL=http://localhost:3000

# For production, use professional email service:
# EMAIL_SERVICE=SendGrid
# SENDGRID_API_KEY=your-key
```

## Gmail Setup (Development)

1. **Enable 2-Factor Authentication** on your Google Account
2. **Generate App Password:**
   - Go to Google Account Settings
   - Security → 2-Step Verification
   - App passwords → Select app → Other
   - Enter "STLTD Properties Backend"
   - Copy the generated 16-character password
3. **Add to .env:**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   ```

## Production Email Services (Recommended)

For production, use a professional email service instead of Gmail:

### Option 1: SendGrid
```javascript
// In emailSender.js
const transporter = nodemailer.createTransporter({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### Option 2: AWS SES
```javascript
const transporter = nodemailer.createTransporter({
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.AWS_SES_USER,
    pass: process.env.AWS_SES_PASSWORD
  }
});
```

### Option 3: Mailgun
```javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.mailgun.org',
  port: 587,
  auth: {
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_PASSWORD
  }
});
```

## Email Templates

Three templates are available:

1. **new-match.html** - Property match notifications
2. **inquiry-confirmation.html** - Inquiry confirmations
3. **welcome.html** - New user welcome emails

## Testing

Test email sending with:
```bash
# In backend directory
node -e "require('./src/utils/emailSender').sendWelcomeEmail({email: 'test@example.com', name: 'Test User'})"
```

## Troubleshooting

**"Invalid login" error:**
- Verify app password (not account password)
- Check 2FA is enabled
- Remove spaces from app password

**Emails not sending:**
- Check console for errors
- Verify EMAIL_USER and EMAIL_PASSWORD
- Test internet connection
- Check Gmail "Less secure app access" (if not using app password)

**Template not found:**
- Verify template files exist in `src/templates/emails/`
- Check file names match exactly (case-sensitive)
