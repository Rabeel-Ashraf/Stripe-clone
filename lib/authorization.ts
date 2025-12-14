/**
 * Authorization Engine
 * Simulates communication with card networks for authorization
 */

import { nanoid } from 'nanoid';
import { getCardOutcome } from './fake-cards';

export interface AuthorizationResponse {
  status: 'approved' | 'declined' | 'error';
  authorizationCode?: string;
  declineReason?: string;
  requires3ds?: boolean;
}

/**
 * Authorizes a charge with the card network (simulated)
 * In production, this would communicate with Visa/Mastercard/etc.
 */
export async function authorizeCharge(
  cardNumber: string,
  amount: number,
  merchantId: string
): Promise<AuthorizationResponse> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 100));

  // Get card outcome from fake card DB
  const outcome = getCardOutcome(cardNumber);

  if (outcome.status === 'declined') {
    return {
      status: 'declined',
      declineReason: outcome.reason || 'card_declined',
    };
  }

  if (outcome.requires3ds) {
    return {
      status: 'approved',
      authorizationCode: `auth_${nanoid(12)}`,
      requires3ds: true,
    };
  }

  // Simulate occasional network errors (1% chance)
  if (Math.random() < 0.01) {
    return {
      status: 'error',
      declineReason: 'processing_error',
    };
  }

  return {
    status: 'approved',
    authorizationCode: `auth_${nanoid(12)}`,
  };
}

/**
 * Simulates 3D Secure authentication
 * In production, this would redirect to the issuing bank's 3DS page
 */
export async function perform3DSecure(
  cardNumber: string,
  amount: number
): Promise<{ authenticated: boolean; transactionId?: string }> {
  // Simulate authentication process (in reality, this is user-interactive)
  await new Promise(resolve => setTimeout(resolve, 200));

  // 90% success rate for 3DS
  const authenticated = Math.random() > 0.1;

  return {
    authenticated,
    transactionId: authenticated ? `3ds_${nanoid(16)}` : undefined,
  };
}
