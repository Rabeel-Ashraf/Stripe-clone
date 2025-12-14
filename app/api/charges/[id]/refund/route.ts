/**
 * POST /api/charges/:id/refund
 * Refund a charge (full or partial)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { fireWebhook } from '@/lib/webhook';

const refundSchema = z.object({
  amount: z.number().int().positive().optional(),
  reason: z.enum(['requested_by_customer', 'duplicate', 'fraudulent']).optional(),
  metadata: z.record(z.any()).optional(),
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
    const { amount, reason, metadata } = refundSchema.parse(body);

    // Load charge
    const charge = await prisma.charge.findUnique({
      where: { id: params.id },
      include: { refunds: true },
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

    // Verify charge can be refunded
    if (charge.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Only succeeded charges can be refunded' },
        { status: 400 }
      );
    }

    // Determine refund amount (full refund if not specified)
    const refundAmount = amount || (charge.amount - charge.amountRefunded);

    // Verify refund amount is valid
    const availableToRefund = charge.amount - charge.amountRefunded;
    if (refundAmount > availableToRefund) {
      return NextResponse.json(
        {
          error: 'Refund amount exceeds available balance',
          available: availableToRefund,
          requested: refundAmount,
        },
        { status: 400 }
      );
    }

    if (refundAmount <= 0) {
      return NextResponse.json(
        { error: 'Refund amount must be positive' },
        { status: 400 }
      );
    }

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        merchantId,
        chargeId: charge.id,
        amount: refundAmount,
        currency: charge.currency,
        status: 'succeeded', // In production, this would be async
        reason,
        metadata: metadata || {},
      },
    });

    // Update charge
    const newAmountRefunded = charge.amountRefunded + refundAmount;
    const isFullyRefunded = newAmountRefunded >= charge.amount;

    await prisma.charge.update({
      where: { id: charge.id },
      data: {
        amountRefunded: newAmountRefunded,
        isRefunded: isFullyRefunded,
        refundedAt: isFullyRefunded ? new Date() : charge.refundedAt,
        status: isFullyRefunded ? 'refunded' : charge.status,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        merchantId,
        action: 'refund.issued',
        resource: 'refund',
        resourceId: refund.id,
        status: 'success',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        requestId: req.headers.get('x-request-id') || crypto.randomUUID(),
        details: {
          chargeId: charge.id,
          amount: refundAmount,
          reason,
        },
      },
    });

    // Fire webhook
    await fireWebhook(merchantId, 'charge.refunded', {
      id: refund.id,
      chargeId: charge.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      createdAt: refund.createdAt,
    });

    logger.info('Refund created', {
      refundId: refund.id,
      chargeId: charge.id,
      amount: refundAmount,
    });

    return NextResponse.json({
      id: refund.id,
      chargeId: refund.chargeId,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      metadata: refund.metadata,
      createdAt: refund.createdAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to create refund', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
