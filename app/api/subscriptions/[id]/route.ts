/**
 * GET /api/subscriptions/:id - Get subscription details
 * PATCH /api/subscriptions/:id - Update subscription
 * DELETE /api/subscriptions/:id - Cancel subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { queueWebhookEvent } from '@/lib/webhook';

const updateSubscriptionSchema = z.object({
  quantity: z.number().int().positive().optional(),
  status: z.enum(['active', 'paused', 'cancelled']).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  trialDays: z.number().int().min(0).optional(),
  metadata: z.record(z.any()).optional(),
});

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

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: params.id,
        merchantId,
      },
      include: { price: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: subscription.id,
      customerId: subscription.customerId,
      priceId: subscription.priceId,
      status: subscription.status,
      amount: subscription.price.amount,
      currency: subscription.price.currency,
      quantity: subscription.quantity,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      nextBillingDate: subscription.nextBillingDate,
      trialEnd: subscription.trialEnd,
      trialDaysLeft: subscription.trialDaysLeft,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      cancelledAt: subscription.cancelledAt,
      cancellationReason: subscription.cancellationReason,
      failureCount: subscription.failureCount,
      lastFailureAt: subscription.lastFailureAt,
      metadata: subscription.metadata,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    });
  } catch (error) {
    logger.error('Failed to get subscription', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Verify subscription exists
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: params.id,
        merchantId,
      },
      include: { price: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Parse and validate request
    const body = await req.json();
    const validatedData = updateSubscriptionSchema.parse(body);

    // Build update data
    const updateData: any = {};

    if (validatedData.quantity !== undefined) {
      updateData.quantity = validatedData.quantity;
    }

    if (validatedData.cancelAtPeriodEnd !== undefined) {
      updateData.cancelAtPeriodEnd = validatedData.cancelAtPeriodEnd;
    }

    if (validatedData.metadata !== undefined) {
      updateData.metadata = validatedData.metadata;
    }

    let webhookEvent = null;
    let webhookData = null;

    if (validatedData.status !== undefined) {
      const oldStatus = subscription.status;
      updateData.status = validatedData.status;

      if (validatedData.status === 'cancelled') {
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = 'customer_request';
        webhookEvent = 'subscription.cancelled';
        webhookData = {
          id: subscription.id,
          customerId: subscription.customerId,
          status: 'cancelled',
          cancellationReason: 'customer_request',
        };
      } else if (oldStatus === 'paused' && validatedData.status === 'active') {
        webhookEvent = 'subscription.resumed';
        webhookData = {
          id: subscription.id,
          customerId: subscription.customerId,
          status: 'active',
        };
      } else if (oldStatus === 'active' && validatedData.status === 'paused') {
        webhookEvent = 'subscription.paused';
        webhookData = {
          id: subscription.id,
          customerId: subscription.customerId,
          status: 'paused',
        };
      }
    }

    // Update subscription
    const updated = await prisma.subscription.update({
      where: { id: params.id },
      data: updateData,
      include: { price: true },
    });

    logger.info('Subscription updated', {
      merchantId,
      subscriptionId: params.id,
      changes: Object.keys(validatedData),
    });

    // Fire webhook if status changed
    if (webhookEvent && webhookData) {
      await queueWebhookEvent(merchantId, webhookEvent, webhookData);
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        merchantId,
        action: 'subscription_updated',
        resource: 'subscription',
        resourceId: params.id,
        status: 'success',
        requestId: req.headers.get('x-request-id') || `audit_${nanoid()}`,
        details: validatedData,
      },
    });

    return NextResponse.json({
      id: updated.id,
      customerId: updated.customerId,
      priceId: updated.priceId,
      status: updated.status,
      amount: updated.price.amount,
      currency: updated.price.currency,
      quantity: updated.quantity,
      currentPeriodStart: updated.currentPeriodStart,
      currentPeriodEnd: updated.currentPeriodEnd,
      nextBillingDate: updated.nextBillingDate,
      trialEnd: updated.trialEnd,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      cancelledAt: updated.cancelledAt,
      failureCount: updated.failureCount,
      metadata: updated.metadata,
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

    logger.error('Failed to update subscription', { error });
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

    // Verify subscription exists
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: params.id,
        merchantId,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Cancel immediately
    const cancelled = await prisma.subscription.update({
      where: { id: params.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: 'customer_request',
      },
      include: { price: true },
    });

    logger.info('Subscription cancelled', {
      merchantId,
      subscriptionId: params.id,
    });

    // Fire webhook
    await queueWebhookEvent(merchantId, 'subscription.cancelled', {
      id: cancelled.id,
      customerId: cancelled.customerId,
      status: 'cancelled',
      cancellationReason: 'customer_request',
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        merchantId,
        action: 'subscription_cancelled',
        resource: 'subscription',
        resourceId: params.id,
        status: 'success',
        requestId: req.headers.get('x-request-id') || `audit_${nanoid()}`,
        details: {
          cancellationReason: 'customer_request',
        },
      },
    });

    return NextResponse.json({
      id: cancelled.id,
      customerId: cancelled.customerId,
      priceId: cancelled.priceId,
      status: cancelled.status,
      amount: cancelled.price.amount,
      currency: cancelled.price.currency,
      cancelledAt: cancelled.cancelledAt,
      cancellationReason: cancelled.cancellationReason,
      createdAt: cancelled.createdAt,
      updatedAt: cancelled.updatedAt,
    });
  } catch (error) {
    logger.error('Failed to cancel subscription', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
