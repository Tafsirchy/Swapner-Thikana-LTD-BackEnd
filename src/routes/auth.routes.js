const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authLimiter, verifyEmailLimiter, resendLimiter } = require('../middlewares/rateLimit.middleware');
const passport = require('passport');

const { validate } = require('../middlewares/validation.middleware');
const { 
  registerValidator, 
  loginValidator, 
  emailValidator, 
  passwordValidator,
  changePasswordValidator
} = require('../validators/auth.validator');

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', authLimiter, registerValidator, validate, authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, loginValidator, validate, authController.login);

// @route   POST /api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.post('/verify-email', verifyEmailLimiter, authController.verifyEmail);

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', resendLimiter, emailValidator, validate, authController.resendVerification);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', authLimiter, emailValidator, validate, authController.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', passwordValidator, validate, authController.resetPassword);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, authController.getMe);

// @route   POST /api/auth/change-password
// @desc    Change password
// @access  Private
router.post('/change-password', protect, changePasswordValidator, validate, authController.changePassword);

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get(
  '/google/callback',
  function(req, res, next) {
    passport.authenticate('google', { session: false }, function(err, user, info) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      if (err) {
        return res.redirect(`${frontendUrl}/auth/login?error=Google_Authentication_Failed`);
      }
      if (!user) {
        const errorMsg = info && info.message ? encodeURIComponent(info.message.replace(/ /g, '_')) : 'Google_Authentication_Cancelled';
        return res.redirect(`${frontendUrl}/auth/login?error=${errorMsg}`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  authController.googleCallback
);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, authController.logout);

module.exports = router;
