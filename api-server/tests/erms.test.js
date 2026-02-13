/**
 * ERMS (Enterprise Resource Management System) Integration Tests
 * Tests for resource allocation, workflows, document management, and reporting
 */

const request = require('supertest');
const app = require('../src/app');
const pool = require('../database/pool');

describe('ERMS Integration', () => {
  let accessToken;
  let adminToken;

  beforeAll(async () => {
    const tokenResponse = await request(app)
      .post('/oauth/token')
      .send({
        grant_type: 'client_credentials',
        client_id: 'sandbox_client',
        client_secret: 'sandbox_secret_key'
      });
    accessToken = tokenResponse.body.access_token;

    // Get admin token
    const adminResponse = await request(app)
      .post('/api/v1/admin/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    adminToken = adminResponse.body?.token;
  });

  describe('Resource Allocation', () => {
    it('should create a resource', async () => {
      const response = await request(app)
        .post('/api/v1/erms/resources')
        .set('Authorization', `******
        .send({
          name: 'Conference Room A',
          type: 'meeting_room',
          capacity: 10,
          location: 'Building 1, Floor 2'
        })
        .expect(201);

      expect(response.body).toHaveProperty('resourceId');
    });

    it('should allocate resource to user', async () => {
      const response = await request(app)
        .post('/api/v1/erms/resources/allocate')
        .set('Authorization', `******
        .send({
          resourceId: 'resource-123',
          userId: 'user-456',
          startTime: '2026-02-15T10:00:00Z',
          endTime: '2026-02-15T12:00:00Z',
          purpose: 'Team meeting'
        })
        .expect(201);

      expect(response.body).toHaveProperty('allocationId');
    });

    it('should check resource availability', async () => {
      const response = await request(app)
        .get('/api/v1/erms/resources/resource-123/availability')
        .set('Authorization', `******
        .query({
          date: '2026-02-15'
        })
        .expect(200);

      expect(Array.isArray(response.body.availableSlots)).toBe(true);
    });

    it('should reject overlapping allocations', async () => {
      await request(app)
        .post('/api/v1/erms/resources/allocate')
        .set('Authorization', `******
        .send({
          resourceId: 'resource-123',
          userId: 'user-789',
          startTime: '2026-02-15T10:30:00Z',
          endTime: '2026-02-15T11:30:00Z',
          purpose: 'Another meeting'
        })
        .expect(409);
    });

    it('should get resource utilization report', async () => {
      const response = await request(app)
        .get('/api/v1/erms/resources/utilization')
        .set('Authorization', `******
        .query({
          startDate: '2026-02-01',
          endDate: '2026-02-28'
        })
        .expect(200);

      expect(response.body).toHaveProperty('utilizationRate');
    });
  });

  describe('Workflow Management', () => {
    it('should create workflow template', async () => {
      const response = await request(app)
        .post('/api/v1/erms/workflows/templates')
        .set('Authorization', `******
        .send({
          name: 'Loan Approval Workflow',
          steps: [
            { order: 1, role: 'credit_officer', action: 'review' },
            { order: 2, role: 'branch_manager', action: 'approve' },
            { order: 3, role: 'regional_manager', action: 'final_approve' }
          ]
        })
        .expect(201);

      expect(response.body).toHaveProperty('templateId');
    });

    it('should initiate workflow instance', async () => {
      const response = await request(app)
        .post('/api/v1/erms/workflows/instances')
        .set('Authorization', `******
        .send({
          templateId: 'template-123',
          entityType: 'loan',
          entityId: 'loan-456',
          initiatedBy: 'user-789'
        })
        .expect(201);

      expect(response.body).toHaveProperty('instanceId');
      expect(response.body.status).toBe('in_progress');
    });

    it('should get pending workflow tasks', async () => {
      const response = await request(app)
        .get('/api/v1/erms/workflows/tasks/pending')
        .set('Authorization', `******
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should complete workflow task', async () => {
      await request(app)
        .post('/api/v1/erms/workflows/tasks/task-123/complete')
        .set('Authorization', `******
        .send({
          action: 'approve',
          comments: 'Approved after review'
        })
        .expect(200);
    });

    it('should reject workflow task', async () => {
      await request(app)
        .post('/api/v1/erms/workflows/tasks/task-456/reject')
        .set('Authorization', `******
        .send({
          reason: 'Insufficient documentation'
        })
        .expect(200);
    });

    it('should get workflow history', async () => {
      const response = await request(app)
        .get('/api/v1/erms/workflows/instances/instance-123/history')
        .set('Authorization', `******
        .expect(200);

      expect(Array.isArray(response.body.history)).toBe(true);
    });
  });

  describe('Document Management', () => {
    it('should upload document', async () => {
      const response = await request(app)
        .post('/api/v1/erms/documents/upload')
        .set('Authorization', `******
        .attach('file', Buffer.from('test content'), 'test.pdf')
        .field('documentType', 'loan_application')
        .field('entityId', 'loan-123')
        .expect(201);

      expect(response.body).toHaveProperty('documentId');
    });

    it('should categorize document', async () => {
      await request(app)
        .put('/api/v1/erms/documents/doc-123/categorize')
        .set('Authorization', `******
        .send({
          category: 'kyc',
          tags: ['passport', 'identification']
        })
        .expect(200);
    });

    it('should retrieve document', async () => {
      await request(app)
        .get('/api/v1/erms/documents/doc-123/download')
        .set('Authorization', `******
        .expect(200);
    });

    it('should search documents', async () => {
      const response = await request(app)
        .get('/api/v1/erms/documents/search')
        .set('Authorization', `******
        .query({
          query: 'loan application',
          documentType: 'loan_application'
        })
        .expect(200);

      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should version documents', async () => {
      const response = await request(app)
        .post('/api/v1/erms/documents/doc-123/versions')
        .set('Authorization', `******
        .attach('file', Buffer.from('updated content'), 'test_v2.pdf')
        .expect(201);

      expect(response.body).toHaveProperty('versionNumber');
    });

    it('should archive old documents', async () => {
      await request(app)
        .post('/api/v1/erms/documents/doc-123/archive')
        .set('Authorization', `******
        .expect(200);
    });

    it('should set document retention policy', async () => {
      await request(app)
        .put('/api/v1/erms/documents/doc-123/retention')
        .set('Authorization', `******
        .send({
          retentionPeriod: 7,
          retentionUnit: 'years'
        })
        .expect(200);
    });
  });

  describe('Reporting and Analytics', () => {
    it('should generate operational report', async () => {
      const response = await request(app)
        .post('/api/v1/erms/reports/operational')
        .set('Authorization', `******
        .send({
          reportType: 'branch_performance',
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          branchId: 'branch-001'
        })
        .expect(200);

      expect(response.body).toHaveProperty('reportUrl');
    });

    it('should generate financial report', async () => {
      const response = await request(app)
        .post('/api/v1/erms/reports/financial')
        .set('Authorization', `******
        .send({
          reportType: 'profit_loss',
          period: 'monthly',
          date: '2026-01-31'
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should get dashboard analytics', async () => {
      const response = await request(app)
        .get('/api/v1/erms/analytics/dashboard')
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('metrics');
    });

    it('should export report to Excel', async () => {
      await request(app)
        .get('/api/v1/erms/reports/report-123/export')
        .set('Authorization', `******
        .query({
          format: 'xlsx'
        })
        .expect(200);
    });

    it('should schedule recurring report', async () => {
      await request(app)
        .post('/api/v1/erms/reports/schedule')
        .set('Authorization', `******
        .send({
          reportType: 'daily_transactions',
          frequency: 'daily',
          time: '08:00',
          recipients: ['manager@wekeza.com']
        })
        .expect(201);
    });
  });

  describe('Approval Workflows', () => {
    it('should create approval request', async () => {
      const response = await request(app)
        .post('/api/v1/erms/approvals')
        .set('Authorization', `******
        .send({
          requestType: 'budget_approval',
          amount: 50000.00,
          description: 'Marketing campaign budget',
          approvers: ['manager-123', 'cfo-456']
        })
        .expect(201);

      expect(response.body).toHaveProperty('approvalId');
    });

    it('should approve request', async () => {
      await request(app)
        .post('/api/v1/erms/approvals/approval-123/approve')
        .set('Authorization', `******
        .send({
          comments: 'Approved'
        })
        .expect(200);
    });

    it('should reject request', async () => {
      await request(app)
        .post('/api/v1/erms/approvals/approval-123/reject')
        .set('Authorization', `******
        .send({
          reason: 'Budget constraints'
        })
        .expect(200);
    });

    it('should get approval chain status', async () => {
      const response = await request(app)
        .get('/api/v1/erms/approvals/approval-123/status')
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('approvalChain');
    });

    it('should support multi-level approvals', async () => {
      const response = await request(app)
        .post('/api/v1/erms/approvals')
        .set('Authorization', `******
        .send({
          requestType: 'large_transaction',
          amount: 1000000.00,
          description: 'Major investment',
          approvalLevels: [
            { level: 1, approvers: ['manager-123'] },
            { level: 2, approvers: ['director-456'] },
            { level: 3, approvers: ['ceo-789'] }
          ]
        })
        .expect(201);

      expect(response.body.approvalLevels).toHaveLength(3);
    });
  });

  describe('Audit Trail', () => {
    it('should log all ERMS activities', async () => {
      const response = await request(app)
        .get('/api/v1/erms/audit/logs')
        .set('Authorization', `******
        .query({
          startDate: '2026-02-01',
          endDate: '2026-02-28'
        })
        .expect(200);

      expect(Array.isArray(response.body.logs)).toBe(true);
    });

    it('should track document access', async () => {
      const response = await request(app)
        .get('/api/v1/erms/audit/documents/doc-123/access')
        .set('Authorization', `******
        .expect(200);

      expect(Array.isArray(response.body.accessLog)).toBe(true);
    });

    it('should track workflow changes', async () => {
      const response = await request(app)
        .get('/api/v1/erms/audit/workflows/instance-123')
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('changes');
    });

    it('should generate audit report', async () => {
      await request(app)
        .post('/api/v1/erms/audit/report')
        .set('Authorization', `******
        .send({
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          includeUserActions: true
        })
        .expect(200);
    });
  });

  describe('Inventory Management', () => {
    it('should add inventory item', async () => {
      const response = await request(app)
        .post('/api/v1/erms/inventory')
        .set('Authorization', `******
        .send({
          itemName: 'Laptop',
          category: 'IT Equipment',
          quantity: 10,
          unitPrice: 50000.00
        })
        .expect(201);

      expect(response.body).toHaveProperty('itemId');
    });

    it('should track inventory movement', async () => {
      await request(app)
        .post('/api/v1/erms/inventory/item-123/movement')
        .set('Authorization', `******
        .send({
          movementType: 'issue',
          quantity: 2,
          issuedTo: 'user-456',
          purpose: 'New employee setup'
        })
        .expect(201);
    });

    it('should get inventory stock levels', async () => {
      const response = await request(app)
        .get('/api/v1/erms/inventory/stock-levels')
        .set('Authorization', `******
        .expect(200);

      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should alert on low stock', async () => {
      const response = await request(app)
        .get('/api/v1/erms/inventory/low-stock-alerts')
        .set('Authorization', `******
        .expect(200);

      expect(Array.isArray(response.body.alerts)).toBe(true);
    });
  });
});
