/**
 * Webhook Routes
 */

const express = require('express');
const router = express.Router();
const webhookService = require('../services/webhookService');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// POST /api/v1/webhooks - Register webhook
router.post('/',
  authenticateToken,
  [
    body('url').isURL().withMessage('Valid URL is required'),
    body('events').isArray({ min: 1 }).withMessage('At least one event is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const webhook = await webhookService.registerWebhook(req.user.clientId, {
        url: req.body.url,
        events: req.body.events,
        secret: req.body.secret
      });
      
      res.status(201).json(webhook);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/webhooks - List webhooks
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const webhooks = await webhookService.listWebhooks(req.user.clientId);
    res.json({ data: webhooks });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
