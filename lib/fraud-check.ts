/**
 * Fraud Rules Engine
 * Implements velocity checks, amount limits, card testing detection, and BIN analysis
 */

import { prisma } from './prisma';

export interface FraudCheckResult {
  passed: boolean;
  score: number; // 0-100
  flags: string[];
  requires3ds: boolean;
}

/**
 * Performs comprehensive fraud checks on a payment attempt
 */
export async function performFraudCheck(
  merchantId: string,
  cardLast4: string,
  amount: number,
  email?: string
): Promise<FraudCheckResult> {
  const flags: string[] = [];
  let score = 0;

  // Rule 1: Velocity check (3 charges in 1 minute)
  const oneMinuteAgo = new Date(Date.now() - 60000);
  const recentCharges = await prisma.charge.count({
    where: {
      merchantId,
      cardLast4,
      createdAt: { gte: oneMinuteAgo },
    },
  });

  if (recentCharges >= 3) {
    flags.push('velocity_limit_exceeded');
    score += 30;
  }

  // Rule 2: Large amount check (> $5000)
  if (amount > 500000) {
    flags.push('large_amount');
    score += 20;
  }

  // Rule 3: Card testing (10+ small charges in 10 min)
  const tenMinutesAgo = new Date(Date.now() - 600000);
  const smallCharges = await prisma.charge.count({
    where: {
      merchantId,
      cardLast4,
      amount: { lt: 100 }, // Less than $1
      createdAt: { gte: tenMinutesAgo },
    },
  });

  if (smallCharges >= 10) {
    flags.push('card_testing_pattern');
    score += 35;
  }

  // Rule 4: BIN check (known high-risk BINs)
  const highRiskBins = ['400000', '410000', '424242'];
  const cardBin = cardLast4.slice(0, 6);
  if (highRiskBins.some(bin => cardBin.startsWith(bin.slice(0, Math.min(bin.length, cardLast4.length))))) {
    flags.push('high_risk_bin');
    score += 15;
  }

  // Rule 5: New card (first use) - low impact
  const previousUses = await prisma.charge.count({
    where: { 
      cardLast4, 
      merchantId,
      status: 'succeeded',
    },
  });

  if (previousUses === 0) {
    score += 5;
    flags.push('new_card');
  }

  // Rule 6: Multiple failed attempts
  const recentFailures = await prisma.charge.count({
    where: {
      merchantId,
      cardLast4,
      status: 'failed',
      createdAt: { gte: oneMinuteAgo },
    },
  });

  if (recentFailures >= 3) {
    flags.push('multiple_failed_attempts');
    score += 25;
  }

  // Determine if 3DS is required
  const requires3ds = score >= 40;

  return {
    passed: score < 50,
    score,
    flags,
    requires3ds,
  };
}

/**
 * Gets fraud status string based on score
 */
export function getFraudStatus(score: number): 'passed' | 'flagged' | 'high_risk' {
  if (score < 30) return 'passed';
  if (score < 50) return 'flagged';
  return 'high_risk';
}
