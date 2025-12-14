/**
 * Webhook Module
 * Handles webhook event creation, queueing, and delivery with HMAC signature and retry logic
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

/**
 * Queue a webhook event for delivery to all relevant endpoints
 */
export async function queueWebhookEvent(
  merchantId: string,
  eventType: string,
  dataObject: any
): Promise<string> {
  try {
    // Create the event in the database
    const event = await prisma.webhookEvent.create({
      data: {
        merchantId,
        type: eventType,
        dataObject,
        status: 'pending',
      },
    });

    logger.info('Webhook event queued', {
      eventId: event.id,
      merchantId,
      type: eventType,
    });

    // Attempt immediate delivery
    await deliverWebhookEvent(event.id).catch(err => {
      logger.error('Error delivering webhook immediately', {
        eventId: event.id,
        error: err instanceof Error ? err.message : String(err),
      });
    });

    return event.id;
  } catch (err) {
    logger.error('Failed to queue webhook event', {
      error: err instanceof Error ? err.message : String(err),
      merchantId,
      eventType,
    });
    throw err;
  }
}

/**
 * Deliver a webhook event to all relevant endpoints
 */
export async function deliverWebhookEvent(eventId: string): Promise<void> {
  const event = await prisma.webhookEvent.findUnique({
    where: { id: eventId },
    include: {
      merchant: {
        include: {
          webhookEndpoints: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  if (!event) {
    logger.warn('Webhook event not found', { eventId });
    return;
  }

  const endpoints = event.merchant.webhookEndpoints.filter(ep =>
    ep.events.includes(event.type)
  );

  if (endpoints.length === 0) {
    logger.info('No webhook endpoints for event type', {
      eventId,
      type: event.type,
    });

    // Mark event as sent even if no endpoints
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: {
        status: 'sent',
        lastDeliveryAt: new Date(),
      },
    });

    return;
  }

  let successCount = 0;

  for (const endpoint of endpoints) {
    try {
      await deliverToEndpoint(event, endpoint);
      successCount++;
    } catch (err) {
      logger.error('Failed to deliver webhook to endpoint', {
        eventId,
        endpointId: endpoint.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Update event status based on delivery success
  if (successCount === endpoints.length) {
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: {
        status: 'sent',
        lastDeliveryAt: new Date(),
        deliveryAttempts: { increment: 1 },
      },
    });
  }
}

/**
 * Deliver webhook to a specific endpoint
 */
async function deliverToEndpoint(
  event: any,
  endpoint: any
): Promise<void> {
  const startTime = Date.now();

  // Build the webhook payload
  const payload = {
    id: `evt_${nanoid(24)}`,
    type: event.type,
    created: Math.floor(event.createdAt.getTime() / 1000),
    data: {
      object: event.dataObject,
    },
  };

  const payloadJson = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(payloadJson, endpoint.secret, timestamp);

  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Stripe-Signature': `t=${timestamp},v1=${signature}`,
        'User-Agent': 'Stripe-Replica/1.0',
      },
      body: payloadJson,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const duration = Date.now() - startTime;
    const responseData = await response.json().catch(() => null);

    // Log the delivery
    await prisma.webhookDelivery.create({
      data: {
        webhookEndpointId: endpoint.id,
        eventId: event.id,
        requestPayload: payload,
        responseStatus: response.status,
        responsePayload: responseData,
        headers: Object.fromEntries(response.headers.entries()),
        signature,
        duration,
      },
    });

    if (response.ok) {
      // Success - reset failure count
      if (endpoint.failureCount > 0) {
        await prisma.webhookEndpoint.update({
          where: { id: endpoint.id },
          data: { failureCount: 0 },
        });
      }

      logger.info('Webhook delivered successfully', {
        eventId: event.id,
        endpointId: endpoint.id,
        status: response.status,
        duration,
      });
    } else {
      // Failed - schedule retry
      await scheduleRetry(event.id);
      await incrementEndpointFailures(endpoint.id);

      logger.warn('Webhook delivery failed', {
        eventId: event.id,
        endpointId: endpoint.id,
        status: response.status,
      });
    }
  } catch (err) {
    const duration = Date.now() - startTime;

    logger.error('Webhook delivery error', {
      eventId: event.id,
      endpointId: endpoint.id,
      error: err instanceof Error ? err.message : String(err),
      duration,
    });

    // Log the delivery attempt
    await prisma.webhookDelivery.create({
      data: {
        webhookEndpointId: endpoint.id,
        eventId: event.id,
        requestPayload: payload,
        responseStatus: undefined,
        responsePayload: undefined,
        headers: {},
        signature,
        duration,
      },
    }).catch(logErr => {
      logger.error('Failed to log webhook delivery', { error: logErr });
    });

    // Schedule retry
    await scheduleRetry(event.id);
    await incrementEndpointFailures(endpoint.id);

    throw err;
  }
}

/**
 * Schedule a retry for a failed webhook event
 * Uses exponential backoff: 1, 2, 5, 10 minutes
 */
async function scheduleRetry(eventId: string): Promise<void> {
  const event = await prisma.webhookEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) return;

  const attempts = event.deliveryAttempts + 1;
  const delays = [1, 2, 5, 10]; // minutes
  const delayIndex = Math.min(attempts - 1, delays.length - 1);
  const delay = delays[delayIndex];

  const nextRetry = new Date(Date.now() + delay * 60 * 1000);

  const status = attempts >= delays.length ? 'failed' : 'retrying';

  await prisma.webhookEvent.update({
    where: { id: eventId },
    data: {
      status,
      nextRetryAt: attempts < delays.length ? nextRetry : null,
      deliveryAttempts: attempts,
      lastError: 'Delivery failed, scheduled for retry',
    },
  });

  logger.info('Webhook retry scheduled', {
    eventId,
    attempt: attempts,
    nextRetry: nextRetry.toISOString(),
  });
}

/**
 * Increment failure count for an endpoint
 * Disable after 5 consecutive failures
 */
async function incrementEndpointFailures(endpointId: string): Promise<void> {
  const endpoint = await prisma.webhookEndpoint.findUnique({
    where: { id: endpointId },
  });

  if (!endpoint) return;

  const newFailureCount = endpoint.failureCount + 1;
  const shouldDisable = newFailureCount >= 5;

  await prisma.webhookEndpoint.update({
    where: { id: endpointId },
    data: {
      failureCount: newFailureCount,
      lastFailedAt: new Date(),
      isActive: !shouldDisable,
    },
  });

  if (shouldDisable) {
    logger.warn('Webhook endpoint disabled due to repeated failures', {
      endpointId,
      failureCount: newFailureCount,
    });
  }
}
