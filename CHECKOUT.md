# Checkout UI & Payment Form - Phase 4

This document describes the customer-facing checkout experience, including hosted checkout page, embeddable forms, and 3D Secure simulation.

## Overview

The checkout system provides a complete payment experience with:
- **Hosted Checkout Page**: Full-page payment form at `/checkout/[intentId]`
- **Embeddable Component**: React component for embedded checkout
- **3D Secure**: Simulation for authentication flows
- **Success/Error Pages**: Post-payment feedback screens
- **Card Tokenization**: Secure card handling without storing raw data

## Hosted Checkout Page

### URL & Access
```
GET /checkout/pi_xxx?client_secret=pi_xxx_secret_yyy
```

The checkout page loads a PaymentIntent using the `client_secret` for verification.

### Layout
- **Desktop (1024px+)**: 66% form (left) + 33% order summary (right)
- **Tablet/Mobile**: Stacked vertically (100% width)

### Features

#### Order Summary (Right Panel)
- Item description (from PaymentIntent.description)
- Amount in large, bold text
- Subtotal, tax (if applicable), and total
- Security badge ("🔒 Secure checkout")

#### Checkout Form (Left Panel)

##### Billing Information
- Full name (required)
- Email (required)
- Address (optional, collapsible group):
  - Street address
  - City, State, ZIP code
  - Country dropdown

##### Payment Information
Card number input with:
- Live brand detection (Visa/Mastercard/Amex/Discover logos)
- Luhn validation (client-side + server-side)
- Automatic formatting: `4242 4242 4242 4242`

Expiry field:
- Format: MM/YY
- Validation: not expired, valid month (01-12)
- Real-time error messages

CVC field:
- Visa/Mastercard/Discover: 3 digits
- Amex: 4 digits
- Input validation in real-time

##### Error Display
- Red banner at top with error message
- Auto-dismissible or manual dismiss button
- Common errors:
  - "Card number is invalid"
  - "Card expired"
  - "CVC is invalid"
  - "Insufficient funds"
  - "Card declined"
  - "3D Secure authentication required"
  - "Payment blocked by fraud detection"

##### Action Buttons
- **"Pay $XX.XX"** button (primary, large, full-width)
  - Disabled until form complete
  - Loading spinner + "Processing..." text during submission
  - Re-enabled on error
- **"Cancel"** link (light text, centered below button)

## Payment Flow

### Client-Side Processing

1. **Validation**: Card number (Luhn), expiry, CVC
2. **Tokenization**: `POST /api/tokenize` returns token without raw card data
3. **Confirmation**: `POST /api/payment-intents/:id/confirm` with token
4. **3DS Check**: If required, show modal for verification

### JavaScript API

```typescript
import { processPayment } from '@/lib/checkout';

const result = await processPayment(
  intentId,           // pi_xxx
  clientSecret,       // pi_xxx_secret_yyy
  cardNumber,         // "4242424242424242"
  expiry,            // "12/25"
  cvc,               // "123"
  billingDetails     // { fullName, email, address? }
);

// Returns: { success: boolean; requires3ds?: boolean; error?: string }
```

## 3D Secure Flow

### When Triggered
- Authorization response includes `requires3ds: true`
- Fraud score requires authentication (40+ points)

### Modal UI
- Title: "Verify Your Card"
- Subtitle: "Your bank requires additional verification"
- Generic bank logo (🏦)
- 6-digit OTP input with:
  - Auto-advance to next field
  - Bullets instead of digits (privacy)
  - Auto-focus on first field

### Verification

```typescript
POST /api/payment-intents/:id/verify-3ds
Body: { clientSecret, otp }
```

**For demo purposes**: Any 6-digit OTP is accepted. In production, this would verify with actual 3DS provider.

### Success Flow
1. User enters 6-digit OTP
2. Backend verifies and creates charge
3. Redirect to `/checkout/success?payment_intent=pi_xxx`

## Success Page

**URL**: `/checkout/success?payment_intent=pi_xxx`

Displays:
- ✅ Success icon (green checkmark)
- "Payment Successful" heading
- "Thank you for your purchase" subheading
- Amount (large, bold)
- Transaction ID (with copy button)
- Date/timestamp
- Action buttons:
  - "Return to Store"
  - "Download Receipt"
  - "View Transaction" (merchant only)

## Error Page

**URL**: `/checkout/error?reason=card_declined`

Displays:
- ❌ Error icon (red X)
- "Payment Failed" heading
- Error message (dynamic based on reason):
  - "Card declined"
  - "Insufficient funds"
  - "Card expired"
  - "Invalid card details"
  - "3D Secure verification failed"
  - "Payment blocked by fraud detection"
- Suggestions for fixing:
  - Check card details
  - Verify not expired
  - Check available funds
  - Contact bank
- Action buttons:
  - "Try Again" (back to checkout)
  - "Return to Store"

## Tokenization Endpoint

```
POST /api/tokenize
```

### Request
```json
{
  "cardNumber": "4242424242424242",
  "expMonth": 12,
  "expYear": 25,
  "cvc": "123"
}
```

### Response
```json
{
  "token": "tok_live_xxxxx",
  "brand": "visa",
  "last4": "4242",
  "expMonth": 12,
  "expYear": 25
}
```

**Security**: Raw card data never reaches the database. Token is generated client-side and server validates without storing PAN.

## Embeddable Component

### React Component

```tsx
import { StripeCheckoutForm } from '@/components/StripeCheckoutForm';

export default function MyCheckout() {
  return (
    <StripeCheckoutForm
      intentId="pi_xxx"
      clientSecret="pi_xxx_secret_yyy"
      onSuccess={(id) => console.log("Payment succeeded:", id)}
      onError={(err) => console.log("Error:", err)}
      buttonText="Buy Now"
      amount={9999}
      description="Product Purchase"
      currency="USD"
      style={{ primaryColor: "#635BFF" }}
    />
  );
}
```

### Props

```typescript
interface StripeCheckoutFormProps {
  intentId: string;                  // pi_xxx
  clientSecret: string;              // pi_xxx_secret_yyy
  onSuccess?: (intentId: string) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
  buttonText?: string;               // Default: "Pay"
  currency?: string;                 // Default: "USD"
  amount?: number;                   // In cents
  description?: string;              // Payment description
  style?: {
    primaryColor?: string;           // Button color
    fontFamily?: string;             // Font family
  };
}
```

## Card Validation

All validation happens client-side with Luhn checksum verification.

### Card Number
- Length: 13-19 digits
- Algorithm: Luhn
- Brands detected: Visa, Mastercard, Amex, Discover

### Expiry
- Format: MM/YY
- Validation: Not expired, valid month (01-12)
- Accepted: Current and future months

### CVC
- Visa/Mastercard/Discover: 3 digits
- Amex: 4 digits
- Input masked (bullets instead of digits in 3DS modal)

## Styling

### Tailwind Configuration
- Input height: 44px (tap-friendly mobile)
- Font size: 14-16px
- Borders: 1px solid
- Focus state: Blue border + ring
- Error state: Red border

### Colors
- Primary: #635BFF (Stripe purple)
- Success: #10B981 (Green)
- Error: #EF4444 (Red)
- Background: #F9FAFB (Light gray)

### Dark Mode
Automatically adapts to system preferences via Tailwind's `dark:` prefix.

### Responsive
```
Mobile:  320px-767px   → 1-column, full-width inputs
Tablet:  768px-1023px  → 1-column, stacked
Desktop: 1024px+       → 2-column (form + summary)
```

## Security Practices

### PCI Compliance
✅ Never store raw card data
✅ Tokenize on frontend before transmission
✅ Use HTTPS in production
✅ Validate client_secret for access control

### CSRF Protection
✅ client_secret required for all payment operations
✅ Verify secret before processing

### Fraud Detection
- Velocity checks (multiple charges in short time)
- Large amount checks (>$5000)
- Card testing detection (10+ small charges)
- High-risk BIN checks
- Multiple failure patterns

## Testing

### Test Cards

```
4242424242424242 - Success
4000000000000002 - Decline
4000002500003155 - 3DS Required
```

See [FAKE_CARDS.md](./FAKE_CARDS.md) for complete test card list.

### Test Flow

1. Navigate to `/checkout/pi_xxx?client_secret=pi_xxx_secret_yyy`
2. Enter test card details
3. Fill billing information
4. Click "Pay"
5. Verify success or error page

### 3DS Test

Use card `4000002500003155` to trigger 3DS modal:
1. Modal appears after form submission
2. Enter any 6-digit code (e.g., "123456")
3. Redirect to success page

## API Endpoints

### Create Payment Intent
```
POST /api/payment-intents
Authorization: Bearer sk_live_xxx
Body: { amount, currency, description, metadata?, receiptEmail? }
```

### Get Payment Intent
```
GET /api/payment-intents/:id
X-Client-Secret: pi_xxx_secret_yyy (or Bearer API key)
```

### Confirm Payment
```
POST /api/payment-intents/:id/confirm
X-Client-Secret: pi_xxx_secret_yyy
Body: { clientSecret, cardToken, cardNumber, billingDetails? }
```

### Verify 3DS
```
POST /api/payment-intents/:id/verify-3ds
X-Client-Secret: pi_xxx_secret_yyy
Body: { clientSecret, otp }
```

### Tokenize Card
```
POST /api/tokenize
Body: { cardNumber, expMonth, expYear, cvc }
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Card number is invalid" | Luhn checksum failed | Verify card number |
| "Card expired" | expiry < current month/year | Use valid card |
| "CVC is invalid" | Wrong length for brand | 3 or 4 digits |
| "Card declined" | Card network declined | Try different card |
| "Insufficient funds" | Balance too low | Add funds or try different card |
| "Payment blocked by fraud detection" | Fraud score > 50 | Contact support |
| "3D Secure authentication required" | High-risk transaction | Complete 3DS verification |

## Webhooks

After successful payment, webhooks are fired:

```
Event: payment.succeeded
Payload: {
  id: charge_id,
  paymentIntentId: pi_xxx,
  amount: 9999,
  currency: "usd",
  status: "succeeded",
  cardLast4: "4242",
  cardBrand: "visa",
  createdAt: "2024-01-15T10:30:00Z",
  threeDSecureVerified?: true
}
```

## Implementation Notes

### Rate Limiting
- Tokenize endpoint: No explicit limit (rate-limited at middleware)
- Confirm endpoint: No explicit limit (rate-limited at middleware)
- 3DS verify: No explicit limit (rate-limited at middleware)

### Concurrency
- PaymentIntent can only be confirmed once
- Status must be `requires_payment_method` to confirm
- Charge creation is atomic with PaymentIntent update

### Audit Logging
- All payment operations logged to `audit_logs`
- Includes IP address, user agent, card details (last4 only)
- Searchable by PaymentIntent ID or card token

## Future Enhancements

- [ ] Apple Pay / Google Pay support
- [ ] Saved cards / tokenized payment methods
- [ ] Coupon codes / discount codes
- [ ] Multiple shipping addresses
- [ ] Invoice generation (PDF)
- [ ] Email receipts with S3 storage
- [ ] ACH/Bank transfer support
- [ ] Cryptocurrency payments
- [ ] Split payments
