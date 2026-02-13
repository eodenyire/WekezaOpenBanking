/**
 * Wekeza API Server
 */

const app = require('./app');
const config = require('../config');
const logger = require('./utils/logger');
const pool = require('../database/pool');

const PORT = config.server.port;

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error('Database connection failed:', err);
    process.exit(1);
  }
  logger.info('Database connection successful');
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Wekeza API Server running on port ${PORT}`);
  logger.info(`Environment: ${config.server.env}`);
  logger.info(`API Version: ${config.server.apiVersion}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    pool.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  });
});

module.exports = server;
