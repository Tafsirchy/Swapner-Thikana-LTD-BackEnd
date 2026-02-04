const nodemailer = require('nodemailer');

console.log('Type of nodemailer:', typeof nodemailer);
console.log('Keys in nodemailer:', Object.keys(nodemailer));
console.log('Has createTransporter?', typeof nodemailer.createTransporter === 'function');

try {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: { user: 'test', pass: 'test' }
  });
  console.log('Transporter created successfully');
} catch (error) {
  console.error('Error creating transporter:', error);
}
