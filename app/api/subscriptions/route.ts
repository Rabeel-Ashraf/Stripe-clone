/**
 * POST /api/subscriptions - Create subscription
 * GET /api/subscriptions - List subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { queueWebhookEvent } from '@/lib/webhook';
import { addIntervalToDate } from '@/lib/billing-engine';

const createSubscriptionSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  priceId: z.string().min(1, 'Price ID is required'),
  quantity: z.number().int().positive().default(1),
  trialDays: z.number().int().min(0).optional(),
  metadata: z.record(z.any()).optional(),
});

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
    const validatedData = createSubscriptionSchema.parse(body);

    // Verify customer exists
    const customer = await prisma.customer.findFirst({
      where: {
        id: validatedData.customerId,
        merchantId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify price exists and is recurring
    const price = await prisma.price.findFirst({
      where: {
        id: validatedData.priceId,
        merchantId,
      },
    });

    if (!price) {
      return NextResponse.json(
        { error: 'Price not found' },
        { status: 404 }
      );
    }

    if (price.type !== 'recurring') {
      return NextResponse.json(
        { error: 'Price must be a recurring type' },
        { status: 400 }
      );
    }

    // Check for existing active subscription
    const existing = await prisma.subscription.findFirst({
      where: {
        merchantId,
        customerId: validatedData.customerId,
        priceId: validatedData.priceId,
        status: { in: ['active', 'paused', 'incomplete'] },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An active subscription already exists for this customer and price' },
        { status: 409 }
      );
    }

    // Calculate billing dates
    const now = new Date();
    const trialEnd = validatedData.trialDays
      ? new Date(now.getTime() + validatedData.trialDays * 24 * 60 * 60 * 1000)
      : null;

    const nextBillingDate = trialEnd || addIntervalToDate(
      now,
      price.recurringInterval || 'month',
      price.recurringIntervalCount || 1
    );

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        id: `sub_${nanoid(24)}`,
        merchantId,
        customerId: validatedData.customerId,
        priceId: validatedData.priceId,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: nextBillingDate,
        nextBillingDate,
        trialStart: validatedData.trialDays ? now : null,
        trialEnd,
        trialDaysLeft: validatedData.trialDays,
        quantity: validatedData.quantity,
        metadata: validatedData.metadata || {},
      },
      include: { price: true },
    });

    logger.info('Subscription created', {
      merchantId,
      subscriptionId: subscription.id,
      customerId: validatedData.customerId,
    });

    // Fire webhook
    await queueWebhookEvent(merchantId, 'subscription.created', {
      id: subscription.id,
      customerId: subscription.customerId,
      priceId: subscription.priceId,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      nextBillingDate: subscription.nextBillingDate,
      trialEnd: subscription.trialEnd,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        merchantId,
        action: 'subscription_created',
        resource: 'subscription',
        resourceId: subscription.id,
        status: 'success',
        requestId: req.headers.get('x-request-id') || `audit_${nanoid()}`,
        details: {
          customerId: validatedData.customerId,
          priceId: validatedData.priceId,
          trialDays: validatedData.trialDays,
        },
      },
    });

    return NextResponse.json({
      id: subscription.id,
      customerId: subscription.customerId,
      priceId: subscription.priceId,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      nextBillingDate: subscription.nextBillingDate,
      trialEnd: subscription.trialEnd,
      quantity: subscription.quantity,
      metadata: subscription.metadata,
      createdAt: subscription.createdAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to create subscription', { error });
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

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');

    const where: any = { merchantId };
    if (customerId) {
      where.customerId = customerId;
    }
    if (status) {
      where.status = status;
    }

    const [subscriptions, totalCount] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { price: true },
      }),
      prisma.subscription.count({ where }),
    ]);

    return NextResponse.json({
      data: subscriptions.map(sub => ({
        id: sub.id,
        customerId: sub.customerId,
        priceId: sub.priceId,
        status: sub.status,
        amount: sub.price.amount,
        currency: sub.price.currency,
        quantity: sub.quantity,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        nextBillingDate: sub.nextBillingDate,
        trialEnd: sub.trialEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        failureCount: sub.failureCount,
        createdAt: sub.createdAt,
      })),
      totalCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    logger.error('Failed to list subscriptions', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
