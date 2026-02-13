/**
 * Wekeza API Accounts Module
 * Handles account information and transaction queries
 */

const axios = require('axios');

class WekezaAccounts {
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
   * List all accounts for the authenticated user
   * @param {object} params - Query parameters
   * @returns {Promise<object>} Account list
   */
  async listAccounts(params = {}) {
    try {
      const client = await this.getClient();
      const response = await client.get('/accounts', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get account details by ID
   * @param {string} accountId - Account ID
   * @returns {Promise<object>} Account details
   */
  async getAccount(accountId) {
    try {
      const client = await this.getClient();
      const response = await client.get(`/accounts/${accountId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get account balance
   * @param {string} accountId - Account ID
   * @returns {Promise<object>} Balance information
   */
  async getBalance(accountId) {
    try {
      const client = await this.getClient();
      const response = await client.get(`/accounts/${accountId}/balance`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get account transactions
   * @param {string} accountId - Account ID
   * @param {object} params - Query parameters (fromDate, toDate, page, limit)
   * @returns {Promise<object>} Transaction list
   */
  async getTransactions(accountId, params = {}) {
    try {
      const client = await this.getClient();
      const response = await client.get(`/accounts/${accountId}/transactions`, { params });
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

module.exports = WekezaAccounts;
