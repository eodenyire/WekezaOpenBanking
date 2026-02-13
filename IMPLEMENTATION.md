# Wekeza Open Banking - API Implementation

This repository contains the complete implementation of the Wekeza Open Banking Platform API ecosystem, including client SDKs and comprehensive documentation.

## 📦 What's Included

### Client SDKs

#### JavaScript/Node.js SDK (`examples/javascript/`)
- **Full OAuth 2.0 implementation** with token caching and refresh
- **Accounts API client** - List accounts, get balances, retrieve transactions
- **Payments API client** - Initiate payments, track status, handle M-Pesa
- **Webhooks module** - Signature verification and event handling
- **Example applications** - Demo app and webhook server
- **Dependencies**: axios, dotenv, express

#### Python SDK (`examples/python/`)
- **Full OAuth 2.0 implementation** with token caching and refresh
- **Accounts API client** - List accounts, get balances, retrieve transactions
- **Payments API client** - Initiate payments, track status, handle M-Pesa
- **Webhooks module** - Signature verification and event handling
- **Example applications** - Demo app and Flask webhook server
- **Dependencies**: requests, python-dotenv, Flask

### Documentation (`docs/`)
- **Getting Started Guide** - 5-minute quickstart
- **Authentication Guide** - Complete OAuth 2.0 implementation
- **API Reference** - Accounts and Payments endpoints
- **Sandbox Environment** - Test accounts and scenarios
- **Webhooks Guide** - Event handling and integration
- **System Documentation** - Core Banking and other systems

## 🚀 Quick Start

### JavaScript/Node.js

```bash
cd examples/javascript
npm install
cp .env.example .env
# Edit .env with your credentials
node examples/demo.js
```

### Python

```bash
cd examples/python
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
python examples/demo.py
```

## 📖 Usage Examples

### JavaScript

```javascript
const WekezaClient = require('./src/index');

// Initialize client
const client = WekezaClient.fromEnv();

// Get accounts
const accounts = await client.accounts.listAccounts();

// Get balance
const balance = await client.accounts.getBalance('acc_123');

// Initiate payment
const payment = await client.payments.initiatePayment({
  sourceAccountId: 'acc_123',
  destinationAccountNumber: '1009876543',
  amount: 1000.00,
  currency: 'KES',
  reference: 'PAYMENT-001'
});
```

### Python

```python
from wekeza_sdk import WekezaClient

# Initialize client
client = WekezaClient.from_env()

# Get accounts
accounts = client.accounts.list_accounts()

# Get balance
balance = client.accounts.get_balance('acc_123')

# Initiate payment
payment = client.payments.initiate_payment({
    'sourceAccountId': 'acc_123',
    'destinationAccountNumber': '1009876543',
    'amount': 1000.00,
    'currency': 'KES',
    'reference': 'PAYMENT-001'
})
```

## 🔐 Authentication

Both SDKs implement OAuth 2.0 client credentials flow with:
- **Token caching** - Reduces unnecessary API calls
- **Automatic refresh** - Handles token expiration seamlessly
- **Secure storage** - Best practices for credential management

## 📡 Webhook Handling

### JavaScript Webhook Server

```bash
cd examples/javascript
node examples/webhook-server.js
```

### Python Webhook Server

```bash
cd examples/python
python examples/webhook_server.py
```

Both servers include:
- **Signature verification** using HMAC-SHA256
- **Event handlers** for all webhook types
- **Error handling** and logging
- **Health check endpoint**

## 🔧 Configuration

Create a `.env` file in the SDK directory:

```env
WEKEZA_CLIENT_ID=your_client_id
WEKEZA_CLIENT_SECRET=your_client_secret
WEKEZA_BASE_URL=https://sandbox.wekeza.com/api/v1
WEKEZA_OAUTH_URL=https://sandbox.wekeza.com/oauth
WEBHOOK_SECRET=your_webhook_secret
```

## 🏗️ Project Structure

```
WekezaOpenBanking/
├── docs/                          # Documentation
│   ├── getting-started.md
│   ├── authentication.md
│   ├── sandbox.md
│   ├── api-reference/
│   │   ├── accounts.md
│   │   └── payments.md
│   ├── guides/
│   │   └── webhooks.md
│   └── systems/
│       └── core-banking.md
├── examples/
│   ├── javascript/               # JavaScript SDK
│   │   ├── src/
│   │   │   ├── index.js         # Main client
│   │   │   ├── auth.js          # OAuth module
│   │   │   ├── accounts.js      # Accounts API
│   │   │   ├── payments.js      # Payments API
│   │   │   └── webhooks.js      # Webhooks module
│   │   ├── examples/
│   │   │   ├── demo.js          # Usage demo
│   │   │   └── webhook-server.js # Webhook server
│   │   ├── package.json
│   │   └── .env.example
│   └── python/                   # Python SDK
│       ├── wekeza_sdk/
│       │   ├── __init__.py
│       │   ├── client.py        # Main client
│       │   ├── auth.py          # OAuth module
│       │   ├── accounts.py      # Accounts API
│       │   ├── payments.py      # Payments API
│       │   └── webhooks.py      # Webhooks module
│       ├── examples/
│       │   ├── demo.py          # Usage demo
│       │   └── webhook_server.py # Webhook server
│       ├── requirements.txt
│       └── .env.example
├── README.md                     # This file
├── Architecture.md               # Architecture documentation
├── PRD.md                        # Product requirements
└── IMPLEMENTATION_SUMMARY.md     # Implementation summary
```

## 🎯 Features

### Accounts API
- ✅ List all accounts
- ✅ Get account details
- ✅ Get account balance
- ✅ Get transaction history with pagination
- ✅ Date range filtering

### Payments API
- ✅ Initiate payments with idempotency
- ✅ Get payment details
- ✅ Track payment status
- ✅ List payments with filtering
- ✅ Cancel payments
- ✅ M-Pesa STK Push integration

### Webhooks
- ✅ Signature verification (HMAC-SHA256)
- ✅ Event parsing and validation
- ✅ Type-based event handlers
- ✅ Error handling and logging

### Security
- ✅ OAuth 2.0 authentication
- ✅ Token caching and refresh
- ✅ Secure credential storage
- ✅ HMAC signature verification
- ✅ TLS encryption (HTTPS)

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/accounts` | GET | List accounts |
| `/accounts/{id}` | GET | Get account details |
| `/accounts/{id}/balance` | GET | Get account balance |
| `/accounts/{id}/transactions` | GET | Get transactions |
| `/payments` | POST | Initiate payment |
| `/payments/{id}` | GET | Get payment details |
| `/payments/{id}/status` | GET | Get payment status |
| `/payments/{id}/cancel` | POST | Cancel payment |
| `/payments/mpesa/stk-push` | POST | M-Pesa STK Push |

## 🔄 Webhook Events

- `transaction.posted` - New transaction created
- `payment.completed` - Payment successful
- `payment.failed` - Payment failed
- `payment.cancelled` - Payment cancelled
- `account.balance_low` - Low balance alert
- `account.updated` - Account details changed
- And 15+ more events...

## 🧪 Testing

### Sandbox Environment
- **URL**: `https://sandbox.wekeza.com/api/v1`
- **Rate Limit**: 100 requests/minute
- **Test Accounts**: Pre-configured accounts with sample data
- **Reset**: Daily at 00:00 UTC

### Running Tests

JavaScript:
```bash
cd examples/javascript
npm test
```

Python:
```bash
cd examples/python
pytest
```

## 📈 Performance

- **Response Time**: < 500ms (95th percentile)
- **Availability**: 99.9% uptime
- **Rate Limiting**: 100 req/min (sandbox), 1000 req/min (production)
- **Token Caching**: Reduces auth overhead by 90%

## 🤝 Support

- **Documentation**: [https://developers.wekeza.com](https://developers.wekeza.com)
- **Email**: developers@wekeza.com
- **Slack**: [Join Developer Community](https://wekeza-dev.slack.com)
- **GitHub Issues**: [Report bugs](https://github.com/eodenyire/WekezaOpenBanking/issues)

## 📝 License

Proprietary - © 2026 Wekeza Bank. All rights reserved.

## 🎓 Next Steps

1. **Get API Credentials** - Register at [developers.wekeza.com](https://developers.wekeza.com)
2. **Explore Documentation** - Read the [Getting Started Guide](docs/getting-started.md)
3. **Test in Sandbox** - Use test accounts from [Sandbox Guide](docs/sandbox.md)
4. **Build Your App** - Follow code examples in this repository
5. **Go to Production** - Submit for production approval

---

**Built with ❤️ by the Wekeza Engineering Team**
