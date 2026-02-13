/**
 * Wekeza API Server Configuration
 */

require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1'
  },
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'wekeza_banking',
    user: process.env.DB_USER || 'wekeza_user',
    password: process.env.DB_PASSWORD || 'password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'change_this_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change_this_refresh_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '24h'
  },
  
  oauth: {
    clientId: process.env.OAUTH_CLIENT_ID || 'sandbox_client',
    clientSecret: process.env.OAUTH_CLIENT_SECRET || 'sandbox_secret_key'
  },
  
  webhook: {
    secret: process.env.WEBHOOK_SECRET || 'webhook_secret'
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  
  services: {
    coreBanking: process.env.CORE_BANKING_URL || 'http://localhost:3001',
    mpesa: {
      consumerKey: process.env.MPESA_CONSUMER_KEY || '',
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
      shortcode: process.env.MPESA_SHORTCODE || '174379'
    }
  }
};
