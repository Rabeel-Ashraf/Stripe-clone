/**
 * Card Tokenization Module
 * Simulates card tokenization - NEVER stores raw card data
 */

import { nanoid } from 'nanoid';
import { validateCardNumber, validateExpiry, validateCvc, extractBrand } from './card-validation';

export interface TokenizedCard {
  token: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface TokenizeCardInput {
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvc: string;
}

/**
 * Tokenizes a card - simulates what Stripe.js would do
 * Never stores raw card data in the database
 * 
 * @returns A token that can be safely passed to the backend
 */
export function tokenizeCard(input: TokenizeCardInput): TokenizedCard {
  const { cardNumber, expMonth, expYear, cvc } = input;

  // Validate card number (Luhn check)
  validateCardNumber(cardNumber);

  // Validate expiry
  validateExpiry(expMonth, expYear);

  // Extract brand
  const brand = extractBrand(cardNumber);

  // Validate CVC for the card brand
  validateCvc(cvc, brand);

  // Extract last 4 digits
  const sanitized = cardNumber.replace(/\s+/g, '');
  const last4 = sanitized.slice(-4);

  // Generate a unique token (simulate Stripe token format)
  const token = `tok_live_${nanoid(24)}`;

  return {
    token,
    brand,
    last4,
    expMonth,
    expYear,
  };
}

/**
 * Simulates tokenizing a card with minimal validation
 * Used for testing scenarios where you want to bypass strict validation
 */
export function tokenizeCardUnsafe(
  cardNumber: string,
  expMonth: number,
  expYear: number
): TokenizedCard {
  const sanitized = cardNumber.replace(/\s+/g, '');
  const last4 = sanitized.slice(-4);
  const brand = extractBrand(cardNumber);

  return {
    token: `tok_live_${nanoid(24)}`,
    brand,
    last4,
    expMonth,
    expYear,
  };
}
