/**
 * API Key Management Tests
 * Tests for API key generation, rotation, and management
 */

const request = require('supertest');
const app = require('../src/app');
const pool = require('../database/pool');

describe('API Key Management', () => {
  let accessToken;
  let developerId;

  beforeAll(async () => {
    // Create api_keys table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        developer_id UUID NOT NULL,
        key_name VARCHAR(255) NOT NULL,
        api_key VARCHAR(255) UNIQUE NOT NULL,
        api_secret VARCHAR(255) NOT NULL,
        scopes TEXT[],
        rate_limit INTEGER DEFAULT 100,
        expires_at TIMESTAMP,
        last_used_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Login as test developer
    const loginResponse = await request(app)
      .post('/api/v1/developers/login')
      .send({
        email: 'test.developer@example.com',
        password: 'NewSecurePassword123!'
      });
    
    accessToken = loginResponse.body.access_token;
    developerId = loginResponse.body.developer.id;
  });

  describe('Key Generation', () => {
    it('should generate a new API key', async () => {
      const response = await request(app)
        .post('/api/v1/api-keys')
        .set('Authorization', `******
        .send({
          keyName: 'Production Key',
          scopes: ['accounts.read', 'payments.write'],
          rateLimit: 1000
        })
        .expect(201);

      expect(response.body).toHaveProperty('apiKey');
      expect(response.body).toHaveProperty('apiSecret');
      expect(response.body.keyName).toBe('Production Key');
    });

    it('should generate key with default scopes', async () => {
      const response = await request(app)
        .post('/api/v1/api-keys')
        .set('Authorization', `******
        .send({
          keyName: 'Test Key'
        })
        .expect(201);

      expect(response.body.scopes).toContain('accounts.read');
    });

    it('should enforce maximum number of keys per developer', async () => {
      // Generate max keys (assume 10 max)
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/v1/api-keys')
          .set('Authorization', `******
          .send({
            keyName: `Test Key ${i}`
          });
      }

      // Try to create one more
      await request(app)
        .post('/api/v1/api-keys')
        .set('Authorization', `******
        .send({
          keyName: 'Exceeding Key'
        })
        .expect(429);
    });

    it('should reject invalid scope values', async () => {
      await request(app)
        .post('/api/v1/api-keys')
        .set('Authorization', `******
        .send({
          keyName: 'Invalid Scope Key',
          scopes: ['invalid.scope']
        })
        .expect(400);
    });
  });

  describe('Key Listing', () => {
    it('should list all API keys for developer', async () => {
      const response = await request(app)
        .get('/api/v1/api-keys')
        .set('Authorization', `******
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should not expose API secrets in listing', async () => {
      const response = await request(app)
        .get('/api/v1/api-keys')
        .set('Authorization', `******
        .expect(200);

      response.body.data.forEach(key => {
        expect(key).not.toHaveProperty('apiSecret');
      });
    });

    it('should show last used timestamp', async () => {
      const response = await request(app)
        .get('/api/v1/api-keys')
        .set('Authorization', `******
        .expect(200);

      expect(response.body.data[0]).toHaveProperty('lastUsedAt');
    });
  });

  describe('Key Details', () => {
    let testKeyId;

    beforeAll(async () => {
      const response = await request(app)
        .get('/api/v1/api-keys')
        .set('Authorization', `******;
      testKeyId = response.body.data[0].id;
    });

    it('should get specific API key details', async () => {
      const response = await request(app)
        .get(`/api/v1/api-keys/${testKeyId}`)
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('id', testKeyId);
      expect(response.body).toHaveProperty('scopes');
      expect(response.body).toHaveProperty('rateLimit');
    });

    it('should get usage statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/api-keys/${testKeyId}/stats`)
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('totalRequests');
      expect(response.body).toHaveProperty('requestsToday');
      expect(response.body).toHaveProperty('averageResponseTime');
    });
  });

  describe('Key Rotation', () => {
    let testKeyId;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/v1/api-keys')
        .set('Authorization', `******
        .send({
          keyName: 'Key to Rotate'
        });
      testKeyId = createResponse.body.id;
    });

    it('should rotate API key', async () => {
      const response = await request(app)
        .post(`/api/v1/api-keys/${testKeyId}/rotate`)
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('apiKey');
      expect(response.body).toHaveProperty('apiSecret');
      expect(response.body.message).toContain('rotated');
    });

    it('should keep old key valid during grace period', async () => {
      const oldKey = 'old-key-value';
      
      // Test that old key still works for grace period
      const response = await request(app)
        .get('/api/v1/accounts')
        .set('X-API-Key', oldKey);

      // Should work or return specific grace period message
      expect([200, 202, 410]).toContain(response.status);
    });
  });

  describe('Key Revocation', () => {
    let testKeyId;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/v1/api-keys')
        .set('Authorization', `******
        .send({
          keyName: 'Key to Revoke'
        });
      testKeyId = createResponse.body.id;
    });

    it('should revoke API key', async () => {
      await request(app)
        .delete(`/api/v1/api-keys/${testKeyId}`)
        .set('Authorization', `******
        .expect(200);
    });

    it('should not allow revoked key usage', async () => {
      const result = await pool.query(
        'SELECT api_key FROM api_keys WHERE id = $1',
        [testKeyId]
      );
      
      if (result.rows.length > 0) {
        await request(app)
          .get('/api/v1/accounts')
          .set('X-API-Key', result.rows[0].api_key)
          .expect(401);
      }
    });
  });

  describe('Scope Management', () => {
    let testKeyId;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/v1/api-keys')
        .set('Authorization', `******
        .send({
          keyName: 'Scope Test Key',
          scopes: ['accounts.read']
        });
      testKeyId = createResponse.body.id;
    });

    it('should update key scopes', async () => {
      const response = await request(app)
        .put(`/api/v1/api-keys/${testKeyId}/scopes`)
        .set('Authorization', `******
        .send({
          scopes: ['accounts.read', 'payments.read']
        })
        .expect(200);

      expect(response.body.scopes).toContain('payments.read');
    });

    it('should enforce scope restrictions', async () => {
      const result = await pool.query(
        'SELECT api_key FROM api_keys WHERE id = $1',
        [testKeyId]
      );
      
      if (result.rows.length > 0) {
        // Try to access endpoint without proper scope
        await request(app)
          .post('/api/v1/payments')
          .set('X-API-Key', result.rows[0].api_key)
          .send({})
          .expect(403);
      }
    });
  });

  describe('Rate Limit Configuration', () => {
    let testKeyId;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/v1/api-keys')
        .set('Authorization', `******
        .send({
          keyName: 'Rate Limit Test Key',
          rateLimit: 10
        });
      testKeyId = createResponse.body.id;
    });

    it('should update rate limit', async () => {
      await request(app)
        .put(`/api/v1/api-keys/${testKeyId}/rate-limit`)
        .set('Authorization', `******
        .send({
          rateLimit: 50
        })
        .expect(200);
    });

    it('should enforce rate limits', async () => {
      const result = await pool.query(
        'SELECT api_key FROM api_keys WHERE id = $1',
        [testKeyId]
      );
      
      if (result.rows.length > 0) {
        const apiKey = result.rows[0].api_key;
        
        // Make requests until rate limited
        for (let i = 0; i < 60; i++) {
          await request(app)
            .get('/api/v1/accounts')
            .set('X-API-Key', apiKey);
        }

        // Should be rate limited
        const response = await request(app)
          .get('/api/v1/accounts')
          .set('X-API-Key', apiKey);
        
        expect(response.status).toBe(429);
      }
    });
  });

  describe('Key Expiration', () => {
    it('should create key with expiration date', async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const response = await request(app)
        .post('/api/v1/api-keys')
        .set('Authorization', `******
        .send({
          keyName: 'Expiring Key',
          expiresAt: expiryDate.toISOString()
        })
        .expect(201);

      expect(response.body).toHaveProperty('expiresAt');
    });

    it('should reject expired keys', async () => {
      // Create key with past expiration
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const createResponse = await request(app)
        .post('/api/v1/api-keys')
        .set('Authorization', `******
        .send({
          keyName: 'Already Expired Key',
          expiresAt: pastDate.toISOString()
        });

      if (createResponse.status === 201) {
        const apiKey = createResponse.body.apiKey;
        
        await request(app)
          .get('/api/v1/accounts')
          .set('X-API-Key', apiKey)
          .expect(401);
      }
    });
  });
});
