# Wekeza Open Banking - Complete System Deployment Guide

## 🎉 System Overview

This is a **fully functional, production-ready** end-to-end open banking system with:

✅ Client SDKs (JavaScript & Python)
✅ API Server (Express.js + PostgreSQL)
✅ OAuth 2.0 Authentication
✅ Complete API Endpoints
✅ Webhook Delivery System
✅ Tests & Documentation
✅ Docker Deployment

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Docker & Docker Compose
- Git

### Steps

```bash
# 1. Clone repository
git clone https://github.com/eodenyire/WekezaOpenBanking.git
cd WekezaOpenBanking

# 2. Create environment file
cp .env.example .env
# Edit .env with secure passwords and secrets

# 3. Start the system
docker-compose up -d

# 4. Initialize database
docker exec -it wekeza-api npm run migrate
docker exec -it wekeza-api npm run seed

# 5. Test the API
curl http://localhost:3000/health
```

**System is now running!** 🎊

- API Server: http://localhost:3000
- PostgreSQL: localhost:5432
- OpenAPI Docs: http://localhost:3000/api-docs (if configured)

## 📖 Complete Setup Guide

### 1. Environment Configuration

Create `.env` file in project root:

```bash
# Database
POSTGRES_DB=wekeza_banking
POSTGRES_USER=wekeza_user
POSTGRES_PASSWORD=CHANGE_THIS_TO_SECURE_PASSWORD

# JWT Secrets (generate with: openssl rand -hex 32)
JWT_SECRET=YOUR_SECURE_JWT_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_SECURE_REFRESH_SECRET_HERE

# OAuth
OAUTH_CLIENT_ID=sandbox_client
OAUTH_CLIENT_SECRET=YOUR_SECURE_OAUTH_SECRET_HERE

# Webhook
WEBHOOK_SECRET=YOUR_SECURE_WEBHOOK_SECRET_HERE
```

**⚠️ IMPORTANT**: Never commit `.env` file to version control!

### 2. Start Services

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api-server
```

### 3. Initialize Database

```bash
# Run migrations (create tables)
docker exec -it wekeza-api npm run migrate

# Seed test data
docker exec -it wekeza-api npm run seed
```

### 4. Verify Installation

```bash
# Health check
curl http://localhost:3000/health

# Should return:
# {"status":"ok","service":"wekeza-api-server","version":"v1"}
```

## 🔐 Getting Your First Access Token

```bash
curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "sandbox_client",
    "client_secret": "sandbox_secret_key",
    "scope": "accounts.read transactions.read payments.write"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "accounts.read transactions.read payments.write"
}
```

## 💡 Using the API

### List Accounts

```bash
curl -X GET http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Account Balance

```bash
curl -X GET http://localhost:3000/api/v1/accounts/{ACCOUNT_ID}/balance \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Initiate Payment

```bash
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: payment_$(date +%s)" \
  -d '{
    "sourceAccountId": "ACCOUNT_ID",
    "destinationAccountNumber": "1009876543",
    "amount": 1000.00,
    "currency": "KES",
    "reference": "PAYMENT-001",
    "description": "Test payment"
  }'
```

## 🐍 Using Python SDK

```bash
cd examples/python
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials

python examples/demo.py
```

```python
from wekeza_sdk import WekezaClient

client = WekezaClient.from_env()

# Get accounts
accounts = client.accounts.list_accounts()
print(accounts)

# Get balance
balance = client.accounts.get_balance(account_id)
print(f"Balance: {balance['currency']} {balance['available']}")

# Initiate payment
payment = client.payments.initiate_payment({
    'sourceAccountId': account_id,
    'destinationAccountNumber': '1009876543',
    'amount': 1000.00,
    'currency': 'KES',
    'reference': 'PAYMENT-001'
})
print(f"Payment: {payment['status']}")
```

## 📦 Using JavaScript SDK

```bash
cd examples/javascript
npm install
cp .env.example .env
# Edit .env with your credentials

node examples/demo.js
```

```javascript
const WekezaClient = require('./src/index');

const client = WekezaClient.fromEnv();

// Get accounts
const accounts = await client.accounts.listAccounts();
console.log(accounts);

// Get balance
const balance = await client.accounts.getBalance(accountId);
console.log(`Balance: ${balance.currency} ${balance.available}`);

// Initiate payment
const payment = await client.payments.initiatePayment({
  sourceAccountId: accountId,
  destinationAccountNumber: '1009876543',
  amount: 1000.00,
  currency: 'KES',
  reference: 'PAYMENT-001'
});
console.log(`Payment: ${payment.status}`);
```

## 🧪 Running Tests

```bash
# API Server tests
cd api-server
npm test

# With coverage
npm test -- --coverage
```

## 🛠️ Development Mode

### Run API server locally (without Docker)

```bash
cd api-server
npm install
cp .env.example .env
# Edit .env with database credentials

# Start PostgreSQL (via Docker or locally)
# Ensure it's running on localhost:5432

# Run migrations
npm run migrate

# Seed data
npm run seed

# Start development server
npm run dev
```

### Watch mode with auto-reload

```bash
npm run dev
```

## 📊 Database Management

### Access PostgreSQL

```bash
# Connect to database
docker exec -it wekeza-db psql -U wekeza_user -d wekeza_banking

# List tables
\dt

# View accounts
SELECT * FROM accounts;

# View payments
SELECT * FROM payments;

# Exit
\q
```

### Reset Database

```bash
# Stop services
docker-compose down

# Remove database volume
docker volume rm wekezaopenbanking_postgres_data

# Start fresh
docker-compose up -d
docker exec -it wekeza-api npm run migrate
docker exec -it wekeza-api npm run seed
```

## 🔄 Webhook Setup

### Register a Webhook

```bash
curl -X POST http://localhost:3000/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/wekeza",
    "events": [
      "payment.completed",
      "transaction.posted",
      "account.balance_low"
    ],
    "secret": "your_webhook_secret"
  }'
```

### Webhook Handler Example

```javascript
// Express.js webhook receiver
app.post('/webhooks/wekeza', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-wekeza-signature'];
  const payload = req.body.toString('utf8');
  
  // Verify signature
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  if (signature !== expected) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = JSON.parse(payload);
  console.log('Webhook received:', event.type, event.data);
  
  res.sendStatus(200);
});
```

## 🌐 Production Deployment

### Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT secrets (32+ characters)
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Configure database backups
- [ ] Review rate limiting settings
- [ ] Enable audit logging
- [ ] Set NODE_ENV=production

### Environment Variables for Production

```bash
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=wekeza_banking_prod
DB_USER=wekeza_prod_user
DB_PASSWORD=SUPER_SECURE_PASSWORD
JWT_SECRET=SUPER_SECURE_JWT_SECRET_MIN_32_CHARS
JWT_REFRESH_SECRET=SUPER_SECURE_REFRESH_SECRET
OAUTH_CLIENT_SECRET=SUPER_SECURE_OAUTH_SECRET
WEBHOOK_SECRET=SUPER_SECURE_WEBHOOK_SECRET
RATE_LIMIT_MAX_REQUESTS=1000
LOG_LEVEL=warn
```

### Scaling

```bash
# Run multiple API instances behind load balancer
docker-compose up --scale api-server=3
```

## 📈 Monitoring

### Health Checks

```bash
# API health
curl http://localhost:3000/health

# Database health
docker exec wekeza-db pg_isready
```

### Logs

```bash
# API server logs
docker-compose logs -f api-server

# Database logs
docker-compose logs -f postgres

# All logs
docker-compose logs -f
```

## 🐛 Troubleshooting

### API Server Won't Start

```bash
# Check logs
docker-compose logs api-server

# Common issues:
# 1. Database not ready - wait for postgres health check
# 2. Port 3000 in use - change PORT in .env
# 3. Missing environment variables - check .env file
```

### Database Connection Failed

```bash
# Check database is running
docker-compose ps postgres

# Check connection
docker exec wekeza-db pg_isready

# Restart database
docker-compose restart postgres
```

### OAuth Token Invalid

```bash
# Check client credentials
# Ensure client_id and client_secret match database

# View OAuth clients
docker exec -it wekeza-db psql -U wekeza_user -d wekeza_banking -c "SELECT client_id FROM oauth_clients;"
```

## 📚 Additional Resources

- **API Documentation**: `api-server/README.md`
- **JavaScript SDK**: `examples/javascript/README.md`
- **Python SDK**: `examples/python/README.md`
- **OpenAPI Spec**: `api-server/openapi.yml`
- **Architecture**: `Architecture.md`

## 🆘 Support

- GitHub Issues: https://github.com/eodenyire/WekezaOpenBanking/issues
- Email: developers@wekeza.com

## ✅ Verification Checklist

After deployment, verify:

- [ ] Health endpoint returns 200 OK
- [ ] Can obtain OAuth token
- [ ] Can list accounts
- [ ] Can retrieve account balance
- [ ] Can initiate payment
- [ ] Can register webhook
- [ ] Database has seed data
- [ ] Logs are working
- [ ] No errors in console

## 🎊 Success!

If all checks pass, your Wekeza Open Banking Platform is ready to use!

**You now have a complete, production-ready open banking system! 🚀**

---

**Built with ❤️ by Wekeza Engineering Team**
