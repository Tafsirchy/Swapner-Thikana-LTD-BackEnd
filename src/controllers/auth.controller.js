const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const ApiResponse = require('../utils/apiResponse');
const crypto = require('crypto');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.error(res, 'User with this email already exists', 400);
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'customer', // Default to customer
    });

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data and token
    return ApiResponse.success(
      res,
      'User registered successfully',
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
      201
    );
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

    // Validate input
    if (!email || !password) {
      return ApiResponse.error(res, 'Please provide email and password', 400);
    }

    // Check if user exists (include password for comparison)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return ApiResponse.error(res, 'Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      return ApiResponse.error(res, 'Your account has been deactivated. Please contact support.', 403);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return ApiResponse.error(res, 'Invalid credentials', 401);
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data and token
    return ApiResponse.success(res, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
      token,
    });
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
    // req.user is set by protect middleware
    const user = await User.findById(req.user._id);

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    return ApiResponse.success(res, 'User profile retrieved', {
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar, agentProfile } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;

    // Update agent profile if user is an agent
    if (user.role === 'agent' && agentProfile) {
      user.agentProfile = {
        ...user.agentProfile,
        ...agentProfile,
      };
    }

    await user.save();

    return ApiResponse.success(res, 'Profile updated successfully', {
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot password - Send reset token
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      return ApiResponse.success(
        res,
        'If an account exists with this email, you will receive a password reset link'
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and set to user
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set expire time (10 minutes)
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // TODO: Send email with reset link
    console.log('Password Reset URL:', resetUrl);
    console.log('Reset Token:', resetToken);

    // For now, return the reset token (in production, only send via email)
    return ApiResponse.success(
      res,
      'Password reset link sent to email',
      process.env.NODE_ENV === 'development' ? { resetToken, resetUrl } : null
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return ApiResponse.error(res, 'Please provide token and new password', 400);
    }

    // Hash token to compare with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return ApiResponse.error(res, 'Invalid or expired reset token', 400);
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Generate new JWT token
    const jwtToken = generateToken(user._id);

    return ApiResponse.success(res, 'Password reset successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token: jwtToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password (for logged-in users)
 * @route   POST /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return ApiResponse.error(res, 'Please provide current and new password', 400);
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return ApiResponse.error(res, 'Current password is incorrect', 401);
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    return ApiResponse.success(res, 'Password changed successfully', {
      token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword,
};
