/**
 * Fraud Management System Tests
 * Tests for fraud detection, monitoring, and case management
 */

const request = require('supertest');
const app = require('../src/app');
const pool = require('../database/pool');

describe('Fraud Management System', () => {
  let accessToken;
  let fraudAnalystToken;

  beforeAll(async () => {
    const tokenResponse = await request(app)
      .post('/oauth/token')
      .send({
        grant_type: 'client_credentials',
        client_id: 'sandbox_client',
        client_secret: 'sandbox_secret_key'
      });
    accessToken = tokenResponse.body.access_token;

    // Get fraud analyst token
    const analystResponse = await request(app)
      .post('/api/v1/fraud/analyst/login')
      .send({
        username: 'fraud_analyst',
        password: 'analyst123'
      });
    fraudAnalystToken = analystResponse.body?.token;
  });

  describe('Transaction Monitoring', () => {
    it('should monitor transaction in real-time', async () => {
      const response = await request(app)
        .post('/api/v1/fraud/monitor/transaction')
        .set('Authorization', `******
        .send({
          transactionId: 'txn-123',
          amount: 50000.00,
          accountId: 'acc-456',
          channel: 'mobile',
          location: { lat: -1.286389, lng: 36.817223 }
        })
        .expect(200);

      expect(response.body).toHaveProperty('riskScore');
      expect(response.body).toHaveProperty('riskLevel');
    });

    it('should flag high-value transactions', async () => {
      const response = await request(app)
        .post('/api/v1/fraud/monitor/transaction')
        .set('Authorization', `******
        .send({
          transactionId: 'txn-789',
          amount: 5000000.00,
          accountId: 'acc-456',
          channel: 'internet'
        })
        .expect(200);

      expect(response.body.riskLevel).toBe('high');
      expect(response.body.requiresReview).toBe(true);
    });

    it('should detect velocity anomalies', async () => {
      // Simulate multiple rapid transactions
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/v1/fraud/monitor/transaction')
          .set('Authorization', `******
          .send({
            transactionId: `txn-vel-${i}`,
            amount: 1000.00,
            accountId: 'acc-456',
            channel: 'mobile'
          });
      }

      const response = await request(app)
        .get('/api/v1/fraud/monitor/velocity-check/acc-456')
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('velocityViolation');
    });

    it('should detect location anomalies', async () => {
      await request(app)
        .post('/api/v1/fraud/monitor/transaction')
        .set('Authorization', `******
        .send({
          transactionId: 'txn-loc-1',
          amount: 1000.00,
          accountId: 'acc-456',
          location: { lat: -1.286389, lng: 36.817223 }  // Nairobi
        });

      // Immediately another transaction from far away
      const response = await request(app)
        .post('/api/v1/fraud/monitor/transaction')
        .set('Authorization', `******
        .send({
          transactionId: 'txn-loc-2',
          amount: 1000.00,
          accountId: 'acc-456',
          location: { lat: 51.5074, lng: -0.1278 }  // London
        })
        .expect(200);

      expect(response.body.alerts).toContain('impossible_travel');
    });
  });

  describe('Suspicious Activity Detection', () => {
    it('should detect unusual transaction patterns', async () => {
      const response = await request(app)
        .post('/api/v1/fraud/detect/pattern')
        .set('Authorization', `******
        .send({
          accountId: 'acc-456',
          transactionHistory: [
            { amount: 100, date: '2026-02-01' },
            { amount: 150, date: '2026-02-02' },
            { amount: 50000, date: '2026-02-03' }  // Unusual spike
          ]
        })
        .expect(200);

      expect(response.body.suspicious).toBe(true);
      expect(response.body.reason).toContain('unusual_amount');
    });

    it('should detect account takeover indicators', async () => {
      const response = await request(app)
        .post('/api/v1/fraud/detect/account-takeover')
        .set('Authorization', `******
        .send({
          accountId: 'acc-456',
          events: [
            { type: 'password_change', timestamp: '2026-02-13T10:00:00Z' },
            { type: 'email_change', timestamp: '2026-02-13T10:05:00Z' },
            { type: 'large_transfer', timestamp: '2026-02-13T10:10:00Z' }
          ]
        })
        .expect(200);

      expect(response.body.takeoverRisk).toBe('high');
    });

    it('should detect smurfing/structuring', async () => {
      const response = await request(app)
        .post('/api/v1/fraud/detect/structuring')
        .set('Authorization', `******
        .send({
          accountId: 'acc-456',
          transactions: Array(20).fill(null).map((_, i) => ({
            amount: 9900.00,  // Just below $10k threshold
            date: `2026-02-${i + 1}`
          }))
        })
        .expect(200);

      expect(response.body.structuringDetected).toBe(true);
    });

    it('should detect money laundering indicators', async () => {
      const response = await request(app)
        .post('/api/v1/fraud/detect/money-laundering')
        .set('Authorization', `******
        .send({
          accountId: 'acc-456',
          transactionPattern: 'rapid_in_out',
          totalVolume: 5000000.00,
          timeframe: '24_hours'
        })
        .expect(200);

      expect(response.body).toHaveProperty('mlScore');
      expect(response.body.requiresInvestigation).toBe(true);
    });
  });

  describe('Risk Scoring', () => {
    it('should calculate transaction risk score', async () => {
      const response = await request(app)
        .post('/api/v1/fraud/risk/score')
        .set('Authorization', `******
        .send({
          transaction: {
            amount: 10000.00,
            channel: 'mobile',
            time: '02:00',  // Unusual time
            location: 'foreign'
          },
          account: {
            age: 30,
            averageBalance: 5000.00,
            transactionHistory: 'low'
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('riskScore');
      expect(response.body).toHaveProperty('riskFactors');
    });

    it('should adjust risk based on customer profile', async () => {
      const response = await request(app)
        .get('/api/v1/fraud/risk/customer/customer-123')
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('customerRiskProfile');
      expect(response.body).toHaveProperty('riskCategory');
    });

    it('should use machine learning for scoring', async () => {
      const response = await request(app)
        .post('/api/v1/fraud/risk/ml-score')
        .set('Authorization', `******
        .send({
          features: {
            transactionAmount: 15000.00,
            timeOfDay: 22,
            dayOfWeek: 6,
            merchantCategory: 'gambling',
            cardPresent: false
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('mlPrediction');
      expect(response.body).toHaveProperty('confidence');
    });
  });

  describe('Fraud Alerts', () => {
    it('should generate fraud alert', async () => {
      const response = await request(app)
        .post('/api/v1/fraud/alerts')
        .set('Authorization', `******
        .send({
          transactionId: 'txn-alert-123',
          alertType: 'high_risk_transaction',
          riskScore: 85,
          description: 'Large unusual transaction'
        })
        .expect(201);

      expect(response.body).toHaveProperty('alertId');
    });

    it('should get pending fraud alerts', async () => {
      const response = await request(app)
        .get('/api/v1/fraud/alerts/pending')
        .set('Authorization', `******
        .expect(200);

      expect(Array.isArray(response.body.alerts)).toBe(true);
    });

    it('should acknowledge alert', async () => {
      await request(app)
        .post('/api/v1/fraud/alerts/alert-123/acknowledge')
        .set('Authorization', `******
        .send({
          analystId: 'analyst-456'
        })
        .expect(200);
    });

    it('should escalate high-priority alerts', async () => {
      await request(app)
        .post('/api/v1/fraud/alerts/alert-123/escalate')
        .set('Authorization', `******
        .send({
          escalateTo: 'senior_analyst',
          reason: 'Requires immediate attention'
        })
        .expect(200);
    });

    it('should send real-time notifications', async () => {
      const response = await request(app)
        .post('/api/v1/fraud/alerts/alert-123/notify')
        .set('Authorization', `******
        .send({
          channels: ['email', 'sms', 'push'],
          recipients: ['fraud_team']
        })
        .expect(200);

      expect(response.body.notificationsSent).toBeGreaterThan(0);
    });
  });

  describe('Case Management', () => {
    it('should create fraud case', async () => {
      const response = await request(app)
        .post('/api/v1/fraud/cases')
        .set('Authorization', `******
        .send({
          caseType: 'card_fraud',
          accountId: 'acc-456',
          transactionIds: ['txn-123', 'txn-456'],
          description: 'Suspected card cloning',
          priority: 'high'
        })
        .expect(201);

      expect(response.body).toHaveProperty('caseId');
      expect(response.body.status).toBe('open');
    });

    it('should assign case to analyst', async () => {
      await request(app)
        .post('/api/v1/fraud/cases/case-123/assign')
        .set('Authorization', `******
        .send({
          analystId: 'analyst-456'
        })
        .expect(200);
    });

    it('should add case notes', async () => {
      await request(app)
        .post('/api/v1/fraud/cases/case-123/notes')
        .set('Authorization', `******
        .send({
          note: 'Contacted customer, confirmed unauthorized transactions',
          analystId: 'analyst-456'
        })
        .expect(201);
    });

    it('should update case status', async () => {
      await request(app)
        .put('/api/v1/fraud/cases/case-123/status')
        .set('Authorization', `******
        .send({
          status: 'investigating',
          comments: 'Gathering evidence'
        })
        .expect(200);
    });

    it('should close case', async () => {
      await request(app)
        .post('/api/v1/fraud/cases/case-123/close')
        .set('Authorization', `******
        .send({
          resolution: 'confirmed_fraud',
          outcome: 'Account secured, card reissued',
          recoveredAmount: 5000.00
        })
        .expect(200);
    });

    it('should get case timeline', async () => {
      const response = await request(app)
        .get('/api/v1/fraud/cases/case-123/timeline')
        .set('Authorization', `******
        .expect(200);

      expect(Array.isArray(response.body.timeline)).toBe(true);
    });
  });

  describe('Rule Engine', () => {
    it('should create fraud rule', async () => {
      const response = await request(app)
        .post('/api/v1/fraud/rules')
        .set('Authorization', `******
        .send({
          ruleName: 'High Value Transaction Rule',
          conditions: [
            { field: 'amount', operator: 'greater_than', value: 100000 }
          ],
          actions: ['block_transaction', 'create_alert'],
          priority: 'high'
        })
        .expect(201);

      expect(response.body).toHaveProperty('ruleId');
    });

    it('should evaluate transaction against rules', async () => {
      const response = await request(app)
        .post('/api/v1/fraud/rules/evaluate')
        .set('Authorization', `******
        .send({
          transaction: {
            amount: 150000.00,
            channel: 'mobile',
            accountId: 'acc-456'
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('rulesTriggered');
      expect(response.body).toHaveProperty('recommendedActions');
    });

    it('should enable/disable rules', async () => {
      await request(app)
        .put('/api/v1/fraud/rules/rule-123/toggle')
        .set('Authorization', `******
        .send({
          enabled: false
        })
        .expect(200);
    });

    it('should get rule performance metrics', async () => {
      const response = await request(app)
        .get('/api/v1/fraud/rules/rule-123/metrics')
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('truePositives');
      expect(response.body).toHaveProperty('falsePositives');
      expect(response.body).toHaveProperty('accuracy');
    });
  });

  describe('Machine Learning Models', () => {
    it('should train fraud detection model', async () => {
      const response = await request(app)
        .post('/api/v1/fraud/ml/train')
        .set('Authorization', `******
        .send({
          modelType: 'transaction_fraud',
          trainingData: 'dataset-2026-01',
          features: ['amount', 'time', 'location', 'merchant_category']
        })
        .expect(202);

      expect(response.body).toHaveProperty('trainingJobId');
    });

    it('should get model predictions', async () => {
      const response = await request(app)
        .post('/api/v1/fraud/ml/predict')
        .set('Authorization', `******
        .send({
          modelId: 'model-123',
          transaction: {
            amount: 5000.00,
            timeOfDay: 14,
            merchantCategory: 'electronics'
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('fraudProbability');
      expect(response.body).toHaveProperty('prediction');
    });

    it('should evaluate model performance', async () => {
      const response = await request(app)
        .get('/api/v1/fraud/ml/models/model-123/performance')
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('accuracy');
      expect(response.body).toHaveProperty('precision');
      expect(response.body).toHaveProperty('recall');
    });

    it('should deploy new model version', async () => {
      await request(app)
        .post('/api/v1/fraud/ml/models/model-123/deploy')
        .set('Authorization', `******
        .send({
          version: '2.0',
          environment: 'production'
        })
        .expect(200);
    });
  });

  describe('Fraud Prevention', () => {
    it('should block suspicious transaction', async () => {
      await request(app)
        .post('/api/v1/fraud/prevent/block')
        .set('Authorization', `******
        .send({
          transactionId: 'txn-suspicious-123',
          reason: 'High fraud risk score'
        })
        .expect(200);
    });

    it('should request additional authentication', async () => {
      const response = await request(app)
        .post('/api/v1/fraud/prevent/challenge')
        .set('Authorization', `******
        .send({
          transactionId: 'txn-challenge-123',
          challengeType: 'otp',
          destination: '+254712345678'
        })
        .expect(200);

      expect(response.body).toHaveProperty('challengeId');
    });

    it('should apply transaction limits', async () => {
      await request(app)
        .post('/api/v1/fraud/prevent/limits')
        .set('Authorization', `******
        .send({
          accountId: 'acc-456',
          dailyLimit: 50000.00,
          transactionLimit: 10000.00
        })
        .expect(200);
    });

    it('should whitelist trusted merchants', async () => {
      await request(app)
        .post('/api/v1/fraud/prevent/whitelist')
        .set('Authorization', `******
        .send({
          accountId: 'acc-456',
          merchantIds: ['merchant-123', 'merchant-456']
        })
        .expect(200);
    });

    it('should block specific countries/regions', async () => {
      await request(app)
        .post('/api/v1/fraud/prevent/geo-block')
        .set('Authorization', `******
        .send({
          accountId: 'acc-456',
          blockedCountries: ['XX', 'YY']
        })
        .expect(200);
    });
  });

  describe('Reporting and Analytics', () => {
    it('should generate fraud statistics report', async () => {
      const response = await request(app)
        .get('/api/v1/fraud/reports/statistics')
        .set('Authorization', `******
        .query({
          startDate: '2026-02-01',
          endDate: '2026-02-28'
        })
        .expect(200);

      expect(response.body).toHaveProperty('totalCases');
      expect(response.body).toHaveProperty('detectionRate');
      expect(response.body).toHaveProperty('lossAmount');
    });

    it('should get fraud trends', async () => {
      const response = await request(app)
        .get('/api/v1/fraud/analytics/trends')
        .set('Authorization', `******
        .expect(200);

      expect(Array.isArray(response.body.trends)).toBe(true);
    });

    it('should get top fraud types', async () => {
      const response = await request(app)
        .get('/api/v1/fraud/analytics/top-fraud-types')
        .set('Authorization', `******
        .expect(200);

      expect(Array.isArray(response.body.fraudTypes)).toBe(true);
    });

    it('should calculate fraud loss metrics', async () => {
      const response = await request(app)
        .get('/api/v1/fraud/analytics/loss-metrics')
        .set('Authorization', `******
        .query({
          period: 'monthly'
        })
        .expect(200);

      expect(response.body).toHaveProperty('totalLoss');
      expect(response.body).toHaveProperty('recoveredAmount');
      expect(response.body).toHaveProperty('preventedAmount');
    });
  });
});
