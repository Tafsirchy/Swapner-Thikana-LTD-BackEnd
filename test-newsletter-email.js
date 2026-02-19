require('dotenv').config();
const { sendNewsletterSubscriptionEmail } = require('./src/utils/emailSender');

async function testEmail() {
  console.log('Testing Newsletter Email...');
  console.log('Using EMAIL_USER:', process.env.EMAIL_USER);
  
  try {
    const result = await sendNewsletterSubscriptionEmail(
      'tafsirkhan@gmail.com', // Test recipient
      'Test User',
      'test-token-123'
    );
    console.log('Send Result:', result);
  } catch (err) {
    console.error('CRITICAL ERROR:', err);
  }
}

testEmail();
