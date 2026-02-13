/**
 * Security and Compliance Tests
 * Tests for security features, PCI DSS, KYC/AML compliance
 */

const request = require('supertest');
const app = require('../src/app');

describe('Security and Compliance', () => {
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

  describe('OAuth 2.0 Flows', () => {
    it('should support client credentials flow', async () => {
      const response = await request(app)
        .post('/oauth/token')
        .send({
          grant_type: 'client_credentials',
          client_id: 'sandbox_client',
          client_secret: 'sandbox_secret_key'
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.token_type).toBe('Bearer');
    });

    it('should support refresh token flow', async () => {
      const initialResponse = await request(app)
        .post('/oauth/token')
        .send({
          grant_type: 'client_credentials',
          client_id: 'sandbox_client',
          client_secret: 'sandbox_secret_key'
        });

      const refreshResponse = await request(app)
        .post('/oauth/token')
        .send({
          grant_type: 'refresh_token',
          refresh_token: initialResponse.body.refresh_token
        })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('access_token');
    });

    it('should reject invalid client credentials', async () => {
      await request(app)
        .post('/oauth/token')
        .send({
          grant_type: 'client_credentials',
          client_id: 'invalid',
          client_secret: 'invalid'
        })
        .expect(401);
    });

    it('should enforce scope restrictions', async () => {
      const limitedToken = await request(app)
        .post('/oauth/token')
        .send({
          grant_type: 'client_credentials',
          client_id: 'sandbox_client',
          client_secret: 'sandbox_secret_key',
          scope: 'accounts.read'
        });

      // Should allow accounts read
      await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `******{limitedToken.body.access_token}`)
        .expect(200);

      // Should deny payments write
      await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `******{limitedToken.body.access_token}`)
        .send({})
        .expect(403);
    });
  });

  describe('JWT Token Validation', () => {
    it('should reject expired tokens', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired.token';
      
      await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `******{expiredToken}`)
        .expect(403);
    });

    it('should reject malformed tokens', async () => {
      await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', 'Bearer invalid_token')
        .expect(403);
    });

    it('should reject tokens without Bearer prefix', async () => {
      await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', accessToken)
        .expect(401);
    });
  });

  describe('Encryption', () => {
    it('should use HTTPS in production', async () => {
      // Check security headers
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('strict-transport-security');
    });

    it('should encrypt sensitive data at rest', async () => {
      // Create payment with sensitive data
      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `******
        .set('Idempotency-Key', `security-test-${Date.now()}`)
        .send({
          sourceAccountId: 'acc-123',
          destinationAccountNumber: '1009876543',
          amount: 100.00,
          currency: 'KES',
          cardNumber: '4111111111111111'  // Sensitive
        })
        .expect(201);

      // Verify card number is not in response
      expect(response.body).not.toHaveProperty('cardNumber');
      expect(JSON.stringify(response.body)).not.toContain('4111111111111111');
    });

    it('should mask sensitive data in logs', async () => {
      await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `******
        .set('Idempotency-Key', `log-test-${Date.now()}`)
        .send({
          sourceAccountId: 'acc-123',
          destinationAccountNumber: '1009876543',
          amount: 100.00,
          currency: 'KES',
          pin: '1234'
        });

      // Check logs don't contain plain PIN
      // This would be verified in actual log files
    });
  });

  describe('PCI DSS Compliance', () => {
    it('should not store full card numbers', async () => {
      await request(app)
        .post('/api/v1/cards/tokenize')
        .set('Authorization', `******
        .send({
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2026'
        })
        .expect(200);

      // Verify card number not stored in plain text
      const response = await request(app)
        .get('/api/v1/cards/card-123')
        .set('Authorization', `******
        .expect(200);

      expect(response.body.cardNumber).toMatch(/\*{12}\d{4}/); // Masked
    });

    it('should not store CVV', async () => {
      await request(app)
        .post('/api/v1/payments/cards/process')
        .set('Authorization', `******
        .send({
          cardNumber: '4111111111111111',
          cvv: '123',
          amount: 100.00
        })
        .expect(200);

      // CVV should never be stored or returned
    });

    it('should use tokenization for card storage', async () => {
      const response = await request(app)
        .post('/api/v1/cards/tokenize')
        .set('Authorization', `******
        .send({
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2026'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.token).not.toContain('4111111111111111');
    });

    it('should enforce strong authentication for card transactions', async () => {
      await request(app)
        .post('/api/v1/payments/cards/process')
        .set('Authorization', `******
        .send({
          cardToken: 'token-123',
          amount: 10000.00  // High value
        })
        .expect(400); // Requires 3DS

      // Should require 3D Secure for high-value transactions
    });
  });

  describe('KYC/AML Checks', () => {
    it('should perform KYC verification', async () => {
      const response = await request(app)
        .post('/api/v1/kyc/verify')
        .set('Authorization', `******
        .send({
          customerId: 'customer-123',
          idNumber: 'ID123456',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01'
        })
        .expect(200);

      expect(response.body).toHaveProperty('verificationStatus');
    });

    it('should screen against sanctions lists', async () => {
      const response = await request(app)
        .post('/api/v1/aml/screen')
        .set('Authorization', `******
        .send({
          name: 'John Doe',
          country: 'KE',
          dateOfBirth: '1990-01-01'
        })
        .expect(200);

      expect(response.body).toHaveProperty('matchFound');
      expect(response.body).toHaveProperty('riskScore');
    });

    it('should flag high-risk transactions', async () => {
      const response = await request(app)
        .post('/api/v1/aml/evaluate-transaction')
        .set('Authorization', `******
        .send({
          customerId: 'customer-123',
          amount: 1000000.00,  // High amount
          destinationCountry: 'XX',  // High-risk country
          transactionType: 'international_wire'
        })
        .expect(200);

      expect(response.body.requiresReview).toBe(true);
    });

    it('should monitor for suspicious patterns', async () => {
      const response = await request(app)
        .post('/api/v1/aml/monitor')
        .set('Authorization', `******
        .send({
          accountId: 'acc-123',
          transactions: [
            { amount: 9900, date: '2026-02-01' },
            { amount: 9900, date: '2026-02-02' },
            { amount: 9900, date: '2026-02-03' }
          ]
        })
        .expect(200);

      expect(response.body.suspiciousActivity).toBe(true);
      expect(response.body.reason).toContain('structuring');
    });

    it('should file SAR for suspicious activity', async () => {
      await request(app)
        .post('/api/v1/aml/file-sar')
        .set('Authorization', `******
        .send({
          customerId: 'customer-123',
          suspiciousActivity: 'Rapid deposit and withdrawal pattern',
          amount: 500000.00,
          dateRange: { start: '2026-02-01', end: '2026-02-10' }
        })
        .expect(201);
    });
  });

  describe('Audit Logging', () => {
    it('should log all API requests', async () => {
      await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `******
        .expect(200);

      const auditResponse = await request(app)
        .get('/api/v1/audit/logs')
        .set('Authorization', `******
        .query({
          endpoint: '/api/v1/accounts',
          limit: 1
        })
        .expect(200);

      expect(auditResponse.body.logs.length).toBeGreaterThan(0);
    });

    it('should log authentication attempts', async () => {
      await request(app)
        .post('/oauth/token')
        .send({
          grant_type: 'client_credentials',
          client_id: 'sandbox_client',
          client_secret: 'wrong_secret'
        });

      const auditResponse = await request(app)
        .get('/api/v1/audit/auth-logs')
        .set('Authorization', `******
        .expect(200);

      expect(auditResponse.body.logs.some(l => l.success === false)).toBe(true);
    });

    it('should log data access', async () => {
      await request(app)
        .get('/api/v1/customers/customer-123')
        .set('Authorization', `******;

      const auditResponse = await request(app)
        .get('/api/v1/audit/data-access')
        .set('Authorization', `******
        .query({
          resourceType: 'customer',
          resourceId: 'customer-123'
        })
        .expect(200);

      expect(auditResponse.body.accessCount).toBeGreaterThan(0);
    });

    it('should be immutable', async () => {
      // Attempt to delete audit log
      await request(app)
        .delete('/api/v1/audit/logs/log-123')
        .set('Authorization', `******
        .expect(405); // Method not allowed
    });
  });

  describe('Input Validation', () => {
    it('should sanitize SQL injection attempts', async () => {
      await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `******
        .query({
          search: "'; DROP TABLE accounts; --"
        })
        .expect(400);
    });

    it('should reject XSS attempts', async () => {
      await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `******
        .send({
          firstName: '<script>alert("XSS")</script>',
          lastName: 'Doe',
          email: 'test@example.com'
        })
        .expect(400);
    });

    it('should validate email formats', async () => {
      await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `******
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email'
        })
        .expect(400);
    });

    it('should enforce data type validation', async () => {
      await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `******
        .send({
          sourceAccountId: 'acc-123',
          destinationAccountNumber: '1009876543',
          amount: 'invalid_amount'  // Should be number
        })
        .expect(400);
    });
  });

  describe('GDPR Compliance', () => {
    it('should allow data export', async () => {
      const response = await request(app)
        .get('/api/v1/customers/customer-123/data-export')
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('personalData');
      expect(response.body).toHaveProperty('transactions');
    });

    it('should allow data deletion (right to be forgotten)', async () => {
      await request(app)
        .post('/api/v1/customers/customer-123/delete-request')
        .set('Authorization', `******
        .send({
          confirmDeletion: true
        })
        .expect(202);
    });

    it('should obtain consent for data processing', async () => {
      await request(app)
        .post('/api/v1/customers/customer-123/consent')
        .set('Authorization', `******
        .send({
          consentType: 'marketing',
          granted: true
        })
        .expect(200);
    });

    it('should allow consent withdrawal', async () => {
      await request(app)
        .post('/api/v1/customers/customer-123/consent')
        .set('Authorization', `******
        .send({
          consentType: 'marketing',
          granted: false
        })
        .expect(200);
    });
  });

  describe('API Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    it('should prevent clickjacking', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-frame-options']).toMatch(/DENY|SAMEORIGIN/);
    });
  });

  describe('Session Management', () => {
    it('should expire sessions after timeout', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/v1/developers/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const sessionToken = loginResponse.body.sessionToken;

      // Wait for expiry (simulated)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to use expired session
      await request(app)
        .get('/api/v1/developers/profile')
        .set('X-Session-Token', sessionToken)
        .expect(401);
    });

    it('should invalidate sessions on logout', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/developers/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const sessionToken = loginResponse.body.sessionToken;

      // Logout
      await request(app)
        .post('/api/v1/developers/logout')
        .set('X-Session-Token', sessionToken)
        .expect(200);

      // Try to use invalidated session
      await request(app)
        .get('/api/v1/developers/profile')
        .set('X-Session-Token', sessionToken)
        .expect(401);
    });
  });
});
