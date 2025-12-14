/**
 * POST /api/webhook-endpoints - Create webhook endpoint
 * GET /api/webhook-endpoints - List webhook endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createHmac, randomBytes } from 'crypto';

const createWebhookEndpointSchema = z.object({
  url: z.string().url('Invalid URL format'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
});

function generateWebhookSecret(): string {
  const secret = randomBytes(32).toString('hex');
  return `whsec_${secret}`;
}

export async function POST(req: NextRequest) {
  try {
    const merchantId = req.headers.get('x-merchant-id');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = createWebhookEndpointSchema.parse(body);

    // Generate secret
    const secret = generateWebhookSecret();

    // Create webhook endpoint
    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        id: `wh_${nanoid(24)}`,
        merchantId,
        url: validatedData.url,
        secret,
        events: validatedData.events,
        isActive: true,
      },
    });

    logger.info('Webhook endpoint created', {
      merchantId,
      endpointId: endpoint.id,
      url: validatedData.url,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        merchantId,
        action: 'webhook_endpoint_created',
        resource: 'webhook_endpoint',
        resourceId: endpoint.id,
        status: 'success',
        requestId: req.headers.get('x-request-id') || `audit_${nanoid()}`,
        details: {
          url: validatedData.url,
          events: validatedData.events,
        },
      },
    });

    return NextResponse.json({
      id: endpoint.id,
      url: endpoint.url,
      events: endpoint.events,
      secret: endpoint.secret, // Only returned once on creation
      isActive: endpoint.isActive,
      failureCount: endpoint.failureCount,
      createdAt: endpoint.createdAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to create webhook endpoint', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const merchantId = req.headers.get('x-merchant-id');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      data: endpoints.map(ep => ({
        id: ep.id,
        url: ep.url,
        events: ep.events,
        isActive: ep.isActive,
        failureCount: ep.failureCount,
        lastFailedAt: ep.lastFailedAt,
        createdAt: ep.createdAt,
        updatedAt: ep.updatedAt,
      })),
    });
  } catch (error) {
    logger.error('Failed to list webhook endpoints', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
