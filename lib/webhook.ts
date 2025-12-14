/**
 * Webhook Module
 * Handles webhook event creation and delivery with HMAC signature
 */

import { createHmac } from 'crypto';
import { nanoid } from 'nanoid';
import { prisma } from './prisma';
import { logger } from './logger';

export interface WebhookEvent {
  id: string;
  type: string;
  created: number;
  data: {
    object: any;
  };
}

/**
 * Fires a webhook event to all registered endpoints for a merchant
 */
export async function fireWebhook(
  merchantId: string,
  eventType: string,
  data: any
): Promise<void> {
  try {
    // Get all active webhook endpoints for this merchant that listen to this event
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        merchantId,
        isActive: true,
        events: {
          has: eventType,
        },
      },
    });

    if (endpoints.length === 0) {
      logger.info('No webhook endpoints configured', { merchantId, eventType });
      return;
    }

    // Create webhook event
    const event: WebhookEvent = {
      id: `evt_${nanoid(24)}`,
      type: eventType,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: data,
      },
    };

    // Send to all endpoints
    const deliveryPromises = endpoints.map(endpoint =>
      deliverWebhook(endpoint, event)
    );

    await Promise.allSettled(deliveryPromises);
  } catch (error) {
    logger.error('Failed to fire webhook', { error, merchantId, eventType });
  }
}

/**
 * Queue webhook event to database for later delivery (used by subscriptions)
 * Alias for fireWebhook to maintain compatibility
 */
export async function queueWebhookEvent(
  merchantId: string,
  eventType: string,
  data: any
): Promise<void> {
  return fireWebhook(merchantId, eventType, data);
}

/**
 * Deliver a webhook event immediately (used for testing webhooks)
 * @param endpointId - The webhook endpoint ID
 * @param eventType - Type of event (e.g., "payment.succeeded")
 * @param data - Event data payload
 */
export async function deliverWebhookEvent(
  endpointId: string,
  eventType: string,
  data: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const endpoint = await prisma.webhookEndpoint.findUnique({
      where: { id: endpointId },
    });

    if (!endpoint) {
      return { success: false, error: 'Webhook endpoint not found' };
    }

    const event: WebhookEvent = {
      id: `evt_${nanoid(24)}`,
      type: eventType,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: data,
      },
    };

    await deliverWebhook(endpoint, event);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delivers a webhook event to a specific endpoint
 */
async function deliverWebhook(
  endpoint: { id: string; url: string; secret: string; failureCount: number },
  event: WebhookEvent
): Promise<void> {
  try {
    const payload = JSON.stringify(event);
    const timestamp = Math.floor(Date.now() / 1000);

    // Generate HMAC signature
    const signature = generateSignature(payload, endpoint.secret, timestamp);

    // Send webhook
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Stripe-Signature': `t=${timestamp},v1=${signature}`,
        'User-Agent': 'Stripe-Replica/1.0',
      },
      body: payload,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.status}`);
    }

    // Reset failure count on success
    if (endpoint.failureCount > 0) {
      await prisma.webhookEndpoint.update({
        where: { id: endpoint.id },
        data: { failureCount: 0 },
      });
    }

    logger.info('Webhook delivered successfully', {
      endpointId: endpoint.id,
      eventType: event.type,
    });
  } catch (error) {
    logger.error('Webhook delivery failed', {
      error,
      endpointId: endpoint.id,
      eventType: event.type,
    });

    // Increment failure count
    const newFailureCount = endpoint.failureCount + 1;
    await prisma.webhookEndpoint.update({
      where: { id: endpoint.id },
      data: {
        failureCount: newFailureCount,
        lastFailedAt: new Date(),
        // Disable endpoint after 10 consecutive failures
        isActive: newFailureCount < 10,
      },
    });
  }
}

/**
 * Generates HMAC-SHA256 signature for webhook verification
 */
export function generateSignature(
  payload: string,
  secret: string,
  timestamp: number
): string {
  const signedPayload = `${timestamp}.${payload}`;
  const hmac = createHmac('sha256', secret);
  hmac.update(signedPayload);
  return hmac.digest('hex');
}

/**
 * Verifies webhook signature (for webhook consumers)
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Parse signature header: t=timestamp,v1=signature
    const parts = signature.split(',');
    const timestamp = parseInt(parts[0].split('=')[1]);
    const receivedSignature = parts[1].split('=')[1];

    // Check timestamp tolerance (5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      return false;
    }

    // Generate expected signature
    const expectedSignature = generateSignature(payload, secret, timestamp);

    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(
      Buffer.from(receivedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}
