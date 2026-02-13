# Sandbox Environment Guide

The Wekeza Sandbox environment provides a complete testing environment with simulated accounts, transactions, and payment scenarios. Use this environment to develop and test your integration before going live.

## Overview

The Sandbox mirrors all production functionality without affecting real customer data or processing real money.

## Environment Details

| Detail | Value |
|--------|-------|
| **Base URL** | `https://sandbox.wekeza.com/api/v1` |
| **OAuth URL** | `https://sandbox.wekeza.com/oauth` |
| **Rate Limit** | 100 requests/minute |
| **Data Retention** | 30 days |
| **Reset Schedule** | Daily at 00:00 UTC |

## Getting Started

### 1. Sandbox Credentials

Use these test credentials for authentication:

**Test Application:**
- **Client ID:** `sandbox_client_123456`
- **Client Secret:** `sandbox_secret_abcdef123456`

**Test User (for Authorization Code Flow):**
- **Username:** `testuser@wekeza.com`
- **Password:** `Sandbox@2026`
- **OTP:** `123456` (for 2FA scenarios)

### 2. Obtain Access Token

```bash
curl -X POST https://sandbox.wekeza.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=sandbox_client_123456" \
  -d "client_secret=sandbox_secret_abcdef123456" \
  -d "scope=accounts.read transactions.read payments.write"
```

---

## Test Data

### Test Accounts

The Sandbox includes pre-populated test accounts:

#### Personal Accounts

| Account Number | Type | Customer | Balance | Status | Purpose |
|----------------|------|----------|---------|--------|---------|
| `1001234567` | SAVINGS | John Doe | 125,000 KES | ACTIVE | Standard testing |
| `1009876543` | CURRENT | John Doe | 450,000 KES | ACTIVE | High balance |
| `1001111111` | SAVINGS | Jane Smith | 10,000 KES | ACTIVE | Low balance scenarios |
| `1002222222` | CURRENT | Bob Wilson | 5,000 KES | FROZEN | Frozen account tests |
| `1003333333` | SAVINGS | Alice Brown | 0.00 KES | ACTIVE | Zero balance |
| `1004444444` | FIXED_DEPOSIT | Mary Johnson | 1,000,000 KES | ACTIVE | Fixed deposit |

#### Business Accounts

| Account Number | Type | Customer | Balance | Status | Purpose |
|----------------|------|----------|---------|--------|---------|
| `2001234567` | CURRENT | ABC Company Ltd | 5,000,000 KES | ACTIVE | Corporate testing |
| `2009876543` | CURRENT | XYZ Enterprises | 2,500,000 KES | ACTIVE | SME testing |
| `2001111111` | CURRENT | Test Corp | 100,000 KES | ACTIVE | Medium balance |

### Test Customer Data

#### John Doe (Personal Customer)
```json
{
  "customerId": "cust_john_doe",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+254712345678",
  "idNumber": "12345678",
  "segment": "RETAIL",
  "kycStatus": "VERIFIED",
  "accounts": ["1001234567", "1009876543"]
}
```

#### ABC Company Ltd (Business Customer)
```json
{
  "customerId": "cust_abc_company",
  "companyName": "ABC Company Ltd",
  "registrationNumber": "PVT-123456",
  "email": "finance@abccompany.com",
  "phone": "+254722334455",
  "segment": "SME",
  "kycStatus": "VERIFIED",
  "accounts": ["2001234567"]
}
```

### Test Cards

| Card Number | Type | Account | Status | Daily Limit | Purpose |
|-------------|------|---------|--------|-------------|---------|
| `5123-4567-8901-2345` | DEBIT | 1001234567 | ACTIVE | 50,000 KES | Standard testing |
| `4111-1111-1111-1111` | CREDIT | 1009876543 | ACTIVE | 100,000 KES | Credit card |
| `5123-0000-0000-0001` | DEBIT | 1001111111 | BLOCKED | - | Blocked card |
| `4111-0000-0000-0002` | CREDIT | 1002222222 | EXPIRED | - | Expired card |

**CVV:** All test cards use CVV `123`  
**Expiry:** `12/2028` (unless testing expired scenarios)

### Pre-loaded Transactions

Each test account includes 90 days of transaction history with various types:
- Salary deposits
- ATM withdrawals
- Internal transfers
- M-Pesa transactions
- Card purchases
- Bill payments

---

## Test Scenarios

### Scenario 1: Successful Payment

**Objective:** Test successful payment flow

```bash
# Step 1: Check source account balance
curl -X GET https://sandbox.wekeza.com/api/v1/accounts/acc_john_savings/balance \
  -H "Authorization: Bearer YOUR_TOKEN"

# Step 2: Initiate payment
curl -X POST https://sandbox.wekeza.com/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "sourceAccountId": "acc_john_savings",
    "destinationAccountNumber": "1009876543",
    "amount": 5000.00,
    "currency": "KES",
    "description": "Test payment",
    "reference": "TEST-001"
  }'

# Step 3: Check payment status
curl -X GET https://sandbox.wekeza.com/api/v1/payments/{payment_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:** Payment status changes from `PENDING` → `PROCESSING` → `COMPLETED`

---

### Scenario 2: Insufficient Funds

**Objective:** Test insufficient funds error handling

```bash
curl -X POST https://sandbox.wekeza.com/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "sourceAccountId": "acc_jane_savings",
    "destinationAccountNumber": "1009876543",
    "amount": 50000.00,
    "currency": "KES",
    "description": "Large payment test",
    "reference": "TEST-002"
  }'
```

**Expected Result:**
```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "The source account has insufficient funds",
    "details": {
      "accountId": "acc_jane_savings",
      "availableBalance": 10000.00,
      "requestedAmount": 50000.00
    }
  }
}
```

---

### Scenario 3: Frozen Account

**Objective:** Test frozen account error

```bash
curl -X POST https://sandbox.wekeza.com/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "sourceAccountId": "acc_bob_current",
    "destinationAccountNumber": "1009876543",
    "amount": 1000.00,
    "currency": "KES",
    "description": "Frozen account test",
    "reference": "TEST-003"
  }'
```

**Expected Result:**
```json
{
  "error": {
    "code": "ACCOUNT_FROZEN",
    "message": "The source account is frozen",
    "details": {
      "accountId": "acc_bob_current",
      "accountNumber": "1002222222",
      "status": "FROZEN"
    }
  }
}
```

---

### Scenario 4: High-Risk Payment

**Objective:** Test fraud detection

```bash
curl -X POST https://sandbox.wekeza.com/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "sourceAccountId": "acc_john_current",
    "destinationAccountNumber": "9999999999",
    "amount": 200000.00,
    "currency": "KES",
    "description": "Large unusual payment",
    "reference": "TEST-004"
  }'
```

**Expected Result:**
```json
{
  "id": "pmt_risk_test",
  "status": "PENDING_REVIEW",
  "riskScore": 0.85,
  "riskLevel": "HIGH",
  "message": "Payment requires manual review"
}
```

---

### Scenario 5: Idempotency Test

**Objective:** Test duplicate payment prevention

```bash
IDEMPOTENCY_KEY="test-duplicate-key-001"

# First request
curl -X POST https://sandbox.wekeza.com/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{"sourceAccountId": "acc_john_savings", "amount": 1000.00, ...}'

# Second request with same key
curl -X POST https://sandbox.wekeza.com/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{"sourceAccountId": "acc_john_savings", "amount": 1000.00, ...}'
```

**Expected Result:** Second request returns 409 Conflict with original payment details

---

### Scenario 6: Pagination Test

**Objective:** Test transaction history pagination

```bash
# Get first page
curl -X GET "https://sandbox.wekeza.com/api/v1/accounts/acc_john_savings/transactions?page=1&perPage=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get second page
curl -X GET "https://sandbox.wekeza.com/api/v1/accounts/acc_john_savings/transactions?page=2&perPage=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Scenario 7: M-Pesa Payment

**Objective:** Test M-Pesa integration

```bash
curl -X POST https://sandbox.wekeza.com/api/v1/payments/mpesa/stkpush \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678",
    "amount": 1000.00,
    "accountReference": "TEST-MPESA",
    "transactionDesc": "M-Pesa test payment"
  }'
```

**Expected Result:** STK push initiated, status can be checked via checkout request ID

---

## Simulating Scenarios

### Trigger Specific Responses

Use special values in requests to trigger specific responses:

#### Trigger Insufficient Funds
```json
{
  "amount": 999999999.00
}
```

#### Trigger Fraud Detection
```json
{
  "destinationAccountNumber": "9999999999",
  "amount": 200000.00
}
```

#### Trigger Processing Delay
```json
{
  "metadata": {
    "test_delay": 30
  }
}
```

#### Trigger Failure
```json
{
  "reference": "FAIL-TEST-001"
}
```

---

## Sandbox Limitations

### What Works Differently

| Feature | Sandbox Behavior | Production Behavior |
|---------|------------------|---------------------|
| **Processing Time** | Instant (< 1 second) | May take seconds/minutes |
| **Fraud Checks** | Simulated scores | Real-time analysis |
| **M-Pesa** | Simulated responses | Real M-Pesa API |
| **Email Notifications** | Not sent | Sent to customers |
| **SMS Notifications** | Not sent | Sent to customers |
| **Transaction Fees** | Always 0.00 | Real fees applied |
| **Data Persistence** | 30 days | Permanent |

### What Doesn't Work

❌ Real money transactions  
❌ Actual M-Pesa payments  
❌ Real email/SMS notifications  
❌ Integration with external banks  
❌ Real card processing  

---

## Data Reset & Refresh

### Automatic Reset

The Sandbox environment resets daily at **00:00 UTC**:
- All custom test data is cleared
- Default test accounts are restored
- Balances are reset to default values
- Transaction history is regenerated

### Manual Reset

You can request a manual reset via the Developer Portal or API:

```bash
POST /api/v1/sandbox/reset
Authorization: Bearer YOUR_TOKEN
```

---

## Sandbox-Specific Endpoints

### Create Test Account

```bash
POST /api/v1/sandbox/accounts
```

```json
{
  "accountType": "SAVINGS",
  "currency": "KES",
  "initialBalance": 50000.00,
  "customerName": "Test Customer"
}
```

### Generate Test Transactions

```bash
POST /api/v1/sandbox/transactions/generate
```

```json
{
  "accountId": "acc_test_001",
  "transactionCount": 50,
  "dateRange": {
    "from": "2026-01-01",
    "to": "2026-02-13"
  }
}
```

### Simulate Payment Status Change

```bash
POST /api/v1/sandbox/payments/{paymentId}/simulate
```

```json
{
  "newStatus": "COMPLETED"
}
```

---

## Best Practices

### Testing Strategy

✅ **Test Happy Path First** - Ensure basic flows work  
✅ **Test Edge Cases** - Insufficient funds, frozen accounts  
✅ **Test Error Handling** - Network failures, timeouts  
✅ **Test Idempotency** - Retry scenarios  
✅ **Test Pagination** - Large data sets  
✅ **Load Testing** - Use sandbox for performance tests  

### Development Workflow

1. **Develop locally** with Sandbox
2. **Run integration tests** against Sandbox
3. **UAT testing** in Sandbox
4. **Request production access** after successful testing
5. **Gradual rollout** in production

### Monitoring

✅ Track API response times  
✅ Monitor error rates  
✅ Log all requests for debugging  
✅ Set up alerts for failures  

---

## Moving to Production

### Checklist

- [ ] All test scenarios pass in Sandbox
- [ ] Error handling implemented
- [ ] Idempotency implemented
- [ ] Rate limiting handled
- [ ] Security review completed
- [ ] Load testing completed
- [ ] Monitoring set up
- [ ] Production credentials obtained
- [ ] Production URLs updated

### Production Approval

To move to production:

1. **Submit Application** via Developer Portal
2. **Security Review** - Your app will be reviewed
3. **Approval** - Typically 3-5 business days
4. **Production Credentials** - Issued after approval
5. **Go Live** - Switch to production URLs

---

## Support

### Sandbox Issues

For Sandbox-specific issues:
- **Email:** sandbox@wekeza.com
- **Slack:** #sandbox-support channel
- **Response Time:** 24 hours

### General Support

- **Email:** developers@wekeza.com
- **Slack:** [wekeza-dev.slack.com](https://wekeza-dev.slack.com)
- **Office Hours:** Tue/Thu 2-4 PM EAT

---

## Tools & Resources

### Postman Collection

Import our complete Sandbox collection:
```
https://sandbox.wekeza.com/postman/collection.json
```

### Swagger/OpenAPI

Interactive API documentation:
```
https://sandbox.wekeza.com/swagger
```

### SDK Downloads

- **JavaScript:** `npm install @wekeza/sdk`
- **Python:** `pip install wekeza-sdk`
- **C#:** `Install-Package Wekeza.SDK`
- **Java:** Coming soon

---

## Frequently Asked Questions

**Q: How long is data retained in Sandbox?**  
A: 30 days, with daily reset at 00:00 UTC.

**Q: Can I create custom test data?**  
A: Yes, use the Sandbox-specific endpoints to create accounts and transactions.

**Q: Are there rate limits in Sandbox?**  
A: Yes, 100 requests/minute (lower than production).

**Q: Can I share Sandbox credentials?**  
A: Yes, but we recommend separate credentials per developer.

**Q: How do I test webhooks in Sandbox?**  
A: Use a service like ngrok or webhook.site to receive webhooks locally.

---

**Ready to test?** [Get your Sandbox credentials](https://developers.wekeza.com/sandbox) and start building!
