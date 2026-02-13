/**
 * API Server Tests
 */

const request = require('supertest');
const app = require('../src/app');

describe('API Server', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'wekeza-api-server');
    });
  });

  describe('OAuth', () => {
    it('should return access token with valid credentials', async () => {
      const response = await request(app)
        .post('/oauth/token')
        .send({
          grant_type: 'client_credentials',
          client_id: 'sandbox_client',
          client_secret: 'sandbox_secret_key'
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('token_type', 'Bearer');
    });

    it('should reject invalid credentials', async () => {
      await request(app)
        .post('/oauth/token')
        .send({
          grant_type: 'client_credentials',
          client_id: 'invalid',
          client_secret: 'invalid'
        })
        .expect(401);
    });
  });

  describe('Accounts API', () => {
    let accessToken;

    beforeAll(async () => {
      const response = await request(app)
        .post('/oauth/token')
        .send({
          grant_type: 'client_credentials',
          client_id: 'sandbox_client',
          client_secret: 'sandbox_secret_key'
        });
      
      accessToken = response.body.access_token;
    });

    it('should list accounts with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject request without token', async () => {
      await request(app)
        .get('/api/v1/accounts')
        .expect(401);
    });

    it('should get account balance', async () => {
      // First get an account
      const accountsResponse = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${accessToken}`);
      
      if (accountsResponse.body.data.length > 0) {
        const accountId = accountsResponse.body.data[0].id;
        
        const balanceResponse = await request(app)
          .get(`/api/v1/accounts/${accountId}/balance`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
        
        expect(balanceResponse.body).toHaveProperty('balance');
        expect(balanceResponse.body).toHaveProperty('available');
        expect(balanceResponse.body).toHaveProperty('currency');
      }
    });
  });

  describe('Payments API', () => {
    let accessToken;
    let accountId;

    beforeAll(async () => {
      const tokenResponse = await request(app)
        .post('/oauth/token')
        .send({
          grant_type: 'client_credentials',
          client_id: 'sandbox_client',
          client_secret: 'sandbox_secret_key',
          scope: 'payments.write'
        });
      
      accessToken = tokenResponse.body.access_token;

      // Get an account for testing
      const accountsResponse = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${accessToken}`);
      
      if (accountsResponse.body.data.length > 0) {
        accountId = accountsResponse.body.data[0].id;
      }
    });

    it('should initiate payment with valid data', async () => {
      if (accountsResponse.body.data.length > 0) {
        const accountId = accountsResponse.body.data[0].id;
        
        const response = await request(app)
          .post('/api/v1/payments')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('Idempotency-Key', `test_${Date.now()}`)
          .send({
            sourceAccountId: accountId,
            destinationAccountNumber: '1009876543',
            amount: 100.00,
            currency: 'KES',
            reference: 'TEST-PAYMENT',
            description: 'Test payment'
          })
          .expect(201);
        
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('paymentRef');
        expect(response.body).toHaveProperty('status');
      } else {
        // Skip test if no account available
        test.skip('No account available for testing');
      }
    });

    it('should reject payment without required fields', async () => {
      await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          amount: 100.00
        })
        .expect(400);
    });
  });
});
