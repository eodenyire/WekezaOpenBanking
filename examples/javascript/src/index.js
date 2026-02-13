/**
 * Wekeza API JavaScript SDK
 * Main entry point
 */

const WekezaAuth = require('./auth');
const WekezaAccounts = require('./accounts');
const WekezaPayments = require('./payments');
const WekezaWebhooks = require('./webhooks');

class WekezaClient {
  constructor(config) {
    // Validate required config
    if (!config.clientId || !config.clientSecret) {
      throw new Error('clientId and clientSecret are required');
    }

    this.config = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      baseUrl: config.baseUrl || 'https://sandbox.wekeza.com/api/v1',
      oauthUrl: config.oauthUrl || 'https://sandbox.wekeza.com/oauth',
      webhookSecret: config.webhookSecret
    };

    // Initialize modules
    this.auth = new WekezaAuth(this.config);
    this.accounts = new WekezaAccounts(this.config, this.auth);
    this.payments = new WekezaPayments(this.config, this.auth);
    
    if (this.config.webhookSecret) {
      this.webhooks = new WekezaWebhooks(this.config.webhookSecret);
    }
  }

  /**
   * Create client from environment variables
   * @returns {WekezaClient} Configured client
   */
  static fromEnv() {
    require('dotenv').config();

    return new WekezaClient({
      clientId: process.env.WEKEZA_CLIENT_ID,
      clientSecret: process.env.WEKEZA_CLIENT_SECRET,
      baseUrl: process.env.WEKEZA_BASE_URL,
      oauthUrl: process.env.WEKEZA_OAUTH_URL,
      webhookSecret: process.env.WEBHOOK_SECRET
    });
  }
}

module.exports = WekezaClient;
