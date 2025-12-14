/**
 * GET /api/charges/:id
 * Retrieve a single charge
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

    // Fetch charge
    const charge = await prisma.charge.findUnique({
      where: { id: params.id },
      include: {
        refunds: {
          orderBy: { createdAt: 'desc' },
        },
        paymentIntent: {
          select: {
            id: true,
            description: true,
          },
        },
      },
    });

    if (!charge) {
      return NextResponse.json(
        { error: 'Charge not found' },
        { status: 404 }
      );
    }

    if (charge.merchantId !== merchantId) {
      return NextResponse.json(
        { error: 'Charge does not belong to this merchant' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      cardLast4: charge.cardLast4,
      cardBrand: charge.cardBrand,
      cardToken: charge.cardToken,
      authorizationStatus: charge.authorizationStatus,
      authorizationCode: charge.authorizationCode,
      fraudCheckStatus: charge.fraudCheckStatus,
      fraudScore: charge.fraudScore,
      failureCode: charge.failureCode,
      failureMessage: charge.failureMessage,
      amountRefunded: charge.amountRefunded,
      isRefunded: charge.isRefunded,
      refundedAt: charge.refundedAt,
      metadata: charge.metadata,
      receiptEmail: charge.receiptEmail,
      receiptUrl: charge.receiptUrl,
      createdAt: charge.createdAt,
      updatedAt: charge.updatedAt,
      paymentIntent: charge.paymentIntent,
      refunds: charge.refunds,
    });
  } catch (error) {
    logger.error('Failed to retrieve charge', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
