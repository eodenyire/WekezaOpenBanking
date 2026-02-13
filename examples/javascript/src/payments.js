/**
 * Wekeza API Payments Module
 * Handles payment initiation and tracking
 */

const axios = require('axios');
const crypto = require('crypto');

class WekezaPayments {
  constructor(config, auth) {
    this.baseUrl = config.baseUrl;
    this.auth = auth;
  }

  /**
   * Get authenticated axios instance
   * @returns {Promise<object>} Configured axios instance
   */
  async getClient() {
    const token = await this.auth.getAccessToken();
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generate idempotency key
   * @returns {string} Unique idempotency key
   */
  generateIdempotencyKey() {
    return `payment_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Initiate a payment
   * @param {object} paymentData - Payment details
   * @param {object} options - Additional options (idempotencyKey)
   * @returns {Promise<object>} Payment response
   */
  async initiatePayment(paymentData, options = {}) {
    try {
      const client = await this.getClient();
      const idempotencyKey = options.idempotencyKey || this.generateIdempotencyKey();
      
      const response = await client.post('/payments', paymentData, {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get payment details
   * @param {string} paymentId - Payment ID
   * @returns {Promise<object>} Payment details
   */
  async getPayment(paymentId) {
    try {
      const client = await this.getClient();
      const response = await client.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get payment status
   * @param {string} paymentId - Payment ID
   * @returns {Promise<object>} Payment status
   */
  async getPaymentStatus(paymentId) {
    try {
      const client = await this.getClient();
      const response = await client.get(`/payments/${paymentId}/status`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List payments
   * @param {object} params - Query parameters (status, fromDate, toDate, page, limit)
   * @returns {Promise<object>} Payment list
   */
  async listPayments(params = {}) {
    try {
      const client = await this.getClient();
      const response = await client.get('/payments', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cancel a payment
   * @param {string} paymentId - Payment ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<object>} Cancellation response
   */
  async cancelPayment(paymentId, reason) {
    try {
      const client = await this.getClient();
      const response = await client.post(`/payments/${paymentId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Initiate M-Pesa STK Push
   * @param {object} mpesaData - M-Pesa payment details
   * @returns {Promise<object>} M-Pesa response
   */
  async mpesaStkPush(mpesaData) {
    try {
      const client = await this.getClient();
      const response = await client.post('/payments/mpesa/stk-push', mpesaData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   * @param {Error} error - Axios error
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      return new Error(
        `API Error (${status}): ${data.message || data.error || 'Unknown error'}`
      );
    } else if (error.request) {
      return new Error('Network error: No response received from server');
    } else {
      return new Error(`Request error: ${error.message}`);
    }
  }
}

module.exports = WekezaPayments;
