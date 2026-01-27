
process.env.JWT_SECRET = 'secret';
process.env.JWT_EXPIRES_IN = ' '; // Invalid value

const jwt = require('./src/utils/jwt');

try {
  const token = jwt.generateToken('test-user');
  console.log('Token generated successfully:', token);
} catch (error) {
  console.error('Error generating token:', error.message);
}
