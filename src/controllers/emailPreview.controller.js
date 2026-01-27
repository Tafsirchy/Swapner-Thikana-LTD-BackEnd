const {
  getEmailVerificationTemplate,
  getPasswordResetTemplate,
  getWelcomeEmailTemplate
} = require('../utils/emailTemplates');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get preview of an email template
 * @route   GET /api/admin/email-preview/:type
 * @access  Private (Admin only)
 */
const getEmailPreview = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { name = 'John Doe', url = 'https://example.com/action' } = req.query;

    let html = '';

    switch (type) {
      case 'verification':
        html = getEmailVerificationTemplate(name, url);
        break;
      case 'reset-password':
        html = getPasswordResetTemplate(name, url);
        break;
      case 'welcome':
        html = getWelcomeEmailTemplate(name);
        break;
      default:
        return ApiResponse.error(res, 'Invalid template type', 400);
    }

    // Send raw HTML for preview
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of available email templates
 * @route   GET /api/admin/email-templates
 * @access  Private (Admin only)
 */
const getEmailTemplates = async (req, res, next) => {
  try {
    const templates = [
      { id: 'verification', name: 'Email Verification', description: 'Sent upon registration' },
      { id: 'reset-password', name: 'Password Reset', description: 'Sent when use requests reset' },
      { id: 'welcome', name: 'Welcome Email', description: 'Sent after successful verification' }
    ];

    return ApiResponse.success(res, 'Templates fetched', { templates });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmailPreview,
  getEmailTemplates
};
