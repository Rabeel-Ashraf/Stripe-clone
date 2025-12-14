# Test Card Numbers

Use these test card numbers to simulate different payment scenarios in development and testing.

## Quick Reference

| Card Number | Brand | Outcome |
|-------------|-------|---------|
| `4242 4242 4242 4242` | Visa | ✅ Success |
| `4012 8888 8888 1881` | Visa | ✅ Success |
| `4000 0000 0000 0002` | Visa | ❌ Generic Decline |
| `4000 0000 0000 0069` | Visa | ❌ Expired Card |
| `4000 0000 0000 0341` | Visa | ❌ Insufficient Funds |
| `4000 0000 0000 0004` | Visa | ❌ Lost Card |
| `4000 0000 0000 0009` | Visa | ❌ Stolen Card |
| `4000 0000 0000 0119` | Visa | ❌ Processing Error |
| `4000 0025 0000 3155` | Visa | 🔒 Requires 3D Secure |
| `3782 8224 6310 005` | Amex | ✅ Success |
| `3714 4963 5398 431` | Amex | ❌ Decline |

## Success Cards

### Visa - Standard Success
```
Card Number: 4242 4242 4242 4242
Brand: Visa
CVC: Any 3 digits
Expiry: Any future date
Result: Approved immediately
```

### Visa - Alternative Success
```
Card Number: 4012 8888 8888 1881
Brand: Visa
CVC: Any 3 digits
Expiry: Any future date
Result: Approved immediately
```

### American Express - Success
```
Card Number: 3782 8224 6310 005
Brand: Amex
CVC: Any 4 digits
Expiry: Any future date
Result: Approved immediately
```

## Decline Cards

### Generic Decline
```
Card Number: 4000 0000 0000 0002
Decline Reason: card_declined
Message: "Your card was declined. Please try a different payment method."
Use Case: Test generic decline handling
```

### Lost Card
```
Card Number: 4000 0000 0000 0004
Decline Reason: lost_card
Message: "Your card has been reported as lost. Please contact your bank."
Use Case: Test fraud prevention workflows
```

### Stolen Card
```
Card Number: 4000 0000 0000 0009
Decline Reason: stolen_card
Message: "Your card has been reported as stolen. Please contact your bank."
Use Case: Test fraud prevention workflows
```

### Expired Card
```
Card Number: 4000 0000 0000 0069
Decline Reason: expired_card
Message: "Your card has expired. Please use a different card."
Use Case: Test expiry validation
```

### Insufficient Funds
```
Card Number: 4000 0000 0000 0341
Decline Reason: insufficient_funds
Message: "Your card has insufficient funds. Please use a different card."
Use Case: Test balance-related declines
```

### Processing Error
```
Card Number: 4000 0000 0000 0119
Decline Reason: processing_error
Message: "An error occurred while processing your card. Please try again."
Use Case: Test error handling and retry logic
```

## 3D Secure Cards

### 3DS Required - Success After Authentication
```
Card Number: 4000 0025 0000 3155
Brand: Visa
CVC: Any 3 digits
Expiry: Any future date
Behavior: 
  1. Initial authorization approved
  2. Status changes to "requires_action"
  3. 3DS authentication required
  4. Payment succeeds after 3DS
Use Case: Test 3D Secure flow
```

## Amex Cards

### Amex - Success
```
Card Number: 3782 8224 6310 005
Brand: American Express
CVC: Any 4 digits (Amex uses 4-digit CVC)
Expiry: Any future date
Result: Approved immediately
```

### Amex - Decline
```
Card Number: 3714 4963 5398 431
Brand: American Express
CVC: Any 4 digits
Expiry: Any future date
Result: Declined
```

## Usage Examples

### JavaScript/TypeScript (Frontend)

```typescript
import { tokenizeCard } from '@/lib/tokenization';

// Success case
const successToken = tokenizeCard({
  cardNumber: '4242424242424242',
  expMonth: 12,
  expYear: 2025,
  cvc: '123',
});

// 3DS required case
const threeDSToken = tokenizeCard({
  cardNumber: '4000002500003155',
  expMonth: 12,
  expYear: 2025,
  cvc: '123',
});

// Decline case
const declineToken = tokenizeCard({
  cardNumber: '4000000000000002',
  expMonth: 12,
  expYear: 2025,
  cvc: '123',
});
```

### API Request

```bash
# Create PaymentIntent
curl -X POST https://api.yoursite.com/api/payment-intents \
  -H "Authorization: Bearer sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "usd"
  }'

# Confirm with test card
curl -X POST https://api.yoursite.com/api/payment-intents/pi_xxx/confirm \
  -H "Authorization: Bearer sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "cardToken": "tok_live_abc123",
    "cardNumber": "4242424242424242"
  }'
```

## Testing Different Scenarios

### Test 1: Successful Payment
```
Card: 4242 4242 4242 4242
Amount: $50.00
Expected: ✅ Charge succeeds, webhook fired
```

### Test 2: Declined Payment
```
Card: 4000 0000 0000 0002
Amount: $50.00
Expected: ❌ Charge fails, error message shown
```

### Test 3: Fraud Detection (Velocity)
```
Card: 4242 4242 4242 4242
Charges: 3 charges within 1 minute
Expected: ⚠️ 3rd charge flagged for fraud
```

### Test 4: Fraud Detection (Card Testing)
```
Card: 4242 4242 4242 4242
Charges: 10 x $0.50 in 10 minutes
Expected: ❌ Charges blocked after pattern detected
```

### Test 5: Large Amount + 3DS
```
Card: 4000 0025 0000 3155
Amount: $6,000
Expected: 🔒 3DS authentication required
```

### Test 6: Refund Flow
```
1. Charge: 4242 4242 4242 4242 for $100
2. Refund: Full or partial
Expected: ✅ Refund succeeds, webhook fired
```

## Important Notes

1. **Always use future expiry dates** (e.g., 12/2025 or later)
2. **CVC can be any valid number** (3 digits for Visa/MC, 4 for Amex)
3. **These cards only work in test mode** - never use in production
4. **All other card numbers** default to approved (for flexibility)

## Luhn Algorithm

All test cards pass the Luhn checksum validation. If you need to generate your own test cards, use a [Luhn calculator](https://www.dcode.fr/luhn-algorithm).

**Generate valid test cards**:
```
Visa: 4[random 15 digits passing Luhn]
Mastercard: 5[1-5][random 14 digits passing Luhn]
Amex: 3[47][random 13 digits passing Luhn]
```

## Validation Rules

### Visa
- Starts with `4`
- 16 digits
- 3-digit CVC

### Mastercard
- Starts with `51-55` or `2221-2720`
- 16 digits
- 3-digit CVC

### American Express
- Starts with `34` or `37`
- 15 digits
- 4-digit CVC

### Discover
- Starts with `6011`, `622126-622925`, `644-649`, or `65`
- 16 digits
- 3-digit CVC
