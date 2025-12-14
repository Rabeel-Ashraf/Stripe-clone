/**
 * POST /api/payment-intents/:id/verify-3ds
 * Verifies 3D Secure authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { fireWebhook } from '@/lib/webhook';
import { getFraudStatus } from '@/lib/fraud-check';

const verify3dsSchema = z.object({
  clientSecret: z.string(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { clientSecret: bodyClientSecret, otp } = verify3dsSchema.parse(body);

    // Load PaymentIntent
    const paymentIntent = await prisma.paymentIntent.findUnique({
      where: { id: params.id },
      include: { charges: true },
    });

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'PaymentIntent not found' },
        { status: 404 }
      );
    }

    // Use either header or body client secret
    const headerClientSecret = req.headers.get('x-client-secret');
    const clientSecret = headerClientSecret || bodyClientSecret;

    if (!clientSecret) {
      return NextResponse.json(
        { error: 'Client secret required' },
        { status: 400 }
      );
    }

    // Verify client secret
    if (clientSecret !== paymentIntent.clientSecret) {
      return NextResponse.json(
        { error: 'Invalid client secret' },
        { status: 400 }
      );
    }

    // Check status
    if (paymentIntent.status !== 'requires_action') {
      return NextResponse.json(
        { error: `PaymentIntent is already ${paymentIntent.status}` },
        { status: 400 }
      );
    }

    // Mock 3DS verification - any 6-digit OTP works
    logger.info('3DS verification attempt', {
      paymentIntentId: paymentIntent.id,
      otp: '****** (redacted)',
    });

    // Find the failed charge (from the authorization attempt)
    const existingCharge = paymentIntent.charges[0];

    // Create successful charge for 3DS completion
    const charge = await prisma.charge.create({
      data: {
        merchantId: paymentIntent.merchantId,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'succeeded',
        cardLast4: paymentIntent.cardLast4 || 'unknown',
        cardBrand: paymentIntent.cardBrand || 'unknown',
        cardToken: paymentIntent.cardToken || '',
        fraudCheckStatus: existingCharge?.fraudCheckStatus || 'passed',
        fraudScore: existingCharge?.fraudScore || 0,
        authorizationStatus: 'approved',
        authorizationCode: `auth_3ds_${Math.random().toString(36).substr(2, 12)}`,
        metadata: paymentIntent.metadata as any,
        receiptEmail: paymentIntent.receiptEmail,
      },
    });

    // Update PaymentIntent to succeeded
    await prisma.paymentIntent.update({
      where: { id: paymentIntent.id },
      data: {
        status: 'succeeded',
        threeDSecureStatus: 'authenticated',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        merchantId: paymentIntent.merchantId,
        action: 'charge.created',
        resource: 'charge',
        resourceId: charge.id,
        status: 'success',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        requestId: req.headers.get('x-request-id') || crypto.randomUUID(),
        details: {
          amount: charge.amount,
          cardLast4: charge.cardLast4,
          threeDSecureVerified: true,
        },
      },
    });

    // Fire webhook
    await fireWebhook(paymentIntent.merchantId, 'payment.succeeded', {
      id: charge.id,
      paymentIntentId: paymentIntent.id,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      cardLast4: charge.cardLast4,
      cardBrand: charge.cardBrand,
      createdAt: charge.createdAt,
      threeDSecureVerified: true,
    });

    logger.info('3DS verification succeeded', {
      chargeId: charge.id,
      paymentIntentId: paymentIntent.id,
    });

    return NextResponse.json({
      id: paymentIntent.id,
      status: 'succeeded',
      chargeId: charge.id,
      threeDSecureStatus: 'authenticated',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('3DS verification failed', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
