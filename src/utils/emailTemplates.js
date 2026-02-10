/**
 * Luxury HTML Email Templates for Shwapner Thikana Ltd
 */

const primaryColor = '#F59E0B'; // Gold
const secondaryColor = '#059669'; // Emerald
const darkBg = '#0F172A';
const lightBg = '#F8FAFC';

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: ${lightBg}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .header { background-color: ${darkBg}; padding: 30px; text-align: center; border-bottom: 4px solid ${primaryColor}; }
        .logo { color: ${primaryColor}; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
        .content { padding: 40px; color: #334155; line-height: 1.6; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
        .button { display: inline-block; padding: 14px 28px; background-color: ${primaryColor}; color: #ffffff !important; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 25px; transition: 0.3s; }
        h1 { color: #0f172a; margin-top: 0; font-size: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">স্বপ্নের ঠিকানা</div>
            <div style="color: #94a3b8; font-size: 12px; margin-top: 5px;">SHWAPNER THIKANA LTD</div>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            &copy; 2026 Shwapner Thikana Ltd. All rights reserved.<br>
            Dhaka, Bangladesh | Building Dreams, Creating Addresses
        </div>
    </div>
</body>
</html>
`;

const getEmailVerificationTemplate = (name, url) => baseTemplate(`
    <h1>Verify Your Address</h1>
    <p>Dear ${name},</p>
    <p>Welcome to <strong>Shwapner Thikana Ltd</strong>. We are thrilled to have you join our exclusive community of homeowners and investors.</p>
    <p>To finalize your account registration and start exploring premium real estate opportunities, please verify your email address by clicking the button below:</p>
    <a href="${url}" class="button">Verify My Account</a>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: ${primaryColor}; font-size: 12px;">${url}</p>
    <p>This link will expire in 24 hours.</p>
    <p>Best Regards,<br>The Shwapner Thikana Team</p>
`);

const getPasswordResetTemplate = (name, url) => baseTemplate(`
    <h1>Reset Your Password</h1>
    <p>Hello ${name},</p>
    <p>We received a request to reset your password for your <strong>Shwapner Thikana Ltd</strong> account.</p>
    <p>If you made this request, click the button below to set a new password:</p>
    <a href="${url}" class="button">Reset Password</a>
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    <p>Link expires in 10 minutes.</p>
    <p>Warmly,<br>Shwapner Thikana Support</p>
`);

const getWelcomeEmailTemplate = (name) => baseTemplate(`
    <h1>Welcome to Excellence</h1>
    <p>Dear ${name},</p>
    <p>Your account with <strong>Shwapner Thikana Ltd</strong> has been successfully verified.</p>
    <p>Our premium real estate platform is now at your fingertips. Whether you are looking for a luxury penthouse in Gulshan, a sprawling estate in Banani, or a high-yield commercial investment, we are here to help you find your "Dream Address".</p>
    <p>What's next?</p>
    <ul>
        <li>Explore featured luxury properties</li>
        <li>Connect with our expert property advisors</li>
        <li>Set up personalized property alerts</li>
    </ul>
    <a href="${process.env.FRONTEND_URL}" class="button">Start Exploring</a>
    <p>Excellence in every square foot,<br>Shwapner Thikana Team</p>
`);

module.exports = {
  getEmailVerificationTemplate,
  getPasswordResetTemplate,
  getWelcomeEmailTemplate,
};
