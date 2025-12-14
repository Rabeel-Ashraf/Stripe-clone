/**
 * Billing Engine Module
 * Handles recurring billing cycles via cron job
 */

import cron from 'node-cron';
import { prisma } from './prisma';
import { logger } from './logger';
import { nanoid } from 'nanoid';
import { queueWebhookEvent } from './webhook';

/**
 * Start the daily billing engine
 * Runs at 2 AM UTC every day to process subscriptions due for billing
 */
export function startBillingEngine() {
  // Run daily at 02:00 UTC: 0 2 * * *
  const job = cron.schedule('0 2 * * *', async () => {
    logger.info('[Billing Engine] Starting daily billing run');

    try {
      const dueBillings = await prisma.subscription.findMany({
        where: {
          status: { in: ['active'] },
          nextBillingDate: { lte: new Date() },
        },
        include: {
          price: true,
          customer: true,
          merchant: true,
        },
      });

      logger.info('[Billing Engine] Found subscriptions to bill', {
        count: dueBillings.length,
      });

      for (const sub of dueBillings) {
        try {
          await processSubscriptionBilling(sub);
        } catch (err) {
          logger.error('[Billing Engine] Error billing subscription', {
            subscriptionId: sub.id,
            error: err instanceof Error ? err.message : String(err),
          });
          // Continue with next subscription
        }
      }

      logger.info('[Billing Engine] Daily billing run complete');
    } catch (err) {
      logger.error('[Billing Engine] Fatal error', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  logger.info('[Billing Engine] Scheduled daily at 02:00 UTC');
  return job;
}

/**
 * Process a single subscription billing cycle
 */
export async function processSubscriptionBilling(subscription: any) {
  const {
    id: subscriptionId,
    merchantId,
    customerId,
    priceId,
    price,
    customer,
    quantity,
  } = subscription;

  try {
    // Create a fake payment intent for this billing cycle
    const paymentIntentId = `pi_${nanoid(24)}`;

    // Create charge for this billing cycle
    const charge = await prisma.charge.create({
      data: {
        merchantId,
        paymentIntentId,
        subscriptionId,
        amount: price.amount * quantity,
        currency: price.currency || 'usd',
        status: 'succeeded',
        cardLast4: customer.defaultCardLast4 || 'xxxx',
        cardBrand: customer.defaultCardBrand || 'unknown',
        cardToken: customer.defaultCardToken || `tok_${nanoid(16)}`,
        authorizationStatus: 'approved',
        authorizationCode: `auth_${nanoid(12)}`,
        fraudCheckStatus: 'passed',
      },
    });

    // Calculate next billing date
    const nextBillingDate = addIntervalToDate(
      new Date(),
      price.recurringInterval || 'month',
      price.recurringIntervalCount || 1
    );

    // Update subscription with new billing dates
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        currentPeriodStart: new Date(),
        currentPeriodEnd: nextBillingDate,
        nextBillingDate,
        failureCount: 0, // Reset on success
        lastFailureAt: null,
      },
      include: { price: true },
    });

    // Fire webhook: subscription.renewed
    await queueWebhookEvent(merchantId, 'subscription.renewed', {
      id: subscriptionId,
      customerId,
      chargeId: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      nextBillingDate,
      status: 'active',
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        merchantId,
        action: 'subscription_billed',
        resource: 'subscription',
        resourceId: subscriptionId,
        status: 'success',
        requestId: `billing_${nanoid()}`,
        details: {
          chargeId: charge.id,
          amount: charge.amount,
          nextBillingDate: nextBillingDate.toISOString(),
        },
      },
    });

    logger.info('[Billing Engine] Subscription billed successfully', {
      subscriptionId,
      chargeId: charge.id,
      amount: charge.amount,
    });
  } catch (err) {
    logger.error('[Billing Engine] Failed to process subscription', {
      subscriptionId,
      error: err instanceof Error ? err.message : String(err),
    });

    // Increment failure count
    const updatedSub = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        failureCount: { increment: 1 },
        lastFailureAt: new Date(),
      },
    });

    // After 3 failures, mark as past_due
    if (updatedSub.failureCount >= 3) {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'past_due' },
      });

      // Fire webhook: subscription.past_due
      await queueWebhookEvent(merchantId, 'subscription.past_due', {
        id: subscriptionId,
        customerId: subscription.customerId,
        failureCount: updatedSub.failureCount,
        reason: 'payment_failure',
      });

      logger.info('[Billing Engine] Subscription marked as past_due', {
        subscriptionId,
        failureCount: updatedSub.failureCount,
      });
    }

    // Create audit log for failure
    await prisma.auditLog.create({
      data: {
        merchantId,
        action: 'subscription_billing_failed',
        resource: 'subscription',
        resourceId: subscriptionId,
        status: 'failure',
        requestId: `billing_${nanoid()}`,
        details: {
          error: err instanceof Error ? err.message : String(err),
          failureCount: updatedSub.failureCount,
        },
      },
    });

    throw err;
  }
}

/**
 * Add a time interval to a date
 * Used to calculate next billing date
 */
export function addIntervalToDate(
  date: Date,
  interval: string,
  count: number
): Date {
  const d = new Date(date);

  switch (interval.toLowerCase()) {
    case 'day':
      d.setDate(d.getDate() + count);
      break;
    case 'week':
      d.setDate(d.getDate() + count * 7);
      break;
    case 'month':
      d.setMonth(d.getMonth() + count);
      break;
    case 'year':
      d.setFullYear(d.getFullYear() + count);
      break;
    default:
      // Default to month if interval is unknown
      d.setMonth(d.getMonth() + count);
  }

  return d;
}

/**
 * Initialize the billing engine (should be called on app startup)
 */
export function initializeBackgroundJobs() {
  // Only start in production or if explicitly enabled
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.RUN_CRON === 'true'
  ) {
    startBillingEngine();
  } else {
    logger.info('[Billing Engine] Skipped (set RUN_CRON=true to enable)');
  }
}
