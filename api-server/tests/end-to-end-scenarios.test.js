/**
 * End-to-End Scenario Tests
 * Complete workflow tests from start to finish
 */

const request = require('supertest');
const app = require('../src/app');
const pool = require('../database/pool');

describe('End-to-End Scenarios', () => {
  let accessToken;

  beforeAll(async () => {
    const tokenResponse = await request(app)
      .post('/oauth/token')
      .send({
        grant_type: 'client_credentials',
        client_id: 'sandbox_client',
        client_secret: 'sandbox_secret_key'
      });
    accessToken = tokenResponse.body.access_token;
  });

  describe('Complete Customer Onboarding', () => {
    let customerId, accountId;

    it('should register new customer', async () => {
      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `******
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@example.com',
          phoneNumber: '+254723456789',
          dateOfBirth: '1990-05-15',
          idNumber: 'ID987654',
          address: '123 Main St, Nairobi'
        })
        .expect(201);

      customerId = response.body.id;
      expect(response.body).toHaveProperty('customerNumber');
    });

    it('should upload KYC documents', async () => {
      await request(app)
        .post(`/api/v1/customers/${customerId}/kyc/documents`)
        .set('Authorization', `******
        .attach('idFront', Buffer.from('id front'), 'id_front.jpg')
        .attach('idBack', Buffer.from('id back'), 'id_back.jpg')
        .attach('proofOfAddress', Buffer.from('utility bill'), 'proof.pdf')
        .expect(201);
    });

    it('should verify KYC', async () => {
      await request(app)
        .post(`/api/v1/customers/${customerId}/kyc/verify`)
        .set('Authorization', `******
        .send({
          verifiedBy: 'officer-123',
          status: 'approved'
        })
        .expect(200);
    });

    it('should create customer account', async () => {
      const response = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `******
        .send({
          customerId: customerId,
          accountType: 'savings',
          currency: 'KES',
          initialDeposit: 5000.00
        })
        .expect(201);

      accountId = response.body.id;
      expect(response.body).toHaveProperty('accountNumber');
    });

    it('should issue debit card', async () => {
      await request(app)
        .post('/api/v1/cards/issue')
        .set('Authorization', `******
        .send({
          accountId: accountId,
          cardType: 'debit',
          deliveryAddress: '123 Main St, Nairobi'
        })
        .expect(201);
    });

    it('should register for mobile banking', async () => {
      await request(app)
        .post('/api/v1/channels/mobile/register')
        .set('Authorization', `******
        .send({
          customerId: customerId,
          phoneNumber: '+254723456789',
          pin: '1234'
        })
        .expect(201);
    });

    it('should send welcome email and SMS', async () => {
      const response = await request(app)
        .post(`/api/v1/customers/${customerId}/welcome`)
        .set('Authorization', `******
        .expect(200);

      expect(response.body.emailSent).toBe(true);
      expect(response.body.smsSent).toBe(true);
    });
  });

  describe('Full Payment Lifecycle', () => {
    let paymentId;

    it('should check source account balance', async () => {
      const response = await request(app)
        .get('/api/v1/accounts/acc-123/balance')
        .set('Authorization', `******
        .expect(200);

      expect(response.body.available).toBeGreaterThan(1000);
    });

    it('should validate destination account', async () => {
      await request(app)
        .get('/api/v1/accounts/validate')
        .set('Authorization', `******
        .query({
          accountNumber: '1009876543'
        })
        .expect(200);
    });

    it('should initiate payment', async () => {
      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `******
        .set('Idempotency-Key', `e2e-payment-${Date.now()}`)
        .send({
          sourceAccountId: 'acc-123',
          destinationAccountNumber: '1009876543',
          amount: 1000.00,
          currency: 'KES',
          reference: 'E2E-PAYMENT-001',
          description: 'End-to-end test payment'
        })
        .expect(201);

      paymentId = response.body.id;
      expect(response.body.status).toBe('completed');
    });

    it('should generate payment receipt', async () => {
      await request(app)
        .get(`/api/v1/payments/${paymentId}/receipt`)
        .set('Authorization', `******
        .expect(200);
    });

    it('should send payment notification', async () => {
      await request(app)
        .post(`/api/v1/payments/${paymentId}/notify`)
        .set('Authorization', `******
        .expect(200);
    });

    it('should update account balances', async () => {
      const response = await request(app)
        .get('/api/v1/accounts/acc-123/balance')
        .set('Authorization', `******
        .expect(200);

      // Balance should be reduced
      expect(response.body.available).toBeLessThan(50000);
    });

    it('should record in transaction history', async () => {
      const response = await request(app)
        .get('/api/v1/accounts/acc-123/transactions')
        .set('Authorization', `******
        .expect(200);

      expect(response.body.data.some(t => t.paymentRef === paymentId)).toBe(true);
    });
  });

  describe('Account Statement Generation Workflow', () => {
    it('should request statement', async () => {
      const response = await request(app)
        .post('/api/v1/accounts/acc-123/statements')
        .set('Authorization', `******
        .send({
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          format: 'pdf',
          deliveryMethod: 'email'
        })
        .expect(202);

      expect(response.body).toHaveProperty('requestId');
    });

    it('should generate statement PDF', async () => {
      // Statement generation happens async
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await request(app)
        .get('/api/v1/accounts/acc-123/statements/latest')
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('url');
    });

    it('should email statement to customer', async () => {
      await request(app)
        .post('/api/v1/accounts/acc-123/statements/statement-123/email')
        .set('Authorization', `******
        .expect(200);
    });

    it('should log statement access', async () => {
      await request(app)
        .get('/api/v1/accounts/acc-123/statements/statement-123/download')
        .set('Authorization', `******
        .expect(200);

      // Check audit log
      const auditResponse = await request(app)
        .get('/api/v1/audit/statements/statement-123')
        .set('Authorization', `******
        .expect(200);

      expect(auditResponse.body.accessCount).toBeGreaterThan(0);
    });
  });

  describe('Dispute Resolution Workflow', () => {
    let disputeId;

    it('should customer raise dispute', async () => {
      const response = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `******
        .send({
          transactionId: 'txn-123',
          disputeType: 'unauthorized_transaction',
          description: 'Did not authorize this transaction',
          evidence: ['screenshot1.jpg', 'screenshot2.jpg']
        })
        .expect(201);

      disputeId = response.body.id;
      expect(response.body.status).toBe('open');
    });

    it('should assign to dispute handler', async () => {
      await request(app)
        .post(`/api/v1/disputes/${disputeId}/assign`)
        .set('Authorization', `******
        .send({
          handlerId: 'handler-123'
        })
        .expect(200);
    });

    it('should investigate dispute', async () => {
      await request(app)
        .post(`/api/v1/disputes/${disputeId}/investigate`)
        .set('Authorization', `******
        .send({
          investigationNotes: 'Reviewed transaction logs',
          status: 'investigating'
        })
        .expect(200);
    });

    it('should request additional information', async () => {
      await request(app)
        .post(`/api/v1/disputes/${disputeId}/request-info`)
        .set('Authorization', `******
        .send({
          requestedInfo: 'Please provide bank statement for the date'
        })
        .expect(200);
    });

    it('should resolve dispute', async () => {
      await request(app)
        .post(`/api/v1/disputes/${disputeId}/resolve`)
        .set('Authorization', `******
        .send({
          resolution: 'approved',
          refundAmount: 1000.00,
          notes: 'Transaction confirmed unauthorized'
        })
        .expect(200);
    });

    it('should process refund', async () => {
      await request(app)
        .post(`/api/v1/disputes/${disputeId}/refund`)
        .set('Authorization', `******
        .expect(200);
    });

    it('should notify customer of resolution', async () => {
      await request(app)
        .post(`/api/v1/disputes/${disputeId}/notify`)
        .set('Authorization', `******
        .expect(200);
    });
  });

  describe('Cross-Border Transaction Flow', () => {
    it('should validate forex rates', async () => {
      const response = await request(app)
        .get('/api/v1/forex/rates')
        .set('Authorization', `******
        .query({
          from: 'KES',
          to: 'USD'
        })
        .expect(200);

      expect(response.body).toHaveProperty('rate');
    });

    it('should check compliance requirements', async () => {
      const response = await request(app)
        .post('/api/v1/compliance/check')
        .set('Authorization', `******
        .send({
          customerId: 'customer-123',
          transactionType: 'international_transfer',
          amount: 10000.00,
          destinationCountry: 'US'
        })
        .expect(200);

      expect(response.body.requiresDocuments).toBeDefined();
    });

    it('should initiate SWIFT payment', async () => {
      const response = await request(app)
        .post('/api/v1/payments/swift')
        .set('Authorization', `******
        .send({
          sourceAccount: 'acc-123',
          beneficiaryName: 'John Smith',
          beneficiaryAccount: 'US123456789',
          swiftCode: 'ABCDUS33',
          amount: 5000.00,
          currency: 'USD',
          purpose: 'Education fees'
        })
        .expect(201);

      expect(response.body).toHaveProperty('swiftReference');
    });

    it('should track payment status', async () => {
      await request(app)
        .get('/api/v1/payments/swift/swift-ref-123/track')
        .set('Authorization', `******
        .expect(200);
    });

    it('should confirm receipt', async () => {
      await request(app)
        .post('/api/v1/payments/swift/swift-ref-123/confirm-receipt')
        .set('Authorization', `******
        .send({
          confirmedBy: 'beneficiary-bank',
          confirmedAt: new Date().toISOString()
        })
        .expect(200);
    });
  });

  describe('Loan Application to Disbursement', () => {
    let loanId;

    it('should customer apply for loan', async () => {
      const response = await request(app)
        .post('/api/v1/loans/apply')
        .set('Authorization', `******
        .send({
          customerId: 'customer-123',
          loanType: 'personal',
          amount: 100000.00,
          term: 12,
          purpose: 'Business expansion',
          collateral: 'Vehicle logbook'
        })
        .expect(201);

      loanId = response.body.applicationId;
    });

    it('should perform credit check', async () => {
      await request(app)
        .post(`/api/v1/loans/${loanId}/credit-check`)
        .set('Authorization', `******
        .expect(200);
    });

    it('should review by credit officer', async () => {
      await request(app)
        .post(`/api/v1/loans/${loanId}/review`)
        .set('Authorization', `******
        .send({
          reviewerId: 'officer-123',
          decision: 'recommend_approval',
          comments: 'Good credit history'
        })
        .expect(200);
    });

    it('should approve by manager', async () => {
      await request(app)
        .post(`/api/v1/loans/${loanId}/approve`)
        .set('Authorization', `******
        .send({
          approverId: 'manager-456',
          approvedAmount: 100000.00,
          interestRate: 12.5,
          term: 12
        })
        .expect(200);
    });

    it('should generate loan agreement', async () => {
      await request(app)
        .get(`/api/v1/loans/${loanId}/agreement`)
        .set('Authorization', `******
        .expect(200);
    });

    it('should customer sign agreement', async () => {
      await request(app)
        .post(`/api/v1/loans/${loanId}/sign`)
        .set('Authorization', `******
        .send({
          customerId: 'customer-123',
          signature: 'base64_signature',
          signedAt: new Date().toISOString()
        })
        .expect(200);
    });

    it('should disburse loan', async () => {
      await request(app)
        .post(`/api/v1/loans/${loanId}/disburse`)
        .set('Authorization', `******
        .send({
          disbursementAccount: 'acc-123',
          disbursedBy: 'officer-789'
        })
        .expect(200);
    });

    it('should generate repayment schedule', async () => {
      const response = await request(app)
        .get(`/api/v1/loans/${loanId}/schedule`)
        .set('Authorization', `******
        .expect(200);

      expect(response.body.schedule).toHaveLength(12);
    });
  });

  describe('Multi-Channel Transaction', () => {
    it('should deposit via agent', async () => {
      await request(app)
        .post('/api/v1/channels/agent/deposit')
        .set('X-Agent-Session', 'agent-session-token')
        .send({
          customerAccountNumber: '1001234567',
          amount: 5000.00
        })
        .expect(200);
    });

    it('should check balance via mobile', async () => {
      await request(app)
        .post('/api/v1/channels/mobile/balance')
        .send({
          phoneNumber: '+254712345678',
          accountNumber: '1001234567'
        })
        .expect(200);
    });

    it('should transfer via internet banking', async () => {
      await request(app)
        .post('/api/v1/channels/internet/transfer')
        .set('X-Session-Token', 'internet-session-token')
        .send({
          sourceAccount: '1001234567',
          destinationAccount: '1009876543',
          amount: 1000.00
        })
        .expect(200);
    });

    it('should withdraw via ATM', async () => {
      await request(app)
        .post('/api/v1/channels/atm/withdraw')
        .send({
          sessionToken: 'atm-session-token',
          amount: 2000.00
        })
        .expect(200);
    });

    it('should verify all transactions recorded', async () => {
      const response = await request(app)
        .get('/api/v1/accounts/1001234567/transactions')
        .set('Authorization', `******
        .query({
          startDate: new Date().toISOString().split('T')[0]
        })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(4);
    });
  });
});
