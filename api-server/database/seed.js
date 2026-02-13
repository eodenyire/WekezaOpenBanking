/**
 * Database Seed Data
 */

const pool = require('./pool');
const bcrypt = require('bcrypt');
const logger = require('../src/utils/logger');

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Seed OAuth Client
    const clientSecret = await bcrypt.hash('sandbox_secret_key', 10);
    await client.query(`
      INSERT INTO oauth_clients (client_id, client_secret, name, scopes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (client_id) DO NOTHING
    `, ['sandbox_client', clientSecret, 'Sandbox Client', ['accounts.read', 'transactions.read', 'payments.write']]);
    
    // Seed Customers
    const customers = [
      { number: 'CUST001', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phone: '+254712345678' },
      { number: 'CUST002', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', phone: '+254723456789' },
      { number: 'CUST003', firstName: 'Michael', lastName: 'Johnson', email: 'michael.j@example.com', phone: '+254734567890' }
    ];
    
    const customerIds = [];
    for (const customer of customers) {
      const result = await client.query(`
        INSERT INTO customers (customer_number, first_name, last_name, email, phone, kyc_status)
        VALUES ($1, $2, $3, $4, $5, 'verified')
        ON CONFLICT (customer_number) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `, [customer.number, customer.firstName, customer.lastName, customer.email, customer.phone]);
      customerIds.push(result.rows[0].id);
    }
    
    // Seed Accounts
    const accounts = [
      { number: '1001234567', customerId: customerIds[0], type: 'savings', balance: 50000.00 },
      { number: '1001234568', customerId: customerIds[0], type: 'current', balance: 150000.00 },
      { number: '1002345678', customerId: customerIds[1], type: 'savings', balance: 75000.00 },
      { number: '1003456789', customerId: customerIds[2], type: 'current', balance: 200000.00 }
    ];
    
    const accountIds = [];
    for (const account of accounts) {
      const result = await client.query(`
        INSERT INTO accounts (account_number, customer_id, account_type, balance, available_balance)
        VALUES ($1, $2, $3, $4, $4)
        ON CONFLICT (account_number) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `, [account.number, account.customerId, account.type, account.balance]);
      accountIds.push(result.rows[0].id);
    }
    
    // Seed Transactions
    const transactions = [
      { accountId: accountIds[0], type: 'credit', amount: 10000, desc: 'Salary deposit' },
      { accountId: accountIds[0], type: 'debit', amount: 5000, desc: 'ATM withdrawal' },
      { accountId: accountIds[1], type: 'credit', amount: 50000, desc: 'Business payment' },
      { accountId: accountIds[2], type: 'credit', amount: 25000, desc: 'Transfer from savings' }
    ];
    
    for (const tx of transactions) {
      await client.query(`
        INSERT INTO transactions (transaction_ref, account_id, transaction_type, amount, description, status)
        VALUES ($1, $2, $3, $4, $5, 'completed')
        ON CONFLICT (transaction_ref) DO NOTHING
      `, [`TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`, tx.accountId, tx.type, tx.amount, tx.desc]);
    }
    
    await client.query('COMMIT');
    logger.info('Database seeded successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  seedData()
    .then(() => {
      logger.info('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedData;
