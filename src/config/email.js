const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Check if we have email credentials
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.log('❌ Email Fallback Triggered. Missing values:');
    console.log(`- EMAIL_HOST: ${process.env.EMAIL_HOST ? 'YES' : 'MISSING'}`);
    console.log(`- EMAIL_USER: ${process.env.EMAIL_USER ? 'YES' : 'MISSING'}`);
    
    console.log('\n--- 📧 DEVELOPMENT EMAIL LOG ---');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    if (options.text) console.log(`Text Body: ${options.text}`);
    if (options.html) console.log(`HTML Body: (Rendered HTML hidden in log)`);
    console.log('--- END OF EMAIL LOG ---\n');
    
    // Check if there's a reset link or verification code in the HTML to help the dev
    const match = options.html?.match(/href="([^"]*)"/);
    if (match) {
        console.log(`💡 DEV TIP: Found link in email: ${match[1]}\n`);
    }
    
    return { messageId: 'dev-mock-id' };
  }

  // Create a transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Define email options
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Shwapner Thikana'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Send the email
  const info = await transporter.sendMail(mailOptions);
  
  console.log('Message sent: %s', info.messageId);
  return info;
};

module.exports = sendEmail;
