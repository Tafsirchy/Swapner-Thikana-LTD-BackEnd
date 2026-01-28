const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Users } = require('../models/User');
const { generateToken } = require('../utils/jwt');
const ApiResponse = require('../utils/apiResponse');
const sendEmail = require('../config/email');
const { getEmailVerificationTemplate } = require('../utils/emailTemplates');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // 1. Check if user already exists
    const existingUser = await Users().findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return ApiResponse.error(res, 'User with this email already exists', 400);
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 4. Create user object
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role: role || 'customer',
      isActive: true,
      isVerified: false,
      verificationToken,
      savedProperties: [],
      savedSearches: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 5. Save to database
    const result = await Users().insertOne(newUser);
    
    // 6. Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;
    
    try {
      await sendEmail({
        email: newUser.email,
        subject: 'Verify Your shwapner Thikana Account',
        html: getEmailVerificationTemplate(newUser.name, verificationUrl),
      });
    } catch (emailError) {
      console.error('Email could not be sent:', emailError);
      // We still registered the user, but verification email failed
    }

    const user = { ...newUser, _id: result.insertedId };
    delete user.password;
    delete user.verificationToken;

    return ApiResponse.success(res, 'Registration successful. Please check your email to verify your account.', {
      user,
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify email
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return ApiResponse.error(res, 'Verification token is required', 400);
    }

    // 1. Find user with this token
    const user = await Users().findOne({ verificationToken: token });
    if (!user) {
      return ApiResponse.error(res, 'Invalid or expired verification token', 400);
    }

    // 2. Update user status
    await Users().updateOne(
      { _id: user._id },
      { 
        $set: { isVerified: true },
        $unset: { verificationToken: "" }
      }
    );

    return ApiResponse.success(res, 'Email verified successfully. You can now login.');
  } catch (error) {
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
    console.log(`Login attempt for: ${email}`);
    const user = await Users().findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log('User not found in DB');
      return ApiResponse.error(res, 'Invalid credentials', 401);
    }

    // 2. Check password
    console.log(`Checking password for ${email}. Salted hash in DB starts with: ${user.password.substring(0, 10)}...`);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Password match for ${email}: ${isMatch}`);
    if (!isMatch) {
      return ApiResponse.error(res, 'Invalid credentials', 401);
    }

    // 3. Check if active
    if (!user.isActive) {
      return ApiResponse.error(res, 'Account is deactivated', 403);
    }

    // 4. Generate token
    const token = generateToken(user._id);

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

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
};
