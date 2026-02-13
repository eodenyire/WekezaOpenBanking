# Payments API Reference

The Payments API enables you to initiate and track payments, transfers, and other financial transactions.

## Base URL

**Sandbox:** `https://sandbox.wekeza.com/api/v1`  
**Production:** `https://api.wekeza.com/api/v1`

## Authentication

All endpoints require OAuth 2.0 authentication with the `payments.write` scope.

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Required Scopes:**
- `payments.write` - Initiate payments
- `accounts.read` - View payment accounts

---

## Endpoints

### Initiate Payment

Create a new payment or transfer.

```http
POST /api/v1/payments
```

#### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token |
| `Content-Type` | Yes | `application/json` |
| `Idempotency-Key` | Yes | Unique request identifier (UUID recommended) |

⚠️ **Idempotency Key:** Use a unique key for each payment request to prevent duplicate transactions.

#### Request Body

```json
{
  "sourceAccountId": "acc_1234567890",
  "destinationAccountNumber": "1009876543",
  "amount": 5000.00,
  "currency": "KES",
  "description": "Payment for services rendered",
  "reference": "INV-2026-001",
  "paymentMethod": "INTERNAL_TRANSFER",
  "metadata": {
    "invoiceId": "INV-001",
    "customerId": "CUST-456"
  }
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sourceAccountId` | string | Yes | Source account identifier |
| `destinationAccountNumber` | string | Yes | Destination account number |
| `amount` | decimal | Yes | Payment amount (positive number) |
| `currency` | string | Yes | ISO 4217 currency code (KES, USD, EUR) |
| `description` | string | Yes | Payment description (max 200 chars) |
| `reference` | string | Yes | Unique payment reference (max 50 chars) |
| `paymentMethod` | string | No | Payment method (default: INTERNAL_TRANSFER) |
| `scheduledDate` | string | No | Future payment date (ISO 8601) |
| `metadata` | object | No | Additional metadata |

#### Payment Methods

| Method | Description |
|--------|-------------|
| `INTERNAL_TRANSFER` | Transfer between Wekeza accounts |
| `MPESA` | M-Pesa payment |
| `RTGS` | Real-Time Gross Settlement |
| `EFT` | Electronic Funds Transfer |
| `SWIFT` | International wire transfer |

#### Request Example

```bash
curl -X POST https://api.wekeza.com/api/v1/payments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "sourceAccountId": "acc_1234567890",
    "destinationAccountNumber": "1009876543",
    "amount": 5000.00,
    "currency": "KES",
    "description": "Payment for services",
    "reference": "INV-2026-001",
    "paymentMethod": "INTERNAL_TRANSFER"
  }'
```

#### Response

```json
{
  "id": "pmt_abc123xyz",
  "status": "PENDING",
  "sourceAccount": {
    "accountId": "acc_1234567890",
    "accountNumber": "1001234567",
    "accountName": "John Doe Savings"
  },
  "destinationAccount": {
    "accountNumber": "1009876543",
    "accountName": "John Doe Current"
  },
  "amount": 5000.00,
  "currency": "KES",
  "description": "Payment for services",
  "reference": "INV-2026-001",
  "paymentMethod": "INTERNAL_TRANSFER",
  "createdAt": "2026-02-13T10:30:00Z",
  "updatedAt": "2026-02-13T10:30:00Z",
  "completedAt": null,
  "metadata": {
    "invoiceId": "INV-001",
    "customerId": "CUST-456"
  },
  "fees": {
    "amount": 0.00,
    "currency": "KES",
    "description": "Free internal transfer"
  },
  "riskScore": 0.15,
  "riskLevel": "LOW"
}
```

#### Response Codes

| Code | Description |
|------|-------------|
| 201 | Payment created successfully |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized |
| 403 | Forbidden - Insufficient permissions or funds |
| 409 | Conflict - Duplicate idempotency key |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

### Get Payment Status

Retrieve the current status of a payment.

```http
GET /api/v1/payments/{paymentId}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `paymentId` | string | Yes | Payment identifier (e.g., `pmt_abc123xyz`) |

#### Request Example

```bash
curl -X GET https://api.wekeza.com/api/v1/payments/pmt_abc123xyz \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Response

```json
{
  "id": "pmt_abc123xyz",
  "status": "COMPLETED",
  "sourceAccount": {
    "accountId": "acc_1234567890",
    "accountNumber": "1001234567",
    "accountName": "John Doe Savings"
  },
  "destinationAccount": {
    "accountNumber": "1009876543",
    "accountName": "John Doe Current"
  },
  "amount": 5000.00,
  "currency": "KES",
  "description": "Payment for services",
  "reference": "INV-2026-001",
  "paymentMethod": "INTERNAL_TRANSFER",
  "createdAt": "2026-02-13T10:30:00Z",
  "updatedAt": "2026-02-13T10:30:15Z",
  "completedAt": "2026-02-13T10:30:15Z",
  "statusHistory": [
    {
      "status": "PENDING",
      "timestamp": "2026-02-13T10:30:00Z",
      "description": "Payment initiated"
    },
    {
      "status": "PROCESSING",
      "timestamp": "2026-02-13T10:30:05Z",
      "description": "Payment being processed"
    },
    {
      "status": "COMPLETED",
      "timestamp": "2026-02-13T10:30:15Z",
      "description": "Payment completed successfully"
    }
  ],
  "metadata": {
    "invoiceId": "INV-001",
    "customerId": "CUST-456"
  },
  "fees": {
    "amount": 0.00,
    "currency": "KES",
    "description": "Free internal transfer"
  },
  "riskScore": 0.15,
  "riskLevel": "LOW",
  "fraudCheck": {
    "status": "PASSED",
    "score": 0.12,
    "timestamp": "2026-02-13T10:30:03Z"
  }
}
```

#### Payment Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Payment initiated, awaiting processing |
| `PROCESSING` | Payment being processed |
| `COMPLETED` | Payment successful |
| `FAILED` | Payment failed |
| `CANCELLED` | Payment cancelled |
| `REVERSED` | Payment reversed |

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Payment not found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

### List Payments

Retrieve a list of payments.

```http
GET /api/v1/payments
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountId` | string | No | Filter by source account |
| `status` | string | No | Filter by status |
| `fromDate` | string | No | Start date (ISO 8601) |
| `toDate` | string | No | End date (ISO 8601) |
| `page` | integer | No | Page number (default: 1) |
| `perPage` | integer | No | Results per page (default: 20, max: 100) |

#### Request Example

```bash
curl -X GET "https://api.wekeza.com/api/v1/payments?accountId=acc_1234567890&status=COMPLETED&page=1&perPage=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Response

```json
{
  "data": [
    {
      "id": "pmt_abc123xyz",
      "status": "COMPLETED",
      "amount": 5000.00,
      "currency": "KES",
      "description": "Payment for services",
      "reference": "INV-2026-001",
      "createdAt": "2026-02-13T10:30:00Z",
      "completedAt": "2026-02-13T10:30:15Z"
    },
    {
      "id": "pmt_def456uvw",
      "status": "COMPLETED",
      "amount": 10000.00,
      "currency": "KES",
      "description": "Invoice payment",
      "reference": "INV-2026-002",
      "createdAt": "2026-02-12T14:20:00Z",
      "completedAt": "2026-02-12T14:20:18Z"
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

---

### Cancel Payment

Cancel a pending or scheduled payment.

```http
POST /api/v1/payments/{paymentId}/cancel
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `paymentId` | string | Yes | Payment identifier |

#### Request Body

```json
{
  "reason": "Customer request",
  "metadata": {
    "cancelledBy": "user_123"
  }
}
```

#### Request Example

```bash
curl -X POST https://api.wekeza.com/api/v1/payments/pmt_abc123xyz/cancel \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Customer request"
  }'
```

#### Response

```json
{
  "id": "pmt_abc123xyz",
  "status": "CANCELLED",
  "cancelledAt": "2026-02-13T11:00:00Z",
  "cancelReason": "Customer request"
}
```

⚠️ **Note:** Only payments with status `PENDING` or `SCHEDULED` can be cancelled.

---

## M-Pesa Integration

### M-Pesa STK Push

Initiate M-Pesa payment via STK Push (Lipa Na M-Pesa).

```http
POST /api/v1/payments/mpesa/stkpush
```

#### Request Body

```json
{
  "phoneNumber": "+254712345678",
  "amount": 1000.00,
  "accountReference": "ACC-001",
  "transactionDesc": "Payment for goods"
}
```

#### Response

```json
{
  "id": "mpesa_abc123",
  "checkoutRequestId": "ws_CO_13022026103000",
  "merchantRequestId": "29115-34620561-1",
  "status": "PENDING",
  "phoneNumber": "+254712345678",
  "amount": 1000.00,
  "createdAt": "2026-02-13T10:30:00Z"
}
```

### Check M-Pesa Payment Status

```http
GET /api/v1/payments/mpesa/{checkoutRequestId}/status
```

---

## Bulk Payments

### Create Bulk Payment

Initiate multiple payments in a single batch.

```http
POST /api/v1/payments/bulk
```

#### Request Body

```json
{
  "sourceAccountId": "acc_1234567890",
  "payments": [
    {
      "destinationAccountNumber": "2001111111",
      "amount": 5000.00,
      "description": "Salary payment - John",
      "reference": "SAL-JAN-001"
    },
    {
      "destinationAccountNumber": "2002222222",
      "amount": 6000.00,
      "description": "Salary payment - Jane",
      "reference": "SAL-JAN-002"
    }
  ],
  "currency": "KES",
  "scheduledDate": "2026-02-28T00:00:00Z"
}
```

#### Response

```json
{
  "batchId": "batch_xyz789",
  "status": "PENDING",
  "totalPayments": 2,
  "totalAmount": 11000.00,
  "currency": "KES",
  "createdAt": "2026-02-13T10:30:00Z",
  "payments": [
    {
      "id": "pmt_bulk_001",
      "status": "PENDING",
      "amount": 5000.00,
      "reference": "SAL-JAN-001"
    },
    {
      "id": "pmt_bulk_002",
      "status": "PENDING",
      "amount": 6000.00,
      "reference": "SAL-JAN-002"
    }
  ]
}
```

---

## Error Handling

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INSUFFICIENT_FUNDS` | 403 | Source account has insufficient balance |
| `INVALID_ACCOUNT` | 400 | Invalid or non-existent account |
| `PAYMENT_LIMIT_EXCEEDED` | 403 | Payment exceeds daily/transaction limit |
| `DUPLICATE_PAYMENT` | 409 | Duplicate idempotency key |
| `ACCOUNT_FROZEN` | 403 | Source or destination account is frozen |
| `INVALID_AMOUNT` | 400 | Amount is zero, negative, or exceeds max |
| `FRAUD_DETECTED` | 403 | Payment flagged as potentially fraudulent |
| `PAYMENT_NOT_FOUND` | 404 | Payment ID not found |

### Error Response Example

```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "The source account has insufficient funds for this transaction",
    "details": {
      "accountId": "acc_1234567890",
      "availableBalance": 1000.00,
      "requestedAmount": 5000.00,
      "currency": "KES"
    }
  },
  "requestId": "req_abc123",
  "timestamp": "2026-02-13T10:30:00Z"
}
```

---

## Security & Fraud Prevention

### Risk Scoring

All payments are automatically scored for fraud risk:

- **LOW** (0.0 - 0.4): Processed immediately
- **MEDIUM** (0.4 - 0.7): Additional validation required
- **HIGH** (0.7 - 1.0): Requires manual review

### Strong Customer Authentication (SCA)

For high-value or high-risk payments, SCA may be required:

```json
{
  "error": {
    "code": "SCA_REQUIRED",
    "message": "Strong Customer Authentication required",
    "details": {
      "challengeUrl": "https://api.wekeza.com/auth/challenge/abc123"
    }
  }
}
```

### Payment Limits

| Account Type | Daily Limit | Single Transaction Limit |
|--------------|-------------|--------------------------|
| RETAIL | 500,000 KES | 100,000 KES |
| SME | 2,000,000 KES | 500,000 KES |
| CORPORATE | 10,000,000 KES | 2,000,000 KES |

---

## Best Practices

### Idempotency

✅ Always use unique Idempotency-Key for each payment  
✅ Use UUIDs or timestamp-based keys  
✅ Store keys to prevent retries with same key  

### Error Handling

✅ Implement retry logic with exponential backoff  
✅ Handle 409 Conflict (duplicate payment) gracefully  
✅ Check payment status after network failures  
✅ Log all payment attempts for reconciliation  

### User Experience

✅ Show payment status in real-time  
✅ Implement webhooks for status updates  
✅ Provide clear error messages to users  
✅ Allow users to track payment history  

### Security

✅ Validate account balances before initiating payments  
✅ Implement transaction limits  
✅ Log all payment attempts  
✅ Monitor for suspicious patterns  

---

## Code Examples

### JavaScript (Node.js)

```javascript
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class WekezaPaymentsAPI {
  constructor(accessToken) {
    this.client = axios.create({
      baseURL: 'https://api.wekeza.com/api/v1',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async initiatePayment(paymentData) {
    const idempotencyKey = uuidv4();
    
    try {
      const response = await this.client.post('/payments', paymentData, {
        headers: { 'Idempotency-Key': idempotencyKey }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('Duplicate payment detected');
      }
      throw error;
    }
  }

  async getPaymentStatus(paymentId) {
    const response = await this.client.get(`/payments/${paymentId}`);
    return response.data;
  }

  async cancelPayment(paymentId, reason) {
    const response = await this.client.post(`/payments/${paymentId}/cancel`, {
      reason
    });
    return response.data;
  }
}

// Usage
const api = new WekezaPaymentsAPI(accessToken);

const payment = await api.initiatePayment({
  sourceAccountId: 'acc_1234567890',
  destinationAccountNumber: '1009876543',
  amount: 5000.00,
  currency: 'KES',
  description: 'Payment for services',
  reference: 'INV-2026-001'
});

console.log(`Payment created: ${payment.id}`);

// Poll for status
const status = await api.getPaymentStatus(payment.id);
console.log(`Payment status: ${status.status}`);
```

### Python

```python
import requests
import uuid
from typing import Dict

class WekezaPaymentsAPI:
    def __init__(self, access_token: str):
        self.base_url = 'https://api.wekeza.com/api/v1'
        self.headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
    
    def initiate_payment(self, payment_data: Dict) -> Dict:
        idempotency_key = str(uuid.uuid4())
        headers = {**self.headers, 'Idempotency-Key': idempotency_key}
        
        response = requests.post(
            f'{self.base_url}/payments',
            json=payment_data,
            headers=headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_payment_status(self, payment_id: str) -> Dict:
        response = requests.get(
            f'{self.base_url}/payments/{payment_id}',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def cancel_payment(self, payment_id: str, reason: str) -> Dict:
        response = requests.post(
            f'{self.base_url}/payments/{payment_id}/cancel',
            json={'reason': reason},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Usage
api = WekezaPaymentsAPI(access_token)

payment = api.initiate_payment({
    'sourceAccountId': 'acc_1234567890',
    'destinationAccountNumber': '1009876543',
    'amount': 5000.00,
    'currency': 'KES',
    'description': 'Payment for services',
    'reference': 'INV-2026-001'
})

print(f"Payment created: {payment['id']}")

# Check status
status = api.get_payment_status(payment['id'])
print(f"Payment status: {status['status']}")
```

---

## Webhooks for Payment Events

Subscribe to payment events for real-time notifications:

- `payment.created`
- `payment.processing`
- `payment.completed`
- `payment.failed`
- `payment.cancelled`

See [Webhooks Guide](../guides/webhooks.md) for implementation details.

---

## Testing in Sandbox

### Test Scenarios

1. **Successful payment** - Use account `1001234567` with balance > payment amount
2. **Insufficient funds** - Use account `1001111111` (low balance)
3. **Frozen account** - Use account `1002222222`
4. **High-risk payment** - Amount > 100,000 KES triggers fraud check

### Test Accounts

| Account | Balance | Purpose |
|---------|---------|---------|
| 1001234567 | 125,000 KES | Successful payments |
| 1001111111 | 10,000 KES | Test insufficient funds |
| 1002222222 | 5,000 KES | Test frozen account |

---

## Related Resources

- **[Accounts API](accounts.md)** - Account information
- **[Webhooks Guide](../guides/webhooks.md)** - Real-time notifications
- **[Error Handling Guide](../guides/error-handling.md)** - Handle errors
- **[Authentication Guide](../authentication.md)** - OAuth 2.0

---

**Need Help?** Contact developers@wekeza.com or visit [Developer Community](https://wekeza-dev.slack.com).
