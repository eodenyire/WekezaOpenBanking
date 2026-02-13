# Wekeza API - JavaScript Examples

Complete examples for integrating with the Wekeza Open Banking Platform using JavaScript/Node.js.

## Prerequisites

```bash
npm install axios dotenv
```

## Setup

Create a `.env` file:

```env
WEKEZA_CLIENT_ID=your_client_id
WEKEZA_CLIENT_SECRET=your_client_secret
WEKEZA_BASE_URL=https://sandbox.wekeza.com/api/v1
WEKEZA_OAUTH_URL=https://sandbox.wekeza.com/oauth
WEBHOOK_SECRET=your_webhook_secret
```

## Authentication

### Get Access Token

```javascript
// auth.js
const axios = require('axios');
require('dotenv').config();

class WekezaAuth {
  constructor() {
    this.clientId = process.env.WEKEZA_CLIENT_ID;
    this.clientSecret = process.env.WEKEZA_CLIENT_SECRET;
    this.oauthUrl = process.env.WEKEZA_OAUTH_URL;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${this.oauthUrl}/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'accounts.read transactions.read payments.write'
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer

      return this.accessToken;
    } catch (error) {
      console.error('Authentication failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      const response = await axios.post(
        `${this.oauthUrl}/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token
      };
    } catch (error) {
      console.error('Token refresh failed:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = WekezaAuth;
```

## Accounts API

### Get Accounts

```javascript
// accounts.js
const axios = require('axios');
const WekezaAuth = require('./auth');

class WekezaAccounts {
  constructor() {
    this.auth = new WekezaAuth();
    this.baseUrl = process.env.WEKEZA_BASE_URL;
  }

  async getClient() {
    const token = await this.auth.getAccessToken();
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async listAccounts(filters = {}) {
    try {
      const client = await this.getClient();
      const response = await client.get('/accounts', { params: filters });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getAccount(accountId) {
    try {
      const client = await this.getClient();
      const response = await client.get(`/accounts/${accountId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getBalance(accountId) {
    try {
      const client = await this.getClient();
      const response = await client.get(`/accounts/${accountId}/balance`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getTransactions(accountId, filters = {}) {
    try {
      const client = await this.getClient();
      const response = await client.get(`/accounts/${accountId}/transactions`, {
        params: filters
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      console.error('API Error:', error.response.data);
      throw new Error(error.response.data.error?.message || 'API request failed');
    } else if (error.request) {
      console.error('Network Error:', error.message);
      throw new Error('Network error occurred');
    } else {
      console.error('Error:', error.message);
      throw error;
    }
  }
}

module.exports = WekezaAccounts;
```

## Payments API

### Initiate Payment

```javascript
// payments.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const WekezaAuth = require('./auth');

class WekezaPayments {
  constructor() {
    this.auth = new WekezaAuth();
    this.baseUrl = process.env.WEKEZA_BASE_URL;
  }

  async getClient() {
    const token = await this.auth.getAccessToken();
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async initiatePayment(paymentData) {
    try {
      const client = await this.getClient();
      const idempotencyKey = uuidv4();
      
      const response = await client.post('/payments', paymentData, {
        headers: { 'Idempotency-Key': idempotencyKey }
      });
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('Duplicate payment detected');
        return error.response.data;
      }
      this.handleError(error);
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const client = await this.getClient();
      const response = await client.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listPayments(filters = {}) {
    try {
      const client = await this.getClient();
      const response = await client.get('/payments', { params: filters });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async cancelPayment(paymentId, reason) {
    try {
      const client = await this.getClient();
      const response = await client.post(`/payments/${paymentId}/cancel`, {
        reason
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async initiateMpesaPayment(phoneNumber, amount, reference) {
    try {
      const client = await this.getClient();
      const response = await client.post('/payments/mpesa/stkpush', {
        phoneNumber,
        amount,
        accountReference: reference,
        transactionDesc: 'Payment via M-Pesa'
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      console.error('API Error:', error.response.data);
      throw new Error(error.response.data.error?.message || 'API request failed');
    } else if (error.request) {
      console.error('Network Error:', error.message);
      throw new Error('Network error occurred');
    } else {
      console.error('Error:', error.message);
      throw error;
    }
  }
}

module.exports = WekezaPayments;
```

## Usage Examples

### Example 1: Get Account Balance

```javascript
// example-balance.js
const WekezaAccounts = require('./accounts');

async function checkBalance() {
  const accounts = new WekezaAccounts();
  
  try {
    // Get all accounts
    const accountList = await accounts.listAccounts();
    console.log('Total accounts:', accountList.data.length);
    
    // Get balance for first account
    if (accountList.data.length > 0) {
      const accountId = accountList.data[0].id;
      const balance = await accounts.getBalance(accountId);
      
      console.log(`Account: ${balance.accountNumber}`);
      console.log(`Available Balance: ${balance.balance.currency} ${balance.balance.available}`);
      console.log(`Current Balance: ${balance.balance.currency} ${balance.balance.current}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkBalance();
```

### Example 2: Make a Payment

```javascript
// example-payment.js
const WekezaPayments = require('./payments');

async function makePayment() {
  const payments = new WekezaPayments();
  
  try {
    const payment = await payments.initiatePayment({
      sourceAccountId: 'acc_1234567890',
      destinationAccountNumber: '1009876543',
      amount: 5000.00,
      currency: 'KES',
      description: 'Payment for services',
      reference: 'INV-2026-001'
    });
    
    console.log('Payment initiated:', payment.id);
    console.log('Status:', payment.status);
    
    // Poll for status
    let status = payment.status;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (status === 'PENDING' || status === 'PROCESSING') {
      if (attempts >= maxAttempts) {
        console.log('Payment still processing after max attempts');
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const updated = await payments.getPaymentStatus(payment.id);
      status = updated.status;
      attempts++;
      
      console.log(`Attempt ${attempts}: Status = ${status}`);
    }
    
    console.log('Final status:', status);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

makePayment();
```

### Example 3: Get Transaction History

```javascript
// example-transactions.js
const WekezaAccounts = require('./accounts');

async function getTransactionHistory() {
  const accounts = new WekezaAccounts();
  
  try {
    const transactions = await accounts.getTransactions('acc_1234567890', {
      fromDate: '2026-01-01',
      toDate: '2026-02-13',
      perPage: 50
    });
    
    console.log('Total transactions:', transactions.summary.totalTransactions);
    console.log('Total credits:', transactions.summary.totalCredits);
    console.log('Total debits:', transactions.summary.totalDebits);
    console.log('Net amount:', transactions.summary.netAmount);
    console.log('\nRecent transactions:');
    
    transactions.data.slice(0, 5).forEach(txn => {
      const sign = txn.type === 'CREDIT' ? '+' : '-';
      console.log(`${txn.transactionDate} | ${sign}${txn.amount} ${txn.currency} | ${txn.description}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getTransactionHistory();
```

## Webhook Handler

### Express.js Webhook Endpoint

```javascript
// webhook-server.js
const express = require('express');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// Important: Use raw body for signature verification
app.use(express.raw({ type: 'application/json' }));

function verifyWebhookSignature(payload, signature, secret) {
  const elements = signature.split(',');
  const timestamp = elements.find(e => e.startsWith('t=')).split('=')[1];
  const sig = elements.find(e => e.startsWith('v1=')).split('=')[1];
  
  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    throw new Error('Webhook timestamp too old');
  }
  
  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  // Compare signatures
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    throw new Error('Invalid webhook signature');
  }
  
  return true;
}

app.post('/webhooks/wekeza', (req, res) => {
  const signature = req.headers['x-wekeza-signature'];
  const rawBody = req.body.toString();
  const event = JSON.parse(rawBody);
  
  try {
    // Verify signature
    verifyWebhookSignature(rawBody, signature, process.env.WEBHOOK_SECRET);
    
    // Acknowledge receipt immediately
    res.status(200).json({ received: true });
    
    // Process event asynchronously
    processWebhook(event).catch(error => {
      console.error('Error processing webhook:', error);
    });
    
  } catch (error) {
    console.error('Webhook verification failed:', error);
    res.status(400).json({ error: error.message });
  }
});

async function processWebhook(event) {
  console.log(`Processing webhook: ${event.type}`);
  
  switch (event.type) {
    case 'payment.completed':
      await handlePaymentCompleted(event.data);
      break;
    case 'payment.failed':
      await handlePaymentFailed(event.data);
      break;
    case 'transaction.posted':
      await handleTransactionPosted(event.data);
      break;
    case 'consent.revoked':
      await handleConsentRevoked(event.data);
      break;
    default:
      console.log('Unknown event type:', event.type);
  }
}

async function handlePaymentCompleted(data) {
  console.log('Payment completed:', data.paymentId);
  // Update your database, notify user, etc.
}

async function handlePaymentFailed(data) {
  console.log('Payment failed:', data.paymentId);
  // Notify user, retry logic, etc.
}

async function handleTransactionPosted(data) {
  console.log('Transaction posted:', data.transactionId);
  // Update records, trigger notifications, etc.
}

async function handleConsentRevoked(data) {
  console.log('Consent revoked:', data.consentId);
  // Clean up tokens, disable features, etc.
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
```

## Error Handling

### Retry with Exponential Backoff

```javascript
// retry.js
async function retryWithBackoff(fn, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on 4xx errors (except 429)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        if (error.response.status !== 429) {
          throw error;
        }
      }
      
      // Calculate backoff delay
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Usage
const accounts = new WekezaAccounts();
const balance = await retryWithBackoff(() => accounts.getBalance('acc_123'));
```

## Rate Limiting Handler

```javascript
// rate-limiter.js
class RateLimiter {
  constructor(maxRequests = 100, timeWindow = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  async throttle() {
    const now = Date.now();
    
    // Remove old requests outside time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      console.log(`Rate limit reached. Waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.throttle();
    }
    
    this.requests.push(now);
  }
}

// Usage
const limiter = new RateLimiter(100, 60000); // 100 requests per minute

async function makeApiCall() {
  await limiter.throttle();
  // Make your API call
}
```

## Complete Integration Example

```javascript
// app.js
const WekezaAccounts = require('./accounts');
const WekezaPayments = require('./payments');

class WekezaApp {
  constructor() {
    this.accounts = new WekezaAccounts();
    this.payments = new WekezaPayments();
  }

  async transferMoney(fromAccountId, toAccountNumber, amount, description) {
    try {
      // 1. Check balance
      const balance = await this.accounts.getBalance(fromAccountId);
      
      if (balance.balance.available < amount) {
        throw new Error('Insufficient funds');
      }
      
      // 2. Initiate payment
      const payment = await this.payments.initiatePayment({
        sourceAccountId: fromAccountId,
        destinationAccountNumber: toAccountNumber,
        amount: amount,
        currency: balance.balance.currency,
        description: description,
        reference: `TRF-${Date.now()}`
      });
      
      console.log('Payment initiated:', payment.id);
      
      // 3. Wait for completion (or use webhooks)
      let status = await this.waitForPayment(payment.id);
      
      return {
        success: status === 'COMPLETED',
        paymentId: payment.id,
        status: status
      };
      
    } catch (error) {
      console.error('Transfer failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async waitForPayment(paymentId, maxWaitTime = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const payment = await this.payments.getPaymentStatus(paymentId);
      
      if (payment.status === 'COMPLETED' || payment.status === 'FAILED') {
        return payment.status;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return 'TIMEOUT';
  }

  async getAccountSummary(accountId) {
    try {
      const [account, balance, transactions] = await Promise.all([
        this.accounts.getAccount(accountId),
        this.accounts.getBalance(accountId),
        this.accounts.getTransactions(accountId, {
          fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          toDate: new Date().toISOString().split('T')[0],
          perPage: 10
        })
      ]);
      
      return {
        account: account,
        balance: balance,
        recentTransactions: transactions.data
      };
    } catch (error) {
      console.error('Error getting summary:', error.message);
      throw error;
    }
  }
}

module.exports = WekezaApp;

// Usage
(async () => {
  const app = new WekezaApp();
  
  // Get account summary
  const summary = await app.getAccountSummary('acc_1234567890');
  console.log('Account:', summary.account.accountNumber);
  console.log('Balance:', summary.balance.balance.available);
  
  // Transfer money
  const result = await app.transferMoney(
    'acc_1234567890',
    '1009876543',
    5000.00,
    'Payment for services'
  );
  
  if (result.success) {
    console.log('Transfer successful!');
  } else {
    console.log('Transfer failed:', result.error);
  }
})();
```

## Testing

### Jest Test Example

```javascript
// __tests__/accounts.test.js
const WekezaAccounts = require('../accounts');

jest.mock('axios');

describe('WekezaAccounts', () => {
  let accounts;

  beforeEach(() => {
    accounts = new WekezaAccounts();
  });

  test('should get account balance', async () => {
    const mockBalance = {
      accountId: 'acc_123',
      balance: {
        available: 125000.00,
        currency: 'KES'
      }
    };

    const client = await accounts.getClient();
    client.get = jest.fn().mockResolvedValue({ data: mockBalance });

    const balance = await accounts.getBalance('acc_123');
    
    expect(balance.balance.available).toBe(125000.00);
  });
});
```

---

## Next Steps

- [Python Examples](../python/) - Python integration
- [C# Examples](../csharp/) - .NET integration
- [API Reference](../../api-reference/) - Complete API documentation
- [Authentication Guide](../../authentication.md) - OAuth 2.0 setup

---

**Need Help?** Contact developers@wekeza.com or visit [Developer Community](https://wekeza-dev.slack.com).
