/**
 * Wekeza API Webhook Server Example
 * Shows how to receive and handle webhooks
 */

const express = require('express');
const WekezaClient = require('../src/index');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3000;

// Create Wekeza client
const client = WekezaClient.fromEnv();

// Middleware to capture raw body for signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

// Webhook endpoint
app.post('/webhooks/wekeza', async (req, res) => {
  try {
    const signature = req.headers['x-wekeza-signature'];
    const rawBody = req.rawBody;

    console.log('\n=== Webhook Received ===');
    console.log('Signature:', signature);

    // Verify and parse webhook
    const event = client.webhooks.parseEvent(rawBody, signature);
    console.log('Event Type:', event.type);
    console.log('Event Data:', JSON.stringify(event.data, null, 2));

    // Handle different event types
    const handlers = {
      'transaction.posted': async (data) => {
        console.log(`New transaction posted: ${data.id}`);
        console.log(`Amount: ${data.currency} ${data.amount}`);
        // Add your logic here
      },
      
      'payment.completed': async (data) => {
        console.log(`Payment completed: ${data.id}`);
        console.log(`Status: ${data.status}`);
        // Add your logic here
      },
      
      'payment.failed': async (data) => {
        console.log(`Payment failed: ${data.id}`);
        console.log(`Reason: ${data.failureReason}`);
        // Add your logic here
      },
      
      'account.balance_low': async (data) => {
        console.log(`Low balance alert for account: ${data.accountId}`);
        console.log(`Balance: ${data.currentBalance}`);
        // Add your logic here
      }
    };

    // Process the event
    await client.webhooks.handleEvent(event, handlers);

    // Return success response
    res.status(200).json({ received: true });
    console.log('Webhook processed successfully');
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'wekeza-webhook-server' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Wekeza Webhook Server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhooks/wekeza`);
  console.log('\nTo test with a local tunnel (e.g., ngrok):');
  console.log(`  ngrok http ${PORT}`);
  console.log('  Then configure the ngrok URL in your Wekeza developer dashboard\n');
});
