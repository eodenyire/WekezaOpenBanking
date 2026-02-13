/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const config = require('../../config');
const logger = require('../utils/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const checkScopes = (requiredScopes) => {
  return (req, res, next) => {
    if (!req.user || !req.user.scopes) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const hasScope = requiredScopes.some(scope => req.user.scopes.includes(scope));
    
    if (!hasScope) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredScopes
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  checkScopes
};
