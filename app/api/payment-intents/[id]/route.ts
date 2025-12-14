/**
 * GET /api/payment-intents/:id
 * Retrieves a specific PaymentIntent
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientSecret = req.headers.get('x-client-secret');

    // Load PaymentIntent
    const paymentIntent = await prisma.paymentIntent.findUnique({
      where: { id: params.id },
      include: {
        charges: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            cardLast4: true,
            cardBrand: true,
            createdAt: true,
            authorizationCode: true,
          },
        },
      },
    });

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'PaymentIntent not found' },
        { status: 404 }
      );
    }

    // Verify client secret if provided
    if (
      clientSecret &&
      clientSecret !== paymentIntent.clientSecret
    ) {
      return NextResponse.json(
        { error: 'Invalid client secret' },
        { status: 403 }
      );
    }

    // Return public fields only
    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      description: paymentIntent.description,
      requires3ds: paymentIntent.requires3ds,
      threeDSecureStatus: paymentIntent.threeDSecureStatus,
      metadata: paymentIntent.metadata,
      charges: paymentIntent.charges,
      createdAt: paymentIntent.createdAt,
      updatedAt: paymentIntent.updatedAt,
    });
  } catch (error) {
    logger.error('Failed to fetch PaymentIntent', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
