# Webhooks API

Complete guide for managing webhooks and processing webhook events.

## Overview

Webhooks allow your application to receive real-time notifications about events happening in the Stripe replica system. When an event occurs, the system sends an HTTP POST to your endpoint with details about what happened.

## Event Types

### Payment Events

#### payment.succeeded
Fired when a payment is successfully processed.

```json
{
  "id": "evt_abc123",
  "type": "payment.succeeded",
  "created": 1701424200,
  "data": {
    "object": {
      "id": "ch_xyz789",
      "amount": 2999,
      "currency": "usd",
      "status": "succeeded",
      "paymentIntentId": "pi_abc123",
      "cardBrand": "visa",
      "cardLast4": "4242",
      "customerId": "cus_customer123",
      "createdAt": "2025-12-13T10:30:00Z"
    }
  }
}
```

#### charge.refunded
Fired when a charge is refunded (partially or fully).

```json
{
  "id": "evt_def456",
  "type": "charge.refunded",
  "created": 1701424300,
  "data": {
    "object": {
      "chargeId": "ch_xyz789",
      "refundId": "ref_abc123",
      "amount": 1000,
      "currency": "usd",
      "reason": "requested_by_customer",
      "status": "succeeded",
      "createdAt": "2025-12-13T11:00:00Z"
    }
  }
}
```

### Subscription Events

#### subscription.created
Fired when a subscription is created.

```json
{
  "id": "evt_ghi789",
  "type": "subscription.created",
  "created": 1701424400,
  "data": {
    "object": {
      "id": "sub_abc123",
      "customerId": "cus_customer123",
      "priceId": "price_monthly",
      "status": "active",
      "currentPeriodStart": "2025-12-13T00:00:00Z",
      "currentPeriodEnd": "2026-01-13T00:00:00Z",
      "nextBillingDate": "2026-01-13T00:00:00Z",
      "trialEnd": null
    }
  }
}
```

#### subscription.renewed
Fired after a successful charge during a billing cycle.

```json
{
  "id": "evt_jkl012",
  "type": "subscription.renewed",
  "created": 1701510600,
  "data": {
    "object": {
      "id": "sub_abc123",
      "customerId": "cus_customer123",
      "chargeId": "ch_new_charge",
      "amount": 2999,
      "currency": "usd",
      "nextBillingDate": "2026-02-13T00:00:00Z",
      "status": "active"
    }
  }
}
```

#### subscription.paused
Fired when a subscription is paused.

```json
{
  "id": "evt_mno345",
  "type": "subscription.paused",
  "created": 1701511000,
  "data": {
    "object": {
      "id": "sub_abc123",
      "customerId": "cus_customer123",
      "status": "paused"
    }
  }
}
```

#### subscription.resumed
Fired when a subscription is resumed from pause.

```json
{
  "id": "evt_pqr678",
  "type": "subscription.resumed",
  "created": 1701511100,
  "data": {
    "object": {
      "id": "sub_abc123",
      "customerId": "cus_customer123",
      "status": "active"
    }
  }
}
```

#### subscription.cancelled
Fired when a subscription is cancelled.

```json
{
  "id": "evt_stu901",
  "type": "subscription.cancelled",
  "created": 1701511200,
  "data": {
    "object": {
      "id": "sub_abc123",
      "customerId": "cus_customer123",
      "status": "cancelled",
      "cancellationReason": "customer_request"
    }
  }
}
```

#### subscription.past_due
Fired when a subscription enters past_due state.

```json
{
  "id": "evt_vwx234",
  "type": "subscription.past_due",
  "created": 1701511300,
  "data": {
    "object": {
      "id": "sub_abc123",
      "customerId": "cus_customer123",
      "failureCount": 3,
      "reason": "payment_failure"
    }
  }
}
```

---

## Webhook Payload Format

All webhook payloads follow this structure:

```typescript
{
  id: string;              // evt_xxx - Unique event ID
  type: string;            // Event type (e.g., "payment.succeeded")
  created: number;         // Unix timestamp when event occurred
  data: {
    object: any;           // Event-specific data
  }
}
```

---

## API Endpoints

### POST /api/webhook-endpoints

Register a new webhook endpoint.

**Request:**
```json
{
  "url": "https://example.com/webhooks",
  "events": [
    "payment.succeeded",
    "charge.refunded",
    "subscription.created",
    "subscription.renewed"
  ]
}
```

**Response:**
```json
{
  "id": "wh_abc123",
  "url": "https://example.com/webhooks",
  "events": [
    "payment.succeeded",
    "charge.refunded",
    "subscription.created",
    "subscription.renewed"
  ],
  "secret": "whsec_abc123xyz789...",
  "isActive": true,
  "failureCount": 0,
  "createdAt": "2025-12-13T10:30:00Z"
}
```

⚠️ **Important**: The `secret` is only returned once on creation. Store it securely. You'll need it to verify signatures.

**Errors:**
- `400`: Invalid URL or missing events
- `401`: Unauthorized

---

### GET /api/webhook-endpoints

List all registered webhook endpoints.

**Request:**
```
GET /api/webhook-endpoints
```

**Response:**
```json
{
  "data": [
    {
      "id": "wh_abc123",
      "url": "https://example.com/webhooks",
      "events": ["payment.succeeded", "charge.refunded"],
      "isActive": true,
      "failureCount": 0,
      "lastFailedAt": null,
      "createdAt": "2025-12-13T10:30:00Z",
      "updatedAt": "2025-12-13T10:30:00Z"
    }
  ]
}
```

Note: `secret` is never returned in list responses for security.

---

### PATCH /api/webhook-endpoints/:id

Update a webhook endpoint.

**Request:**
```json
{
  "url": "https://example.com/webhooks/v2",
  "events": ["payment.succeeded", "subscription.created"]
}
```

**Response:** Updated webhook object

**Errors:**
- `400`: Invalid URL or events
- `404`: Webhook endpoint not found

---

### DELETE /api/webhook-endpoints/:id

Delete a webhook endpoint. No more events will be sent to it.

**Request:**
```
DELETE /api/webhook-endpoints/wh_abc123
```

**Response:**
```json
{
  "id": "wh_abc123",
  "deleted": true
}
```

---

### GET /api/webhook-endpoints/:id/deliveries

View delivery history for a specific endpoint.

**Query Parameters:**
- `limit`: 1-100, default 20
- `offset`: Pagination offset, default 0
- `status`: Filter by status (pending, retrying, sent, failed)

**Request:**
```
GET /api/webhook-endpoints/wh_abc123/deliveries?limit=50&status=failed
```

**Response:**
```json
{
  "data": [
    {
      "id": "del_abc123",
      "eventId": "evt_event123",
      "eventType": "payment.succeeded",
      "eventStatus": "sent",
      "responseStatus": 200,
      "duration": 234,
      "createdAt": "2025-12-13T10:30:00Z"
    }
  ],
  "totalCount": 5,
  "hasMore": false
}
```

---

### POST /api/webhook-endpoints/:id/test

Send a test webhook to verify endpoint is working.

**Request:**
```json
{
  "eventType": "payment.succeeded"
}
```

**Response:**
```json
{
  "eventId": "evt_test_abc123",
  "endpointId": "wh_abc123",
  "eventType": "payment.succeeded",
  "status": "pending",
  "createdAt": "2025-12-13T10:35:00Z"
}
```

---

## Signature Verification

All webhook requests are signed with HMAC-SHA256. Verify the signature to ensure requests are authentic.

### Signature Header Format

```
X-Stripe-Signature: t=1701424200,v1=abcdef0123456789...
```

- `t`: Unix timestamp
- `v1`: HMAC-SHA256 hex digest

### Verification Steps

1. Extract timestamp and signature from header
2. Reconstruct signed payload: `timestamp.json_body`
3. Generate HMAC-SHA256 using your webhook secret
4. Compare calculated signature with provided signature (constant-time comparison)
5. Verify timestamp is within 5 minutes of now (prevent replay attacks)

### Example (Node.js)

```typescript
import { createHmac, timingSafeEqual } from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string
): boolean {
  try {
    // Parse signature header: t=timestamp,v1=signature
    const parts = signatureHeader.split(',');
    const timestamp = parseInt(parts[0].split('=')[1]);
    const receivedSignature = parts[1].split('=')[1];

    // Reject old timestamps (> 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      return false;
    }

    // Reconstruct signed payload
    const signedPayload = `${timestamp}.${payload}`;

    // Generate expected signature
    const hmac = createHmac('sha256', secret);
    hmac.update(signedPayload);
    const expectedSignature = hmac.digest('hex');

    // Constant-time comparison
    return timingSafeEqual(
      Buffer.from(receivedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

// Usage in Express middleware
app.post('/webhooks', express.raw({ type: 'application/json' }), (req, res) => {
  const payload = req.body.toString();
  const signature = req.headers['x-stripe-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!verifyWebhookSignature(payload, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(payload);
  // Handle event...
});
```

### Example (Python)

```python
import hmac
import hashlib
import json
from time import time

def verify_webhook_signature(payload, signature_header, secret):
    try:
        # Parse signature header
        parts = signature_header.split(',')
        timestamp = int(parts[0].split('=')[1])
        received_sig = parts[1].split('=')[1]

        # Reject old timestamps
        if abs(int(time()) - timestamp) > 300:
            return False

        # Reconstruct signed payload
        signed_payload = f"{timestamp}.{payload}"

        # Generate expected signature
        expected_sig = hmac.new(
            secret.encode(),
            signed_payload.encode(),
            hashlib.sha256
        ).hexdigest()

        # Constant-time comparison
        return hmac.compare_digest(received_sig, expected_sig)
    except:
        return False

# Usage in Flask
@app.route('/webhooks', methods=['POST'])
def handle_webhook():
    payload = request.get_data(as_text=True)
    signature = request.headers.get('X-Stripe-Signature')
    secret = os.getenv('WEBHOOK_SECRET')

    if not verify_webhook_signature(payload, signature, secret):
        return {'error': 'Invalid signature'}, 401

    event = json.loads(payload)
    # Handle event...
    return {'status': 'ok'}
```

---

## Retry Policy

Failed deliveries are retried with exponential backoff:

1. **Attempt 1**: Immediate
2. **Attempt 2**: Wait 1 minute
3. **Attempt 3**: Wait 2 minutes
4. **Attempt 4**: Wait 5 minutes
5. **Attempt 5**: Wait 10 minutes
6. **Attempt 6+**: Stop retrying, mark as failed

### Failure Reasons

A webhook is considered failed if:
- HTTP response status is not 2xx
- Connection timeout (30 seconds)
- Network error
- DNS resolution failure
- TLS/SSL error

### Endpoint Disabling

If an endpoint has 5+ consecutive failed deliveries:
- Endpoint is automatically disabled (`isActive = false`)
- No new events will be sent
- You must manually re-enable by updating the endpoint

---

## Best Practices

### 1. Verify Signatures
Always verify webhook signatures. Never trust unsigned requests.

```typescript
if (!verifySignature(payload, header, secret)) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### 2. Idempotency
Webhooks may be retried. Handle duplicate events gracefully.

```typescript
// Check if event already processed
const existing = await db.webhookEvent.findUnique({
  where: { externalId: event.id }
});

if (existing) {
  return res.json({ status: 'already_processed' });
}

// Process event...
await db.webhookEvent.create({
  data: {
    externalId: event.id,
    type: event.type,
    // ...
  }
});
```

### 3. Quick Responses
Respond immediately with 2xx status, then process async.

```typescript
// Good: Respond immediately
res.json({ received: true });

// Then process in background
processWebhookEvent(event).catch(err => {
  logger.error('Error processing webhook', err);
});
```

### 4. Structured Logging
Log webhook events for debugging and auditing.

```typescript
logger.info('Webhook received', {
  eventId: event.id,
  type: event.type,
  timestamp: event.created,
  endpointId: req.headers['x-endpoint-id'],
});
```

### 5. Error Handling
Handle partial failures gracefully.

```typescript
try {
  // Process subscription.renewed event
  await sendReceipt(event.data.object);
} catch (err) {
  logger.error('Failed to send receipt', err);
  // Still return 200 so webhook doesn't retry
}

res.json({ status: 'processed' });
```

### 6. Timeouts
Implement request timeouts to prevent hanging.

```typescript
const timeout = 30000; // 30 seconds
const controller = new AbortController();
const id = setTimeout(() => controller.abort(), timeout);

try {
  const response = await fetch(webhookUrl, {
    signal: controller.signal,
  });
} finally {
  clearTimeout(id);
}
```

### 7. Test Webhooks
Use the test endpoint regularly to verify configuration.

```bash
curl -X POST https://api.example.com/api/webhook-endpoints/wh_abc/test \
  -H "Authorization: Bearer sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "payment.succeeded"
  }'
```

---

## Examples

### Register Webhook Endpoint

```bash
curl -X POST https://api.example.com/api/webhook-endpoints \
  -H "Authorization: Bearer sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/webhooks",
    "events": ["payment.succeeded", "subscription.created"]
  }'

# Response includes secret (save this!)
# secret: "whsec_abc123xyz789..."
```

### Handle Payment Webhook (Node.js)

```typescript
import express from 'express';
import { verifySignature } from '@/lib/webhook';

const app = express();

app.post('/webhooks', express.raw({ type: 'application/json' }), async (req, res) => {
  const payload = req.body.toString();
  const signature = req.headers['x-stripe-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  // Verify signature
  if (!verifySignature(payload, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Respond immediately
  res.json({ received: true });

  // Process asynchronously
  const event = JSON.parse(payload);

  switch (event.type) {
    case 'payment.succeeded':
      await sendReceipt(event.data.object);
      await updateAccountBalance(event.data.object);
      break;

    case 'subscription.renewed':
      await sendRenewalEmail(event.data.object);
      break;

    case 'subscription.cancelled':
      await offboardCustomer(event.data.object);
      break;
  }
});
```

### View Delivery History

```bash
curl https://api.example.com/api/webhook-endpoints/wh_abc123/deliveries?limit=20 \
  -H "Authorization: Bearer sk_live_xxx"

# Response
{
  "data": [
    {
      "id": "del_abc123",
      "eventId": "evt_event123",
      "eventType": "payment.succeeded",
      "responseStatus": 200,
      "duration": 234,
      "createdAt": "2025-12-13T10:30:00Z"
    }
  ]
}
```

---

## Troubleshooting

### Webhook Not Received

1. Check endpoint is active: `GET /api/webhook-endpoints/:id`
2. Verify event type is in subscribed list
3. Check firewall/network allows incoming connections
4. View delivery history: `GET /api/webhook-endpoints/:id/deliveries`

### Signature Verification Fails

1. Ensure using correct secret for endpoint
2. Verify timestamp is within 5 minutes of now
3. Ensure payload is exact bytes, not re-encoded
4. Use constant-time comparison (timing attacks)

### High Failure Rate

1. Check endpoint is accessible (test manually)
2. Verify returning 2xx status quickly
3. Review response payloads in delivery history
4. Check server logs for errors
5. Endpoint will auto-disable after 5 failures

### Missing Events

1. Verify events subscribed in endpoint config
2. Check endpoint is active (not disabled)
3. Verify authentication is correct
4. Check rate limiting not blocking requests
