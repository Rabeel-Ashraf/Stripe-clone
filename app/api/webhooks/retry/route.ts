/**
 * POST /api/webhooks/retry - Process retrying webhook events
 * Called by cron or manually to retry failed webhook deliveries
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { deliverWebhookEvent } from '@/lib/webhook';

export async function POST(req: NextRequest) {
  try {
    // Find all webhook events that are due for retry
    const retryableEvents = await prisma.webhookEvent.findMany({
      where: {
        status: 'retrying',
        nextRetryAt: {
          lte: new Date(),
        },
      },
    });

    logger.info('[Webhook Retry] Found events to retry', {
      count: retryableEvents.length,
    });

    let successCount = 0;
    let errorCount = 0;

    for (const event of retryableEvents) {
      try {
        await deliverWebhookEvent(event.id);
        successCount++;
      } catch (err) {
        logger.error('[Webhook Retry] Error retrying event', {
          eventId: event.id,
          error: err instanceof Error ? err.message : String(err),
        });
        errorCount++;
      }
    }

    logger.info('[Webhook Retry] Completed', {
      total: retryableEvents.length,
      success: successCount,
      errors: errorCount,
    });

    return NextResponse.json({
      processed: retryableEvents.length,
      success: successCount,
      errors: errorCount,
    });
  } catch (error) {
    logger.error('[Webhook Retry] Fatal error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
