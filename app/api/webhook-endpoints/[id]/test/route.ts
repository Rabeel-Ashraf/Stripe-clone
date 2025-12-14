/**
 * POST /api/webhook-endpoints/:id/test - Send test webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { deliverWebhookEvent, queueWebhookEvent } from '@/lib/webhook';
import { nanoid } from 'nanoid';

const testWebhookSchema = z.object({
  eventType: z.string().min(1, 'Event type is required'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const merchantId = req.headers.get('x-merchant-id');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify endpoint exists and belongs to merchant
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: {
        id: params.id,
        merchantId,
      },
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Webhook endpoint not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = testWebhookSchema.parse(body);

    // Queue a test webhook event
    const eventId = await queueWebhookEvent(
      merchantId,
      validatedData.eventType,
      {
        id: `test_${nanoid(12)}`,
        test: true,
        timestamp: new Date().toISOString(),
      }
    );

    logger.info('Test webhook sent', {
      merchantId,
      endpointId: params.id,
      eventType: validatedData.eventType,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        merchantId,
        action: 'webhook_test_sent',
        resource: 'webhook_endpoint',
        resourceId: params.id,
        status: 'success',
        requestId: req.headers.get('x-request-id') || `audit_${nanoid()}`,
        details: {
          eventType: validatedData.eventType,
        },
      },
    });

    return NextResponse.json({
      eventId,
      endpointId: params.id,
      eventType: validatedData.eventType,
      status: 'pending',
      createdAt: new Date(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to send test webhook', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
