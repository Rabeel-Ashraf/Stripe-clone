/**
 * GET /api/webhook-endpoints/:id/deliveries - View webhook deliveries
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(
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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // Build query
    const where: any = { webhookEndpointId: params.id };
    if (status) {
      where.event = {
        status,
      };
    }

    // Fetch deliveries
    const [deliveries, totalCount] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          event: {
            select: {
              type: true,
              status: true,
            },
          },
        },
      }),
      prisma.webhookDelivery.count({ where }),
    ]);

    return NextResponse.json({
      data: deliveries.map(del => ({
        id: del.id,
        eventId: del.eventId,
        eventType: del.event?.type,
        eventStatus: del.event?.status,
        responseStatus: del.responseStatus,
        duration: del.duration,
        createdAt: del.createdAt,
      })),
      totalCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    logger.error('Failed to list webhook deliveries', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
