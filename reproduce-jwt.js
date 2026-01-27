require('dotenv').config();
const jwt = require('./src/utils/jwt');

console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
console.log('Type of JWT_EXPIRES_IN:', typeof process.env.JWT_EXPIRES_IN);

try {
  const token = jwt.generateToken('test-user-id');
  console.log('Token generated successfully:', token);
} catch (error) {
  console.error('Error generating token:', error.message);
}
