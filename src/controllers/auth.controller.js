const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Users } = require('../models/User');
const { PendingUsers } = require('../models/PendingUser');
const { generateToken } = require('../utils/jwt');
const ApiResponse = require('../utils/apiResponse');
const sendEmail = require('../config/email');

const setTokenCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days matching JWT_EXPIRES_IN
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  };

  res.cookie('token', token, cookieOptions);
};
const { getEmailVerificationTemplate } = require('../utils/emailTemplates');
const { sendWelcomeEmail } = require('../utils/emailSender');

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
        subject: 'Verify Your shwapner Thikana Account',
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

    // 1. Find and retrieve data from PendingUsers
    // We maintain 'atomic' behavior by ensuring we have the data before deleting,
    // and ideally using a transaction, but for single-node Mongo logic:
    // FindAndDelete ensures we get the document and remove it so it can't be used again.
    const pendingUser = await PendingUsers().findOneAndDelete({ 
      verificationToken: hashedToken 
    });

    if (!pendingUser) {
      // Token invalid or expired (TTL removed it)
      // Check if user is already verified in main collection to give better error
      // Since we don't have the email from the token (hash), we can't easily check 'isVerified' 
      // unless we assume the token *might* be valid but just not found.
      // So generic error is safest.
      return ApiResponse.error(res, 'Invalid or expired verification link. Please register again.', 400);
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
      // No verificationToken needed in User collection
      savedProperties: [],
      savedSearches: [],
      createdAt: new Date(), // Reset created date to verification time? Or keep original? Let's use new.
      updatedAt: new Date(),
    };

    // 3. Create User in main collection
    // Note: If this fails (e.g. DB error), data is lost from PendingUsers. 
    // In production cluster with replica set, use a Transaction.
    // For now, we assume success or user has to register again (which is safe fail-state).
    await Users().insertOne(newUser);
    
    // 4. Send Welcome Email (Async)
    try {
      await sendWelcomeEmail(newUser);
    } catch (msgError) {
      console.error('[VERIFY EMAIL] Failed to send welcome email:', msgError);
      // Don't block flow
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
      return ApiResponse.error(res, 'Invalid credentials', 401);
    }

    // 2. Check password
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

    // 4. Generate token
    const token = generateToken(user._id);
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
        subject: 'Password Reset Request - shwapner Thikana',
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
    return ApiResponse.success(res, 'User profile fetched', { user: req.user });
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
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000), // Expire in 10 seconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  };

  res.cookie('token', 'none', cookieOptions);

  return ApiResponse.success(res, 'Logged out successfully');
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
    
    // Generate token and set cookie
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    // Redirect based on user role
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = user.role === 'admin' 
      ? `${frontendUrl}/dashboard/admin?login=success`
      : `${frontendUrl}/?login=success`;
    
    res.redirect(redirectUrl);
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
        subject: 'Verify Your shwapner Thikana Account',
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
  resendVerification
};
