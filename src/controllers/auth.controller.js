const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Users } = require('../models/User');
const { PendingUsers } = require('../models/PendingUser');
const { generateToken } = require('../utils/jwt');
const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');
const { sendRawEmail: sendEmail, sendWelcomeEmail } = require('../utils/emailSender');

// Fix 3: Shortened cookie lifetime to 2h (matches new JWT_EXPIRES_IN)
const setTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    maxAge: 2 * 60 * 60 * 1000, // Fix 3: 2 hours instead of 7 days
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
  };

  res.cookie('token', token, cookieOptions);
};
const { getEmailVerificationTemplate } = require('../utils/emailTemplates');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // 1. Check if user already exists in MAIN collection
    const existingUser = await Users().findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return ApiResponse.error(res, 'User with this email already exists', 400);
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create verification token (Securely hashed)
    // Generate random token for URL
    const rawToken = crypto.randomBytes(32).toString('hex');
    // Hash token for database storage
    const verificationTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 4. Create pending user object
    // Delete old pending request for this email if exists, then create new
    
    await PendingUsers().deleteOne({ email: email.toLowerCase() });

    const newPendingUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword, // Hashed password
      phone,
      verificationToken: verificationTokenHash,
      createdAt: new Date() // Manual timestamp for native driver (for TTL)
    };

    // 5. Save to PendingUsers collection
    await PendingUsers().insertOne(newPendingUser);
    
    // 6. Send verification email (Send RAW token)
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${rawToken}`;
    
    let emailSent = true;
    try {
      await sendEmail({
        email: newPendingUser.email,
        subject: 'Verify Your Shwapner Thikana Account',
        html: getEmailVerificationTemplate(newPendingUser.name, verificationUrl),
      });
      console.log('[REGISTER] Verification email sent to:', newPendingUser.email);
    } catch (emailError) {
      console.error('[REGISTER] Email could not be sent:', emailError);
      emailSent = false;
    }

    const message = emailSent 
      ? 'Registration successful. Please check your email to verify your account.'
      : 'Registration successful, but we could not send the verification email. Please use the resend option.';

    // Do NOT return the user object (security best practice)
    return ApiResponse.success(res, message, {
      email: newPendingUser.email,
      emailSent,
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify email (Step 2: Move from PendingUsers to Users)
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return ApiResponse.error(res, 'Verification token is required', 400);
    }

    // Hash the incoming token to match database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 1. Find data from PendingUsers
    const pendingUser = await PendingUsers().findOne({ 
      verificationToken: hashedToken 
    });

    if (!pendingUser) {
      // IDEMPOTENCY CHECK:
      // If not in PendingUsers, it might be because verification already succeeded (double click)
      // or the token is genuinely invalid/expired.
      // We'll check if a user with a verified flag already exists for a "success" fallback.
      // Note: We don't have the email here unless we decode the token or store it differently,
      // but for this specific architecture, if the token is gone, it usually means success or expiry.
      
      // Let's check if the token was recently used or if the user is already in the main collection.
      // Since we don't have the email in the request, we can't easily check Users() without it.
      // However, we can return a more helpful message or assume success if we want to be very lenient,
      // but safest is to check if the user is already registered.
      
      return ApiResponse.error(res, 'Invalid or expired verification link. If you already verified, please try logging in.', 400);
    }

    // 2. Prepare User object
    const newUser = {
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password, // Already hashed
      phone: pendingUser.phone,
      role: 'customer',
      status: 'active',
      isActive: true,
      isVerified: true, // Auto-verified!
      savedProperties: [],
      savedSearches: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 3. Create User in main collection FIRST
    await Users().insertOne(newUser);
    
    // 4. Delete from PendingUsers ONLY after successful insertion
    await PendingUsers().deleteOne({ _id: pendingUser._id });
    
    // 5. Send Welcome Email & Notify Admin (Async)
    try {
      await sendWelcomeEmail(newUser);
      
      // Notify Admin about new verified user
      const notifyEmail = process.env.EMAIL_NOTIFY || process.env.EMAIL_USER;
      if (notifyEmail) {
        sendEmail({
          email: notifyEmail,
          subject: `👤 New User Verified: ${newUser.name}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:8px;">
              <h3 style="color:#f59e0b;margin-top:0;">New User Registration</h3>
              <p>A new user has verified their email and is now active.</p>
              <hr style="border:0;border-top:1px solid #334155;margin:16px 0;">
              <p><strong>Name:</strong> ${newUser.name}</p>
              <p><strong>Email:</strong> ${newUser.email}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })}</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/admin/users" style="display:inline-block;margin-top:16px;background:#f59e0b;color:#0f172a;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Manage Users →</a>
            </div>
          `
        }).catch(err => console.error('[ADMIN NOTIFY] Registration alert failed:', err));
      }
    } catch (msgError) {
      console.error('[VERIFY EMAIL] Failed to send emails:', msgError);
    }

    console.log('[VERIFY EMAIL] User verified and moved to main collection:', newUser.email);

    return ApiResponse.success(res, 'Email verified successfully. Registration complete. You can now login.');
  } catch (error) {
    console.error('[VERIFY EMAIL] Error:', error);
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await Users().findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // CHECK PENDING USERS for better feedback
      const pendingUser = await PendingUsers().findOne({ email: email.toLowerCase().trim() });
      if (pendingUser) {
        return ApiResponse.error(res, 'Your email is not verified yet. Please check your inbox for the verification link.', 403);
      }
      return ApiResponse.error(res, 'Invalid credentials', 401);
    }

    // 2. Check password
    if (!user.password) {
      return ApiResponse.error(res, 'This account was created using Google. To sign in with a password, please use "Forgot Password" to set one first.', 401);
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return ApiResponse.error(res, 'Invalid credentials', 401);
    }

    // 3. Check if verified
    if (!user.isVerified) {
      return ApiResponse.error(res, 'Please verify your email address before logging in.', 403);
    }

    // 4. Check if active
    if (!user.isActive) {
      return ApiResponse.error(res, 'Account is deactivated', 403);
    }

    // Fix 4: Generate short-lived token (2h, controlled by JWT_EXPIRES_IN env var)
    const token = generateToken(user._id, user.tokenVersion ?? 0);
    setTokenCookie(res, token);

    // Clean user object
    const userProfile = { ...user };
    delete userProfile.password;
    delete userProfile.verificationToken;

    return ApiResponse.success(res, 'Login successful', {
      user: userProfile,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot password - Send reset link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // 1. Find user
    const user = await Users().findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security, don't reveal if user exists
      return ApiResponse.success(res, 'If an account exists with this email, a reset link will be sent.');
    }

    // 2. Create reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 3. Save to user
    await Users().updateOne(
      { _id: user._id },
      { 
        $set: { 
          resetPasswordToken, 
          resetPasswordExpires 
        } 
      }
    );

    // 4. Send email
    const { getPasswordResetTemplate } = require('../utils/emailTemplates');
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request - Shwapner Thikana',
        html: getPasswordResetTemplate(user.name, resetUrl),
      });
    } catch (emailError) {
      console.error('Email could not be sent:', emailError);
      return ApiResponse.error(res, 'Email could not be sent', 500);
    }

    return ApiResponse.success(res, 'Reset link sent to email', {
      // Include link in response for easier development/testing
      dev_reset_link: process.env.NODE_ENV === 'development' ? resetUrl : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // 1. Hash the incoming token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // 2. Find user with valid token and not expired
    const user = await Users().findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return ApiResponse.error(res, 'Invalid or expired password reset token', 400);
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Update user
    await Users().updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetPasswordToken: "", resetPasswordExpires: "" }
      }
    );

    return ApiResponse.success(res, 'Password reset successful. You can now login.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is already populated by auth middleware
    const userProfile = { ...req.user };
    
    // Sanitize sensitive metadata
    delete userProfile.resetPasswordToken;
    delete userProfile.resetPasswordExpires;
    delete userProfile.verificationToken;
    delete userProfile.password;

    return ApiResponse.success(res, 'User profile fetched', { user: userProfile });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   POST /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // 1. Get user with password
    const user = await Users().findOne({ _id: userId });
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    // 2. Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return ApiResponse.error(res, 'Invalid current password', 400);
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Update password
    await Users().updateOne(
      { _id: userId },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    return ApiResponse.success(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user - Clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    // Fix 5: Invalidate all existing tokens by incrementing tokenVersion in the database
    const userId = req.user?._id;
    if (userId) {
      const { getDB } = require('../config/db');
      await getDB().collection('users').updateOne(
        { _id: userId },
        { $inc: { tokenVersion: 1 } }
      );
    }

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', 'none', {
      maxAge: 10 * 1000, // Expire in 10 seconds
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
    });

    return ApiResponse.success(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Google OAuth callback
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
const googleCallback = async (req, res, next) => {
  try {
    // Passport adds authenticated user to req.user
    const user = req.user;
    
    // 1. Generate short-lived (1 minute) exchange token
    const exchangeToken = jwt.sign(
      { id: user._id, tokenVersion: user.tokenVersion ?? 0, type: 'exchange' },
      process.env.JWT_SECRET,
      { expiresIn: '1m' }
    );

    // Redirect based on user role WITH the exchange token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const isNewParam = user.isNew ? '&new=true' : '';
    const redirectUrl = user.role === 'admin' 
      ? `${frontendUrl}/dashboard/admin?login=success${isNewParam}&code=${exchangeToken}`
      : `${frontendUrl}/?login=success${isNewParam}&code=${exchangeToken}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Exchange Google Auth Code for Session Cookie
 * @route   POST /api/auth/google/exchange
 * @access  Public
 */
const googleExchange = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return ApiResponse.error(res, 'Authorization code missing', 400);

    let decoded;
    try {
      const jwt = require('jsonwebtoken');
      decoded = jwt.verify(code, process.env.JWT_SECRET);
      if (decoded.type !== 'exchange') throw new Error('Invalid token type');
    } catch (err) {
      return ApiResponse.error(res, 'Invalid or expired authorization code', 401);
    }

    // Generate real token and set cookie (Now happens securely via XHR)
    const token = generateToken(decoded.id, decoded.tokenVersion);
    setTokenCookie(res, token);

    // Fetch User Profile to return to UI
    const { Users } = require('../models/User');
    const { ObjectId } = require('mongodb');
    const user = await Users().findOne(
      { _id: new ObjectId(decoded.id) },
      { projection: { password: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } }
    );

    return ApiResponse.success(res, 'Login successful', { user, token });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return ApiResponse.error(res, 'Email is required', 400);
    }
    
    const normalizedEmail = email.toLowerCase();

    // 1. Check if user is already fully registered (Verified)
    const existingUser = await Users().findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log('[RESEND] User already exists in main DB:', normalizedEmail);
      // Already fully registered and verified (since we only save verified users now)
      return ApiResponse.error(res, 'This account is already registered and verified. Please login.', 400);
    }

    // 2. Find in PendingUsers
    const pendingUser = await PendingUsers().findOne({ email: normalizedEmail });
    
    if (!pendingUser) {
       // Not in pending either.
       // For security, don't reveal if user exists.
       console.log('[RESEND] Email not found in PendingUsers:', normalizedEmail);
       return ApiResponse.success(res, 'If a pending registration exists, a new verification link has been sent.');
    }

    // 3. Generate new token with 24-hour expiration (Securely hashed)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 4. Update PendingUser record
    // This resets the TTL as well because we validate against createdAt? 
    // Actually Mongoose TTL relies on 'createdAt' field. 
    // To refresh the TTL, we should update 'createdAt' to now.
    await PendingUsers().updateOne(
      { _id: pendingUser._id },
      { 
        $set: { 
          verificationToken: verificationTokenHash, 
          createdAt: new Date() // Reset TTL to 24h from now
        } 
      }
    );

    // 5. Send email (Send RAW token)
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${rawToken}`;
    
    try {
      await sendEmail({
        email: pendingUser.email,
        subject: 'Verify Your Shwapner Thikana Account',
        html: getEmailVerificationTemplate(pendingUser.name, verificationUrl),
      });
      console.log('[RESEND] Verification email sent to:', pendingUser.email);
    } catch (emailError) {
      console.error('[RESEND] Email could not be sent:', emailError);
      return ApiResponse.error(res, 'Email could not be sent', 500);
    }

    return ApiResponse.success(res, 'Verification link sent to email');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
  logout,
  googleCallback,
  googleExchange,
  resendVerification
};
