/**
 * Core Banking System Integration Tests
 * Tests for all core banking functionalities
 */

const request = require('supertest');
const app = require('../src/app');
const pool = require('../database/pool');

describe('Core Banking System', () => {
  let accessToken;
  let testAccountId;
  let testCustomerId;

  beforeAll(async () => {
    // Get auth token
    const tokenResponse = await request(app)
      .post('/oauth/token')
      .send({
        grant_type: 'client_credentials',
        client_id: 'sandbox_client',
        client_secret: 'sandbox_secret_key'
      });
    accessToken = tokenResponse.body.access_token;

    // Get test account
    const accountsResponse = await request(app)
      .get('/api/v1/accounts')
      .set('Authorization', `******;
    testAccountId = accountsResponse.body.data[0]?.id;
    testCustomerId = accountsResponse.body.data[0]?.customer?.id;
  });

  describe('Account Creation', () => {
    it('should create a new savings account', async () => {
      const response = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `******
        .send({
          customerId: testCustomerId,
          accountType: 'savings',
          currency: 'KES',
          initialDeposit: 1000.00
        })
        .expect(201);

      expect(response.body).toHaveProperty('accountNumber');
      expect(response.body.accountType).toBe('savings');
      expect(response.body.balance).toBe(1000.00);
    });

    it('should create a current account', async () => {
      const response = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `******
        .send({
          customerId: testCustomerId,
          accountType: 'current',
          currency: 'KES'
        })
        .expect(201);

      expect(response.body.accountType).toBe('current');
    });

    it('should create a fixed deposit account', async () => {
      const response = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `******
        .send({
          customerId: testCustomerId,
          accountType: 'fixed_deposit',
          currency: 'KES',
          initialDeposit: 50000.00,
          maturityPeriod: 12,
          interestRate: 8.5
        })
        .expect(201);

      expect(response.body).toHaveProperty('maturityDate');
      expect(response.body).toHaveProperty('interestRate');
    });

    it('should reject account creation with invalid customer', async () => {
      await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `******
        .send({
          customerId: '00000000-0000-0000-0000-000000000000',
          accountType: 'savings',
          currency: 'KES'
        })
        .expect(404);
    });

    it('should enforce minimum balance requirements', async () => {
      await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `******
        .send({
          customerId: testCustomerId,
          accountType: 'savings',
          currency: 'KES',
          initialDeposit: 10.00
        })
        .expect(400);
    });
  });

  describe('Balance Queries', () => {
    it('should get account balance', async () => {
      const response = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/balance`)
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('balance');
      expect(response.body).toHaveProperty('available');
      expect(response.body).toHaveProperty('currency');
    });

    it('should get balance with pending transactions', async () => {
      const response = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/balance`)
        .set('Authorization', `******
        .query({ includePending: true })
        .expect(200);

      expect(response.body).toHaveProperty('pendingBalance');
    });

    it('should get multi-currency balances', async () => {
      const response = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/balances`)
        .set('Authorization', `******
        .expect(200);

      expect(Array.isArray(response.body.balances)).toBe(true);
    });
  });

  describe('Fund Transfers', () => {
    it('should transfer funds between accounts', async () => {
      const response = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `******
        .send({
          sourceAccountId: testAccountId,
          destinationAccountNumber: '1002345678',
          amount: 500.00,
          currency: 'KES',
          reference: 'TEST-TRANSFER',
          description: 'Test transfer'
        })
        .expect(201);

      expect(response.body).toHaveProperty('transferId');
      expect(response.body.status).toBe('completed');
    });

    it('should handle insufficient funds', async () => {
      await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `******
        .send({
          sourceAccountId: testAccountId,
          destinationAccountNumber: '1002345678',
          amount: 999999999.00,
          currency: 'KES'
        })
        .expect(400);
    });

    it('should support scheduled transfers', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const response = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `******
        .send({
          sourceAccountId: testAccountId,
          destinationAccountNumber: '1002345678',
          amount: 100.00,
          currency: 'KES',
          scheduledDate: futureDate.toISOString()
        })
        .expect(201);

      expect(response.body.status).toBe('scheduled');
    });

    it('should support recurring transfers', async () => {
      const response = await request(app)
        .post('/api/v1/transfers/recurring')
        .set('Authorization', `******
        .send({
          sourceAccountId: testAccountId,
          destinationAccountNumber: '1002345678',
          amount: 50.00,
          currency: 'KES',
          frequency: 'monthly',
          startDate: new Date().toISOString()
        })
        .expect(201);

      expect(response.body).toHaveProperty('recurringId');
    });
  });

  describe('Transaction Processing', () => {
    it('should process debit transaction', async () => {
      const response = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `******
        .send({
          accountId: testAccountId,
          type: 'debit',
          amount: 100.00,
          description: 'Test debit'
        })
        .expect(201);

      expect(response.body.type).toBe('debit');
    });

    it('should process credit transaction', async () => {
      const response = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `******
        .send({
          accountId: testAccountId,
          type: 'credit',
          amount: 100.00,
          description: 'Test credit'
        })
        .expect(201);

      expect(response.body.type).toBe('credit');
    });

    it('should handle transaction reversal', async () => {
      // Create a transaction first
      const txResponse = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `******
        .send({
          accountId: testAccountId,
          type: 'debit',
          amount: 50.00,
          description: 'To be reversed'
        });

      // Reverse it
      await request(app)
        .post(`/api/v1/transactions/${txResponse.body.id}/reverse`)
        .set('Authorization', `******
        .send({
          reason: 'Test reversal'
        })
        .expect(200);
    });
  });

  describe('Statement Generation', () => {
    it('should generate monthly statement', async () => {
      const response = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/statements`)
        .set('Authorization', `******
        .send({
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          format: 'pdf'
        })
        .expect(200);

      expect(response.body).toHaveProperty('statementUrl');
    });

    it('should generate statement in CSV format', async () => {
      const response = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/statements`)
        .set('Authorization', `******
        .send({
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          format: 'csv'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('csv');
    });

    it('should email statement to customer', async () => {
      await request(app)
        .post(`/api/v1/accounts/${testAccountId}/statements/email`)
        .set('Authorization', `******
        .send({
          startDate: '2026-01-01',
          endDate: '2026-01-31'
        })
        .expect(200);
    });
  });

  describe('Interest Calculations', () => {
    it('should calculate savings account interest', async () => {
      const response = await request(app)
        .get(`/api/v1/accounts/${testAccountId}/interest`)
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('accruedInterest');
      expect(response.body).toHaveProperty('interestRate');
    });

    it('should post interest to account', async () => {
      await request(app)
        .post(`/api/v1/accounts/${testAccountId}/interest/post`)
        .set('Authorization', `******
        .expect(200);
    });
  });

  describe('Account Closure', () => {
    let closureAccountId;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `******
        .send({
          customerId: testCustomerId,
          accountType: 'savings',
          currency: 'KES',
          initialDeposit: 1000.00
        });
      closureAccountId = response.body.id;
    });

    it('should close account with zero balance', async () => {
      // Withdraw all funds first
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `******
        .send({
          accountId: closureAccountId,
          type: 'debit',
          amount: 1000.00,
          description: 'Withdraw all'
        });

      // Close account
      await request(app)
        .post(`/api/v1/accounts/${closureAccountId}/close`)
        .set('Authorization', `******
        .send({
          reason: 'Customer request'
        })
        .expect(200);
    });

    it('should reject closure of account with balance', async () => {
      await request(app)
        .post(`/api/v1/accounts/${testAccountId}/close`)
        .set('Authorization', `******
        .send({
          reason: 'Test'
        })
        .expect(400);
    });
  });

  describe('Multi-Currency Support', () => {
    it('should create USD account', async () => {
      const response = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `******
        .send({
          customerId: testCustomerId,
          accountType: 'savings',
          currency: 'USD',
          initialDeposit: 100.00
        })
        .expect(201);

      expect(response.body.currency).toBe('USD');
    });

    it('should convert currency for transfers', async () => {
      const response = await request(app)
        .post('/api/v1/transfers/currency-convert')
        .set('Authorization', `******
        .send({
          sourceAccountId: testAccountId,
          destinationCurrency: 'USD',
          amount: 1000.00
        })
        .expect(200);

      expect(response.body).toHaveProperty('exchangeRate');
      expect(response.body).toHaveProperty('convertedAmount');
    });
  });

  describe('Loan Management', () => {
    it('should apply for loan', async () => {
      const response = await request(app)
        .post('/api/v1/loans/apply')
        .set('Authorization', `******
        .send({
          customerId: testCustomerId,
          loanType: 'personal',
          amount: 50000.00,
          term: 12,
          purpose: 'Business expansion'
        })
        .expect(201);

      expect(response.body).toHaveProperty('applicationId');
      expect(response.body.status).toBe('pending');
    });

    it('should get loan repayment schedule', async () => {
      const response = await request(app)
        .get('/api/v1/loans/12345/schedule')
        .set('Authorization', `******
        .expect(200);

      expect(Array.isArray(response.body.schedule)).toBe(true);
    });

    it('should make loan repayment', async () => {
      await request(app)
        .post('/api/v1/loans/12345/repay')
        .set('Authorization', `******
        .send({
          amount: 5000.00,
          sourceAccountId: testAccountId
        })
        .expect(200);
    });
  });

  describe('Card Management', () => {
    it('should issue debit card', async () => {
      const response = await request(app)
        .post('/api/v1/cards/issue')
        .set('Authorization', `******
        .send({
          accountId: testAccountId,
          cardType: 'debit',
          deliveryAddress: '123 Test Street'
        })
        .expect(201);

      expect(response.body).toHaveProperty('cardNumber');
      expect(response.body.status).toBe('pending');
    });

    it('should block card', async () => {
      await request(app)
        .post('/api/v1/cards/12345/block')
        .set('Authorization', `******
        .send({
          reason: 'Lost card'
        })
        .expect(200);
    });

    it('should get card transactions', async () => {
      const response = await request(app)
        .get('/api/v1/cards/12345/transactions')
        .set('Authorization', `******
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
