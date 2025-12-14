/**
 * POST /api/tokenize
 * Tokenizes a card - simulates Stripe.js tokenization
 * NEVER stores raw card data
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { tokenizeCard } from '@/lib/tokenization';

const tokenizeSchema = z.object({
  cardNumber: z.string().regex(/^\d{13,19}$/, 'Invalid card number'),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().min(0).max(99),
  cvc: z.string().regex(/^\d{3,4}$/, 'Invalid CVC'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = tokenizeSchema.parse(body);

    // Tokenize the card (client-side operation)
    const tokenized = tokenizeCard({
      cardNumber: validated.cardNumber,
      expMonth: validated.expMonth,
      expYear: validated.expYear,
      cvc: validated.cvc,
    });

    logger.info('Card tokenized', {
      token: tokenized.token,
      brand: tokenized.brand,
      last4: tokenized.last4,
    });

    // Return token and metadata, never raw card data
    return NextResponse.json({
      token: tokenized.token,
      brand: tokenized.brand,
      last4: tokenized.last4,
      expMonth: tokenized.expMonth,
      expYear: tokenized.expYear,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid card data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    logger.error('Tokenization failed', { error });
    return NextResponse.json(
      { error: 'Tokenization failed' },
      { status: 500 }
    );
  }
}
