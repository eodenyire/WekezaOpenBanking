/**
 * Channels Integration Tests
 * Tests for all banking channels (Mobile, Internet, USSD, ATM, POS, Agent)
 */

const request = require('supertest');
const app = require('../src/app');

describe('Banking Channels', () => {
  let accessToken;
  let testAccountId;

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

  describe('Mobile Banking Channel', () => {
    it('should register for mobile banking', async () => {
      const response = await request(app)
        .post('/api/v1/channels/mobile/register')
        .set('Authorization', `******
        .send({
          phoneNumber: '+254712345678',
          pin: '1234',
          deviceId: 'test-device-123'
        })
        .expect(201);

      expect(response.body).toHaveProperty('mobileUserId');
    });

    it('should authenticate mobile user', async () => {
      const response = await request(app)
        .post('/api/v1/channels/mobile/login')
        .send({
          phoneNumber: '+254712345678',
          pin: '1234'
        })
        .expect(200);

      expect(response.body).toHaveProperty('sessionToken');
    });

    it('should check mobile balance', async () => {
      const response = await request(app)
        .post('/api/v1/channels/mobile/balance')
        .send({
          phoneNumber: '+254712345678',
          accountNumber: '1001234567'
        })
        .expect(200);

      expect(response.body).toHaveProperty('balance');
    });

    it('should perform mobile transfer', async () => {
      await request(app)
        .post('/api/v1/channels/mobile/transfer')
        .send({
          sourcePhone: '+254712345678',
          destinationPhone: '+254723456789',
          amount: 100.00,
          pin: '1234'
        })
        .expect(200);
    });

    it('should buy airtime via mobile', async () => {
      await request(app)
        .post('/api/v1/channels/mobile/airtime')
        .send({
          phoneNumber: '+254712345678',
          amount: 50.00,
          pin: '1234'
        })
        .expect(200);
    });

    it('should pay bills via mobile', async () => {
      await request(app)
        .post('/api/v1/channels/mobile/pay-bill')
        .send({
          phoneNumber: '+254712345678',
          businessNumber: '123456',
          accountNumber: 'ACCT001',
          amount: 500.00,
          pin: '1234'
        })
        .expect(200);
    });
  });

  describe('Internet Banking Channel', () => {
    let internetBankingSession;

    it('should register for internet banking', async () => {
      const response = await request(app)
        .post('/api/v1/channels/internet/register')
        .set('Authorization', `******
        .send({
          accountNumber: '1001234567',
          email: 'customer@example.com',
          password: 'SecurePass123!'
        })
        .expect(201);

      expect(response.body).toHaveProperty('userId');
    });

    it('should login to internet banking', async () => {
      const response = await request(app)
        .post('/api/v1/channels/internet/login')
        .send({
          username: 'customer@example.com',
          password: 'SecurePass123!'
        })
        .expect(200);

      internetBankingSession = response.body.sessionToken;
      expect(response.body).toHaveProperty('sessionToken');
    });

    it('should view account summary', async () => {
      const response = await request(app)
        .get('/api/v1/channels/internet/summary')
        .set('X-Session-Token', internetBankingSession)
        .expect(200);

      expect(response.body).toHaveProperty('accounts');
      expect(response.body).toHaveProperty('totalBalance');
    });

    it('should download statement', async () => {
      await request(app)
        .get('/api/v1/channels/internet/statement')
        .set('X-Session-Token', internetBankingSession)
        .query({
          accountId: testAccountId,
          format: 'pdf'
        })
        .expect(200);
    });

    it('should manage beneficiaries', async () => {
      await request(app)
        .post('/api/v1/channels/internet/beneficiaries')
        .set('X-Session-Token', internetBankingSession)
        .send({
          name: 'John Doe',
          accountNumber: '1009876543',
          bank: 'Wekeza Bank'
        })
        .expect(201);
    });
  });

  describe('USSD Channel', () => {
    it('should initiate USSD session', async () => {
      const response = await request(app)
        .post('/api/v1/channels/ussd/session')
        .send({
          phoneNumber: '+254712345678',
          ussdCode: '*123#'
        })
        .expect(200);

      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('message');
    });

    it('should handle USSD menu navigation', async () => {
      const sessionResponse = await request(app)
        .post('/api/v1/channels/ussd/session')
        .send({
          phoneNumber: '+254712345678',
          ussdCode: '*123#'
        });

      const response = await request(app)
        .post('/api/v1/channels/ussd/continue')
        .send({
          sessionId: sessionResponse.body.sessionId,
          input: '1'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should check balance via USSD', async () => {
      const sessionResponse = await request(app)
        .post('/api/v1/channels/ussd/session')
        .send({
          phoneNumber: '+254712345678',
          ussdCode: '*123*1#'
        });

      expect(sessionResponse.body.message).toContain('balance');
    });

    it('should send money via USSD', async () => {
      await request(app)
        .post('/api/v1/channels/ussd/send-money')
        .send({
          phoneNumber: '+254712345678',
          recipient: '+254723456789',
          amount: 100.00,
          pin: '1234'
        })
        .expect(200);
    });
  });

  describe('ATM Channel', () => {
    it('should authenticate at ATM', async () => {
      const response = await request(app)
        .post('/api/v1/channels/atm/authenticate')
        .send({
          cardNumber: '1234567890123456',
          pin: '1234',
          atmId: 'ATM-001'
        })
        .expect(200);

      expect(response.body).toHaveProperty('sessionToken');
    });

    it('should withdraw cash from ATM', async () => {
      const authResponse = await request(app)
        .post('/api/v1/channels/atm/authenticate')
        .send({
          cardNumber: '1234567890123456',
          pin: '1234',
          atmId: 'ATM-001'
        });

      await request(app)
        .post('/api/v1/channels/atm/withdraw')
        .send({
          sessionToken: authResponse.body.sessionToken,
          amount: 1000.00
        })
        .expect(200);
    });

    it('should check balance at ATM', async () => {
      const authResponse = await request(app)
        .post('/api/v1/channels/atm/authenticate')
        .send({
          cardNumber: '1234567890123456',
          pin: '1234',
          atmId: 'ATM-001'
        });

      const response = await request(app)
        .get('/api/v1/channels/atm/balance')
        .query({
          sessionToken: authResponse.body.sessionToken
        })
        .expect(200);

      expect(response.body).toHaveProperty('balance');
    });

    it('should print mini-statement at ATM', async () => {
      const authResponse = await request(app)
        .post('/api/v1/channels/atm/authenticate')
        .send({
          cardNumber: '1234567890123456',
          pin: '1234',
          atmId: 'ATM-001'
        });

      await request(app)
        .get('/api/v1/channels/atm/mini-statement')
        .query({
          sessionToken: authResponse.body.sessionToken
        })
        .expect(200);
    });

    it('should deposit cash at ATM', async () => {
      const authResponse = await request(app)
        .post('/api/v1/channels/atm/authenticate')
        .send({
          cardNumber: '1234567890123456',
          pin: '1234',
          atmId: 'ATM-001'
        });

      await request(app)
        .post('/api/v1/channels/atm/deposit')
        .send({
          sessionToken: authResponse.body.sessionToken,
          amount: 5000.00
        })
        .expect(200);
    });
  });

  describe('POS Terminal Channel', () => {
    it('should process POS payment', async () => {
      const response = await request(app)
        .post('/api/v1/channels/pos/payment')
        .send({
          terminalId: 'POS-001',
          cardNumber: '1234567890123456',
          pin: '1234',
          amount: 250.00,
          merchantId: 'MERCH-123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('transactionId');
      expect(response.body.status).toBe('approved');
    });

    it('should handle POS payment reversal', async () => {
      const paymentResponse = await request(app)
        .post('/api/v1/channels/pos/payment')
        .send({
          terminalId: 'POS-001',
          cardNumber: '1234567890123456',
          pin: '1234',
          amount: 100.00,
          merchantId: 'MERCH-123'
        });

      await request(app)
        .post('/api/v1/channels/pos/reversal')
        .send({
          transactionId: paymentResponse.body.transactionId,
          reason: 'Customer cancellation'
        })
        .expect(200);
    });

    it('should check card balance at POS', async () => {
      await request(app)
        .post('/api/v1/channels/pos/balance')
        .send({
          terminalId: 'POS-001',
          cardNumber: '1234567890123456',
          pin: '1234'
        })
        .expect(200);
    });

    it('should process contactless payment', async () => {
      await request(app)
        .post('/api/v1/channels/pos/contactless')
        .send({
          terminalId: 'POS-001',
          cardToken: 'TOKEN-123',
          amount: 50.00,
          merchantId: 'MERCH-123'
        })
        .expect(200);
    });
  });

  describe('Agent Banking Channel', () => {
    let agentId;

    it('should register agent', async () => {
      const response = await request(app)
        .post('/api/v1/channels/agent/register')
        .set('Authorization', `******
        .send({
          name: 'John Agent',
          phoneNumber: '+254712345678',
          idNumber: 'ID123456',
          location: 'Nairobi'
        })
        .expect(201);

      agentId = response.body.agentId;
      expect(response.body).toHaveProperty('agentId');
    });

    it('should authenticate agent', async () => {
      const response = await request(app)
        .post('/api/v1/channels/agent/login')
        .send({
          agentId: agentId,
          pin: '1234'
        })
        .expect(200);

      expect(response.body).toHaveProperty('sessionToken');
    });

    it('should process customer deposit via agent', async () => {
      const authResponse = await request(app)
        .post('/api/v1/channels/agent/login')
        .send({
          agentId: agentId,
          pin: '1234'
        });

      await request(app)
        .post('/api/v1/channels/agent/deposit')
        .set('X-Agent-Session', authResponse.body.sessionToken)
        .send({
          customerAccountNumber: '1001234567',
          amount: 1000.00
        })
        .expect(200);
    });

    it('should process customer withdrawal via agent', async () => {
      const authResponse = await request(app)
        .post('/api/v1/channels/agent/login')
        .send({
          agentId: agentId,
          pin: '1234'
        });

      await request(app)
        .post('/api/v1/channels/agent/withdrawal')
        .set('X-Agent-Session', authResponse.body.sessionToken)
        .send({
          customerAccountNumber: '1001234567',
          amount: 500.00,
          customerPin: '5678'
        })
        .expect(200);
    });

    it('should check agent float balance', async () => {
      const authResponse = await request(app)
        .post('/api/v1/channels/agent/login')
        .send({
          agentId: agentId,
          pin: '1234'
        });

      const response = await request(app)
        .get('/api/v1/channels/agent/float-balance')
        .set('X-Agent-Session', authResponse.body.sessionToken)
        .expect(200);

      expect(response.body).toHaveProperty('floatBalance');
    });

    it('should generate agent daily report', async () => {
      const authResponse = await request(app)
        .post('/api/v1/channels/agent/login')
        .send({
          agentId: agentId,
          pin: '1234'
        });

      await request(app)
        .get('/api/v1/channels/agent/daily-report')
        .set('X-Agent-Session', authResponse.body.sessionToken)
        .expect(200);
    });
  });
});
