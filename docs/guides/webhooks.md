# Webhooks Guide

Webhooks allow your application to receive real-time notifications when events occur in the Wekeza platform. Instead of polling for updates, Wekeza pushes event data to your application's webhook endpoint.

## Overview

### How Webhooks Work

```
1. Event occurs (e.g., payment completed)
2. Wekeza sends HTTP POST to your webhook URL
3. Your server receives and processes the event
4. Your server responds with 200 OK
5. If delivery fails, Wekeza retries automatically
```

### Benefits

✅ **Real-time updates** - Get notified instantly  
✅ **Reduced API calls** - No need to poll for status  
✅ **Better UX** - Update users immediately  
✅ **Efficient** - Only receive relevant events  

---

## Setup

### 1. Register Your Webhook URL

Register your webhook endpoint via the Developer Portal or API:

```bash
POST /api/v1/webhooks
Authorization: Bearer YOUR_ACCESS_TOKEN
```

```json
{
  "url": "https://yourapp.com/webhooks/wekeza",
  "events": [
    "payment.completed",
    "payment.failed",
    "transaction.posted",
    "account.balance.low",
    "consent.revoked"
  ],
  "secret": "your_webhook_secret_key"
}
```

**Response:**
```json
{
  "id": "webhook_abc123",
  "url": "https://yourapp.com/webhooks/wekeza",
  "events": [
    "payment.completed",
    "payment.failed",
    "transaction.posted",
    "account.balance.low",
    "consent.revoked"
  ],
  "status": "ACTIVE",
  "createdAt": "2026-02-13T10:30:00Z"
}
```

### 2. Implement Webhook Endpoint

Your webhook endpoint must:
- ✅ Accept HTTP POST requests
- ✅ Verify webhook signatures
- ✅ Return 200 OK within 5 seconds
- ✅ Process events asynchronously
- ✅ Be publicly accessible via HTTPS

---

## Available Events

### Payment Events

| Event | Description | Trigger |
|-------|-------------|---------|
| `payment.created` | Payment initiated | When payment is created |
| `payment.processing` | Payment being processed | When processing starts |
| `payment.completed` | Payment successful | When payment completes |
| `payment.failed` | Payment failed | When payment fails |
| `payment.cancelled` | Payment cancelled | When payment is cancelled |
| `payment.reversed` | Payment reversed | When payment is reversed |

### Transaction Events

| Event | Description | Trigger |
|-------|-------------|---------|
| `transaction.posted` | Transaction posted to account | When transaction is recorded |
| `transaction.reversed` | Transaction reversed | When transaction is reversed |

### Account Events

| Event | Description | Trigger |
|-------|-------------|---------|
| `account.created` | New account opened | When account is created |
| `account.frozen` | Account frozen | When account is frozen |
| `account.unfrozen` | Account unfrozen | When account is reactivated |
| `account.closed` | Account closed | When account is closed |
| `account.balance.low` | Low balance alert | When balance drops below threshold |

### Consent Events

| Event | Description | Trigger |
|-------|-------------|---------|
| `consent.granted` | User granted consent | When consent is approved |
| `consent.revoked` | User revoked consent | When consent is revoked |
| `consent.expired` | Consent expired | When consent period ends |

### Card Events

| Event | Description | Trigger |
|-------|-------------|---------|
| `card.issued` | New card issued | When card is created |
| `card.activated` | Card activated | When card is activated |
| `card.blocked` | Card blocked | When card is blocked |
| `card.transaction` | Card transaction | When card is used |

---

## Webhook Payload

### Payload Structure

All webhooks follow this structure:

```json
{
  "id": "evt_abc123xyz",
  "type": "payment.completed",
  "created": "2026-02-13T10:30:15Z",
  "data": {
    // Event-specific data
  },
  "metadata": {
    "webhookId": "webhook_abc123",
    "attempt": 1
  }
}
```

### Example: payment.completed

```json
{
  "id": "evt_payment_001",
  "type": "payment.completed",
  "created": "2026-02-13T10:30:15Z",
  "data": {
    "paymentId": "pmt_abc123xyz",
    "status": "COMPLETED",
    "sourceAccount": {
      "accountId": "acc_1234567890",
      "accountNumber": "1001234567"
    },
    "destinationAccount": {
      "accountNumber": "1009876543"
    },
    "amount": 5000.00,
    "currency": "KES",
    "description": "Payment for services",
    "reference": "INV-2026-001",
    "completedAt": "2026-02-13T10:30:15Z"
  },
  "metadata": {
    "webhookId": "webhook_abc123",
    "attempt": 1
  }
}
```

### Example: transaction.posted

```json
{
  "id": "evt_txn_002",
  "type": "transaction.posted",
  "created": "2026-02-13T14:30:00Z",
  "data": {
    "transactionId": "txn_xyz789",
    "accountId": "acc_1234567890",
    "accountNumber": "1001234567",
    "type": "CREDIT",
    "amount": 50000.00,
    "currency": "KES",
    "description": "Salary Payment",
    "reference": "SAL-FEB-2026",
    "balanceAfter": 125000.00,
    "transactionDate": "2026-02-13T14:30:00Z"
  },
  "metadata": {
    "webhookId": "webhook_abc123",
    "attempt": 1
  }
}
```

### Example: consent.revoked

```json
{
  "id": "evt_consent_003",
  "type": "consent.revoked",
  "created": "2026-02-13T16:00:00Z",
  "data": {
    "consentId": "consent_123",
    "customerId": "cust_456",
    "applicationId": "app_789",
    "scopes": ["accounts.read", "transactions.read"],
    "revokedAt": "2026-02-13T16:00:00Z",
    "reason": "User requested via mobile app"
  },
  "metadata": {
    "webhookId": "webhook_abc123",
    "attempt": 1
  }
}
```

---

## Security

### Verify Webhook Signatures

Every webhook includes a signature in the `X-Wekeza-Signature` header. Always verify this signature to ensure the webhook came from Wekeza.

#### Signature Format

```
X-Wekeza-Signature: t=1708701000,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd
```

- `t` - Unix timestamp when signature was created
- `v1` - HMAC-SHA256 signature

#### Verification Steps

1. Extract timestamp and signature from header
2. Compute expected signature
3. Compare signatures using constant-time comparison
4. Verify timestamp is recent (within 5 minutes)

#### Code Examples

**JavaScript (Node.js):**
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const elements = signature.split(',');
  const timestamp = elements.find(e => e.startsWith('t=')).split('=')[1];
  const sig = elements.find(e => e.startsWith('v1=')).split('=')[1];
  
  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    throw new Error('Webhook timestamp too old');
  }
  
  // Compute expected signature
  const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  // Compare signatures (constant-time)
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    throw new Error('Invalid webhook signature');
  }
  
  return true;
}

// Express.js example
app.post('/webhooks/wekeza', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-wekeza-signature'];
  const payload = JSON.parse(req.body.toString());
  
  try {
    verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET);
    
    // Process webhook
    processWebhook(payload);
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook verification failed:', error);
    res.status(400).json({ error: 'Invalid signature' });
  }
});
```

**Python:**
```python
import hmac
import hashlib
import time
import json

def verify_webhook_signature(payload, signature, secret):
    elements = dict(e.split('=') for e in signature.split(','))
    timestamp = int(elements['t'])
    sig = elements['v1']
    
    # Check timestamp is within 5 minutes
    now = int(time.time())
    if abs(now - timestamp) > 300:
        raise ValueError('Webhook timestamp too old')
    
    # Compute expected signature
    signed_payload = f"{timestamp}.{json.dumps(payload, separators=(',', ':'))}"
    expected_sig = hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Compare signatures (constant-time)
    if not hmac.compare_digest(sig, expected_sig):
        raise ValueError('Invalid webhook signature')
    
    return True

# Flask example
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhooks/wekeza', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Wekeza-Signature')
    payload = request.get_json()
    
    try:
        verify_webhook_signature(payload, signature, os.getenv('WEBHOOK_SECRET'))
        
        # Process webhook
        process_webhook(payload)
        
        return jsonify({'received': True}), 200
    except ValueError as e:
        print(f'Webhook verification failed: {e}')
        return jsonify({'error': 'Invalid signature'}), 400
```

**C#:**
```csharp
using System;
using System.Security.Cryptography;
using System.Text;

public class WebhookVerifier
{
    public static bool VerifySignature(string payload, string signature, string secret)
    {
        var elements = signature.Split(',');
        var timestamp = long.Parse(elements[0].Split('=')[1]);
        var sig = elements[1].Split('=')[1];
        
        // Check timestamp is within 5 minutes
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        if (Math.Abs(now - timestamp) > 300)
        {
            throw new Exception("Webhook timestamp too old");
        }
        
        // Compute expected signature
        var signedPayload = $"{timestamp}.{payload}";
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var payloadBytes = Encoding.UTF8.GetBytes(signedPayload);
        
        using (var hmac = new HMACSHA256(keyBytes))
        {
            var hash = hmac.ComputeHash(payloadBytes);
            var expectedSig = BitConverter.ToString(hash).Replace("-", "").ToLower();
            
            // Compare signatures
            if (sig != expectedSig)
            {
                throw new Exception("Invalid webhook signature");
            }
        }
        
        return true;
    }
}
```

---

## Handling Webhooks

### Best Practices

✅ **Return 200 OK quickly** - Acknowledge receipt within 5 seconds  
✅ **Process asynchronously** - Queue events for background processing  
✅ **Handle duplicates** - Use event ID to prevent duplicate processing  
✅ **Verify signatures** - Always validate webhook authenticity  
✅ **Log events** - Store webhooks for debugging and auditing  

### Implementation Pattern

```javascript
// Express.js example
app.post('/webhooks/wekeza', async (req, res) => {
  const signature = req.headers['x-wekeza-signature'];
  const event = req.body;
  
  try {
    // 1. Verify signature
    verifyWebhookSignature(event, signature, WEBHOOK_SECRET);
    
    // 2. Check for duplicate (using event ID)
    if (await isEventProcessed(event.id)) {
      return res.status(200).json({ received: true });
    }
    
    // 3. Acknowledge receipt immediately
    res.status(200).json({ received: true });
    
    // 4. Process asynchronously
    await queue.add('process-webhook', {
      eventId: event.id,
      eventType: event.type,
      data: event.data
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Background processor
queue.process('process-webhook', async (job) => {
  const { eventId, eventType, data } = job.data;
  
  switch (eventType) {
    case 'payment.completed':
      await handlePaymentCompleted(data);
      break;
    case 'transaction.posted':
      await handleTransactionPosted(data);
      break;
    case 'consent.revoked':
      await handleConsentRevoked(data);
      break;
    // ... other event types
  }
  
  // Mark event as processed
  await markEventProcessed(eventId);
});
```

---

## Retry Logic

### Automatic Retries

If your endpoint doesn't respond with 200 OK, Wekeza automatically retries:

| Attempt | Delay | Total Time |
|---------|-------|------------|
| 1 | Immediate | 0 min |
| 2 | 1 minute | 1 min |
| 3 | 5 minutes | 6 min |
| 4 | 15 minutes | 21 min |
| 5 | 1 hour | 1h 21min |
| 6 | 6 hours | 7h 21min |
| 7 | 24 hours | 31h 21min |

After 7 failed attempts, the webhook is marked as failed.

### Retry Headers

Retried webhooks include additional headers:

```
X-Wekeza-Signature: t=...,v1=...
X-Wekeza-Delivery-Attempt: 3
X-Wekeza-Delivery-ID: dlv_abc123
```

### Manual Retry

You can manually retry failed webhooks via the Developer Portal or API:

```bash
POST /api/v1/webhooks/{webhookId}/retry/{eventId}
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## Testing Webhooks

### Local Development with ngrok

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   # or
   brew install ngrok
   ```

2. **Start your local server:**
   ```bash
   node server.js
   # Server running on http://localhost:3000
   ```

3. **Create ngrok tunnel:**
   ```bash
   ngrok http 3000
   ```

4. **Register ngrok URL:**
   ```
   https://abc123.ngrok.io/webhooks/wekeza
   ```

### Test with webhook.site

1. Visit [webhook.site](https://webhook.site)
2. Copy your unique URL
3. Register URL with Wekeza
4. Trigger events to see webhooks in real-time

### Sandbox Test Events

Trigger test events in Sandbox:

```bash
POST /api/v1/sandbox/webhooks/trigger
Authorization: Bearer YOUR_ACCESS_TOKEN
```

```json
{
  "eventType": "payment.completed",
  "webhookId": "webhook_abc123",
  "data": {
    "paymentId": "pmt_test_001",
    "amount": 1000.00,
    "currency": "KES"
  }
}
```

---

## Webhook Management

### List Webhooks

```bash
GET /api/v1/webhooks
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Get Webhook Details

```bash
GET /api/v1/webhooks/{webhookId}
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Update Webhook

```bash
PATCH /api/v1/webhooks/{webhookId}
Authorization: Bearer YOUR_ACCESS_TOKEN
```

```json
{
  "events": ["payment.completed", "payment.failed"],
  "status": "ACTIVE"
}
```

### Delete Webhook

```bash
DELETE /api/v1/webhooks/{webhookId}
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### View Delivery Logs

```bash
GET /api/v1/webhooks/{webhookId}/deliveries
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "data": [
    {
      "id": "dlv_001",
      "eventId": "evt_abc123",
      "eventType": "payment.completed",
      "status": "SUCCESS",
      "attempts": 1,
      "responseCode": 200,
      "deliveredAt": "2026-02-13T10:30:15Z"
    },
    {
      "id": "dlv_002",
      "eventId": "evt_def456",
      "eventType": "payment.failed",
      "status": "FAILED",
      "attempts": 7,
      "responseCode": 500,
      "lastAttemptAt": "2026-02-14T10:30:00Z",
      "error": "Connection timeout"
    }
  ]
}
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Webhooks not received | Firewall blocking | Whitelist Wekeza IPs |
| Signature verification fails | Wrong secret | Check webhook secret |
| Timeout errors | Slow processing | Process asynchronously |
| Duplicate events | Retry logic | Check event ID before processing |
| SSL errors | Invalid certificate | Use valid SSL certificate |

### Wekeza IP Ranges

Whitelist these IP ranges for webhooks:

**Production:**
```
52.214.45.89/32
34.240.123.45/32
```

**Sandbox:**
```
54.220.67.123/32
```

### Debug Mode

Enable debug headers in Developer Portal to get additional information:

```
X-Wekeza-Debug: true
X-Wekeza-Request-ID: req_abc123
X-Wekeza-Timestamp: 1708701000
```

---

## Rate Limits

- **Webhook Registration:** 10 webhooks per application
- **Events per Webhook:** Unlimited
- **Delivery Rate:** 10 requests/second per webhook

---

## Related Resources

- **[Payments API](../api-reference/payments.md)** - Payment endpoints
- **[Authentication Guide](../authentication.md)** - OAuth 2.0
- **[Error Handling](error-handling.md)** - Handle errors
- **[Sandbox Guide](../sandbox.md)** - Test webhooks

---

**Need Help?** Contact developers@wekeza.com or visit [Developer Community](https://wekeza-dev.slack.com).
