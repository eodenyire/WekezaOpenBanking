# Wekeza Core Banking System

The Wekeza Core Banking System is the foundation of our banking infrastructure, built with .NET 8 using Domain-Driven Design (DDD) and Clean Architecture principles.

## Overview

The Core Banking System manages:
- Customer accounts (Savings, Current, Fixed Deposits)
- Transactions (Deposits, Withdrawals, Transfers)
- Loans (Applications, Approvals, Disbursements, Repayments)
- Cards (Debit/Credit card issuance and management)
- M-Pesa Integration
- Audit trails and compliance

## Architecture

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | .NET 8 (C#) |
| **Database** | PostgreSQL 15+ |
| **ORM** | Entity Framework Core |
| **CQRS** | MediatR |
| **Validation** | FluentValidation |
| **API** | ASP.NET Core Web API |
| **Authentication** | JWT + IdentityServer |
| **Background Jobs** | Hangfire |
| **Caching** | Redis |

### Architecture Layers

```
┌─────────────────────────────────────────┐
│         API Layer (REST APIs)           │
│    Controllers, Middleware, Filters     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Application Layer (Use Cases)      │
│   Commands, Queries, Handlers, DTOs    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Domain Layer (Business Logic)      │
│  Entities, Aggregates, Value Objects   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    Infrastructure Layer (Data Access)   │
│  Repositories, DbContext, External APIs │
└─────────────────────────────────────────┘
```

## API Domains

### 1. Account Management

#### Open New Account

```http
POST /api/accounts/open
```

**Request:**
```json
{
  "customerId": "cust_123",
  "accountType": "SAVINGS",
  "currency": "KES",
  "initialDeposit": 5000.00,
  "branch": "001"
}
```

**Response:**
```json
{
  "accountId": "acc_1234567890",
  "accountNumber": "1001234567",
  "accountType": "SAVINGS",
  "currency": "KES",
  "balance": 5000.00,
  "status": "ACTIVE",
  "openedDate": "2026-02-13T10:30:00Z"
}
```

#### Freeze/Unfreeze Account

```http
POST /api/accounts/{accountId}/freeze
POST /api/accounts/{accountId}/unfreeze
```

#### Close Account

```http
POST /api/accounts/{accountId}/close
```

**Request:**
```json
{
  "reason": "Customer request",
  "transferBalanceTo": "1009876543"
}
```

---

### 2. Transaction Processing

#### Deposit

```http
POST /api/transactions/deposit
```

**Request:**
```json
{
  "accountId": "acc_1234567890",
  "amount": 10000.00,
  "currency": "KES",
  "description": "Cash deposit",
  "reference": "DEP-001",
  "channel": "BRANCH",
  "metadata": {
    "tellerId": "teller_001",
    "branchCode": "001"
  }
}
```

**Response:**
```json
{
  "transactionId": "txn_abc123",
  "status": "COMPLETED",
  "accountId": "acc_1234567890",
  "amount": 10000.00,
  "balanceAfter": 135000.00,
  "transactionDate": "2026-02-13T10:30:00Z"
}
```

#### Withdrawal

```http
POST /api/transactions/withdraw
```

**Request:**
```json
{
  "accountId": "acc_1234567890",
  "amount": 5000.00,
  "currency": "KES",
  "description": "Cash withdrawal",
  "reference": "WDL-001",
  "channel": "ATM"
}
```

#### Internal Transfer

```http
POST /api/transactions/transfer
```

**Request:**
```json
{
  "sourceAccountId": "acc_1234567890",
  "destinationAccountId": "acc_9876543210",
  "amount": 5000.00,
  "currency": "KES",
  "description": "Transfer between accounts",
  "reference": "TRF-001"
}
```

#### Get Statement

```http
GET /api/transactions/statement
```

**Query Parameters:**
- `accountId` - Account identifier
- `fromDate` - Start date (ISO 8601)
- `toDate` - End date (ISO 8601)
- `format` - Response format: `json`, `pdf`, `csv`

---

### 3. Loan Management

#### Apply for Loan

```http
POST /api/loans/apply
```

**Request:**
```json
{
  "customerId": "cust_123",
  "loanType": "PERSONAL",
  "amount": 100000.00,
  "currency": "KES",
  "term": 12,
  "purpose": "Business expansion",
  "collateral": {
    "type": "PROPERTY",
    "value": 500000.00,
    "description": "Land title deed"
  }
}
```

**Response:**
```json
{
  "loanApplicationId": "loan_app_001",
  "status": "PENDING_REVIEW",
  "amount": 100000.00,
  "term": 12,
  "interestRate": 14.5,
  "monthlyPayment": 9012.50,
  "appliedDate": "2026-02-13T10:30:00Z"
}
```

#### Approve Loan (Loan Officer)

```http
POST /api/loans/{loanId}/approve
```

**Request:**
```json
{
  "approvedAmount": 100000.00,
  "interestRate": 14.5,
  "term": 12,
  "notes": "Approved based on credit score and collateral"
}
```

#### Disburse Loan

```http
POST /api/loans/{loanId}/disburse
```

**Request:**
```json
{
  "disbursementAccountId": "acc_1234567890",
  "disbursementDate": "2026-02-15T00:00:00Z"
}
```

#### Make Repayment

```http
POST /api/loans/{loanId}/repay
```

**Request:**
```json
{
  "amount": 9012.50,
  "paymentAccountId": "acc_1234567890",
  "reference": "LOAN-REP-001"
}
```

#### Get Loan Schedule

```http
GET /api/loans/{loanId}/schedule
```

**Response:**
```json
{
  "loanId": "loan_001",
  "principal": 100000.00,
  "interestRate": 14.5,
  "term": 12,
  "monthlyPayment": 9012.50,
  "schedule": [
    {
      "installmentNumber": 1,
      "dueDate": "2026-03-15",
      "principal": 7804.17,
      "interest": 1208.33,
      "totalPayment": 9012.50,
      "outstandingBalance": 92195.83,
      "status": "PENDING"
    },
    // ... more installments
  ]
}
```

---

### 4. Card Management

#### Issue Card

```http
POST /api/cards/issue
```

**Request:**
```json
{
  "accountId": "acc_1234567890",
  "cardType": "DEBIT",
  "cardBrand": "VISA",
  "dailyLimit": 50000.00,
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Nairobi",
    "country": "Kenya"
  }
}
```

**Response:**
```json
{
  "cardId": "card_001",
  "cardNumber": "5123********2345",
  "cardType": "DEBIT",
  "status": "PENDING_ACTIVATION",
  "expiryDate": "2028-12-31",
  "dailyLimit": 50000.00,
  "issuedDate": "2026-02-13T10:30:00Z"
}
```

#### Activate Card

```http
POST /api/cards/{cardId}/activate
```

#### Block/Unblock Card

```http
POST /api/cards/{cardId}/block
POST /api/cards/{cardId}/unblock
```

#### Cancel Card

```http
POST /api/cards/{cardId}/cancel
```

#### Process ATM Withdrawal

```http
POST /api/cards/{cardId}/withdraw
```

**Request:**
```json
{
  "amount": 5000.00,
  "atmId": "ATM-001",
  "location": "Westlands, Nairobi"
}
```

---

### 5. M-Pesa Integration

#### STK Push (Lipa Na M-Pesa)

```http
POST /api/mpesa/stkpush
```

**Request:**
```json
{
  "phoneNumber": "+254712345678",
  "amount": 1000.00,
  "accountReference": "ACC-001",
  "transactionDesc": "Payment for goods"
}
```

**Response:**
```json
{
  "checkoutRequestId": "ws_CO_13022026103000",
  "merchantRequestId": "29115-34620561-1",
  "responseCode": "0",
  "responseDescription": "Success. Request accepted for processing",
  "customerMessage": "Enter M-Pesa PIN to complete payment"
}
```

#### M-Pesa Callback

```http
POST /api/mpesa/callback
```

Wekeza automatically processes M-Pesa callbacks and posts transactions to customer accounts.

#### Check M-Pesa Status

```http
GET /api/mpesa/status/{checkoutRequestId}
```

---

## Security & Compliance

### Authentication

All endpoints require JWT authentication:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Customer** | View own accounts, make transactions |
| **Teller** | Process deposits/withdrawals for customers |
| **LoanOfficer** | Approve and disburse loans |
| **RiskOfficer** | Freeze/unfreeze accounts, verify businesses |
| **Administrator** | Full system access |
| **SystemService** | Automated processes, integrations |

### Audit Trails

All operations are logged for compliance:
- Who performed the action
- What action was performed
- When it was performed
- IP address and user agent
- Before/after state

### AML/KYC Workflows

- Customer verification required for account opening
- Transaction monitoring for suspicious activity
- Automated flagging of high-risk transactions
- Integration with compliance systems

---

## Performance & Scalability

### Optimizations

- **Database Indexing** - Optimized indexes on account numbers, customer IDs
- **Caching** - Redis caching for frequently accessed data
- **Connection Pooling** - Efficient database connection management
- **Async Processing** - Background jobs for non-critical operations
- **Load Balancing** - Horizontal scaling with multiple instances

### Performance Metrics

- **Transaction Processing:** < 100ms (p95)
- **Account Balance Query:** < 50ms (p95)
- **Loan Calculation:** < 200ms (p95)
- **Throughput:** 1000+ TPS (Transactions Per Second)

---

## Integration Points

### Internal Integrations

| System | Integration Type | Purpose |
|--------|------------------|---------|
| **Risk Management** | REST API | Transaction risk scoring |
| **CRM** | Events (Kafka) | Customer interaction tracking |
| **Open Banking API** | Internal APIs | Expose banking capabilities |
| **Fraud Detection** | REST API | Real-time fraud checks |
| **Notification Service** | Events | Customer alerts (SMS, Email) |

### External Integrations

| System | Integration Type | Purpose |
|--------|------------------|---------|
| **M-Pesa** | REST API | Mobile money integration |
| **SWIFT Network** | ISO 20022 | International transfers |
| **Credit Bureau** | REST API | Credit score checks |
| **KRA (Tax Authority)** | REST API | Tax validation |
| **Payment Switch** | ISO 8583 | Card transactions |

---

## Data Models

### Account Entity

```csharp
public class Account
{
    public Guid Id { get; set; }
    public string AccountNumber { get; set; }
    public string AccountName { get; set; }
    public AccountType AccountType { get; set; }
    public string Currency { get; set; }
    public decimal Balance { get; set; }
    public AccountStatus Status { get; set; }
    public DateTime OpenedDate { get; set; }
    public DateTime? ClosedDate { get; set; }
    public Guid CustomerId { get; set; }
    public string BranchCode { get; set; }
    
    // Navigation properties
    public Customer Customer { get; set; }
    public ICollection<Transaction> Transactions { get; set; }
}
```

### Transaction Entity

```csharp
public class Transaction
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; }
    public string Description { get; set; }
    public string Reference { get; set; }
    public TransactionChannel Channel { get; set; }
    public decimal BalanceAfter { get; set; }
    public TransactionStatus Status { get; set; }
    public DateTime TransactionDate { get; set; }
    public DateTime ValueDate { get; set; }
    
    // Navigation properties
    public Account Account { get; set; }
}
```

### Loan Entity

```csharp
public class Loan
{
    public Guid Id { get; set; }
    public string LoanNumber { get; set; }
    public Guid CustomerId { get; set; }
    public LoanType LoanType { get; set; }
    public decimal Principal { get; set; }
    public decimal InterestRate { get; set; }
    public int TermMonths { get; set; }
    public decimal MonthlyPayment { get; set; }
    public LoanStatus Status { get; set; }
    public DateTime ApplicationDate { get; set; }
    public DateTime? ApprovalDate { get; set; }
    public DateTime? DisbursementDate { get; set; }
    public decimal OutstandingBalance { get; set; }
    
    // Navigation properties
    public Customer Customer { get; set; }
    public ICollection<LoanRepayment> Repayments { get; set; }
}
```

---

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `ACCOUNT_NOT_FOUND` | Account does not exist | 404 |
| `INSUFFICIENT_FUNDS` | Account balance too low | 400 |
| `ACCOUNT_FROZEN` | Account is frozen | 403 |
| `DAILY_LIMIT_EXCEEDED` | Transaction exceeds daily limit | 403 |
| `INVALID_AMOUNT` | Amount is invalid (negative, zero) | 400 |
| `DUPLICATE_TRANSACTION` | Duplicate transaction reference | 409 |
| `LOAN_NOT_ELIGIBLE` | Customer not eligible for loan | 403 |
| `CARD_BLOCKED` | Card is blocked | 403 |

---

## Development Setup

### Prerequisites

- .NET 8 SDK
- PostgreSQL 15+
- Redis (optional, for caching)
- Visual Studio 2022 or VS Code

### Quick Start

```bash
# Clone repository
git clone https://github.com/eodenyire/Wekeza.git
cd Wekeza

# Restore packages
dotnet restore

# Update connection string in appsettings.json
# Run migrations
dotnet ef database update --project Core/Wekeza.Core.Infrastructure

# Run application
dotnet run --project Core/Wekeza.Core.Api

# Access Swagger
https://localhost:5001/swagger
```

---

## Testing

### Unit Tests

```bash
dotnet test Tests/Wekeza.Core.UnitTests
```

### Integration Tests

```bash
dotnet test Tests/Wekeza.Core.IntegrationTests
```

### Load Testing

```bash
# Using Apache Bench
ab -n 10000 -c 100 https://localhost:5001/api/accounts

# Using k6
k6 run load-tests/accounts-test.js
```

---

## Monitoring & Observability

### Metrics

- Transaction volume and success rate
- API response times (p50, p95, p99)
- Database query performance
- Error rates by endpoint
- Active user sessions

### Logging

- Application logs (Information, Warning, Error)
- Audit logs (all operations)
- Performance logs
- Security events

### Alerting

- High error rates
- Slow response times
- Database connection issues
- Fraudulent activity detected
- System downtime

---

## Related Resources

- **[GitHub Repository](https://github.com/eodenyire/Wekeza)** - Core Banking source code
- **[API Reference](../api-reference/)** - Open Banking APIs
- **[Risk Management System](risk-management.md)** - Risk & Fraud detection
- **[CRM System](crm.md)** - Customer relationship management

---

**Need Help?** Contact dev@wekeza.com or open an issue on GitHub.
