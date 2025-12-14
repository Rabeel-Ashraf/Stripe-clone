import { processPayment, verify3Ds } from '@/lib/checkout';
import { validateCardNumber, validateExpiry, validateCvc, extractBrand } from '@/lib/card-validation';
import { tokenizeCard } from '@/lib/tokenization';

describe('Card Validation', () => {
  describe('validateCardNumber', () => {
    test('accepts valid Visa card', () => {
      expect(validateCardNumber('4242424242424242')).toBe(true);
    });

    test('accepts valid Mastercard', () => {
      expect(validateCardNumber('5555555555554444')).toBe(true);
    });

    test('accepts valid Amex', () => {
      expect(validateCardNumber('378282246310005')).toBe(true);
    });

    test('rejects invalid card number (wrong Luhn)', () => {
      expect(() => validateCardNumber('4242424242424241')).toThrow();
    });

    test('rejects too short card', () => {
      expect(() => validateCardNumber('4242')).toThrow();
    });

    test('handles spaces in card number', () => {
      expect(validateCardNumber('4242 4242 4242 4242')).toBe(true);
    });
  });

  describe('validateExpiry', () => {
    test('accepts future expiry', () => {
      // Use 2025 for test
      expect(validateExpiry(12, 25)).toBe(true);
    });

    test('rejects past expiry', () => {
      expect(() => validateExpiry(1, 20)).toThrow();
    });

    test('rejects invalid month', () => {
      expect(() => validateExpiry(13, 25)).toThrow();
      expect(() => validateExpiry(0, 25)).toThrow();
    });

    test('accepts current month if year is future', () => {
      const now = new Date();
      const futureYear = now.getFullYear() + 1;
      const twoDigitYear = futureYear % 100;
      expect(validateExpiry(1, twoDigitYear)).toBe(true);
    });
  });

  describe('validateCvc', () => {
    test('accepts 3-digit CVC for Visa', () => {
      expect(validateCvc('123', 'visa')).toBe(true);
    });

    test('accepts 4-digit CVC for Amex', () => {
      expect(validateCvc('1234', 'amex')).toBe(true);
    });

    test('rejects 4-digit CVC for Visa', () => {
      expect(() => validateCvc('1234', 'visa')).toThrow();
    });

    test('rejects 3-digit CVC for Amex', () => {
      expect(() => validateCvc('123', 'amex')).toThrow();
    });

    test('rejects non-numeric CVC', () => {
      expect(() => validateCvc('abc')).toThrow();
    });
  });

  describe('extractBrand', () => {
    test('detects Visa', () => {
      expect(extractBrand('4242424242424242')).toBe('visa');
    });

    test('detects Mastercard', () => {
      expect(extractBrand('5555555555554444')).toBe('mastercard');
    });

    test('detects Amex', () => {
      expect(extractBrand('378282246310005')).toBe('amex');
    });

    test('detects Discover', () => {
      expect(extractBrand('6011111111111117')).toBe('discover');
    });

    test('returns unknown for unrecognized card', () => {
      expect(extractBrand('9999999999999999')).toBe('unknown');
    });
  });
});

describe('Card Tokenization', () => {
  test('tokenizes valid card', () => {
    const result = tokenizeCard({
      cardNumber: '4242424242424242',
      expMonth: 12,
      expYear: 25,
      cvc: '123',
    });

    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('brand');
    expect(result).toHaveProperty('last4');
    expect(result.brand).toBe('visa');
    expect(result.last4).toBe('4242');
    expect(result.token).toMatch(/^tok_live_/);
  });

  test('throws on invalid card', () => {
    expect(() =>
      tokenizeCard({
        cardNumber: '4242424242424241', // Invalid Luhn
        expMonth: 12,
        expYear: 25,
        cvc: '123',
      })
    ).toThrow();
  });

  test('throws on expired card', () => {
    expect(() =>
      tokenizeCard({
        cardNumber: '4242424242424242',
        expMonth: 1,
        expYear: 20, // Expired
        cvc: '123',
      })
    ).toThrow();
  });
});

describe('Checkout Flow (Integration)', () => {
  test('validates all card details before processing', async () => {
    // This would test the full processPayment flow
    // In a real test, you'd mock the API calls
    // For now, just verify the validation logic works

    const cardNumber = '4242424242424242';
    const expiry = '12/25';
    const cvc = '123';

    // Parse and validate
    expect(() => validateCardNumber(cardNumber)).not.toThrow();
    
    const [monthStr, yearStr] = expiry.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    
    expect(() => validateExpiry(month, year)).not.toThrow();
    expect(() => validateCvc(cvc)).not.toThrow();

    // Verify brand detection
    const brand = extractBrand(cardNumber);
    expect(brand).toBe('visa');
  });
});
