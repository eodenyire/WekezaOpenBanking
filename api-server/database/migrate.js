/**
 * Database Schema Migration
 */

const pool = require('./pool');
const logger = require('../src/utils/logger');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // OAuth Clients Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS oauth_clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id VARCHAR(255) UNIQUE NOT NULL,
        client_secret VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        redirect_uris TEXT[],
        scopes TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // OAuth Tokens Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        access_token VARCHAR(500) UNIQUE NOT NULL,
        refresh_token VARCHAR(500) UNIQUE,
        client_id VARCHAR(255) REFERENCES oauth_clients(client_id),
        user_id UUID,
        scopes TEXT[],
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Customers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_number VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        date_of_birth DATE,
        kyc_status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Accounts Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id UUID REFERENCES customers(id),
        account_type VARCHAR(20) NOT NULL,
        currency VARCHAR(3) DEFAULT 'KES',
        balance DECIMAL(15, 2) DEFAULT 0.00,
        available_balance DECIMAL(15, 2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Transactions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transaction_ref VARCHAR(100) UNIQUE NOT NULL,
        account_id UUID REFERENCES accounts(id),
        transaction_type VARCHAR(20) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'KES',
        balance_after DECIMAL(15, 2),
        description TEXT,
        status VARCHAR(20) DEFAULT 'completed',
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Payments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_ref VARCHAR(100) UNIQUE NOT NULL,
        source_account_id UUID REFERENCES accounts(id),
        destination_account_number VARCHAR(50) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'KES',
        reference VARCHAR(255),
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        risk_score DECIMAL(3, 2),
        idempotency_key VARCHAR(255),
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Webhooks Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id VARCHAR(255) REFERENCES oauth_clients(client_id),
        url VARCHAR(500) NOT NULL,
        events TEXT[],
        secret VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Webhook Deliveries Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        webhook_id UUID REFERENCES webhooks(id),
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        attempts INTEGER DEFAULT 0,
        last_attempt_at TIMESTAMP,
        next_retry_at TIMESTAMP,
        delivered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_accounts_customer ON accounts(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_payments_source ON payments(source_account_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_oauth_tokens_access ON oauth_tokens(access_token)');
    
    await client.query('COMMIT');
    logger.info('Database schema created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating schema:', error);
    throw error;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  createTables()
    .then(() => {
      logger.info('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createTables;
