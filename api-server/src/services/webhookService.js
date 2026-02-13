/**
 * Webhook Delivery Service
 */

const axios = require('axios');
const crypto = require('crypto');
const pool = require('../../database/pool');
const config = require('../../config');
const logger = require('../utils/logger');

class WebhookService {
  constructor() {
    this.retryDelays = [1000, 2000, 4000, 8000, 16000, 32000, 64000]; // Exponential backoff
  }

  async registerWebhook(clientId, webhookData) {
    try {
      const webhook = await pool.query_one(`
        INSERT INTO webhooks (client_id, url, events, secret, is_active)
        VALUES ($1, $2, $3, $4, true)
        RETURNING *
      `, [clientId, webhookData.url, webhookData.events, webhookData.secret || crypto.randomBytes(32).toString('hex')]);
      
      return {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        isActive: webhook.is_active
      };
    } catch (error) {
      logger.error('Register webhook error:', error);
      throw error;
    }
  }

  async triggerEvent(eventType, eventData) {
    try {
      // Get all active webhooks subscribed to this event
      const webhooks = await pool.query(`
        SELECT * FROM webhooks
        WHERE is_active = true AND $1 = ANY(events)
      `, [eventType]);
      
      // Create delivery records for each webhook
      for (const webhook of webhooks.rows) {
        await pool.query(`
          INSERT INTO webhook_deliveries (webhook_id, event_type, payload, status)
          VALUES ($1, $2, $3, 'pending')
        `, [webhook.id, eventType, JSON.stringify(eventData)]);
      }
      
      // Process deliveries asynchronously
      this.processDeliveries();
      
      return { queued: webhooks.rows.length };
    } catch (error) {
      logger.error('Trigger event error:', error);
      throw error;
    }
  }

  async processDeliveries() {
    try {
      // Get pending deliveries
      const deliveries = await pool.query(`
        SELECT wd.*, w.url, w.secret
        FROM webhook_deliveries wd
        JOIN webhooks w ON wd.webhook_id = w.id
        WHERE wd.status = 'pending'
          AND (wd.next_retry_at IS NULL OR wd.next_retry_at <= CURRENT_TIMESTAMP)
        LIMIT 10
      `);
      
      for (const delivery of deliveries.rows) {
        await this.deliverWebhook(delivery);
      }
    } catch (error) {
      logger.error('Process deliveries error:', error);
    }
  }

  async deliverWebhook(delivery) {
    try {
      // Generate signature
      const signature = crypto
        .createHmac('sha256', delivery.secret)
        .update(JSON.stringify(delivery.payload))
        .digest('hex');
      
      // Send webhook
      const response = await axios.post(delivery.url, delivery.payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Wekeza-Signature': signature,
          'X-Wekeza-Event': delivery.event_type
        },
        timeout: 10000
      });
      
      if (response.status >= 200 && response.status < 300) {
        // Success
        await pool.query(`
          UPDATE webhook_deliveries
          SET status = 'delivered',
              delivered_at = CURRENT_TIMESTAMP,
              last_attempt_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [delivery.id]);
        
        logger.info(`Webhook delivered successfully: ${delivery.id}`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      // Handle failure
      const attempts = delivery.attempts + 1;
      
      if (attempts >= this.retryDelays.length) {
        // Max retries reached
        await pool.query(`
          UPDATE webhook_deliveries
          SET status = 'failed',
              attempts = $1,
              last_attempt_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [attempts, delivery.id]);
        
        logger.error(`Webhook delivery failed permanently: ${delivery.id}`);
      } else {
        // Schedule retry
        const nextRetry = new Date(Date.now() + this.retryDelays[attempts]);
        
        await pool.query(`
          UPDATE webhook_deliveries
          SET attempts = $1,
              last_attempt_at = CURRENT_TIMESTAMP,
              next_retry_at = $2
          WHERE id = $3
        `, [attempts, nextRetry, delivery.id]);
        
        logger.warn(`Webhook delivery failed, will retry: ${delivery.id} (attempt ${attempts})`);
      }
    }
  }

  async listWebhooks(clientId) {
    try {
      const webhooks = await pool.query(`
        SELECT * FROM webhooks WHERE client_id = $1 ORDER BY created_at DESC
      `, [clientId]);
      
      return webhooks.rows.map(w => ({
        id: w.id,
        url: w.url,
        events: w.events,
        isActive: w.is_active,
        createdAt: w.created_at
      }));
    } catch (error) {
      logger.error('List webhooks error:', error);
      throw error;
    }
  }
}

module.exports = new WebhookService();
