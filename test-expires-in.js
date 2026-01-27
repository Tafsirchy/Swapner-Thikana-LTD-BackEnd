const jwt = require('jsonwebtoken');

console.log('Testing with space " ":');
try {
  jwt.sign({ foo: 'bar' }, 'secret', { expiresIn: ' ' });
} catch (e) {
  console.log('Error with space:', e.message);
}

console.log('Testing with value "invalid":');
try {
  jwt.sign({ foo: 'bar' }, 'secret', { expiresIn: 'invalid' });
} catch (e) {
  console.log('Error with "invalid":', e.message);
}
