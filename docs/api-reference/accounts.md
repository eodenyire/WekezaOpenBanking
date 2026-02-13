# Accounts API Reference

The Accounts API allows you to retrieve customer account information, balances, and transaction history.

## Base URL

**Sandbox:** `https://sandbox.wekeza.com/api/v1`  
**Production:** `https://api.wekeza.com/api/v1`

## Authentication

All endpoints require OAuth 2.0 authentication. Include the access token in the Authorization header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Required Scope:** `accounts.read`

---

## Endpoints

### List Accounts

Retrieve all accounts accessible to the authenticated user or application.

```http
GET /api/v1/accounts
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `perPage` | integer | No | Results per page (default: 20, max: 100) |
| `accountType` | string | No | Filter by type: `SAVINGS`, `CURRENT`, `FIXED_DEPOSIT` |
| `currency` | string | No | Filter by currency: `KES`, `USD`, `EUR` |
| `status` | string | No | Filter by status: `ACTIVE`, `FROZEN`, `CLOSED` |

#### Request Example

```bash
curl -X GET "https://api.wekeza.com/api/v1/accounts?page=1&perPage=20&accountType=SAVINGS" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Response

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
        "currency": "KES",
        "lastUpdated": "2026-02-13T10:30:00Z"
      },
      "status": "ACTIVE",
      "openedDate": "2025-01-15T10:30:00Z",
      "branch": {
        "code": "001",
        "name": "Nairobi Central"
      },
      "customer": {
        "id": "cust_789",
        "name": "John Doe",
        "segment": "RETAIL"
      }
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
        "currency": "KES",
        "lastUpdated": "2026-02-13T10:30:00Z"
      },
      "status": "ACTIVE",
      "openedDate": "2024-06-20T14:15:00Z",
      "branch": {
        "code": "001",
        "name": "Nairobi Central"
      },
      "customer": {
        "id": "cust_789",
        "name": "John Doe",
        "segment": "RETAIL"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "totalPages": 1,
    "totalRecords": 2,
    "hasNext": false,
    "hasPrevious": false
  },
  "links": {
    "self": "/api/v1/accounts?page=1&perPage=20",
    "first": "/api/v1/accounts?page=1&perPage=20",
    "last": "/api/v1/accounts?page=1&perPage=20"
  }
}
```

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

### Get Account by ID

Retrieve detailed information about a specific account.

```http
GET /api/v1/accounts/{accountId}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountId` | string | Yes | Account identifier (e.g., `acc_1234567890`) |

#### Request Example

```bash
curl -X GET https://api.wekeza.com/api/v1/accounts/acc_1234567890 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Response

```json
{
  "id": "acc_1234567890",
  "accountNumber": "1001234567",
  "accountName": "John Doe Savings",
  "accountType": "SAVINGS",
  "currency": "KES",
  "balance": {
    "available": 125000.00,
    "current": 125000.00,
    "pending": 0.00,
    "currency": "KES",
    "lastUpdated": "2026-02-13T10:30:00Z"
  },
  "status": "ACTIVE",
  "openedDate": "2025-01-15T10:30:00Z",
  "closedDate": null,
  "branch": {
    "code": "001",
    "name": "Nairobi Central",
    "address": "Kenyatta Avenue, Nairobi"
  },
  "customer": {
    "id": "cust_789",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+254712345678",
    "segment": "RETAIL"
  },
  "overdraft": {
    "enabled": false,
    "limit": 0.00,
    "utilized": 0.00
  },
  "interestRate": 4.5,
  "minimumBalance": 1000.00,
  "metadata": {
    "kycStatus": "VERIFIED",
    "riskRating": "LOW",
    "lastActivityDate": "2026-02-12T18:30:00Z"
  }
}
```

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Account not found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

### Get Account Balance

Retrieve the current balance for a specific account.

```http
GET /api/v1/accounts/{accountId}/balance
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountId` | string | Yes | Account identifier |

#### Request Example

```bash
curl -X GET https://api.wekeza.com/api/v1/accounts/acc_1234567890/balance \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Response

```json
{
  "accountId": "acc_1234567890",
  "accountNumber": "1001234567",
  "balance": {
    "available": 125000.00,
    "current": 125000.00,
    "pending": 0.00,
    "currency": "KES",
    "lastUpdated": "2026-02-13T10:30:00Z"
  },
  "overdraft": {
    "enabled": false,
    "limit": 0.00,
    "utilized": 0.00,
    "available": 0.00
  },
  "holds": [],
  "effectiveBalance": 125000.00
}
```

#### Balance Components

- **available:** Amount available for withdrawal/transfer
- **current:** Current ledger balance
- **pending:** Transactions being processed
- **effectiveBalance:** Available + Overdraft available

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Account not found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

### Get Account Transactions

Retrieve transaction history for a specific account.

```http
GET /api/v1/accounts/{accountId}/transactions
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountId` | string | Yes | Account identifier |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromDate` | string | No | Start date (ISO 8601: `2026-01-01`) |
| `toDate` | string | No | End date (ISO 8601: `2026-02-13`) |
| `page` | integer | No | Page number (default: 1) |
| `perPage` | integer | No | Results per page (default: 50, max: 100) |
| `type` | string | No | Filter by type: `CREDIT`, `DEBIT` |
| `minAmount` | decimal | No | Minimum transaction amount |
| `maxAmount` | decimal | No | Maximum transaction amount |
| `search` | string | No | Search in description/reference |

#### Request Example

```bash
curl -X GET "https://api.wekeza.com/api/v1/accounts/acc_1234567890/transactions?fromDate=2026-01-01&toDate=2026-02-13&page=1&perPage=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Response

```json
{
  "accountId": "acc_1234567890",
  "accountNumber": "1001234567",
  "data": [
    {
      "id": "txn_abc123",
      "transactionDate": "2026-02-12T14:30:00Z",
      "valueDate": "2026-02-12",
      "type": "CREDIT",
      "amount": 50000.00,
      "currency": "KES",
      "description": "Salary Payment",
      "reference": "SAL-FEB-2026",
      "channel": "DIRECT_CREDIT",
      "balanceAfter": 125000.00,
      "counterparty": {
        "name": "ABC Company Ltd",
        "accountNumber": "2001234567"
      },
      "status": "COMPLETED",
      "metadata": {
        "riskScore": 0.1,
        "riskLevel": "LOW"
      }
    },
    {
      "id": "txn_def456",
      "transactionDate": "2026-02-10T09:15:00Z",
      "valueDate": "2026-02-10",
      "type": "DEBIT",
      "amount": 5000.00,
      "currency": "KES",
      "description": "ATM Withdrawal",
      "reference": "ATM-001-02102026",
      "channel": "ATM",
      "balanceAfter": 75000.00,
      "counterparty": null,
      "status": "COMPLETED",
      "location": {
        "atmId": "ATM-001",
        "address": "Westlands, Nairobi"
      },
      "metadata": {
        "riskScore": 0.2,
        "riskLevel": "LOW"
      }
    },
    {
      "id": "txn_ghi789",
      "transactionDate": "2026-02-08T16:45:00Z",
      "valueDate": "2026-02-08",
      "type": "DEBIT",
      "amount": 15000.00,
      "currency": "KES",
      "description": "Transfer to John's Current Account",
      "reference": "TRF-08022026-001",
      "channel": "MOBILE_APP",
      "balanceAfter": 80000.00,
      "counterparty": {
        "name": "John Doe Current",
        "accountNumber": "1009876543"
      },
      "status": "COMPLETED",
      "metadata": {
        "riskScore": 0.15,
        "riskLevel": "LOW"
      }
    }
  ],
  "summary": {
    "totalTransactions": 45,
    "totalCredits": 150000.00,
    "totalDebits": 75000.00,
    "netAmount": 75000.00
  },
  "pagination": {
    "page": 1,
    "perPage": 50,
    "totalPages": 1,
    "totalRecords": 45,
    "hasNext": false,
    "hasPrevious": false
  },
  "links": {
    "self": "/api/v1/accounts/acc_1234567890/transactions?page=1",
    "first": "/api/v1/accounts/acc_1234567890/transactions?page=1",
    "last": "/api/v1/accounts/acc_1234567890/transactions?page=1"
  }
}
```

#### Transaction Types

| Type | Description |
|------|-------------|
| `CREDIT` | Money received |
| `DEBIT` | Money sent/withdrawn |

#### Transaction Channels

| Channel | Description |
|---------|-------------|
| `BRANCH` | Branch transaction |
| `ATM` | ATM withdrawal/deposit |
| `MOBILE_APP` | Mobile banking |
| `INTERNET_BANKING` | Web banking |
| `DIRECT_CREDIT` | Direct credit (salary, etc.) |
| `DIRECT_DEBIT` | Direct debit (bills, etc.) |
| `POS` | Point of sale |
| `MPESA` | M-Pesa integration |

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid date range |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Account not found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Data Models

### Account Object

```typescript
{
  id: string;                    // Unique account identifier
  accountNumber: string;         // Account number
  accountName: string;           // Account display name
  accountType: string;           // SAVINGS | CURRENT | FIXED_DEPOSIT
  currency: string;              // ISO 4217 currency code
  balance: Balance;              // Balance information
  status: string;                // ACTIVE | FROZEN | CLOSED
  openedDate: string;            // ISO 8601 datetime
  closedDate?: string;           // ISO 8601 datetime (if closed)
  branch: Branch;                // Branch information
  customer: Customer;            // Customer information
  overdraft?: Overdraft;         // Overdraft facility
  interestRate?: number;         // Annual interest rate
  minimumBalance?: number;       // Minimum balance requirement
  metadata?: object;             // Additional metadata
}
```

### Balance Object

```typescript
{
  available: number;             // Available for withdrawal
  current: number;               // Current ledger balance
  pending: number;               // Pending transactions
  currency: string;              // Currency code
  lastUpdated: string;           // ISO 8601 datetime
}
```

### Transaction Object

```typescript
{
  id: string;                    // Transaction identifier
  transactionDate: string;       // ISO 8601 datetime
  valueDate: string;             // Date funds are available
  type: string;                  // CREDIT | DEBIT
  amount: number;                // Transaction amount
  currency: string;              // Currency code
  description: string;           // Transaction description
  reference: string;             // Transaction reference
  channel: string;               // Transaction channel
  balanceAfter: number;          // Balance after transaction
  counterparty?: Counterparty;   // Other party in transaction
  status: string;                // PENDING | COMPLETED | FAILED
  location?: Location;           // Location info (for ATM, POS)
  metadata?: object;             // Additional metadata
}
```

---

## Rate Limiting

**Rate Limit:** 1000 requests per minute per client

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1708704000
```

When rate limit is exceeded:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please retry after 60 seconds.",
    "retryAfter": 60
  }
}
```

---

## Error Responses

### Error Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  },
  "requestId": "req_abc123",
  "timestamp": "2026-02-13T10:30:00Z"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `ACCOUNT_NOT_FOUND` | 404 | Account does not exist |
| `ACCOUNT_FROZEN` | 403 | Account is frozen |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Best Practices

### Caching

✅ Cache account balances for up to 30 seconds  
✅ Cache transaction history for up to 5 minutes  
✅ Use ETags for conditional requests  

### Pagination

✅ Use reasonable page sizes (50-100 transactions)  
✅ Implement "load more" instead of loading all data  
✅ Cache paginated results  

### Error Handling

✅ Implement exponential backoff for retries  
✅ Handle rate limits gracefully  
✅ Log errors for debugging  
✅ Show user-friendly error messages  

### Security

✅ Never log full account numbers  
✅ Mask sensitive data in UI  
✅ Use HTTPS for all requests  
✅ Validate access tokens before use  

---

## Code Examples

### JavaScript (Node.js)

```javascript
const axios = require('axios');

class WekezaAccountsAPI {
  constructor(accessToken) {
    this.client = axios.create({
      baseURL: 'https://api.wekeza.com/api/v1',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getAccounts(filters = {}) {
    const response = await this.client.get('/accounts', { params: filters });
    return response.data;
  }

  async getAccount(accountId) {
    const response = await this.client.get(`/accounts/${accountId}`);
    return response.data;
  }

  async getBalance(accountId) {
    const response = await this.client.get(`/accounts/${accountId}/balance`);
    return response.data;
  }

  async getTransactions(accountId, filters = {}) {
    const response = await this.client.get(`/accounts/${accountId}/transactions`, {
      params: filters
    });
    return response.data;
  }
}

// Usage
const api = new WekezaAccountsAPI(accessToken);
const accounts = await api.getAccounts({ accountType: 'SAVINGS' });
const balance = await api.getBalance('acc_1234567890');
const transactions = await api.getTransactions('acc_1234567890', {
  fromDate: '2026-01-01',
  toDate: '2026-02-13',
  perPage: 50
});
```

### Python

```python
import requests
from typing import Dict, Optional

class WekezaAccountsAPI:
    def __init__(self, access_token: str, base_url: str = 'https://api.wekeza.com/api/v1'):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
    
    def get_accounts(self, filters: Optional[Dict] = None) -> Dict:
        response = requests.get(
            f'{self.base_url}/accounts',
            headers=self.headers,
            params=filters or {}
        )
        response.raise_for_status()
        return response.json()
    
    def get_account(self, account_id: str) -> Dict:
        response = requests.get(
            f'{self.base_url}/accounts/{account_id}',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_balance(self, account_id: str) -> Dict:
        response = requests.get(
            f'{self.base_url}/accounts/{account_id}/balance',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_transactions(self, account_id: str, filters: Optional[Dict] = None) -> Dict:
        response = requests.get(
            f'{self.base_url}/accounts/{account_id}/transactions',
            headers=self.headers,
            params=filters or {}
        )
        response.raise_for_status()
        return response.json()

# Usage
api = WekezaAccountsAPI(access_token)
accounts = api.get_accounts({'accountType': 'SAVINGS'})
balance = api.get_balance('acc_1234567890')
transactions = api.get_transactions('acc_1234567890', {
    'fromDate': '2026-01-01',
    'toDate': '2026-02-13',
    'perPage': 50
})
```

---

## Testing in Sandbox

### Test Accounts

| Account Number | Type | Balance | Status |
|----------------|------|---------|--------|
| 1001234567 | SAVINGS | 125,000 KES | ACTIVE |
| 1009876543 | CURRENT | 450,000 KES | ACTIVE |
| 1001111111 | SAVINGS | 10,000 KES | ACTIVE |
| 1002222222 | CURRENT | 5,000 KES | FROZEN |

### Test Scenarios

1. **Successful retrieval** - Use account `1001234567`
2. **Low balance** - Use account `1001111111`
3. **Frozen account** - Use account `1002222222`
4. **Non-existent account** - Use account `9999999999`

---

## Related Resources

- **[Payments API](payments.md)** - Initiate payments
- **[Customers API](customers.md)** - Customer information
- **[Webhooks Guide](../guides/webhooks.md)** - Real-time notifications
- **[Authentication Guide](../authentication.md)** - OAuth 2.0 setup

---

**Need Help?** Contact developers@wekeza.com or visit [Developer Community](https://wekeza-dev.slack.com).
