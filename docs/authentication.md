# Authentication & Authorization Guide

Wekeza Open Banking Platform uses **OAuth 2.0** and **OpenID Connect** for secure authentication and authorization. This guide covers everything you need to implement authentication in your application.

## Table of Contents
- [Overview](#overview)
- [OAuth 2.0 Flows](#oauth-20-flows)
- [Scopes & Permissions](#scopes--permissions)
- [Access Tokens](#access-tokens)
- [Refresh Tokens](#refresh-tokens)
- [Customer Consent](#customer-consent)
- [Security Best Practices](#security-best-practices)

## Overview

### Why OAuth 2.0?

OAuth 2.0 is the industry standard for API authorization. It enables:
- **Secure delegation** - Users grant limited access without sharing passwords
- **Granular permissions** - Control exactly what data your app can access
- **Token-based** - Short-lived tokens reduce security risks
- **Revocable access** - Users can revoke access at any time

### Authentication Flow at a Glance

```
Developer App → Request Token → Wekeza Auth Server
                                      ↓
                            Issue Access Token
                                      ↓
Developer App ← Access Token ← Wekeza Auth Server
       ↓
Call Wekeza APIs with Token
```

## OAuth 2.0 Flows

Wekeza supports two OAuth 2.0 flows:

### 1. Client Credentials Flow (Server-to-Server)

**Use case:** Backend applications, scheduled jobs, system integrations

**Best for:**
- Accessing your own resources
- Server-to-server communication
- Applications without user interaction
- Background processes

#### How It Works

```
Client Application → Request Token with Client ID & Secret
                                    ↓
                    Wekeza Auth Server validates credentials
                                    ↓
                      Returns Access Token
                                    ↓
Client Application → Use token to call APIs
```

#### Implementation

**Step 1: Request Access Token**

```http
POST /oauth/token HTTP/1.1
Host: api.wekeza.com
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&scope=accounts.read transactions.read
```

**cURL Example:**
```bash
curl -X POST https://api.wekeza.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=accounts.read transactions.read"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "accounts.read transactions.read"
}
```

**Step 2: Use Access Token**

```bash
curl -X GET https://api.wekeza.com/api/v1/accounts \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 2. Authorization Code Flow (User Authorization)

**Use case:** Web apps, mobile apps requiring user consent

**Best for:**
- Accessing customer data on their behalf
- Applications requiring user login
- Web and mobile applications
- Third-party integrations

#### How It Works

```
1. User visits your app
2. App redirects to Wekeza login
3. User logs in and grants consent
4. Wekeza redirects back with authorization code
5. App exchanges code for access token
6. App uses token to access user data
```

#### Implementation

**Step 1: Redirect User to Authorization Endpoint**

```http
GET /oauth/authorize?
  response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=https://yourapp.com/callback
  &scope=accounts.read transactions.read payments.write
  &state=random_state_string
```

**Example URL:**
```
https://api.wekeza.com/oauth/authorize?response_type=code&client_id=app_123&redirect_uri=https://yourapp.com/callback&scope=accounts.read&state=xyz789
```

**Step 2: User Grants Consent**

User sees a consent screen:
```
MyFinanceApp wants to access your Wekeza account

This application will be able to:
✓ View your account information
✓ View your transaction history
✓ Initiate payments on your behalf

[Approve] [Deny]
```

**Step 3: Handle Callback**

After user approval, Wekeza redirects to your `redirect_uri`:

```
https://yourapp.com/callback?code=AUTH_CODE_HERE&state=xyz789
```

⚠️ **Verify the `state` parameter** to prevent CSRF attacks.

**Step 4: Exchange Code for Access Token**

```http
POST /oauth/token HTTP/1.1
Host: api.wekeza.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTH_CODE_HERE
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&redirect_uri=https://yourapp.com/callback
```

**cURL Example:**
```bash
curl -X POST https://api.wekeza.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTH_CODE_HERE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=https://yourapp.com/callback"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "accounts.read transactions.read payments.write"
}
```

---

## Scopes & Permissions

Scopes define what your application can access. Request only the scopes you need.

### Available Scopes

| Scope | Description | Risk Level |
|-------|-------------|------------|
| `accounts.read` | View account information and balances | Low |
| `transactions.read` | View transaction history | Low |
| `customers.read` | View customer profile data | Medium |
| `customers.write` | Update customer profile | Medium |
| `payments.write` | Initiate payments | High |
| `loans.read` | View loan information | Medium |
| `loans.write` | Apply for loans | High |
| `cards.read` | View card information | Medium |
| `cards.write` | Issue and manage cards | High |

### Scope Combinations

**Personal Finance App:**
```
accounts.read transactions.read
```

**Payment App:**
```
accounts.read payments.write
```

**Comprehensive Banking App:**
```
accounts.read transactions.read customers.read payments.write loans.read
```

### Requesting Multiple Scopes

Separate scopes with spaces:

```bash
scope=accounts.read transactions.read payments.write
```

---

## Access Tokens

### Token Lifetime

- **Standard tokens:** 1 hour (3600 seconds)
- **Refresh tokens:** 24 hours (86400 seconds)

### Token Format

Wekeza uses JWT (JSON Web Tokens):

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiJ1c2VyMTIzIiwiY2xpZW50X2lkIjoiYXBwXzEyMyIsInNjb3BlIjpbImFjY291bnRzLnJlYWQiXSwiZXhwIjoxNzA4NzA0MDAwfQ.
signature_here
```

**Decoded payload:**
```json
{
  "sub": "user123",
  "client_id": "app_123",
  "scope": ["accounts.read", "transactions.read"],
  "exp": 1708704000,
  "iat": 1708700400,
  "iss": "https://api.wekeza.com",
  "aud": "https://api.wekeza.com"
}
```

### Using Access Tokens

Include the token in the `Authorization` header:

```http
GET /api/v1/accounts HTTP/1.1
Host: api.wekeza.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Validation

The API gateway automatically validates:
- ✅ Token signature
- ✅ Token expiration
- ✅ Required scopes
- ✅ Token revocation status

---

## Refresh Tokens

Use refresh tokens to obtain new access tokens without user interaction.

### When to Refresh

- Access token has expired (HTTP 401 response)
- Proactively refresh before expiration (recommended)

### Refresh Flow

```http
POST /oauth/token HTTP/1.1
Host: api.wekeza.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=YOUR_REFRESH_TOKEN
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
```

**Response:**
```json
{
  "access_token": "NEW_ACCESS_TOKEN",
  "refresh_token": "NEW_REFRESH_TOKEN",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

⚠️ **Note:** Refresh tokens are single-use. The response includes a new refresh token.

---

## Customer Consent

### Consent Management

When using Authorization Code Flow, customer consent is:
- ✅ **Explicit** - Users see exactly what access they're granting
- ✅ **Granular** - Per-scope permissions
- ✅ **Revocable** - Users can revoke access anytime
- ✅ **Time-limited** - Consent expires after defined period

### Consent Lifecycle

```
1. User grants consent → Consent active
2. App uses access tokens → Consent valid
3. User revokes consent → Tokens invalidated
4. Consent expires → App must re-request
```

### Checking Consent Status

```bash
GET /api/v1/consents/{consent_id}
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "consentId": "consent_abc123",
  "customerId": "cust_456",
  "applicationId": "app_123",
  "scopes": ["accounts.read", "transactions.read"],
  "status": "ACTIVE",
  "grantedAt": "2026-01-15T10:00:00Z",
  "expiresAt": "2026-07-15T10:00:00Z",
  "lastUsedAt": "2026-02-13T09:45:00Z"
}
```

### Revoking Consent

Users can revoke consent via:
- Wekeza Mobile App
- Internet Banking
- Customer Service

When consent is revoked:
- All active tokens are invalidated immediately
- API calls return HTTP 403 Forbidden
- App must re-request authorization

---

## Security Best Practices

### 🔒 Protect Your Credentials

**DO:**
✅ Store Client Secret in environment variables or secure vaults  
✅ Use different credentials for dev/staging/production  
✅ Rotate credentials regularly  
✅ Limit credential access to authorized team members  

**DON'T:**
❌ Commit credentials to version control  
❌ Share credentials in email or chat  
❌ Hardcode credentials in source code  
❌ Log credentials in application logs  

### 🔒 Token Security

**DO:**
✅ Store tokens securely (encrypted storage, secure cookies)  
✅ Use HTTPS for all API calls  
✅ Implement token expiration handling  
✅ Clear tokens on logout  
✅ Validate token expiration before use  

**DON'T:**
❌ Store tokens in localStorage (XSS risk)  
❌ Include tokens in URLs  
❌ Share tokens between applications  
❌ Log full token values  

### 🔒 State Parameter (CSRF Protection)

Always use a random `state` parameter in Authorization Code Flow:

```javascript
// Generate random state
const state = crypto.randomBytes(16).toString('hex');

// Store in session
session.oauthState = state;

// Include in authorization URL
const authUrl = `https://api.wekeza.com/oauth/authorize?
  response_type=code
  &client_id=${clientId}
  &state=${state}
  &...`;

// Verify on callback
if (req.query.state !== session.oauthState) {
  throw new Error('Invalid state parameter');
}
```

### 🔒 PKCE (Proof Key for Code Exchange)

For mobile and single-page apps, use PKCE for enhanced security:

```javascript
// Generate code verifier and challenge
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

// Authorization request
const authUrl = `https://api.wekeza.com/oauth/authorize?
  response_type=code
  &client_id=${clientId}
  &code_challenge=${codeChallenge}
  &code_challenge_method=S256
  &...`;

// Token request
const tokenResponse = await fetch('https://api.wekeza.com/oauth/token', {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authCode,
    code_verifier: codeVerifier,
    client_id: clientId
  })
});
```

### 🔒 Rate Limiting

Authentication endpoints are rate-limited:
- **Token endpoint:** 10 requests/minute per client
- **Authorization endpoint:** 20 requests/minute per client

Implement exponential backoff for retries.

---

## Error Handling

### Common Authentication Errors

| Error Code | Description | Solution |
|-----------|-------------|----------|
| `invalid_client` | Invalid Client ID/Secret | Verify credentials |
| `invalid_grant` | Invalid/expired authorization code | Request new code |
| `invalid_scope` | Requested scope not allowed | Check allowed scopes |
| `access_denied` | User denied consent | Request consent again |
| `invalid_token` | Access token invalid/expired | Refresh or re-authenticate |

### Error Response Format

```json
{
  "error": "invalid_client",
  "error_description": "Client authentication failed due to invalid credentials",
  "error_uri": "https://docs.wekeza.com/errors/invalid_client"
}
```

---

## Testing Authentication

### Sandbox Credentials

For testing in Sandbox:

**Test Application:**
- Client ID: `test_client_sandbox_123`
- Client Secret: `test_secret_abc456xyz`

**Test User:**
- Username: `testuser@wekeza.com`
- Password: `Test@1234`

### Test Scenarios

1. **Successful authentication**
2. **Invalid credentials**
3. **Expired token**
4. **Insufficient scopes**
5. **Revoked consent**

---

## Code Examples

### JavaScript (Node.js)

```javascript
const axios = require('axios');

async function getAccessToken(clientId, clientSecret) {
  const response = await axios.post('https://api.wekeza.com/oauth/token', 
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'accounts.read transactions.read'
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );
  
  return response.data.access_token;
}

// Usage
const token = await getAccessToken(process.env.CLIENT_ID, process.env.CLIENT_SECRET);
```

### Python

```python
import requests

def get_access_token(client_id, client_secret):
    response = requests.post(
        'https://api.wekeza.com/oauth/token',
        data={
            'grant_type': 'client_credentials',
            'client_id': client_id,
            'client_secret': client_secret,
            'scope': 'accounts.read transactions.read'
        }
    )
    response.raise_for_status()
    return response.json()['access_token']

# Usage
token = get_access_token(os.getenv('CLIENT_ID'), os.getenv('CLIENT_SECRET'))
```

### C#

```csharp
using System.Net.Http;
using System.Collections.Generic;

public async Task<string> GetAccessTokenAsync(string clientId, string clientSecret)
{
    var client = new HttpClient();
    var content = new FormUrlEncodedContent(new Dictionary<string, string>
    {
        { "grant_type", "client_credentials" },
        { "client_id", clientId },
        { "client_secret", clientSecret },
        { "scope", "accounts.read transactions.read" }
    });

    var response = await client.PostAsync("https://api.wekeza.com/oauth/token", content);
    response.EnsureSuccessStatusCode();
    
    var result = await response.Content.ReadAsAsync<TokenResponse>();
    return result.AccessToken;
}
```

---

## Next Steps

- **[API Reference](api-reference/)** - Explore available APIs
- **[Webhooks Guide](guides/webhooks.md)** - Real-time notifications
- **[Rate Limiting](guides/rate-limiting.md)** - Understand API limits
- **[Best Practices](guides/best-practices.md)** - Build production-ready apps

---

**Need Help?** Contact developers@wekeza.com or visit our [Developer Community](https://wekeza-dev.slack.com).
