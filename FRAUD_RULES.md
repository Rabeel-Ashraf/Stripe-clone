# Fraud Detection Rules

This document describes the fraud detection rules engine and how payments are scored for risk.

## Overview

Every payment is automatically evaluated against multiple fraud rules before being processed. Payments receive a fraud score (0-100) and may be flagged, blocked, or required to complete 3D Secure authentication.

## Fraud Score Thresholds

- **0-29**: ✅ **Passed** - Low risk, payment proceeds normally
- **30-49**: ⚠️ **Flagged** - Medium risk, payment proceeds but is monitored
- **40+**: 🔒 **Requires 3DS** - Payment requires 3D Secure authentication
- **50+**: ❌ **High Risk** - Payment is blocked

## Fraud Rules

### Rule 1: Velocity Check (+30 points)

**Trigger**: 3 or more charges in 1 minute from the same card

**Why it matters**: Legitimate customers rarely make multiple rapid purchases. This pattern often indicates:
- Stolen card testing
- Automated fraud bots
- Card verification attacks

**Example**:
```
Card *4242: Charged $10 at 10:30:00
Card *4242: Charged $10 at 10:30:15
Card *4242: Charged $10 at 10:30:30  ← Flagged!
```

### Rule 2: Large Amount (+20 points)

**Trigger**: Single charge exceeds $5,000

**Why it matters**: Large transactions carry higher risk and potential loss. Many fraudsters test with small amounts first, then attempt large purchases.

**Example**:
```
Amount: $6,500 ← Flagged!
```

### Rule 3: Card Testing Pattern (+35 points)

**Trigger**: 10 or more charges under $1 in 10 minutes

**Why it matters**: Fraudsters often validate stolen cards with tiny charges before attempting larger purchases. This is a strong indicator of card testing.

**Example**:
```
Card *4242: 
  - $0.50 at 10:00
  - $0.75 at 10:01
  - $0.25 at 10:02
  ... (8 more small charges)
  - $0.50 at 10:09  ← Flagged!
```

### Rule 4: High-Risk BIN (+15 points)

**Trigger**: Card BIN (first 6 digits) matches known high-risk issuer

**Why it matters**: Certain card BINs have historically higher fraud rates. This includes:
- Prepaid cards from certain issuers
- Cards from high-risk regions
- Known compromised BIN ranges

**High-Risk BINs**:
- `400000` - Generic test cards
- `410000` - High-risk issuer range
- `424242` - Test card pattern

### Rule 5: New Card (+5 points)

**Trigger**: First time this card is used with the merchant

**Why it matters**: While legitimate, first-time card usage has slightly elevated risk. This is a low-weight indicator.

**Note**: This alone won't trigger any action, but combined with other flags can push the score higher.

### Rule 6: Multiple Failed Attempts (+25 points)

**Trigger**: 3 or more failed charges in 1 minute from the same card

**Why it matters**: Multiple rapid declines suggest:
- Incorrect card information (CVV, expiry)
- Card testing with guessed details
- Stolen card that's been blocked

**Example**:
```
Card *4242: Declined (invalid CVV) at 10:30:00
Card *4242: Declined (invalid expiry) at 10:30:15
Card *4242: Declined (card blocked) at 10:30:30  ← Flagged!
```

## 3D Secure (3DS) Requirements

When a payment reaches a fraud score of **40 or higher**, 3D Secure authentication is required:

1. Payment status changes to `requires_action`
2. Customer is redirected to their bank's authentication page
3. Customer completes 3DS challenge (OTP, biometric, etc.)
4. Payment proceeds only if authentication succeeds

**Benefits of 3DS**:
- Liability shift to card issuer
- Reduced chargeback risk
- Higher approval rates for risky transactions

## Payment Outcomes by Fraud Score

| Score | Status | Action | 3DS Required |
|-------|--------|--------|--------------|
| 0-29 | Passed | Payment proceeds | No |
| 30-39 | Flagged | Payment proceeds, monitored | No |
| 40-49 | Flagged | Payment proceeds with 3DS | Yes |
| 50+ | High Risk | Payment blocked | N/A |

## Example Scenarios

### Scenario 1: Normal Purchase
```
Card: *4242
Amount: $49.99
Previous uses: 5 successful charges
Time since last charge: 2 days

Score: 0 points
Result: ✅ Approved immediately
```

### Scenario 2: First Large Purchase
```
Card: *5555
Amount: $7,500
Previous uses: 0
Time since last charge: N/A

Score: 20 (large amount) + 5 (new card) = 25 points
Result: ✅ Approved (flagged for monitoring)
```

### Scenario 3: Suspicious Activity
```
Card: *4242
Amount: $99.99
Previous uses: 10 charges in last 2 minutes (all under $1)
Time since last charge: 30 seconds

Score: 35 (card testing) + 30 (velocity) = 65 points
Result: ❌ Blocked
```

### Scenario 4: High-Risk Card + Large Amount
```
Card: *4000 (high-risk BIN)
Amount: $6,000
Previous uses: 0
Time since last charge: N/A

Score: 15 (BIN) + 20 (amount) + 5 (new) = 40 points
Result: 🔒 Requires 3DS authentication
```

## Monitoring and Alerts

All flagged transactions are:
- ✅ Logged in audit trail with fraud score and flags
- ✅ Included in merchant dashboard fraud reports
- ✅ Monitored for patterns across all merchants
- ✅ Reviewed for rule tuning and improvements

## Customization (Future)

Future versions will support merchant-specific rules:
- Custom BIN blocklists
- Country/region restrictions
- Velocity limits per merchant
- Amount thresholds per merchant tier

## Best Practices

1. **Enable 3DS** for all high-value transactions
2. **Monitor fraud reports** regularly in your dashboard
3. **Set up webhooks** to receive real-time fraud alerts
4. **Contact support** if you see unusual patterns
5. **Keep card BINs updated** if you identify high-risk patterns
