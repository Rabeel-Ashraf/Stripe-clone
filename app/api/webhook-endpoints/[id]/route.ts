/**
 * GET /api/webhook-endpoints/:id/deliveries - View deliveries
 * PATCH /api/webhook-endpoints/:id - Update webhook
 * DELETE /api/webhook-endpoints/:id - Delete webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const updateWebhookEndpointSchema = z.object({
  url: z.string().url('Invalid URL format').optional(),
  events: z.array(z.string()).min(1, 'At least one event is required').optional(),
});

export async function PATCH(
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

    // Verify endpoint exists
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
    const validatedData = updateWebhookEndpointSchema.parse(body);

    const updateData: any = {};
    if (validatedData.url !== undefined) {
      updateData.url = validatedData.url;
    }
    if (validatedData.events !== undefined) {
      updateData.events = validatedData.events;
    }

    const updated = await prisma.webhookEndpoint.update({
      where: { id: params.id },
      data: updateData,
    });

    logger.info('Webhook endpoint updated', {
      merchantId,
      endpointId: params.id,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        merchantId,
        action: 'webhook_endpoint_updated',
        resource: 'webhook_endpoint',
        resourceId: params.id,
        status: 'success',
        requestId: req.headers.get('x-request-id') || `audit_${nanoid()}`,
        details: validatedData,
      },
    });

    return NextResponse.json({
      id: updated.id,
      url: updated.url,
      events: updated.events,
      isActive: updated.isActive,
      failureCount: updated.failureCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to update webhook endpoint', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verify endpoint exists
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

    // Delete endpoint
    const deleted = await prisma.webhookEndpoint.delete({
      where: { id: params.id },
    });

    logger.info('Webhook endpoint deleted', {
      merchantId,
      endpointId: params.id,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        merchantId,
        action: 'webhook_endpoint_deleted',
        resource: 'webhook_endpoint',
        resourceId: params.id,
        status: 'success',
        requestId: req.headers.get('x-request-id') || `audit_${nanoid()}`,
      },
    });

    return NextResponse.json({
      id: deleted.id,
      deleted: true,
    });
  } catch (error) {
    logger.error('Failed to delete webhook endpoint', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
