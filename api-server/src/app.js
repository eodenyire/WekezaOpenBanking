/**
 * Main Application Setup
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('../config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const oauthRoutes = require('./routes/oauth');
const accountsRoutes = require('./routes/accounts');
const paymentsRoutes = require('./routes/payments');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'wekeza-api-server',
    version: config.server.apiVersion,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/oauth', oauthRoutes);
app.use(`/api/${config.server.apiVersion}/accounts`, accountsRoutes);
app.use(`/api/${config.server.apiVersion}/payments`, paymentsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
