# Wekeza API Server

Complete implementation of the Wekeza Open Banking Platform API Server.

## Features

✅ **OAuth 2.0 Authentication** - Client credentials and refresh token flows
✅ **Accounts API** - List accounts, get details, balances, transactions  
✅ **Payments API** - Initiate payments, track status, idempotency support  
✅ **PostgreSQL Database** - Complete schema with migrations and seeds  
✅ **Rate Limiting** - Configurable per-endpoint protection  
✅ **Security** - Helmet, CORS, JWT, input validation  
✅ **Logging** - Winston-based structured logging  
✅ **Docker Support** - Full Docker Compose setup  

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# From repository root
docker-compose up

# In another terminal, run migrations and seed
docker exec -it wekeza-api npm run migrate
docker exec -it wekeza-api npm run seed
```

### Option 2: Local Development

```bash
cd api-server

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Start PostgreSQL (if not using Docker)
# Make sure PostgreSQL is running on localhost:5432

# Run migrations
npm run migrate

# Seed database
npm run seed

# Start server
npm run dev
```

## API Endpoints

### OAuth
```
POST /oauth/token - Get access token
```

### Accounts
```
GET /api/v1/accounts - List accounts
GET /api/v1/accounts/:id - Get account details
GET /api/v1/accounts/:id/balance - Get account balance
GET /api/v1/accounts/:id/transactions - Get transactions
```

### Payments
```
POST /api/v1/payments - Initiate payment
GET /api/v1/payments/:id - Get payment details
GET /api/v1/payments/:id/status - Get payment status
GET /api/v1/payments - List payments
```

## Testing the API

### 1. Get Access Token

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

### 2. List Accounts

```bash
curl -X GET http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Initiate Payment

```bash
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: payment_12345" \
  -d '{
    "sourceAccountId": "ACCOUNT_ID_FROM_STEP_2",
    "destinationAccountNumber": "1009876543",
    "amount": 1000.00,
    "currency": "KES",
    "reference": "TEST-PAYMENT-001",
    "description": "Test payment"
  }'
```

## Database Schema

The system includes:
- `oauth_clients` - OAuth client credentials
- `oauth_tokens` - Access and refresh tokens
- `customers` - Customer information
- `accounts` - Bank accounts
- `transactions` - Transaction history
- `payments` - Payment records
- `webhooks` - Webhook subscriptions
- `webhook_deliveries` - Webhook delivery tracking

## Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `PORT` - Server port (default: 3000)
- `DB_*` - Database connection settings
- `JWT_SECRET` - JWT signing secret
- `OAUTH_CLIENT_ID` / `OAUTH_CLIENT_SECRET` - Default OAuth credentials

## Testing

```bash
npm test
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with test data
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Architecture

```
api-server/
├── src/
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── models/          # Data models (if needed)
│   ├── utils/           # Utilities (logger, etc.)
│   ├── app.js           # Express app setup
│   └── server.js        # Server startup
├── database/
│   ├── pool.js          # Database connection
│   ├── migrate.js       # Schema migrations
│   └── seed.js          # Test data
├── config/
│   └── index.js         # Configuration
└── tests/               # Test files
```

## Production Deployment

1. Set all environment variables securely
2. Use strong JWT secrets
3. Configure rate limiting appropriately
4. Set up SSL/TLS termination
5. Enable monitoring and logging
6. Regular database backups
7. Use connection pooling

## License

Proprietary - © 2026 Wekeza Bank
