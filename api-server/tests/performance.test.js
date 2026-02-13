/**
 * Performance and Load Tests
 * Tests for API performance, concurrency, and scalability
 */

const request = require('supertest');
const app = require('../src/app');

describe('Performance and Load Tests', () => {
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

  describe('API Response Time Benchmarks', () => {
    it('should respond to health check within 100ms', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
    });

    it('should authenticate within 500ms', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/oauth/token')
        .send({
          grant_type: 'client_credentials',
          client_id: 'sandbox_client',
          client_secret: 'sandbox_secret_key'
        })
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });

    it('should list accounts within 300ms', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `******
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(300);
    });

    it('should process payment within 1000ms', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `******
        .set('Idempotency-Key', `perf-test-${Date.now()}`)
        .send({
          sourceAccountId: 'acc-123',
          destinationAccountNumber: '1009876543',
          amount: 100.00,
          currency: 'KES'
        });
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle 10 concurrent account requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/v1/accounts')
          .set('Authorization', `******`)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle 50 concurrent balance checks', async () => {
      const requests = Array(50).fill(null).map(() =>
        request(app)
          .get('/api/v1/accounts/acc-123/balance')
          .set('Authorization', `******`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });

      console.log(`50 concurrent requests completed in ${totalTime}ms`);
    });

    it('should handle 100 concurrent authentication requests', async () => {
      const requests = Array(100).fill(null).map(() =>
        request(app)
          .post('/oauth/token')
          .send({
            grant_type: 'client_credentials',
            client_id: 'sandbox_client',
            client_secret: 'sandbox_secret_key'
          })
      );

      const responses = await Promise.all(requests);
      
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(50); // At least 50% success
    });
  });

  describe('Rate Limiting Effectiveness', () => {
    it('should enforce rate limits after threshold', async () => {
      const maxRequests = 100;
      let rateLimitHit = false;

      for (let i = 0; i < maxRequests + 10; i++) {
        const response = await request(app)
          .get('/api/v1/accounts')
          .set('Authorization', `******`);

        if (response.status === 429) {
          rateLimitHit = true;
          break;
        }
      }

      expect(rateLimitHit).toBe(true);
    });

    it('should return rate limit headers', async () => {
      const response = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `******
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('Database Query Performance', () => {
    it('should retrieve 100 transactions efficiently', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/accounts/acc-123/transactions')
        .set('Authorization', `******
        .query({ limit: 100 })
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });

    it('should handle complex transaction filtering', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/accounts/acc-123/transactions')
        .set('Authorization', `******
        .query({
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          type: 'debit',
          minAmount: 100,
          maxAmount: 10000
        })
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(800);
    });

    it('should paginate large result sets efficiently', async () => {
      const pages = 10;
      const timings = [];

      for (let page = 0; page < pages; page++) {
        const startTime = Date.now();
        
        await request(app)
          .get('/api/v1/accounts/acc-123/transactions')
          .set('Authorization', `******
          .query({ limit: 50, offset: page * 50 })
          .expect(200);
        
        timings.push(Date.now() - startTime);
      }

      const avgTime = timings.reduce((a, b) => a + b) / timings.length;
      expect(avgTime).toBeLessThan(300);
    });
  });

  describe('Webhook Delivery Performance', () => {
    it('should queue webhook deliveries quickly', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/v1/webhooks/trigger')
        .set('Authorization', `******
        .send({
          eventType: 'payment.completed',
          eventData: { paymentId: 'payment-123' }
        })
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(200);
    });

    it('should handle batch webhook deliveries', async () => {
      const events = Array(50).fill(null).map((_, i) => ({
        eventType: 'payment.completed',
        eventData: { paymentId: `payment-${i}` }
      }));

      const startTime = Date.now();
      
      const requests = events.map(event =>
        request(app)
          .post('/api/v1/webhooks/trigger')
          .set('Authorization', `******
          .send(event)
      );

      await Promise.all(requests);
      
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / events.length;
      
      expect(avgTime).toBeLessThan(100);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should handle large payment batch without memory issues', async () => {
      const largeBatch = Array(1000).fill(null).map((_, i) => ({
        accountNumber: `100${i}`,
        amount: 1000.00,
        reference: `REF${i}`
      }));

      await request(app)
        .post('/api/v1/payments/bulk')
        .set('Authorization', `******
        .send({
          batchName: 'Large Performance Test',
          sourceAccount: 'ACC123',
          payments: largeBatch
        })
        .expect(201);
    });

    it('should handle large file uploads', async () => {
      const largeFile = Buffer.alloc(5 * 1024 * 1024, 'a'); // 5MB file

      await request(app)
        .post('/api/v1/documents/upload')
        .set('Authorization', `******
        .attach('file', largeFile, 'large_file.pdf')
        .expect(201);
    });
  });

  describe('Caching Effectiveness', () => {
    it('should serve cached responses faster', async () => {
      // First request (uncached)
      const firstStart = Date.now();
      await request(app)
        .get('/api/v1/accounts/acc-123/balance')
        .set('Authorization', `******
        .expect(200);
      const firstTime = Date.now() - firstStart;

      // Second request (should be cached)
      const secondStart = Date.now();
      await request(app)
        .get('/api/v1/accounts/acc-123/balance')
        .set('Authorization', `******
        .expect(200);
      const secondTime = Date.now() - secondStart;

      // Cached should be faster
      expect(secondTime).toBeLessThanOrEqual(firstTime);
    });

    it('should invalidate cache on updates', async () => {
      // Get balance (cached)
      const balanceResponse1 = await request(app)
        .get('/api/v1/accounts/acc-123/balance')
        .set('Authorization', `******;

      // Make a transaction
      await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `******
        .set('Idempotency-Key', `cache-test-${Date.now()}`)
        .send({
          sourceAccountId: 'acc-123',
          destinationAccountNumber: '1009876543',
          amount: 10.00,
          currency: 'KES'
        });

      // Get balance again (should be fresh)
      const balanceResponse2 = await request(app)
        .get('/api/v1/accounts/acc-123/balance')
        .set('Authorization', `******;

      expect(balanceResponse2.body.balance).not.toBe(balanceResponse1.body.balance);
    });
  });

  describe('Scalability Tests', () => {
    it('should maintain performance under sustained load', async () => {
      const duration = 10000; // 10 seconds
      const startTime = Date.now();
      const results = [];

      while (Date.now() - startTime < duration) {
        const reqStart = Date.now();
        
        await request(app)
          .get('/health')
          .expect(200);
        
        results.push(Date.now() - reqStart);
      }

      const avgResponseTime = results.reduce((a, b) => a + b) / results.length;
      const maxResponseTime = Math.max(...results);

      console.log(`Sustained load test: ${results.length} requests`);
      console.log(`Average response time: ${avgResponseTime}ms`);
      console.log(`Max response time: ${maxResponseTime}ms`);

      expect(avgResponseTime).toBeLessThan(200);
      expect(maxResponseTime).toBeLessThan(1000);
    });
  });
});
