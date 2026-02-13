/**
 * Wekeza API Webhooks Module
 * Handles webhook signature verification and event processing
 */

const crypto = require('crypto');

class WekezaWebhooks {
  constructor(webhookSecret) {
    this.webhookSecret = webhookSecret;
  }

  /**
   * Verify webhook signature
   * @param {string} payload - Raw request body
   * @param {string} signature - X-Wekeza-Signature header value
   * @returns {boolean} True if signature is valid
   */
  verifySignature(payload, signature) {
    if (!signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Parse webhook event
   * @param {string} payload - Raw request body
   * @param {string} signature - X-Wekeza-Signature header value
   * @returns {object} Parsed event data
   * @throws {Error} If signature is invalid
   */
  parseEvent(payload, signature) {
    if (!this.verifySignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    try {
      return JSON.parse(payload);
    } catch (error) {
      throw new Error('Invalid webhook payload: not valid JSON');
    }
  }

  /**
   * Handle webhook event based on type
   * @param {object} event - Parsed event data
   * @param {object} handlers - Event handlers by type
   * @returns {Promise<any>} Handler result
   */
  async handleEvent(event, handlers) {
    const eventType = event.type || event.event_type;
    
    if (!eventType) {
      throw new Error('Event type not specified in webhook payload');
    }

    const handler = handlers[eventType];
    
    if (!handler) {
      console.warn(`No handler registered for event type: ${eventType}`);
      return null;
    }

    try {
      return await handler(event.data || event.payload);
    } catch (error) {
      console.error(`Error handling ${eventType} event:`, error);
      throw error;
    }
  }
}

module.exports = WekezaWebhooks;
