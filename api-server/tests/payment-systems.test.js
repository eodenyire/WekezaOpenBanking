/**
 * Payment Systems Integration Tests
 * Tests for M-Pesa, SWIFT, Card Processing, Bulk Payments
 */

const request = require('supertest');
const app = require('../src/app');

describe('Payment Systems Integration', () => {
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

  describe('M-Pesa Integration', () => {
    it('should initiate M-Pesa STK Push', async () => {
      const response = await request(app)
        .post('/api/v1/payments/mpesa/stk-push')
        .set('Authorization', `******
        .send({
          phoneNumber: '+254712345678',
          amount: 100.00,
          accountReference: 'ACC123',
          transactionDesc: 'Payment for services'
        })
        .expect(200);

      expect(response.body).toHaveProperty('checkoutRequestID');
    });

    it('should query M-Pesa transaction status', async () => {
      const response = await request(app)
        .get('/api/v1/payments/mpesa/query')
        .set('Authorization', `******
        .query({
          checkoutRequestID: 'ws_CO_123456789'
        })
        .expect(200);

      expect(response.body).toHaveProperty('resultCode');
    });

    it('should process M-Pesa C2B payment', async () => {
      await request(app)
        .post('/api/v1/payments/mpesa/c2b')
        .send({
          transactionType: 'CustomerPayBillOnline',
          transID: 'OEI2AK4Q16',
          transAmount: 1000.00,
          businessShortCode: '600986',
          billRefNumber: 'ACC123',
          msisdn: '254712345678'
        })
        .expect(200);
    });

    it('should initiate M-Pesa B2C payment', async () => {
      const response = await request(app)
        .post('/api/v1/payments/mpesa/b2c')
        .set('Authorization', `******
        .send({
          phoneNumber: '+254712345678',
          amount: 500.00,
          occasion: 'Salary',
          remarks: 'Monthly salary'
        })
        .expect(200);

      expect(response.body).toHaveProperty('conversationID');
    });

    it('should process M-Pesa B2B payment', async () => {
      await request(app)
        .post('/api/v1/payments/mpesa/b2b')
        .set('Authorization', `******
        .send({
          receiverShortCode: '600000',
          amount: 10000.00,
          accountReference: 'SUPP123',
          remarks: 'Supplier payment'
        })
        .expect(200);
    });

    it('should reverse M-Pesa transaction', async () => {
      await request(app)
        .post('/api/v1/payments/mpesa/reversal')
        .set('Authorization', `******
        .send({
          transactionID: 'OEI2AK4Q16',
          amount: 1000.00,
          occasion: 'Wrong payment'
        })
        .expect(200);
    });
  });

  describe('SWIFT Payments', () => {
    it('should initiate SWIFT payment', async () => {
      const response = await request(app)
        .post('/api/v1/payments/swift')
        .set('Authorization', `******
        .send({
          senderAccount: 'ACC123456',
          beneficiaryName: 'John Doe',
          beneficiaryAccount: 'IBAN123',
          beneficiaryBank: 'SWIFT BANK',
          swiftCode: 'ABCDUS33',
          amount: 5000.00,
          currency: 'USD',
          purpose: 'Trade payment'
        })
        .expect(201);

      expect(response.body).toHaveProperty('swiftReference');
    });

    it('should track SWIFT payment status', async () => {
      const response = await request(app)
        .get('/api/v1/payments/swift/swift-ref-123/status')
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });

    it('should validate SWIFT code', async () => {
      const response = await request(app)
        .get('/api/v1/payments/swift/validate')
        .set('Authorization', `******
        .query({
          swiftCode: 'ABCDUS33'
        })
        .expect(200);

      expect(response.body).toHaveProperty('valid');
    });

    it('should calculate SWIFT charges', async () => {
      const response = await request(app)
        .post('/api/v1/payments/swift/calculate-charges')
        .set('Authorization', `******
        .send({
          amount: 5000.00,
          currency: 'USD',
          destination: 'US'
        })
        .expect(200);

      expect(response.body).toHaveProperty('charges');
    });
  });

  describe('Card Processing', () => {
    it('should process card payment', async () => {
      const response = await request(app)
        .post('/api/v1/payments/cards/process')
        .set('Authorization', `******
        .send({
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2026',
          cvv: '123',
          amount: 250.00,
          currency: 'KES'
        })
        .expect(200);

      expect(response.body).toHaveProperty('transactionId');
      expect(response.body.status).toBe('approved');
    });

    it('should handle card tokenization', async () => {
      const response = await request(app)
        .post('/api/v1/payments/cards/tokenize')
        .set('Authorization', `******
        .send({
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2026'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
    });

    it('should process 3D Secure payment', async () => {
      const response = await request(app)
        .post('/api/v1/payments/cards/3ds')
        .set('Authorization', `******
        .send({
          cardNumber: '4111111111111111',
          amount: 1000.00,
          returnUrl: 'https://merchant.com/callback'
        })
        .expect(200);

      expect(response.body).toHaveProperty('redirectUrl');
    });

    it('should refund card payment', async () => {
      await request(app)
        .post('/api/v1/payments/cards/refund')
        .set('Authorization', `******
        .send({
          transactionId: 'card-txn-123',
          amount: 250.00,
          reason: 'Customer request'
        })
        .expect(200);
    });
  });

  describe('Bulk Payments', () => {
    it('should initiate bulk salary payment', async () => {
      const response = await request(app)
        .post('/api/v1/payments/bulk')
        .set('Authorization', `******
        .send({
          batchName: 'January 2026 Salaries',
          sourceAccount: 'ACC123',
          payments: [
            { accountNumber: '1001', amount: 50000, reference: 'EMP001' },
            { accountNumber: '1002', amount: 60000, reference: 'EMP002' },
            { accountNumber: '1003', amount: 45000, reference: 'EMP003' }
          ]
        })
        .expect(201);

      expect(response.body).toHaveProperty('batchId');
    });

    it('should get bulk payment status', async () => {
      const response = await request(app)
        .get('/api/v1/payments/bulk/batch-123/status')
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('totalPayments');
      expect(response.body).toHaveProperty('successCount');
      expect(response.body).toHaveProperty('failedCount');
    });

    it('should download bulk payment report', async () => {
      await request(app)
        .get('/api/v1/payments/bulk/batch-123/report')
        .set('Authorization', `******
        .expect(200);
    });

    it('should approve bulk payment batch', async () => {
      await request(app)
        .post('/api/v1/payments/bulk/batch-123/approve')
        .set('Authorization', `******
        .send({
          approverId: 'manager-123'
        })
        .expect(200);
    });

    it('should reject bulk payment batch', async () => {
      await request(app)
        .post('/api/v1/payments/bulk/batch-123/reject')
        .set('Authorization', `******
        .send({
          reason: 'Incorrect amounts'
        })
        .expect(200);
    });
  });

  describe('Payment Reversals', () => {
    it('should reverse payment', async () => {
      await request(app)
        .post('/api/v1/payments/payment-123/reverse')
        .set('Authorization', `******
        .send({
          reason: 'Duplicate payment',
          reversalType: 'full'
        })
        .expect(200);
    });

    it('should partially reverse payment', async () => {
      await request(app)
        .post('/api/v1/payments/payment-123/reverse')
        .set('Authorization', `******
        .send({
          reason: 'Partial refund',
          reversalType: 'partial',
          amount: 500.00
        })
        .expect(200);
    });

    it('should get reversal history', async () => {
      const response = await request(app)
        .get('/api/v1/payments/payment-123/reversals')
        .set('Authorization', `******
        .expect(200);

      expect(Array.isArray(response.body.reversals)).toBe(true);
    });
  });

  describe('Settlement Processing', () => {
    it('should initiate settlement', async () => {
      const response = await request(app)
        .post('/api/v1/payments/settlement')
        .set('Authorization', `******
        .send({
          settlementDate: '2026-02-13',
          merchantId: 'merchant-123'
        })
        .expect(201);

      expect(response.body).toHaveProperty('settlementId');
    });

    it('should get settlement report', async () => {
      const response = await request(app)
        .get('/api/v1/payments/settlement/settlement-123')
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('totalAmount');
      expect(response.body).toHaveProperty('transactionCount');
    });

    it('should reconcile settlement', async () => {
      await request(app)
        .post('/api/v1/payments/settlement/settlement-123/reconcile')
        .set('Authorization', `******
        .expect(200);
    });
  });

  describe('Payment Gateways', () => {
    it('should initialize payment with Pesapal', async () => {
      const response = await request(app)
        .post('/api/v1/payments/gateways/pesapal/initialize')
        .set('Authorization', `******
        .send({
          amount: 1500.00,
          description: 'Product purchase',
          callbackUrl: 'https://merchant.com/callback'
        })
        .expect(200);

      expect(response.body).toHaveProperty('paymentUrl');
    });

    it('should process Flutterwave payment', async () => {
      await request(app)
        .post('/api/v1/payments/gateways/flutterwave/charge')
        .set('Authorization', `******
        .send({
          cardNumber: '4187427415564246',
          cvv: '123',
          expiryMonth: '09',
          expiryYear: '26',
          amount: 2000.00,
          email: 'customer@example.com'
        })
        .expect(200);
    });

    it('should verify Paystack transaction', async () => {
      await request(app)
        .get('/api/v1/payments/gateways/paystack/verify')
        .set('Authorization', `******
        .query({
          reference: 'paystack-ref-123'
        })
        .expect(200);
    });
  });

  describe('Recurring Payments', () => {
    it('should create recurring payment', async () => {
      const response = await request(app)
        .post('/api/v1/payments/recurring')
        .set('Authorization', `******
        .send({
          sourceAccount: 'ACC123',
          destinationAccount: 'ACC456',
          amount: 1000.00,
          frequency: 'monthly',
          startDate: '2026-02-15',
          endDate: '2026-12-15'
        })
        .expect(201);

      expect(response.body).toHaveProperty('recurringId');
    });

    it('should cancel recurring payment', async () => {
      await request(app)
        .post('/api/v1/payments/recurring/rec-123/cancel')
        .set('Authorization', `******
        .expect(200);
    });

    it('should skip recurring payment instance', async () => {
      await request(app)
        .post('/api/v1/payments/recurring/rec-123/skip')
        .set('Authorization', `******
        .send({
          instanceDate: '2026-03-15'
        })
        .expect(200);
    });
  });
});
