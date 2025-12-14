/**
 * Card Validation Module
 * Implements Luhn algorithm, expiry validation, CVC validation, and brand detection
 */

export interface CardBrand {
  name: string;
  pattern: RegExp;
  cvcLength: number[];
}

const CARD_BRANDS: CardBrand[] = [
  {
    name: 'visa',
    pattern: /^4/,
    cvcLength: [3],
  },
  {
    name: 'mastercard',
    pattern: /^(5[1-5]|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)/,
    cvcLength: [3],
  },
  {
    name: 'amex',
    pattern: /^3[47]/,
    cvcLength: [4],
  },
  {
    name: 'discover',
    pattern: /^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)/,
    cvcLength: [3],
  },
];

/**
 * Validates card number using Luhn algorithm
 * @throws Error if card number is invalid
 */
export function validateCardNumber(cardNumber: string): boolean {
  const sanitized = cardNumber.replace(/\s+/g, '');
  
  if (!/^\d{13,19}$/.test(sanitized)) {
    throw new Error('Card number must be 13-19 digits');
  }

  let sum = 0;
  let isEven = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    throw new Error('Invalid card number (failed Luhn check)');
  }

  return true;
}

/**
 * Validates card expiry date
 * @throws Error if expiry is in the past
 */
export function validateExpiry(month: number, year: number): boolean {
  if (month < 1 || month > 12) {
    throw new Error('Invalid expiry month (must be 1-12)');
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Normalize 2-digit year to 4-digit
  const fullYear = year < 100 ? 2000 + year : year;

  if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
    throw new Error('Card has expired');
  }

  return true;
}

/**
 * Validates CVC code
 * @throws Error if CVC is invalid
 */
export function validateCvc(cvc: string, brand?: string): boolean {
  if (!/^\d{3,4}$/.test(cvc)) {
    throw new Error('CVC must be 3 or 4 digits');
  }

  if (brand) {
    const cardBrand = CARD_BRANDS.find(b => b.name === brand.toLowerCase());
    if (cardBrand && !cardBrand.cvcLength.includes(cvc.length)) {
      throw new Error(`CVC for ${brand} must be ${cardBrand.cvcLength.join(' or ')} digits`);
    }
  }

  return true;
}

/**
 * Extracts card brand from card number using BIN ranges
 */
export function extractBrand(cardNumber: string): string {
  const sanitized = cardNumber.replace(/\s+/g, '');

  for (const brand of CARD_BRANDS) {
    if (brand.pattern.test(sanitized)) {
      return brand.name;
    }
  }

  return 'unknown';
}

/**
 * Gets expected CVC length for a card brand
 */
export function getCvcLength(brand: string): number[] {
  const cardBrand = CARD_BRANDS.find(b => b.name === brand.toLowerCase());
  return cardBrand?.cvcLength || [3, 4];
}
