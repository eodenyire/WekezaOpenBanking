/**
 * Accounts Routes
 */

const express = require('express');
const router = express.Router();
const accountsService = require('../services/accountsService');
const { authenticateToken, checkScopes } = require('../middleware/auth');

// GET /api/v1/accounts - List accounts
router.get('/', authenticateToken, checkScopes(['accounts.read']), async (req, res, next) => {
  try {
    const filters = {
      limit: parseInt(req.query.limit) || 10,
      offset: parseInt(req.query.offset) || 0,
      customerId: req.query.customerId
    };
    
    const result = await accountsService.listAccounts(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/accounts/:id - Get account details
router.get('/:id', authenticateToken, checkScopes(['accounts.read']), async (req, res, next) => {
  try {
    const account = await accountsService.getAccount(req.params.id);
    res.json(account);
  } catch (error) {
    if (error.message === 'Account not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

// GET /api/v1/accounts/:id/balance - Get account balance
router.get('/:id/balance', authenticateToken, checkScopes(['accounts.read']), async (req, res, next) => {
  try {
    const balance = await accountsService.getBalance(req.params.id);
    res.json(balance);
  } catch (error) {
    if (error.message === 'Account not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

// GET /api/v1/accounts/:id/transactions - Get account transactions
router.get('/:id/transactions', authenticateToken, checkScopes(['transactions.read']), async (req, res, next) => {
  try {
    const filters = {
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      type: req.query.type,
      limit: parseInt(req.query.limit) || 10
    };
    
    const transactions = await accountsService.getTransactions(req.params.id, filters);
    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
