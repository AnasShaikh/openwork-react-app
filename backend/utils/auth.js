const jwt = require('jsonwebtoken');
const path = require('path');
const { safeEqual } = require('../middleware/security');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SESSION_EXPIRY_HOURS = parseInt(process.env.SESSION_EXPIRY_HOURS) || 24;

function isAdminAuthConfigured() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.JWT_SECRET);
}

/**
 * Verify admin credentials
 */
function verifyAdminCredentials(username, password) {
  if (!isAdminAuthConfigured()) return false;
  return safeEqual(username, process.env.ADMIN_USERNAME)
    && safeEqual(password, process.env.ADMIN_PASSWORD);
}

/**
 * Generate JWT token for admin session
 */
function generateAdminToken(username) {
  if (!isAdminAuthConfigured()) throw new Error('Admin authentication is not configured');
  const payload = {
    username,
    role: 'admin',
    iat: Math.floor(Date.now() / 1000)
  };
  
  const options = {
    expiresIn: `${SESSION_EXPIRY_HOURS}h`
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, options);
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  if (!isAdminAuthConfigured()) {
    return { valid: false, error: 'Admin authentication is not configured' };
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Express middleware to require admin authentication
 */
function requireAdmin(req, res, next) {
  if (!isAdminAuthConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Admin authentication is not configured'
    });
  }
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No authorization token provided'
    });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const verification = verifyToken(token);
  
  if (!verification.valid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      details: verification.error
    });
  }
  
  // Check if user is admin
  if (verification.decoded.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions'
    });
  }
  
  // Attach user info to request
  req.admin = verification.decoded;
  next();
}

module.exports = {
  verifyAdminCredentials,
  generateAdminToken,
  verifyToken,
  requireAdmin,
  isAdminAuthConfigured
};
