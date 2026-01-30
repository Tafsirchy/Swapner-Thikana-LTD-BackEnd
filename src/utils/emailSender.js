const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Create email transporter
const createTransporter = () => {
  // For development: Use Gmail
  // For production: Use SendGrid, Mailgun, or AWS SES
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
  });
};

/**
 * Load and compile email template with data
 * @param {string} templateName - Name of the template file (without .html)
 * @param {object} data - Data to replace placeholders
 * @returns {Promise<string>} - Compiled HTML
 */
const loadTemplate = async (templateName, data) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
    let html = await fs.readFile(templatePath, 'utf-8');
    
    // Simple template replacement (for handlebars-like syntax)
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key] || '');
    });
    
    // Handle conditionals like {{#if featured}}
    html = html.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, key, content) => {
      return data[key] ? content : '';
    });
    
    return html;
  } catch (error) {
    console.error('Error loading email template:', error);
    throw new Error(`Failed to load email template: ${templateName}`);
  }
};

/**
 * Send email
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name
 * @param {object} options.data - Template data
 * @returns {Promise<object>} - Send result
 */
const sendEmail = async ({ to, subject, template, data }) => {
  try {
    const transporter = createTransporter();
    const html = await loadTemplate(template, data);
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Shwapner Thikana LTD'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@stltd.com'}>`,
      to,
      subject,
      html
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send new property match email
 */
const sendNewMatchEmail = async (user, property, savedSearch) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  return sendEmail({
    to: user.email,
    subject: '🏡 New Property Match - STLTD Properties',
    template: 'new-match',
    data: {
      userName: user.name,
      propertyImage: property.images?.[0] || '',
      propertyTitle: property.title,
      propertyType: property.propertyType,
      listingType: property.listingType === 'sale' ? 'For Sale' : 'For Rent',
      featured: property.featured,
      location: `${property.location.area}, ${property.location.city}`,
      price: property.price?.toLocaleString('en-BD'),
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      size: property.size?.toLocaleString('en-BD'),
      propertyUrl: `${baseUrl}/properties/${property.slug}`,
      savedSearchName: savedSearch.name,
      alertFrequency: savedSearch.alertFrequency,
      manageSearchesUrl: `${baseUrl}/dashboard/saved-searches`,
      unsubscribeUrl: `${baseUrl}/dashboard/saved-searches?unsubscribe=${savedSearch._id}`
    }
  });
};

/**
 * Send inquiry confirmation email
 */
const sendInquiryConfirmationEmail = async (inquiry, property) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  return sendEmail({
    to: inquiry.email,
    subject: '✅ Inquiry Received - STLTD Properties',
    template: 'inquiry-confirmation',
    data: {
      userName: inquiry.name,
      propertyTitle: property.title,
      userEmail: inquiry.email,
      userPhone: inquiry.phone,
      message: inquiry.message,
      inquiryDate: new Date(inquiry.createdAt || new Date()).toLocaleDateString('en-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      propertyUrl: `${baseUrl}/properties/${property.slug}`,
      dashboardUrl: `${baseUrl}/dashboard`,
      contactUrl: `${baseUrl}/contact`
    }
  });
};

/**
 * Send welcome email to new users
 */
const sendWelcomeEmail = async (user) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  return sendEmail({
    to: user.email,
    subject: '🎉 Welcome to STLTD Properties!',
    template: 'welcome',
    data: {
      userName: user.name,
      propertiesUrl: `${baseUrl}/properties`,
      dashboardUrl: `${baseUrl}/dashboard`,
      helpUrl: `${baseUrl}/help`,
      contactUrl: `${baseUrl}/contact`
    }
  });
};

/**
 * Send lead status update email
 */
const sendLeadStatusUpdateEmail = async (lead, newStatus) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  return sendEmail({
    to: lead.email,
    subject: `🔔 Update on your inquiry - STLTD Properties`,
    template: 'lead-status-update',
    data: {
      userName: lead.name,
      newStatus: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
      propertyTitle: lead.propertyName || 'Property Inquiry',
      logoUrl: `${baseUrl}/logo.png`,
      dashboardUrl: `${baseUrl}/dashboard`,
      contactUrl: `${baseUrl}/contact`
    }
  });
};

module.exports = {
  sendEmail,
  sendNewMatchEmail,
  sendInquiryConfirmationEmail,
  sendWelcomeEmail,
  sendLeadStatusUpdateEmail
};
