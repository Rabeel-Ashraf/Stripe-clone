/**
 * Fake Cards Database for Testing
 * Simulates various card scenarios for payment processing
 */

export const FAKE_CARDS = {
  // Success scenarios
  SUCCESS: '4242424242424242',
  SUCCESS_VISA: '4012888888881881',
  
  // Decline scenarios
  DECLINE_GENERIC: '4000000000000002',
  DECLINE_LOST_CARD: '4000000000000004',
  DECLINE_STOLEN_CARD: '4000000000000009',
  DECLINE_PROCESSING_ERROR: '4000000000000119',
  DECLINE_3DS_REQUIRED: '4000002500003155',
  
  // Amex
  AMEX_SUCCESS: '378282246310005',
  AMEX_DECLINE: '371449635398431',
  
  // Expired card
  EXPIRED: '4000000000000069',
  
  // Low funds
  INSUFFICIENT_FUNDS: '4000000000000341',
} as const;

export interface CardOutcome {
  status: 'approved' | 'declined';
  reason?: string;
  requires3ds?: boolean;
}

/**
 * Determines the outcome of a charge based on the card number
 * This simulates what a real payment processor would return
 */
export function getCardOutcome(cardNumber: string): CardOutcome {
  const sanitized = cardNumber.replace(/\s+/g, '');

  switch (sanitized) {
    case FAKE_CARDS.SUCCESS:
    case FAKE_CARDS.SUCCESS_VISA:
    case FAKE_CARDS.AMEX_SUCCESS:
      return { status: 'approved' };

    case FAKE_CARDS.DECLINE_GENERIC:
      return { status: 'declined', reason: 'card_declined' };

    case FAKE_CARDS.DECLINE_LOST_CARD:
      return { status: 'declined', reason: 'lost_card' };

    case FAKE_CARDS.DECLINE_STOLEN_CARD:
      return { status: 'declined', reason: 'stolen_card' };

    case FAKE_CARDS.DECLINE_PROCESSING_ERROR:
      return { status: 'declined', reason: 'processing_error' };

    case FAKE_CARDS.DECLINE_3DS_REQUIRED:
      return { status: 'approved', requires3ds: true };

    case FAKE_CARDS.AMEX_DECLINE:
      return { status: 'declined', reason: 'card_declined' };

    case FAKE_CARDS.EXPIRED:
      return { status: 'declined', reason: 'expired_card' };

    case FAKE_CARDS.INSUFFICIENT_FUNDS:
      return { status: 'declined', reason: 'insufficient_funds' };

    default:
      // Default behavior for unknown cards: approve
      return { status: 'approved' };
  }
}

/**
 * Maps decline reasons to user-friendly messages
 */
export function getFailureMessage(reason: string): string {
  const messages: Record<string, string> = {
    card_declined: 'Your card was declined. Please try a different payment method.',
    lost_card: 'Your card has been reported as lost. Please contact your bank.',
    stolen_card: 'Your card has been reported as stolen. Please contact your bank.',
    processing_error: 'An error occurred while processing your card. Please try again.',
    expired_card: 'Your card has expired. Please use a different card.',
    insufficient_funds: 'Your card has insufficient funds. Please use a different card.',
    invalid_cvc: 'The CVC code you entered is invalid.',
    invalid_expiry: 'The expiry date you entered is invalid.',
    invalid_number: 'The card number you entered is invalid.',
  };

  return messages[reason] || 'Your payment could not be processed. Please try again.';
}
