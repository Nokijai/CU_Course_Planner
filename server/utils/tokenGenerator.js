const crypto = require('crypto');

/**
 * Generate a secure random token for email verification
 * @returns {string} A secure random token
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a secure random token with specified length
 * @param {number} length - Length of the token in bytes
 * @returns {string} A secure random token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a JWT-like token (for future use with JWT)
 * @param {Object} payload - Data to encode in token
 * @param {string} secret - Secret key for signing
 * @returns {string} A signed token
 */
function generateSignedToken(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

module.exports = {
  generateVerificationToken,
  generateSecureToken,
  generateSignedToken
}; 