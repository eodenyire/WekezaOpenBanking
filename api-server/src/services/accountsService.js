/**
 * Accounts Service
 */

const pool = require('../../database/pool');
const logger = require('../utils/logger');

class AccountsService {
  async listAccounts(filters = {}) {
    try {
      let query = `
        SELECT a.*, c.first_name, c.last_name, c.email
        FROM accounts a
        JOIN customers c ON a.customer_id = c.id
        WHERE a.status = 'active'
      `;
      
      const params = [];
      
      if (filters.customerId) {
        params.push(filters.customerId);
        query += ` AND a.customer_id = $${params.length}`;
      }
      
      query += ' ORDER BY a.created_at DESC';
      
      if (filters.limit) {
        params.push(filters.limit);
        query += ` LIMIT $${params.length}`;
      }
      
      if (filters.offset) {
        params.push(filters.offset);
        query += ` OFFSET $${params.length}`;
      }
      
      const result = await pool.query(query, params);
      
      return {
        data: result.rows.map(row => ({
          id: row.id,
          accountNumber: row.account_number,
          accountType: row.account_type,
          currency: row.currency,
          balance: parseFloat(row.balance),
          availableBalance: parseFloat(row.available_balance),
          status: row.status,
          customer: {
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email
          },
          createdAt: row.created_at
        })),
        pagination: {
          limit: filters.limit || 10,
          offset: filters.offset || 0
        }
      };
    } catch (error) {
      logger.error('List accounts error:', error);
      throw error;
    }
  }

  async getAccount(accountId) {
    try {
      const result = await pool.query_one(`
        SELECT a.*, c.first_name, c.last_name, c.email, c.phone
        FROM accounts a
        JOIN customers c ON a.customer_id = c.id
        WHERE a.id = $1
      `, [accountId]);
      
      if (!result) {
        throw new Error('Account not found');
      }
      
      return {
        id: result.id,
        accountNumber: result.account_number,
        accountType: result.account_type,
        currency: result.currency,
        balance: parseFloat(result.balance),
        availableBalance: parseFloat(result.available_balance),
        status: result.status,
        customer: {
          firstName: result.first_name,
          lastName: result.last_name,
          email: result.email,
          phone: result.phone
        },
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };
    } catch (error) {
      logger.error('Get account error:', error);
      throw error;
    }
  }

  async getBalance(accountId) {
    try {
      const result = await pool.query_one(`
        SELECT balance, available_balance, currency
        FROM accounts
        WHERE id = $1
      `, [accountId]);
      
      if (!result) {
        throw new Error('Account not found');
      }
      
      return {
        balance: parseFloat(result.balance),
        available: parseFloat(result.available_balance),
        currency: result.currency
      };
    } catch (error) {
      logger.error('Get balance error:', error);
      throw error;
    }
  }

  async getTransactions(accountId, filters = {}) {
    try {
      let query = `
        SELECT *
        FROM transactions
        WHERE account_id = $1
      `;
      
      const params = [accountId];
      
      if (filters.fromDate) {
        params.push(filters.fromDate);
        query += ` AND transaction_date >= $${params.length}`;
      }
      
      if (filters.toDate) {
        params.push(filters.toDate);
        query += ` AND transaction_date <= $${params.length}`;
      }
      
      if (filters.type) {
        params.push(filters.type);
        query += ` AND transaction_type = $${params.length}`;
      }
      
      query += ' ORDER BY transaction_date DESC';
      
      if (filters.limit) {
        params.push(filters.limit);
        query += ` LIMIT $${params.length}`;
      }
      
      const result = await pool.query(query, params);
      
      return {
        data: result.rows.map(row => ({
          id: row.id,
          transactionRef: row.transaction_ref,
          type: row.transaction_type,
          amount: parseFloat(row.amount),
          currency: row.currency,
          balanceAfter: row.balance_after ? parseFloat(row.balance_after) : null,
          description: row.description,
          status: row.status,
          transactionDate: row.transaction_date,
          createdAt: row.created_at
        }))
      };
    } catch (error) {
      logger.error('Get transactions error:', error);
      throw error;
    }
  }
}

module.exports = new AccountsService();
