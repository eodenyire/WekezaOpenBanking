/**
 * Payments Service
 */

const pool = require('../../database/pool');
const logger = require('../utils/logger');
const crypto = require('crypto');

class PaymentsService {
  async initiatePayment(paymentData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check for idempotency
      if (paymentData.idempotencyKey) {
        const existing = await client.query_one(`
          SELECT * FROM payments WHERE idempotency_key = $1
        `, [paymentData.idempotencyKey]);
        
        if (existing) {
          await client.query('COMMIT');
          return this._formatPayment(existing);
        }
      }
      
      // Verify source account exists and has sufficient balance
      const sourceAccount = await client.query_one(`
        SELECT * FROM accounts WHERE id = $1 AND status = 'active'
      `, [paymentData.sourceAccountId]);
      
      if (!sourceAccount) {
        throw new Error('Source account not found or inactive');
      }
      
      if (parseFloat(sourceAccount.available_balance) < paymentData.amount) {
        throw new Error('Insufficient funds');
      }
      
      // Generate payment reference
      const paymentRef = `PAY${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      // Calculate risk score (simple implementation - should be more sophisticated in production)
      // Risk factors: amount, account history, destination, etc.
      const amountRisk = paymentData.amount > 100000 ? 0.3 : 0.1;
      const riskScore = Math.min(amountRisk + Math.random() * 0.2, 0.99);
      
      // Create payment in processing status
      const payment = await client.query_one(`
        INSERT INTO payments (
          payment_ref, source_account_id, destination_account_number,
          amount, currency, reference, description, status, risk_score, idempotency_key
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        paymentRef,
        paymentData.sourceAccountId,
        paymentData.destinationAccountNumber,
        paymentData.amount,
        paymentData.currency || 'KES',
        paymentData.reference,
        paymentData.description,
        'processing',
        riskScore,
        paymentData.idempotencyKey
      ]);
      
      // Debit source account
      await client.query(`
        UPDATE accounts
        SET available_balance = available_balance - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [paymentData.amount, paymentData.sourceAccountId]);
      
      // Create debit transaction
      await client.query(`
        INSERT INTO transactions (
          transaction_ref, account_id, transaction_type, amount, description, status
        )
        VALUES ($1, $2, 'debit', $3, $4, 'completed')
      `, [
        `TXN${paymentRef}`,
        paymentData.sourceAccountId,
        paymentData.amount,
        `Payment: ${paymentData.reference || paymentRef}`
      ]);
      
      // Simulate async payment processing (in real system, this would be a background job)
      // For demo purposes, we mark as completed immediately
      // TODO: Implement proper async payment processing with worker queues
      await client.query(`
        UPDATE payments
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [payment.id]);
      
      await client.query('COMMIT');
      
      payment.status = 'completed';
      payment.completed_at = new Date();
      
      return this._formatPayment(payment);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Payment initiation error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getPayment(paymentId) {
    try {
      const payment = await pool.query_one(`
        SELECT * FROM payments WHERE id = $1
      `, [paymentId]);
      
      if (!payment) {
        throw new Error('Payment not found');
      }
      
      return this._formatPayment(payment);
    } catch (error) {
      logger.error('Get payment error:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const payment = await pool.query_one(`
        SELECT id, payment_ref, status, completed_at, created_at
        FROM payments WHERE id = $1
      `, [paymentId]);
      
      if (!payment) {
        throw new Error('Payment not found');
      }
      
      return {
        id: payment.id,
        paymentRef: payment.payment_ref,
        status: payment.status,
        completedAt: payment.completed_at,
        createdAt: payment.created_at
      };
    } catch (error) {
      logger.error('Get payment status error:', error);
      throw error;
    }
  }

  async listPayments(filters = {}) {
    try {
      let query = 'SELECT * FROM payments WHERE 1=1';
      const params = [];
      
      if (filters.sourceAccountId) {
        params.push(filters.sourceAccountId);
        query += ` AND source_account_id = $${params.length}`;
      }
      
      if (filters.status) {
        params.push(filters.status);
        query += ` AND status = $${params.length}`;
      }
      
      query += ' ORDER BY created_at DESC';
      
      if (filters.limit) {
        params.push(filters.limit);
        query += ` LIMIT $${params.length}`;
      }
      
      const result = await pool.query(query, params);
      
      return {
        data: result.rows.map(payment => this._formatPayment(payment))
      };
    } catch (error) {
      logger.error('List payments error:', error);
      throw error;
    }
  }

  _formatPayment(payment) {
    return {
      id: payment.id,
      paymentRef: payment.payment_ref,
      sourceAccountId: payment.source_account_id,
      destinationAccountNumber: payment.destination_account_number,
      amount: parseFloat(payment.amount),
      currency: payment.currency,
      reference: payment.reference,
      description: payment.description,
      status: payment.status,
      riskScore: payment.risk_score ? parseFloat(payment.risk_score) : null,
      completedAt: payment.completed_at,
      createdAt: payment.created_at
    };
  }
}

module.exports = new PaymentsService();
