# Subscriptions API

Complete guide for managing recurring billing subscriptions.

## Overview

Subscriptions enable recurring billing cycles for customers. They automatically generate charges on a set schedule (daily, weekly, monthly, yearly).

## Data Model

### Subscription Object

```typescript
{
  id: string;                    // sub_xxx unique identifier
  merchantId: string;
  customerId: string;
  priceId: string;               // References recurring price
  
  status: string;                // active, paused, cancelled, past_due, incomplete
  cancelAtPeriodEnd: boolean;    // Cancel after current period ends
  
  currentPeriodStart: DateTime;  // When current billing period began
  currentPeriodEnd: DateTime;    // When current billing period ends
  nextBillingDate: DateTime;     // When next charge will occur
  
  trialStart: DateTime | null;   // Trial period start (if applicable)
  trialEnd: DateTime | null;     // Trial period end (if applicable)
  trialDaysLeft: number | null;  // Remaining trial days
  
  quantity: number;              // How many units (default 1)
  
  cancelledAt: DateTime | null;
  cancellationReason: string | null; // customer_request, payment_failure, merchant_request
  
  failureCount: number;          // Failed charge attempts
  lastFailureAt: DateTime | null;
  
  metadata: object;              // Custom fields
  
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

## Billing Cycles

### Period Calculation

Subscriptions automatically advance billing periods based on `recurringInterval`:

- **day**: Advances by N days
- **week**: Advances by N weeks (7 × N days)
- **month**: Advances by N months (same date next month)
- **year**: Advances by N years

Example:
- Subscription starts Dec 13, 2025 with monthly interval
- `currentPeriodEnd` = Jan 13, 2026
- `nextBillingDate` = Jan 13, 2026 (charge will occur then)

### Trial Periods

If `trialDays` is set during subscription creation:

1. `trialStart` = now
2. `trialEnd` = now + trialDays
3. `nextBillingDate` = trialEnd + billing interval
4. No charge occurs until `trialEnd`

Example:
- Create subscription on Dec 13 with 14-day trial
- Trial ends Dec 27
- First charge occurs Dec 27
- Next charge occurs Jan 27 (monthly billing)

## API Endpoints

### POST /api/subscriptions

Create a new subscription for a customer.

**Request:**
```json
{
  "customerId": "cus_abc123",
  "priceId": "price_xyz789",
  "quantity": 1,
  "trialDays": 14,
  "metadata": {
    "couponCode": "SAVE10",
    "orderId": "ord_123"
  }
}
```

**Response:**
```json
{
  "id": "sub_abc123",
  "customerId": "cus_abc123",
  "priceId": "price_xyz789",
  "status": "active",
  "currentPeriodStart": "2025-12-13T00:00:00Z",
  "currentPeriodEnd": "2026-01-13T00:00:00Z",
  "nextBillingDate": "2025-12-27T00:00:00Z",
  "trialEnd": "2025-12-27T00:00:00Z",
  "quantity": 1,
  "metadata": { "couponCode": "SAVE10" },
  "createdAt": "2025-12-13T10:30:00Z"
}
```

**Errors:**
- `400`: Invalid request data (amount not positive, invalid currency)
- `404`: Customer or Price not found
- `409`: Active subscription already exists for this customer/price pair

**Webhook:** `subscription.created` fires immediately

---

### GET /api/subscriptions

List subscriptions with optional filtering.

**Query Parameters:**
- `limit`: 1-100, default 10
- `offset`: Pagination offset, default 0
- `customerId`: Filter by customer
- `status`: Filter by status (active, paused, cancelled, past_due)

**Request:**
```
GET /api/subscriptions?customerId=cus_abc123&status=active&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "sub_abc123",
      "customerId": "cus_abc123",
      "priceId": "price_xyz789",
      "status": "active",
      "amount": 2999,
      "currency": "usd",
      "quantity": 1,
      "nextBillingDate": "2026-01-13T00:00:00Z",
      "trialEnd": null,
      "cancelAtPeriodEnd": false,
      "failureCount": 0,
      "createdAt": "2025-12-13T10:30:00Z"
    }
  ],
  "totalCount": 5,
  "hasMore": false
}
```

---

### GET /api/subscriptions/:id

Get subscription details.

**Request:**
```
GET /api/subscriptions/sub_abc123
```

**Response:**
```json
{
  "id": "sub_abc123",
  "customerId": "cus_abc123",
  "priceId": "price_xyz789",
  "status": "active",
  "amount": 2999,
  "currency": "usd",
  "quantity": 1,
  "currentPeriodStart": "2025-12-13T00:00:00Z",
  "currentPeriodEnd": "2026-01-13T00:00:00Z",
  "nextBillingDate": "2026-01-13T00:00:00Z",
  "trialEnd": null,
  "trialDaysLeft": null,
  "cancelAtPeriodEnd": false,
  "cancelledAt": null,
  "cancellationReason": null,
  "failureCount": 0,
  "lastFailureAt": null,
  "metadata": {},
  "createdAt": "2025-12-13T10:30:00Z",
  "updatedAt": "2025-12-13T10:30:00Z"
}
```

**Errors:**
- `404`: Subscription not found

---

### PATCH /api/subscriptions/:id

Update subscription properties.

**Request:**
```json
{
  "quantity": 2,
  "status": "paused",
  "metadata": { "newField": "value" }
}
```

**Response:** Updated subscription object

**Status Transitions:**
- `active` → `paused`: Pause without cancelling (can resume)
- `paused` → `active`: Resume from pause
- `active` → `cancelled`: Cancel immediately
- Any status → `cancelled`: Final state, cannot be reversed

**Side Effects:**
- `status` → `paused`: Fires `subscription.paused` webhook
- `status` → `active`: Fires `subscription.resumed` webhook
- `status` → `cancelled`: Fires `subscription.cancelled` webhook

---

### DELETE /api/subscriptions/:id

Cancel subscription immediately (same as `PATCH` with `status: cancelled`).

**Request:**
```
DELETE /api/subscriptions/sub_abc123
```

**Response:**
```json
{
  "id": "sub_abc123",
  "status": "cancelled",
  "cancelledAt": "2025-12-13T11:00:00Z",
  "cancellationReason": "customer_request"
}
```

**Webhook:** `subscription.cancelled` fires immediately

---

## Subscription States

### Active
- Currently billing on schedule
- Charges occur at `nextBillingDate`
- Can be paused or cancelled

### Paused
- Billing suspended, no charges occur
- Can be resumed to active state
- Trial period is not affected

### Past Due
- Automatic state after 3 failed payment attempts
- No further charges will be attempted
- Manual intervention required

### Cancelled
- Permanent terminal state
- No more charges
- Cannot be resumed

### Incomplete
- Created but awaiting initial setup
- May transition to active or cancelled

---

## Cancellation Options

### Immediate Cancellation
```json
{
  "status": "cancelled"
}
```
- Subscription ends immediately
- No more charges will occur
- Customer loses access immediately

### Cancel at Period End
```json
{
  "cancelAtPeriodEnd": true
}
```
- Subscription remains active
- Last charge occurs at `currentPeriodEnd`
- Status changes to cancelled after final period ends
- Allows customer to use service through paid period

---

## Failed Billing Handling

When a charge fails:

1. **First Failure**: `failureCount = 1`, `lastFailureAt` set
2. **Second Failure**: `failureCount = 2`
3. **Third Failure**: `failureCount = 3`, `status` → `past_due`

After status becomes `past_due`:
- No further automatic charges attempted
- Webhook `subscription.past_due` fires
- Manual intervention required (merchant must update payment method)

**Recovery:**
- Customer adds valid payment method
- Merchant calls billing engine to retry
- If successful, `failureCount` resets to 0
- Status changes back to `active`

---

## Trial Periods

### Creating with Trial
```json
{
  "customerId": "cus_123",
  "priceId": "price_monthly",
  "trialDays": 14
}
```

Results in:
- `trialStart` = now
- `trialEnd` = now + 14 days
- `nextBillingDate` = trialEnd
- First charge on day 14
- Second charge on day 14+30 (for monthly plan)

### Trial Period Tracking
- `trialDaysLeft` calculated as `(trialEnd - now) / 86400`
- Updated daily by client (not automatic)
- Returns null after trial period ends

---

## Quantity Changes

Subscribers can increase/decrease unit count:

```json
{
  "quantity": 5
}
```

- Takes effect at next billing date
- Previous charges unaffected
- New amount = `price.amount * quantity`

Example:
- $29.99/month subscription with quantity 1
- Update to quantity 2
- Next charge will be $59.98

---

## Metadata

Store custom data with subscriptions:

```json
{
  "metadata": {
    "couponCode": "SAVE10",
    "accountManager": "sales@example.com",
    "department": "Engineering",
    "costCenter": "CC-123"
  }
}
```

- Useful for accounting, analytics, support
- Included in webhooks
- Updated via PATCH endpoint

---

## Webhooks

Subscriptions fire the following webhook events:

### subscription.created
Fires when subscription is created.

```json
{
  "id": "sub_abc123",
  "customerId": "cus_xyz789",
  "priceId": "price_monthly",
  "status": "active",
  "currentPeriodStart": "2025-12-13T00:00:00Z",
  "currentPeriodEnd": "2026-01-13T00:00:00Z",
  "nextBillingDate": "2026-01-13T00:00:00Z",
  "trialEnd": null
}
```

### subscription.renewed
Fires after successful charge during billing cycle.

```json
{
  "id": "sub_abc123",
  "customerId": "cus_xyz789",
  "chargeId": "ch_new_charge",
  "amount": 2999,
  "currency": "usd",
  "nextBillingDate": "2026-02-13T00:00:00Z",
  "status": "active"
}
```

### subscription.paused
Fires when subscription is paused.

```json
{
  "id": "sub_abc123",
  "customerId": "cus_xyz789",
  "status": "paused"
}
```

### subscription.resumed
Fires when subscription is resumed from pause.

```json
{
  "id": "sub_abc123",
  "customerId": "cus_xyz789",
  "status": "active"
}
```

### subscription.cancelled
Fires when subscription is cancelled.

```json
{
  "id": "sub_abc123",
  "customerId": "cus_xyz789",
  "status": "cancelled",
  "cancellationReason": "customer_request"
}
```

### subscription.past_due
Fires when subscription enters past_due state after 3 failures.

```json
{
  "id": "sub_abc123",
  "customerId": "cus_xyz789",
  "failureCount": 3,
  "reason": "payment_failure"
}
```

---

## Billing Engine

### Cron Schedule
- Runs daily at **02:00 UTC**
- Finds all subscriptions with `nextBillingDate <= now`
- Creates charges automatically
- Updates billing dates for next cycle
- Fires `subscription.renewed` webhook on success

### Processing Flow
1. Find due subscriptions
2. For each subscription:
   - Create new Charge
   - Update `currentPeriodStart` and `currentPeriodEnd`
   - Calculate next `nextBillingDate`
   - Fire `subscription.renewed` webhook
   - Reset `failureCount` to 0
3. On charge failure:
   - Increment `failureCount`
   - If >= 3: Set status to `past_due`
   - Fire `subscription.past_due` webhook

### Manual Trigger
Call via API:
```
POST /api/billing/process
```

---

## Best Practices

1. **Trial Periods**: Use to reduce churn. 14-day trials are common.
2. **Quantity Updates**: Allow customers to scale up/down mid-period.
3. **Pause Before Cancel**: Offer pause option to retain at-risk customers.
4. **Monitoring**: Watch `past_due` subscriptions for recovery opportunities.
5. **Metadata**: Store context for disputes and customer support.
6. **Webhooks**: Process `subscription.renewed` to send receipts/invoices.
7. **Error Handling**: Handle failed charges gracefully, retry with updated payment method.

---

## Examples

### Simple Monthly Subscription
```bash
curl -X POST https://api.example.com/api/subscriptions \
  -H "Authorization: Bearer sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cus_123",
    "priceId": "price_monthly",
    "quantity": 1
  }'
```

### Freemium with 14-Day Trial
```bash
curl -X POST https://api.example.com/api/subscriptions \
  -H "Authorization: Bearer sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cus_123",
    "priceId": "price_pro_monthly",
    "trialDays": 14,
    "metadata": {
      "plan": "pro",
      "source": "website"
    }
  }'
```

### Pause and Resume
```bash
# Pause
curl -X PATCH https://api.example.com/api/subscriptions/sub_abc123 \
  -H "Authorization: Bearer sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{ "status": "paused" }'

# Resume
curl -X PATCH https://api.example.com/api/subscriptions/sub_abc123 \
  -H "Authorization: Bearer sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{ "status": "active" }'
```

### Scale Quantity
```bash
curl -X PATCH https://api.example.com/api/subscriptions/sub_abc123 \
  -H "Authorization: Bearer sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{ "quantity": 5 }'
```
