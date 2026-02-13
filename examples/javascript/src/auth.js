/**
 * Wekeza API Authentication Module
 * Handles OAuth 2.0 token management with caching
 */

const axios = require('axios');

class WekezaAuth {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.oauthUrl = config.oauthUrl;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.refreshToken = null;
  }

  /**
   * Get access token (uses cache if valid)
   * @returns {Promise<string>} Access token
   */
  async getAccessToken() {
    // Return cached token if still valid (with 60s buffer)
    if (this.accessToken && this.tokenExpiry > Date.now() + 60000) {
      return this.accessToken;
    }

    // Try refresh token first if available
    if (this.refreshToken) {
      try {
        return await this.refreshAccessToken();
      } catch (error) {
        console.warn('Token refresh failed, requesting new token');
      }
    }

    // Request new token
    return await this.requestNewToken();
  }

  /**
   * Request new access token using client credentials
   * @returns {Promise<string>} Access token
   */
  async requestNewToken() {
    try {
      const response = await axios.post(
        `${this.oauthUrl}/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'accounts.read transactions.read payments.write'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const data = response.data;
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      
      // Set expiry time (typically 3600 seconds)
      const expiresIn = data.expires_in || 3600;
      this.tokenExpiry = Date.now() + (expiresIn * 1000);

      return this.accessToken;
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   * @returns {Promise<string>} Access token
   */
  async refreshAccessToken() {
    try {
      const response = await axios.post(
        `${this.oauthUrl}/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const data = response.data;
      this.accessToken = data.access_token;
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
      }
      
      const expiresIn = data.expires_in || 3600;
      this.tokenExpiry = Date.now() + (expiresIn * 1000);

      return this.accessToken;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Clear cached tokens
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }
}

module.exports = WekezaAuth;
