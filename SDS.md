# System Design Specification (SDS)

## Wekeza Open Banking Platform

**Version:** 1.0
**Date:** February 2026
**System Owner:** Wekeza Digital Platforms

---

# 1. Introduction

## 1.1 Purpose

This System Design Specification (SDS) provides detailed technical design for the Wekeza Open Banking Platform. It describes system components, interfaces, data models, workflows, and technical decisions required for implementation.

The platform enables secure access to banking services via APIs for:

* Internal systems (AI Financial Copilot, Channels)
* External developers and partners
* Embedded finance applications

---

# 2. System Overview

The platform is built using:

* Microservices architecture
* API Gateway pattern
* OAuth 2.0 / OpenID Connect security
* Event-driven integration
* Containerized deployment

### Core Components

1. API Gateway
2. Identity & Authorization Server
3. Consent Service
4. Account Service
5. Transaction Service
6. Payment Service
7. Developer Management Service
8. Webhook Service
9. Event Streaming Layer
10. Core Banking Integration Layer

---

# 3. Component Design

---

## 3.1 API Gateway

### Responsibilities

* Route requests to services
* Validate OAuth tokens
* Enforce rate limits
* Log requests/responses
* Apply throttling
* API version routing

### Configuration

| Setting    | Value                |
| ---------- | -------------------- |
| Rate Limit | Configurable per app |
| Timeout    | 30 seconds           |
| TLS        | Mandatory            |
| Versioning | URL-based (/v1/)     |

---

## 3.2 Identity & Authorization Server

### Functions

* OAuth 2.0 Authorization Code Flow
* Client Credentials Flow
* Token issuance and validation
* Refresh token management

### Token Structure (JWT)

Claims:

* sub (CustomerId)
* client_id
* scopes
* exp
* iat

### Token Lifetime

| Token         | Duration   |
| ------------- | ---------- |
| Access Token  | 15 minutes |
| Refresh Token | 24 hours   |

---

## 3.3 Consent Service

### Functions

* Store customer consent
* Validate consent for each request
* Handle revocation
* Maintain audit logs

### Database Schema

**Consents**

* ConsentId (PK)
* CustomerId
* AppId
* Scope
* Status (Active/Revoked/Expired)
* CreatedAt
* ExpiryDate

### API

* POST /consents
* GET /consents/{id}
* DELETE /consents/{id}

---

## 3.4 Account Service

### Responsibilities

* Retrieve accounts
* Fetch balances
* Map core banking responses

### Endpoints

GET /accounts
GET /accounts/{id}
GET /accounts/{id}/balance

### Data Flow

```
Request → API Gateway → Account Service → Core Banking API → Response
```

### Caching

* Redis cache for balances (TTL: 30 seconds)

---

## 3.5 Transaction Service

### Responsibilities

* Retrieve transaction history
* Pagination and filtering
* Optional enrichment (merchant category)

### Endpoint

GET /accounts/{id}/transactions?fromDate=&toDate=&page=

### Performance

* Pagination required
* Max page size: 500 records

---

## 3.6 Payment Service

### Responsibilities

* Validate payment request
* Idempotency handling
* Fraud/Risk integration
* Payment execution

### Endpoint

POST /payments

### Idempotency

Header:
Idempotency-Key

Stored in:
**PaymentRequests**

* IdempotencyKey
* RequestHash
* Status

### Workflow

```
Client Request
   ↓
Validate Request
   ↓
Check Idempotency
   ↓
Fraud Check
   ↓
Risk Score
   ↓
Core Banking Execution
   ↓
Return Status
```

---

## 3.7 Developer Management Service

### Functions

* Developer registration
* Application management
* Client credential generation
* Usage tracking

### Database

**Developers**

* DeveloperId
* Name
* Email
* Status

**Applications**

* AppId
* DeveloperId
* ClientId
* ClientSecret (encrypted)
* RedirectURI
* Status

---

## 3.8 Webhook Service

### Functions

* Register webhook endpoints
* Event subscription
* Retry logic
* Signature validation

### Database

**Webhooks**

* WebhookId
* AppId
* URL
* EventType
* Status

### Retry Policy

| Attempt | Delay      |
| ------- | ---------- |
| 1       | Immediate  |
| 2       | 30 seconds |
| 3       | 2 minutes  |
| 4       | 10 minutes |

---

# 4. Event Streaming Design

Technology: Kafka (recommended)

### Topics

* transactions.posted
* payments.completed
* payments.failed
* consent.revoked

Consumers:

* Webhook Service
* AI Financial Copilot
* Analytics
* Notification Service

---

# 5. Data Design

Each service has its own database (PostgreSQL).

### Key Tables

| Service   | Tables                         |
| --------- | ------------------------------ |
| Consent   | Consents                       |
| Developer | Developers, Applications       |
| Payment   | PaymentRequests, PaymentStatus |
| Webhook   | Webhooks, WebhookLogs          |
| Audit     | ApiAccessLogs                  |

---

# 6. Error Handling Standard

Response format:

```
{
  "code": "INVALID_REQUEST",
  "message": "Account not found",
  "traceId": "abc123"
}
```

HTTP Codes:

* 400 – Bad Request
* 401 – Unauthorized
* 403 – Forbidden
* 404 – Not Found
* 429 – Rate limit exceeded
* 500 – Internal error

---

# 7. Security Design

### Authentication

* OAuth 2.0 / OpenID Connect

### Transport

* TLS 1.2+

### Data Protection

* Encryption at rest
* Secrets stored in Vault/Key Vault

### Additional Controls

* Rate limiting
* IP whitelisting (optional)
* mTLS (enterprise partners)

---

# 8. Performance Design

### Targets

| Metric          | Target                |
| --------------- | --------------------- |
| Response Time   | < 500ms               |
| Throughput      | Scalable horizontally |
| Cache Hit Ratio | > 70% for balances    |

### Optimization

* Redis caching
* Connection pooling
* Async processing for webhooks

---

# 9. Observability

### Metrics

* Request count
* Latency
* Error rate
* Token failures

### Logging

* Centralized logging (ELK/OpenSearch)
* TraceId per request

### Monitoring Tools

* Prometheus
* Grafana
* Alertmanager

---

# 10. Deployment Design

### Environment

* Docker containers
* Kubernetes orchestration
* CI/CD pipeline

### Environments

* Dev
* QA
* Sandbox
* Production

### High Availability

* Multi-zone deployment
* Load balancer
* Auto-scaling enabled

---

# 11. Integration Points

| System               | Integration Method  |
| -------------------- | ------------------- |
| Core Banking         | REST / internal API |
| Fraud System         | Synchronous API     |
| Risk Engine          | Synchronous API     |
| Notification Service | Event-driven        |
| AI Copilot           | Open Banking APIs   |
| BI/Analytics         | Kafka / Data export |

---

# 12. API Versioning Strategy

Format:

```
/api/v1/accounts
```

Rules:

* No breaking changes within version
* New features added as optional fields
* Major changes released as v2

---

# 13. Audit & Compliance

Audit logs stored for:

* API access
* Consent actions
* Payment requests
* Authentication events

Retention:

* Minimum 7 years (configurable)

---

# 14. Failure Handling

### Circuit Breaker

* Prevent overload to Core Banking

### Retry Policies

* External service calls retried up to 3 times

### Graceful Degradation

* Cached data returned when possible

---

# 15. Future Enhancements

* API monetization engine
* Developer analytics dashboard
* SDK auto-generation
* Graph-based fraud analysis
* Global Open Banking standards compliance

---

# 16. Design Summary

The Wekeza Open Banking Platform SDS defines a secure, scalable, and enterprise-grade architecture based on microservices, event-driven integration, and strong security controls. This design supports internal innovation (AI Financial Copilot), external developer ecosystems, and future Bank-as-a-Service capabilities.

