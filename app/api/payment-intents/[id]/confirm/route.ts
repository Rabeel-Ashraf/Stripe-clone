/**
 * POST /api/payment-intents/:id/confirm
 * Confirms a PaymentIntent with payment method
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { performFraudCheck, getFraudStatus } from '@/lib/fraud-check';
import { authorizeCharge } from '@/lib/authorization';
import { fireWebhook } from '@/lib/webhook';
import { getFailureMessage } from '@/lib/fake-cards';

const confirmPaymentIntentSchema = z.object({
  cardToken: z.string().startsWith('tok_'),
  cardNumber: z.string(), // For authorization simulation only
  clientSecret: z.string().optional(),
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

    // Parse request body
    const body = await req.json();
    const { cardToken, cardNumber, clientSecret } = confirmPaymentIntentSchema.parse(body);

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

    if (paymentIntent.merchantId !== merchantId) {
      return NextResponse.json(
        { error: 'PaymentIntent does not belong to this merchant' },
        { status: 403 }
      );
    }

    // Verify client secret if provided (CSRF protection)
    if (clientSecret && clientSecret !== paymentIntent.clientSecret) {
      return NextResponse.json(
        { error: 'Invalid client secret' },
        { status: 400 }
      );
    }

    // Check if already confirmed
    if (paymentIntent.status !== 'requires_payment_method') {
      return NextResponse.json(
        { error: `PaymentIntent is already ${paymentIntent.status}` },
        { status: 400 }
      );
    }

    // Extract card info from token (in reality, token would be looked up in secure vault)
    // For simulation, we'll extract from the cardNumber and store with token
    const cardLast4 = cardNumber.slice(-4);

    // Import card validation
    const { extractBrand } = await import('@/lib/card-validation');
    const cardBrand = extractBrand(cardNumber);

    // Step 1: Fraud Check
    const fraudCheck = await performFraudCheck(
      merchantId,
      cardLast4,
      paymentIntent.amount,
      paymentIntent.receiptEmail || undefined
    );

    logger.info('Fraud check completed', {
      paymentIntentId: paymentIntent.id,
      fraudScore: fraudCheck.score,
      flags: fraudCheck.flags,
    });

    // If fraud check fails completely, cancel the payment
    if (!fraudCheck.passed) {
      await prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: { status: 'canceled' },
      });

      return NextResponse.json(
        {
          error: 'Payment blocked by fraud detection',
          fraudScore: fraudCheck.score,
          flags: fraudCheck.flags,
        },
        { status: 400 }
      );
    }

    // Step 2: Authorization
    const authResult = await authorizeCharge(
      cardNumber,
      paymentIntent.amount,
      merchantId
    );

    logger.info('Authorization completed', {
      paymentIntentId: paymentIntent.id,
      status: authResult.status,
      requires3ds: authResult.requires3ds,
    });

    // Handle declined authorization
    if (authResult.status === 'declined' || authResult.status === 'error') {
      // Create failed charge record
      const charge = await prisma.charge.create({
        data: {
          merchantId,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'failed',
          cardLast4,
          cardBrand,
          cardToken,
          fraudCheckStatus: getFraudStatus(fraudCheck.score),
          fraudScore: fraudCheck.score,
          authorizationStatus: authResult.status,
          failureCode: authResult.declineReason,
          failureMessage: getFailureMessage(authResult.declineReason || 'card_declined'),
          metadata: paymentIntent.metadata,
          receiptEmail: paymentIntent.receiptEmail,
        },
      });

      // Update PaymentIntent
      await prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: { 
          status: 'canceled',
          cardToken,
          cardLast4,
          cardBrand,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          merchantId,
          action: 'charge.failed',
          resource: 'charge',
          resourceId: charge.id,
          status: 'failure',
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          requestId: req.headers.get('x-request-id') || crypto.randomUUID(),
          details: {
            amount: paymentIntent.amount,
            failureCode: authResult.declineReason,
          },
        },
      });

      // Fire webhook
      await fireWebhook(merchantId, 'payment.failed', {
        id: charge.id,
        paymentIntentId: paymentIntent.id,
        amount: charge.amount,
        status: charge.status,
        failureCode: charge.failureCode,
        failureMessage: charge.failureMessage,
      });

      return NextResponse.json(
        {
          error: 'Payment declined',
          charge: {
            id: charge.id,
            status: charge.status,
            failureCode: charge.failureCode,
            failureMessage: charge.failureMessage,
          },
        },
        { status: 402 }
      );
    }

    // Handle 3DS required
    if (authResult.requires3ds || fraudCheck.requires3ds) {
      await prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: 'requires_action',
          requires3ds: true,
          cardToken,
          cardLast4,
          cardBrand,
        },
      });

      return NextResponse.json({
        id: paymentIntent.id,
        status: 'requires_action',
        nextAction: {
          type: 'redirect_to_3ds',
          redirectUrl: `/3ds/authenticate/${paymentIntent.id}`,
        },
      });
    }

    // Step 3: Create successful charge
    const charge = await prisma.charge.create({
      data: {
        merchantId,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'succeeded',
        cardLast4,
        cardBrand,
        cardToken,
        fraudCheckStatus: getFraudStatus(fraudCheck.score),
        fraudScore: fraudCheck.score,
        authorizationStatus: 'approved',
        authorizationCode: authResult.authorizationCode,
        metadata: paymentIntent.metadata,
        receiptEmail: paymentIntent.receiptEmail,
      },
    });

    // Update PaymentIntent
    await prisma.paymentIntent.update({
      where: { id: paymentIntent.id },
      data: {
        status: 'succeeded',
        cardToken,
        cardLast4,
        cardBrand,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        merchantId,
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
        },
      },
    });

    // Fire webhook
    await fireWebhook(merchantId, 'payment.succeeded', {
      id: charge.id,
      paymentIntentId: paymentIntent.id,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      cardLast4: charge.cardLast4,
      cardBrand: charge.cardBrand,
      createdAt: charge.createdAt,
    });

    logger.info('Charge succeeded', {
      chargeId: charge.id,
      paymentIntentId: paymentIntent.id,
      amount: charge.amount,
    });

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      charge: {
        id: charge.id,
        amount: charge.amount,
        status: charge.status,
        cardLast4: charge.cardLast4,
        cardBrand: charge.cardBrand,
        authorizationCode: charge.authorizationCode,
        createdAt: charge.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to confirm PaymentIntent', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
