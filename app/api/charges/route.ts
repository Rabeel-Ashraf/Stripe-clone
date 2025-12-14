/**
 * GET /api/charges
 * List charges for a merchant
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const merchantId = req.headers.get('x-merchant-id');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // Build query
    const where: any = { merchantId };
    if (status) {
      where.status = status;
    }

    // Fetch charges
    const [charges, totalCount] = await Promise.all([
      prisma.charge.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          cardLast4: true,
          cardBrand: true,
          authorizationCode: true,
          fraudScore: true,
          fraudCheckStatus: true,
          failureCode: true,
          failureMessage: true,
          amountRefunded: true,
          isRefunded: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          paymentIntentId: true,
        },
      }),
      prisma.charge.count({ where }),
    ]);

    return NextResponse.json({
      data: charges,
      totalCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    logger.error('Failed to list charges', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
