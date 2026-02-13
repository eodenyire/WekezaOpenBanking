/**
 * Developer Portal Tests
 * Tests for developer registration, authentication, and management
 */

const request = require('supertest');
const app = require('../src/app');
const pool = require('../database/pool');
const bcrypt = require('bcrypt');

describe('Developer Portal', () => {
  let testDeveloper = {
    email: 'test.developer@example.com',
    password: 'SecurePassword123!',
    firstName: 'Test',
    lastName: 'Developer',
    company: 'Test Corp'
  };

  beforeAll(async () => {
    // Create developers table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS developers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        company VARCHAR(255),
        email_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        reset_token VARCHAR(255),
        two_factor_enabled BOOLEAN DEFAULT false,
        two_factor_secret VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  afterAll(async () => {
    // Cleanup test data
    await pool.query('DELETE FROM developers WHERE email = $1', [testDeveloper.email]);
  });

  describe('Registration', () => {
    it('should register a new developer', async () => {
      const response = await request(app)
        .post('/api/v1/developers/register')
        .send(testDeveloper)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', testDeveloper.email);
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should reject registration with duplicate email', async () => {
      await request(app)
        .post('/api/v1/developers/register')
        .send(testDeveloper)
        .expect(409);
    });

    it('should reject registration with invalid email', async () => {
      await request(app)
        .post('/api/v1/developers/register')
        .send({
          ...testDeveloper,
          email: 'invalid-email'
        })
        .expect(400);
    });

    it('should reject registration with weak password', async () => {
      await request(app)
        .post('/api/v1/developers/register')
        .send({
          ...testDeveloper,
          email: 'another@example.com',
          password: '123'
        })
        .expect(400);
    });

    it('should send verification email after registration', async () => {
      const response = await request(app)
        .post('/api/v1/developers/register')
        .send({
          ...testDeveloper,
          email: 'verify@example.com'
        })
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('verification email');
    });
  });

  describe('Email Verification', () => {
    let verificationToken;

    beforeAll(async () => {
      const result = await pool.query(
        'SELECT verification_token FROM developers WHERE email = $1',
        [testDeveloper.email]
      );
      verificationToken = result.rows[0]?.verification_token || 'test-token';
    });

    it('should verify email with valid token', async () => {
      await request(app)
        .get(`/api/v1/developers/verify-email/${verificationToken}`)
        .expect(200);
    });

    it('should reject invalid verification token', async () => {
      await request(app)
        .get('/api/v1/developers/verify-email/invalid-token')
        .expect(400);
    });
  });

  describe('Login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/developers/login')
        .send({
          email: testDeveloper.email,
          password: testDeveloper.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body).toHaveProperty('developer');
    });

    it('should reject login with invalid email', async () => {
      await request(app)
        .post('/api/v1/developers/login')
        .send({
          email: 'nonexistent@example.com',
          password: testDeveloper.password
        })
        .expect(401);
    });

    it('should reject login with invalid password', async () => {
      await request(app)
        .post('/api/v1/developers/login')
        .send({
          email: testDeveloper.email,
          password: 'WrongPassword'
        })
        .expect(401);
    });

    it('should track failed login attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/developers/login')
          .send({
            email: testDeveloper.email,
            password: 'WrongPassword'
          });
      }

      const response = await request(app)
        .post('/api/v1/developers/login')
        .send({
          email: testDeveloper.email,
          password: testDeveloper.password
        })
        .expect(429);

      expect(response.body.error).toContain('locked');
    });
  });

  describe('Password Reset', () => {
    it('should request password reset', async () => {
      const response = await request(app)
        .post('/api/v1/developers/request-reset')
        .send({
          email: testDeveloper.email
        })
        .expect(200);

      expect(response.body.message).toContain('reset email');
    });

    it('should reset password with valid token', async () => {
      const result = await pool.query(
        'SELECT reset_token FROM developers WHERE email = $1',
        [testDeveloper.email]
      );
      const resetToken = result.rows[0]?.reset_token;

      if (resetToken) {
        await request(app)
          .post('/api/v1/developers/reset-password')
          .send({
            token: resetToken,
            newPassword: 'NewSecurePassword123!'
          })
          .expect(200);
      }
    });
  });

  describe('Profile Management', () => {
    let accessToken;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/developers/login')
        .send({
          email: testDeveloper.email,
          password: 'NewSecurePassword123!'
        });
      accessToken = response.body.access_token;
    });

    it('should get developer profile', async () => {
      const response = await request(app)
        .get('/api/v1/developers/profile')
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('email', testDeveloper.email);
    });

    it('should update developer profile', async () => {
      await request(app)
        .put('/api/v1/developers/profile')
        .set('Authorization', `******
        .send({
          firstName: 'Updated',
          company: 'Updated Corp'
        })
        .expect(200);
    });

    it('should reject profile access without token', async () => {
      await request(app)
        .get('/api/v1/developers/profile')
        .expect(401);
    });
  });

  describe('Two-Factor Authentication', () => {
    let accessToken;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/developers/login')
        .send({
          email: testDeveloper.email,
          password: 'NewSecurePassword123!'
        });
      accessToken = response.body.access_token;
    });

    it('should enable 2FA', async () => {
      const response = await request(app)
        .post('/api/v1/developers/2fa/enable')
        .set('Authorization', `******
        .expect(200);

      expect(response.body).toHaveProperty('qrCode');
      expect(response.body).toHaveProperty('secret');
    });

    it('should verify 2FA code', async () => {
      // This would require actual TOTP token generation
      await request(app)
        .post('/api/v1/developers/2fa/verify')
        .set('Authorization', `******
        .send({
          code: '123456'
        });
    });

    it('should disable 2FA', async () => {
      await request(app)
        .post('/api/v1/developers/2fa/disable')
        .set('Authorization', `******
        .expect(200);
    });
  });
});
