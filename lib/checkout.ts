/**
 * Checkout Flow Client-Side Processing
 * Handles payment form submission, tokenization, and intent confirmation
 */

import { validateCardNumber, validateExpiry, validateCvc, extractBrand } from './card-validation';

export interface BillingDetails {
  fullName: string;
  email: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface PaymentResult {
  success: boolean;
  requires3ds?: boolean;
  intentId?: string;
  error?: string;
  chargeId?: string;
}

/**
 * Tokenizes card information and processes payment
 */
export async function processPayment(
  intentId: string,
  clientSecret: string,
  cardNumber: string,
  expiry: string,
  cvc: string,
  billingDetails: BillingDetails
): Promise<PaymentResult> {
  try {
    // 1. Client-side validation
    const sanitizedCard = cardNumber.replace(/\s+/g, '');
    
    try {
      validateCardNumber(sanitizedCard);
    } catch (err) {
      return { success: false, error: 'Card number is invalid' };
    }

    // Parse expiry MM/YY
    const [monthStr, yearStr] = expiry.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    try {
      validateExpiry(month, year);
    } catch (err) {
      return { success: false, error: 'Card expired' };
    }

    const brand = extractBrand(sanitizedCard);
    try {
      validateCvc(cvc, brand);
    } catch (err) {
      return { success: false, error: 'CVC is invalid' };
    }

    // 2. Tokenize card on backend
    const tokenResponse = await fetch('/api/tokenize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardNumber: sanitizedCard,
        expMonth: month,
        expYear: year,
        cvc,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      return { success: false, error: error.error || 'Tokenization failed' };
    }

    const { token, brand: tokenBrand, last4 } = await tokenResponse.json();

    // 3. Confirm PaymentIntent with token
    const confirmResponse = await fetch(`/api/payment-intents/${intentId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSecret,
        cardToken: token,
        cardNumber: sanitizedCard,
        billingDetails,
      }),
    });

    const confirmData = await confirmResponse.json();

    if (!confirmResponse.ok) {
      if (confirmData.error === 'Payment blocked by fraud detection') {
        return { 
          success: false, 
          error: 'Payment blocked by fraud detection. Please contact support.',
        };
      }
      return { 
        success: false, 
        error: confirmData.charge?.failureMessage || confirmData.error || 'Payment failed',
      };
    }

    // Check if 3DS is required
    if (confirmData.nextAction?.type === 'redirect_to_3ds') {
      return { 
        success: false, 
        requires3ds: true, 
        intentId: confirmData.id,
      };
    }

    return { 
      success: true, 
      intentId: confirmData.id,
      chargeId: confirmData.charge?.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}

/**
 * Verifies 3DS OTP
 */
export async function verify3Ds(
  intentId: string,
  clientSecret: string,
  otp: string
): Promise<PaymentResult> {
  try {
    const response = await fetch(`/api/payment-intents/${intentId}/verify-3ds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientSecret, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Verification failed' };
    }

    return { 
      success: true, 
      intentId: data.id,
      chargeId: data.chargeId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    return { success: false, error: message };
  }
}
