/**
 * OAuth Service
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../../database/pool');
const config = require('../../config');
const logger = require('../utils/logger');

class OAuthService {
  async generateToken(clientId, clientSecret, scopes = []) {
    try {
      // Verify client credentials
      const client = await pool.query_one(
        'SELECT * FROM oauth_clients WHERE client_id = $1',
        [clientId]
      );

      if (!client) {
        throw new Error('Invalid client credentials');
      }

      const isValidSecret = await bcrypt.compare(clientSecret, client.client_secret);
      if (!isValidSecret) {
        throw new Error('Invalid client credentials');
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { clientId, scopes: scopes.length > 0 ? scopes : client.scopes },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      const refreshToken = jwt.sign(
        { clientId, type: 'refresh' },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      // Calculate expiry
      const expiresIn = 3600; // 1 hour in seconds
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Store token
      await pool.query(`
        INSERT INTO oauth_tokens (access_token, refresh_token, client_id, scopes, expires_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [accessToken, refreshToken, clientId, scopes.length > 0 ? scopes : client.scopes, expiresAt]);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        scope: (scopes.length > 0 ? scopes : client.scopes).join(' ')
      };
    } catch (error) {
      logger.error('Token generation error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

      // Check if token exists in database
      const tokenRecord = await pool.query_one(
        'SELECT * FROM oauth_tokens WHERE refresh_token = $1',
        [refreshToken]
      );

      if (!tokenRecord) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { clientId: decoded.clientId, scopes: tokenRecord.scopes },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      const expiresIn = 3600;
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Update token
      await pool.query(`
        UPDATE oauth_tokens 
        SET access_token = $1, expires_at = $2
        WHERE refresh_token = $3
      `, [accessToken, expiresAt, refreshToken]);

      return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresIn
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }
}

module.exports = new OAuthService();
