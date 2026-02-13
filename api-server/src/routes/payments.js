/**
 * Payments Routes
 */

const express = require('express');
const router = express.Router();
const paymentsService = require('../services/paymentsService');
const { authenticateToken, checkScopes } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// POST /api/v1/payments - Initiate payment
router.post('/',
  authenticateToken,
  checkScopes(['payments.write']),
  [
    body('sourceAccountId').notEmpty().withMessage('Source account ID is required'),
    body('destinationAccountNumber').notEmpty().withMessage('Destination account number is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const paymentData = {
        sourceAccountId: req.body.sourceAccountId,
        destinationAccountNumber: req.body.destinationAccountNumber,
        amount: req.body.amount,
        currency: req.body.currency || 'KES',
        reference: req.body.reference,
        description: req.body.description,
        idempotencyKey: req.headers['idempotency-key']
      };
      
      const payment = await paymentsService.initiatePayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Insufficient')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
);

// GET /api/v1/payments/:id - Get payment details
router.get('/:id', authenticateToken, checkScopes(['payments.read', 'payments.write']), async (req, res, next) => {
  try {
    const payment = await paymentsService.getPayment(req.params.id);
    res.json(payment);
  } catch (error) {
    if (error.message === 'Payment not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

// GET /api/v1/payments/:id/status - Get payment status
router.get('/:id/status', authenticateToken, checkScopes(['payments.read', 'payments.write']), async (req, res, next) => {
  try {
    const status = await paymentsService.getPaymentStatus(req.params.id);
    res.json(status);
  } catch (error) {
    if (error.message === 'Payment not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

// GET /api/v1/payments - List payments
router.get('/', authenticateToken, checkScopes(['payments.read', 'payments.write']), async (req, res, next) => {
  try {
    const filters = {
      sourceAccountId: req.query.sourceAccountId,
      status: req.query.status,
      limit: parseInt(req.query.limit) || 10
    };
    
    const payments = await paymentsService.listPayments(filters);
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
