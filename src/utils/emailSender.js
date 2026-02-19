const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Create email transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER and EMAIL_PASS environment variables are required');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Low-level email sender — matches config/email.js signature
 * Use this from auth.controller.js and anywhere that needs raw HTML sending
 * without a template file.
 * @param {object} options - { email, subject, html, text }
 */
const sendRawEmail = async (options) => {
  if (!process.env.EMAIL_USER) {
    console.log('\n--- 📧 DEV EMAIL LOG ---');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log('--- END ---\n');
    const match = options.html?.match(/href="([^"]*)"/);
    if (match) console.log(`💡 DEV TIP: Found link: ${match[1]}\n`);
    return { messageId: 'dev-mock-id' };
  }
  const transporter = createTransporter();
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Shwapner Thikana LTD'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };
  const info = await transporter.sendMail(mailOptions);
  console.log('Message sent: %s', info.messageId);
  return info;
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
    
    // Handle conditionals like {{#if featured}}...{{else}}...{{/if}}
    const pattern = /{{#if\s+(\w+)}}(.*?){{\/if}}/gs;
    html = html.replace(pattern, (match, key, content) => {
      const parts = content.split('{{else}}');
      const ifContent = parts[0];
      const elseContent = parts[1] || '';
      return data[key] ? ifContent : elseContent;
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
  // Dev fallback: if no email credentials, log to console
  if (!process.env.EMAIL_USER) {
    console.log(`\n--- 📧 DEV TEMPLATE EMAIL ---`);
    console.log(`To: ${to} | Subject: ${subject} | Template: ${template}`);
    console.log('--- END ---\n');
    return { success: true, messageId: 'dev-mock-id' };
  }
  try {
    const transporter = createTransporter();
    const html = await loadTemplate(template, data);
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Shwapner Thikana LTD'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
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
    subject: inquiry.subject || '✅ Inquiry Received - STLTD Properties',
    template: 'inquiry-confirmation',
    data: {
      userName: inquiry.name,
      propertyTitle: property ? property.title : (inquiry.subject || 'General Inquiry'),
      userEmail: inquiry.email,
      userPhone: inquiry.phone,
      message: inquiry.message,
      inquiryDate: new Date(inquiry.createdAt || new Date()).toLocaleDateString('en-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      propertyUrl: property ? `${baseUrl}/properties/${property.slug}` : `${baseUrl}/contact`,
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

/**
 * Send newsletter subscription confirmation email
 */
const sendNewsletterSubscriptionEmail = async (email, name, unsubscribeToken) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  return sendEmail({
    to: email,
    subject: '✅ You are now subscribed — Shwapner Thikana LTD',
    template: 'newsletter-subscription',
    data: {
      userName: name,
      frontendUrl: baseUrl,
      unsubscribeUrl: `${baseUrl}/newsletter/unsubscribe?token=${unsubscribeToken}`
    }
  });
};

module.exports = {
  sendEmail,
  sendRawEmail,
  sendNewMatchEmail,
  sendInquiryConfirmationEmail,
  sendWelcomeEmail,
  sendLeadStatusUpdateEmail,
  sendNewsletterSubscriptionEmail
};
