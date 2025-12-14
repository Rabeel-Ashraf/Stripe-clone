/**
 * POST /api/payment-intents
 * Creates a new PaymentIntent
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const createPaymentIntentSchema = z.object({
  amount: z.number().int().positive().min(50, 'Amount must be at least $0.50'),
  currency: z.string().default('usd').refine(val => ['usd', 'eur', 'gbp'].includes(val)),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  customerId: z.string().optional(),
  receiptEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Get merchant from API key authentication (set by middleware)
    const merchantId = req.headers.get('x-merchant-id');
    const publishableKey = req.headers.get('x-publishable-key');

    if (!merchantId || !publishableKey) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide a valid API key.' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = createPaymentIntentSchema.parse(body);

    // Generate client secret
    const id = `pi_${nanoid(24)}`;
    const clientSecret = `${id}_secret_${nanoid(32)}`;

    // Create PaymentIntent
    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        id,
        merchantId,
        publishableKey,
        clientSecret,
        amount: validatedData.amount,
        currency: validatedData.currency,
        status: 'requires_payment_method',
        description: validatedData.description,
        metadata: validatedData.metadata || {},
        customerId: validatedData.customerId,
        receiptEmail: validatedData.receiptEmail,
      },
    });

    logger.info('PaymentIntent created', {
      merchantId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
    });

    // Return public fields only
    return NextResponse.json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.clientSecret,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      description: paymentIntent.description,
      metadata: paymentIntent.metadata,
      createdAt: paymentIntent.createdAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to create PaymentIntent', { error });
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

    // Fetch payment intents
    const [paymentIntents, totalCount] = await Promise.all([
      prisma.paymentIntent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          status: true,
          amount: true,
          currency: true,
          description: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.paymentIntent.count({ where }),
    ]);

    return NextResponse.json({
      data: paymentIntents,
      totalCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    logger.error('Failed to list PaymentIntents', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
