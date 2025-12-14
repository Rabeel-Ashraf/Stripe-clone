/**
 * Payment Processing Tests
 * Comprehensive test suite for payment flow
 */

import { tokenizeCard } from '@/lib/tokenization';
import { validateCardNumber, validateExpiry, validateCvc, extractBrand } from '@/lib/card-validation';
import { performFraudCheck } from '@/lib/fraud-check';
import { authorizeCharge } from '@/lib/authorization';
import { getCardOutcome, FAKE_CARDS } from '@/lib/fake-cards';
import { prisma } from '@/lib/prisma';

// Mock prisma for fraud check tests
jest.mock('@/lib/prisma', () => ({
  prisma: {
    charge: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    paymentIntent: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refund: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

describe('Card Tokenization', () => {
  test('Tokenize valid Visa card successfully', () => {
    const result = tokenizeCard({
      cardNumber: '4242424242424242',
      expMonth: 12,
      expYear: 2025,
      cvc: '123',
    });

    expect(result.token).toMatch(/^tok_live_/);
    expect(result.brand).toBe('visa');
    expect(result.last4).toBe('4242');
    expect(result.expMonth).toBe(12);
    expect(result.expYear).toBe(2025);
  });

  test('Tokenize valid Amex card successfully', () => {
    const result = tokenizeCard({
      cardNumber: '378282246310005',
      expMonth: 6,
      expYear: 2026,
      cvc: '1234',
    });

    expect(result.token).toMatch(/^tok_live_/);
    expect(result.brand).toBe('amex');
    expect(result.last4).toBe('0005');
  });

  test('Reject invalid card number (Luhn check)', () => {
    expect(() =>
      tokenizeCard({
        cardNumber: '4242424242424241',
        expMonth: 12,
        expYear: 2025,
        cvc: '123',
      })
    ).toThrow('Invalid card number (failed Luhn check)');
  });

  test('Reject expired card', () => {
    expect(() =>
      tokenizeCard({
        cardNumber: '4242424242424242',
        expMonth: 1,
        expYear: 2020,
        cvc: '123',
      })
    ).toThrow('Card has expired');
  });

  test('Reject invalid CVC', () => {
    expect(() =>
      tokenizeCard({
        cardNumber: '4242424242424242',
        expMonth: 12,
        expYear: 2025,
        cvc: '12',
      })
    ).toThrow('CVC must be 3 or 4 digits');
  });
});

describe('Card Validation', () => {
  test('Luhn validation accepts valid card', () => {
    expect(() => validateCardNumber('4242424242424242')).not.toThrow();
    expect(() => validateCardNumber('378282246310005')).not.toThrow();
  });

  test('Luhn validation rejects invalid card', () => {
    expect(() => validateCardNumber('4242424242424241')).toThrow();
    expect(() => validateCardNumber('1234567890123456')).toThrow();
  });

  test('Extract brand correctly', () => {
    expect(extractBrand('4242424242424242')).toBe('visa');
    expect(extractBrand('5555555555554444')).toBe('mastercard');
    expect(extractBrand('378282246310005')).toBe('amex');
    expect(extractBrand('6011111111111117')).toBe('discover');
  });

  test('Validate expiry not in past', () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(() => validateExpiry(12, nextYear)).not.toThrow();
    expect(() => validateExpiry(1, 2020)).toThrow('Card has expired');
  });

  test('Validate CVC length', () => {
    expect(() => validateCvc('123')).not.toThrow();
    expect(() => validateCvc('1234')).not.toThrow();
    expect(() => validateCvc('12')).toThrow();
    expect(() => validateCvc('12345')).toThrow();
  });
});

describe('Fraud Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Fraud check flags velocity abuse', async () => {
    (prisma.charge.count as jest.Mock).mockImplementation((args) => {
      if (args.where.createdAt?.gte) {
        const minutesAgo = Date.now() - args.where.createdAt.gte.getTime();
        if (minutesAgo <= 60000) return 3; // 3 charges in 1 minute
      }
      return 0;
    });

    const result = await performFraudCheck('merchant123', '4242', 1000);

    expect(result.flags).toContain('velocity_limit_exceeded');
    expect(result.score).toBeGreaterThanOrEqual(30);
  });

  test('Fraud check flags large amount', async () => {
    (prisma.charge.count as jest.Mock).mockResolvedValue(0);

    const result = await performFraudCheck('merchant123', '4242', 600000); // $6000

    expect(result.flags).toContain('large_amount');
    expect(result.score).toBeGreaterThanOrEqual(20);
  });

  test('Fraud check flags card testing pattern', async () => {
    (prisma.charge.count as jest.Mock).mockImplementation((args) => {
      if (args.where.amount?.lt === 100) {
        return 10; // 10 small charges
      }
      return 0;
    });

    const result = await performFraudCheck('merchant123', '4242', 1000);

    expect(result.flags).toContain('card_testing_pattern');
    expect(result.score).toBeGreaterThanOrEqual(35);
  });

  test('Fraud check requires 3DS for high score', async () => {
    (prisma.charge.count as jest.Mock).mockImplementation((args) => {
      if (args.where.createdAt?.gte) {
        const minutesAgo = Date.now() - args.where.createdAt.gte.getTime();
        if (minutesAgo <= 60000) return 3; // Velocity
      }
      if (args.where.amount?.lt === 100) return 10; // Card testing
      return 0;
    });

    const result = await performFraudCheck('merchant123', '4242', 1000);

    expect(result.requires3ds).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(40);
  });

  test('Fraud check passes for normal transaction', async () => {
    (prisma.charge.count as jest.Mock).mockResolvedValue(0);

    const result = await performFraudCheck('merchant123', '4242', 5000);

    expect(result.passed).toBe(true);
    expect(result.score).toBeLessThan(50);
  });
});

describe('Authorization', () => {
  test('Authorization approves known-good card', async () => {
    const result = await authorizeCharge(FAKE_CARDS.SUCCESS, 5000, 'merchant123');

    expect(result.status).toBe('approved');
    expect(result.authorizationCode).toMatch(/^auth_/);
  });

  test('Authorization declines known-bad card', async () => {
    const result = await authorizeCharge(FAKE_CARDS.DECLINE_GENERIC, 5000, 'merchant123');

    expect(result.status).toBe('declined');
    expect(result.declineReason).toBe('card_declined');
  });

  test('Authorization requires 3DS for specific cards', async () => {
    const result = await authorizeCharge(FAKE_CARDS.DECLINE_3DS_REQUIRED, 5000, 'merchant123');

    expect(result.status).toBe('approved');
    expect(result.requires3ds).toBe(true);
  });

  test('Authorization handles lost card', async () => {
    const result = await authorizeCharge(FAKE_CARDS.DECLINE_LOST_CARD, 5000, 'merchant123');

    expect(result.status).toBe('declined');
    expect(result.declineReason).toBe('lost_card');
  });

  test('Authorization handles insufficient funds', async () => {
    const result = await authorizeCharge(FAKE_CARDS.INSUFFICIENT_FUNDS, 5000, 'merchant123');

    expect(result.status).toBe('declined');
    expect(result.declineReason).toBe('insufficient_funds');
  });
});

describe('Card Outcomes', () => {
  test('Success card returns approved', () => {
    const outcome = getCardOutcome(FAKE_CARDS.SUCCESS);
    expect(outcome.status).toBe('approved');
  });

  test('Decline card returns declined with reason', () => {
    const outcome = getCardOutcome(FAKE_CARDS.DECLINE_GENERIC);
    expect(outcome.status).toBe('declined');
    expect(outcome.reason).toBe('card_declined');
  });

  test('3DS card returns approved with 3DS flag', () => {
    const outcome = getCardOutcome(FAKE_CARDS.DECLINE_3DS_REQUIRED);
    expect(outcome.status).toBe('approved');
    expect(outcome.requires3ds).toBe(true);
  });

  test('Unknown card defaults to approved', () => {
    const outcome = getCardOutcome('4111111111111111');
    expect(outcome.status).toBe('approved');
  });
});

describe('Integration Tests', () => {
  test('Full payment flow: tokenize -> fraud check -> authorize', async () => {
    // Mock clean slate
    (prisma.charge.count as jest.Mock).mockResolvedValue(0);

    // Step 1: Tokenize
    const tokenResult = tokenizeCard({
      cardNumber: FAKE_CARDS.SUCCESS,
      expMonth: 12,
      expYear: 2025,
      cvc: '123',
    });

    expect(tokenResult.token).toMatch(/^tok_live_/);

    // Step 2: Fraud check
    const fraudResult = await performFraudCheck(
      'merchant123',
      tokenResult.last4,
      5000
    );

    expect(fraudResult.passed).toBe(true);

    // Step 3: Authorization
    const authResult = await authorizeCharge(
      FAKE_CARDS.SUCCESS,
      5000,
      'merchant123'
    );

    expect(authResult.status).toBe('approved');
    expect(authResult.authorizationCode).toBeDefined();
  });

  test('Declined payment flow', async () => {
    (prisma.charge.count as jest.Mock).mockResolvedValue(0);

    const tokenResult = tokenizeCard({
      cardNumber: FAKE_CARDS.DECLINE_GENERIC,
      expMonth: 12,
      expYear: 2025,
      cvc: '123',
    });

    const fraudResult = await performFraudCheck(
      'merchant123',
      tokenResult.last4,
      5000
    );

    expect(fraudResult.passed).toBe(true);

    const authResult = await authorizeCharge(
      FAKE_CARDS.DECLINE_GENERIC,
      5000,
      'merchant123'
    );

    expect(authResult.status).toBe('declined');
  });
});
