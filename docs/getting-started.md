# Getting Started with Wekeza Open Banking API

Welcome to the Wekeza Open Banking Platform! This guide will help you make your first API call in just 5 minutes.

## Prerequisites

Before you begin, you'll need:
- A Wekeza Developer account
- Your application credentials (Client ID and Client Secret)
- Basic understanding of REST APIs and OAuth 2.0
- A tool like cURL, Postman, or your favorite programming language

## Step 1: Register Your Application

### Create a Developer Account

1. Visit [https://developers.wekeza.com](https://developers.wekeza.com)
2. Click "Sign Up" and complete the registration form
3. Verify your email address
4. Complete your developer profile

### Register Your Application

1. Log in to the Developer Portal
2. Navigate to "My Applications"
3. Click "Create New Application"
4. Fill in the application details:
   - **Application Name:** My First Wekeza App
   - **Description:** Testing the Wekeza API
   - **Redirect URI:** https://localhost:3000/callback (for OAuth flows)
   - **Scopes:** Select the permissions you need
5. Click "Create Application"
6. Save your **Client ID** and **Client Secret** securely

⚠️ **Security Note:** Never commit your Client Secret to version control or share it publicly.

## Step 2: Choose Your Environment

### Sandbox Environment (Recommended for Testing)
- **Base URL:** `https://sandbox.wekeza.com/api/v1`
- **OAuth URL:** `https://sandbox.wekeza.com/oauth`
- Test data pre-populated
- No real money transactions
- Rate limit: 100 requests/minute

### Production Environment
- **Base URL:** `https://api.wekeza.com/api/v1`
- **OAuth URL:** `https://api.wekeza.com/oauth`
- Real customer data (requires approval)
- Live transactions
- Rate limit: 1000 requests/minute

**For this guide, we'll use the Sandbox environment.**

## Step 3: Authenticate with OAuth 2.0

Wekeza uses OAuth 2.0 for authentication. We support two flows:

### Client Credentials Flow (Server-to-Server)

Best for: Backend applications, scheduled jobs, server-to-server integrations

#### Request an Access Token

```bash
curl -X POST https://sandbox.wekeza.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=accounts.read transactions.read"
```

#### Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "accounts.read transactions.read"
}
```

The access token is valid for **1 hour** (3600 seconds).

### Authorization Code Flow (User Authorization)

Best for: Web apps, mobile apps requiring user consent

This flow requires user interaction. See the [Authentication Guide](authentication.md) for detailed steps.

## Step 4: Make Your First API Call

Let's retrieve a list of accounts using the access token you just obtained.

### Request

```bash
curl -X GET https://sandbox.wekeza.com/api/v1/accounts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### Response

```json
{
  "data": [
    {
      "id": "acc_1234567890",
      "accountNumber": "1001234567",
      "accountName": "John Doe Savings",
      "accountType": "SAVINGS",
      "currency": "KES",
      "balance": {
        "available": 125000.00,
        "current": 125000.00,
        "currency": "KES"
      },
      "status": "ACTIVE",
      "openedDate": "2025-01-15T10:30:00Z"
    },
    {
      "id": "acc_9876543210",
      "accountNumber": "1009876543",
      "accountName": "John Doe Current",
      "accountType": "CURRENT",
      "currency": "KES",
      "balance": {
        "available": 450000.00,
        "current": 450000.00,
        "currency": "KES"
      },
      "status": "ACTIVE",
      "openedDate": "2024-06-20T14:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "totalPages": 1,
    "totalRecords": 2
  }
}
```

🎉 **Congratulations!** You've made your first API call to Wekeza Open Banking Platform.

## Step 5: Explore More Endpoints

### Get Account Details

```bash
curl -X GET https://sandbox.wekeza.com/api/v1/accounts/acc_1234567890 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Account Balance

```bash
curl -X GET https://sandbox.wekeza.com/api/v1/accounts/acc_1234567890/balance \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Transaction History

```bash
curl -X GET "https://sandbox.wekeza.com/api/v1/accounts/acc_1234567890/transactions?fromDate=2026-01-01&toDate=2026-02-13&page=1&perPage=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Initiate a Payment

```bash
curl -X POST https://sandbox.wekeza.com/api/v1/payments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-request-id-123" \
  -d '{
    "sourceAccountId": "acc_1234567890",
    "destinationAccountNumber": "1009876543",
    "amount": 5000.00,
    "currency": "KES",
    "description": "Payment for services",
    "reference": "INV-2026-001"
  }'
```

## Step 6: Handle Errors Gracefully

The API returns standard HTTP status codes and detailed error messages.

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid access token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Response Format

```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "The source account has insufficient funds for this transaction",
    "details": {
      "accountId": "acc_1234567890",
      "availableBalance": 1000.00,
      "requestedAmount": 5000.00
    }
  },
  "requestId": "req_abc123",
  "timestamp": "2026-02-13T10:30:00Z"
}
```

## Next Steps

Now that you've made your first API call, explore these resources:

### 📚 Documentation
- **[Authentication Guide](authentication.md)** - OAuth 2.0 deep dive
- **[API Reference](api-reference/)** - Complete endpoint documentation
- **[Error Handling](guides/error-handling.md)** - Handle errors like a pro
- **[Webhooks](guides/webhooks.md)** - Real-time event notifications

### 💻 Code Examples
- **[JavaScript Examples](../examples/javascript/)** - Node.js and browser
- **[Python Examples](../examples/python/)** - Python 3.8+
- **[C# Examples](../examples/csharp/)** - .NET 8
- **[Java Examples](../examples/java/)** - Java 17+

### 🎓 Tutorials
- **[Building a Fintech App](tutorials/building-fintech-app.md)** - End-to-end guide
- **[Payment Integration](tutorials/payment-integration.md)** - Accept payments
- **[Risk Integration](tutorials/risk-integration.md)** - Fraud detection

### 🛠️ Tools
- **[Postman Collection](../postman/)** - Import and test APIs
- **[Sandbox Data](sandbox.md)** - Test accounts and scenarios
- **[API Status Page](https://status.wekeza.com)** - Monitor uptime

## Best Practices

### Security
✅ Store credentials securely (use environment variables)  
✅ Use HTTPS for all API calls  
✅ Rotate access tokens regularly  
✅ Implement proper error handling  
✅ Log API interactions for debugging  

### Performance
✅ Cache access tokens (they're valid for 1 hour)  
✅ Use pagination for large datasets  
✅ Implement retry logic with exponential backoff  
✅ Monitor your API usage and rate limits  

### Development
✅ Start with Sandbox environment  
✅ Use Idempotency-Key for payment requests  
✅ Test error scenarios  
✅ Validate user input before API calls  
✅ Keep your SDK/library up to date  

## Sandbox Test Data

The Sandbox environment includes pre-populated test data:

### Test Accounts
- **Account 1:** 1001234567 (Savings, Balance: 125,000 KES)
- **Account 2:** 1009876543 (Current, Balance: 450,000 KES)
- **Account 3:** 1001111111 (Savings, Balance: 10,000 KES) - Low balance
- **Account 4:** 1002222222 (Frozen Account) - For testing error scenarios

### Test Cards
- **Card 1:** 5123-4567-8901-2345 (Active Debit Card)
- **Card 2:** 4111-1111-1111-1111 (Active Credit Card)

### Test Transactions
Pre-populated transaction history for the past 90 days

See [Sandbox Documentation](sandbox.md) for complete test data.

## Support

Need help? We're here for you!

- **Developer Support:** developers@wekeza.com
- **Slack Community:** [wekeza-dev.slack.com](https://wekeza-dev.slack.com)
- **Stack Overflow:** Tag questions with `wekeza-api`
- **GitHub Issues:** [Report bugs and request features](https://github.com/eodenyire/WekezaOpenBanking/issues)

**Office Hours:**
- Tuesday: 2:00 PM - 4:00 PM EAT
- Thursday: 10:00 AM - 12:00 PM EAT

---

**Ready to build something amazing?** Check out our [Tutorials](tutorials/) for step-by-step project guides.
