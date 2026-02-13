/**
 * OAuth Routes
 */

const express = require('express');
const router = express.Router();
const oauthService = require('../services/oauthService');
const logger = require('../utils/logger');

// POST /oauth/token - Get access token
router.post('/token', async (req, res, next) => {
  try {
    const { grant_type, client_id, client_secret, refresh_token, scope } = req.body;
    
    if (grant_type === 'client_credentials') {
      const scopes = scope ? scope.split(' ') : [];
      const tokenData = await oauthService.generateToken(client_id, client_secret, scopes);
      res.json(tokenData);
    } else if (grant_type === 'refresh_token') {
      const tokenData = await oauthService.refreshToken(refresh_token);
      res.json(tokenData);
    } else {
      res.status(400).json({ error: 'Unsupported grant type' });
    }
  } catch (error) {
    logger.error('OAuth token error:', error);
    res.status(401).json({ error: error.message });
  }
});

module.exports = router;
