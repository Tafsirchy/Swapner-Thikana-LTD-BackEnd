const { getDB } = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { sendRawEmail, sendNewsletterSubscriptionEmail } = require('../utils/emailSender');
const crypto = require('crypto');

const Newsletters = () => getDB().collection('newsletters');

/**
 * @desc    Subscribe to newsletter
 * @route   POST /api/newsletter/subscribe
 * @access  Public
 */
const subscribe = async (req, res, next) => {
  try {
    const { email, name } = req.body;
    console.log('[NEWSLETTER] Subscription request:', { email, name });

    if (!email) {
      return ApiResponse.error(res, 'Email address is required', 400);
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ApiResponse.error(res, 'Please enter a valid email address', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate unsubscribe token (needed for new or resend)
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');

    // Detailed notification helper for the business/admin
    const notifyBusiness = (type) => {
      const notifyEmail = process.env.EMAIL_NOTIFY || process.env.EMAIL_USER;
      if (!notifyEmail) return;

      sendRawEmail({
        email: notifyEmail,
        subject: `🔔 [ADMIN] ${type}: ${normalizedEmail}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0c0a09;color:#e2e8f0;border-radius:0;border:1px solid #d4af37;">
            <div style="text-align:center;margin-bottom:20px;border-bottom:1px solid #1c1917;padding-bottom:15px;">
               <p style="color:#d4af37;text-transform:uppercase;letter-spacing:2px;font-size:10px;margin:0;font-weight:bold;">Internal Management System</p>
               <h2 style="color:white;margin:5px 0 0 0;font-size:18px;">${type}</h2>
            </div>
            
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:10px 0;color:#a1a1aa;font-size:13px;width:100px;">Subscriber</td>
                <td style="padding:10px 0;color:white;font-weight:bold;">${normalizedEmail}</td>
              </tr>
              ${name ? `
              <tr>
                <td style="padding:10px 0;color:#a1a1aa;font-size:13px;">Name</td>
                <td style="padding:10px 0;color:white;">${name}</td>
              </tr>` : ''}
              <tr>
                <td style="padding:10px 0;color:#a1a1aa;font-size:13px;">Date/Time</td>
                <td style="padding:10px 0;color:#d4af37;">${new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })} (Dhaka)</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#a1a1aa;font-size:13px;">Status</td>
                <td style="padding:10px 0;"><span style="background:#d4af37;color:black;padding:2px 8px;font-size:11px;font-weight:bold;text-transform:uppercase;">Active Member</span></td>
              </tr>
            </table>

            <div style="margin-top:24px;padding-top:16px;border-top:1px solid #1c1917;text-align:center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/subscribers" style="background:transparent;border:1px solid #d4af37;color:#d4af37;padding:10px 20px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">View All Subscribers</a>
            </div>
          </div>
        `,
      }).catch(err => console.error('[NEWSLETTER] Failed to send business notification:', err));
    };

    // Check for duplicate
    const existing = await Newsletters().findOne({ email: normalizedEmail });
    if (existing && existing.isActive) {
      // Still send confirmation email (serves as a resend/verification)
      sendNewsletterSubscriptionEmail(normalizedEmail, name?.trim() || existing.name, existing.unsubscribeToken || unsubscribeToken)
        .catch(err => console.error('[NEWSLETTER] Failed to resend confirmation email:', err));

      notifyBusiness('Duplicate Subscription Attempt');
      return ApiResponse.success(res, 'Welcome back! You are already on our list, and we have resent your confirmation email.', null, 200);
    }

    if (existing && !existing.isActive) {
      // Re-activate unsubscribed user
      await Newsletters().updateOne(
        { email: normalizedEmail },
        { $set: { isActive: true, resubscribedAt: new Date() } }
      );
      
      sendNewsletterSubscriptionEmail(normalizedEmail, name?.trim() || existing.name, existing.unsubscribeToken)
        .catch(err => console.error('[NEWSLETTER] Failed to send re-activation email:', err));

      notifyBusiness('Newsletter Re-subscription');
      return ApiResponse.success(res, 'Welcome back! Your subscription has been re-activated.');
    }

    // Save subscriber
    await Newsletters().insertOne({
      email: normalizedEmail,
      name: name?.trim() || null,
      isActive: true,
      unsubscribeToken,
      subscribedAt: new Date(),
    });

    // Send confirmation to subscriber (using template system)
    sendNewsletterSubscriptionEmail(normalizedEmail, name?.trim(), unsubscribeToken)
      .catch(err => console.error('[NEWSLETTER] Failed to send confirmation email:', err));

    // Notify business
    notifyBusiness('New Newsletter Subscriber');

    return ApiResponse.success(res, 'Subscribed successfully! Check your inbox for confirmation.', null, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unsubscribe from newsletter
 * @route   GET /api/newsletter/unsubscribe?token=...
 * @access  Public
 */
const unsubscribe = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return ApiResponse.error(res, 'Invalid unsubscribe link', 400);

    const result = await Newsletters().updateOne(
      { unsubscribeToken: token },
      { $set: { isActive: false, unsubscribedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.error(res, 'Unsubscribe link is invalid or already used', 404);
    }

    return ApiResponse.success(res, 'You have been unsubscribed successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all subscribers (Admin)
 * @route   GET /api/newsletter/subscribers
 * @access  Private/Admin
 */
const getSubscribers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, active } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = active !== undefined ? { isActive: active === 'true' } : {};

    const subscribers = await Newsletters()
      .find(query)
      .sort({ subscribedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .project({ unsubscribeToken: 0 })
      .toArray();

    const total = await Newsletters().countDocuments(query);

    return ApiResponse.success(res, 'Subscribers fetched', {
      subscribers,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { subscribe, unsubscribe, getSubscribers };
