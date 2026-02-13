/**
 * Wekeza API Demo
 * Shows basic usage of the JavaScript SDK
 */

const WekezaClient = require('../src/index');

async function main() {
  // Create client from environment variables
  const client = WekezaClient.fromEnv();

  console.log('=== Wekeza API Demo ===\n');

  try {
    // 1. List Accounts
    console.log('1. Fetching accounts...');
    const accounts = await client.accounts.listAccounts();
    console.log(`Found ${accounts.data.length} accounts`);
    console.log(JSON.stringify(accounts, null, 2));
    console.log('');

    // 2. Get Account Balance
    if (accounts.data && accounts.data.length > 0) {
      const firstAccount = accounts.data[0];
      console.log(`2. Getting balance for account ${firstAccount.id}...`);
      const balance = await client.accounts.getBalance(firstAccount.id);
      console.log(`Balance: ${balance.currency} ${balance.available}`);
      console.log('');

      // 3. Get Transactions
      console.log(`3. Getting transactions for account ${firstAccount.id}...`);
      const transactions = await client.accounts.getTransactions(firstAccount.id, {
        limit: 5
      });
      console.log(`Found ${transactions.data.length} recent transactions`);
      console.log(JSON.stringify(transactions, null, 2));
      console.log('');
    }

    // 4. Initiate Payment
    console.log('4. Initiating a payment...');
    const payment = await client.payments.initiatePayment({
      sourceAccountId: 'acc_test_12345',
      destinationAccountNumber: '1009876543',
      amount: 1000.00,
      currency: 'KES',
      reference: 'TEST-PAYMENT-001',
      description: 'Test payment from SDK'
    });
    console.log('Payment initiated successfully:');
    console.log(JSON.stringify(payment, null, 2));
    console.log('');

    // 5. Check Payment Status
    console.log(`5. Checking payment status...`);
    const paymentStatus = await client.payments.getPaymentStatus(payment.id);
    console.log(`Payment Status: ${paymentStatus.status}`);
    console.log('');

    console.log('=== Demo Complete ===');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  main();
}

module.exports = main;
