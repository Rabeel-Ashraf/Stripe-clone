# Payment API Reference

Complete API reference for payment processing endpoints.

## Authentication

All API requests require authentication using your secret API key:

```bash
Authorization: Bearer sk_live_your_secret_key
```

Or using publishable keys for certain client-side operations:

```bash
Authorization: Bearer pk_live_your_publishable_key
```

---

## POST /api/payment-intents

Creates a new PaymentIntent to collect payment from a customer.

### Request

```json
{
  "amount": 5000,
  "currency": "usd",
  "description": "Widget purchase",
  "metadata": {
    "orderId": "order_123"
  },
  "customerId": "cus_abc123",
  "receiptEmail": "customer@example.com"
}
```

### Parameters

- `amount` (required): Amount in cents (minimum 50)
- `currency` (optional): Three-letter ISO currency code (default: "usd")
- `description` (optional): Description of the payment
- `metadata` (optional): Key-value pairs for custom data
- `customerId` (optional): Customer ID to associate with payment
- `receiptEmail` (optional): Email address to send receipt to

### Response

```json
{
  "id": "pi_1MqLxKLkdIwHu7ixPt7u2uqC",
  "clientSecret": "pi_1MqLxKLkdIwHu7ixPt7u2uqC_secret_abc123",
  "status": "requires_payment_method",
  "amount": 5000,
  "currency": "usd",
  "description": "Widget purchase",
  "metadata": {
    "orderId": "order_123"
  },
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

### Error Codes

- `400` - Invalid request (amount too small, invalid currency, etc.)
- `401` - Authentication failed
- `500` - Internal server error

---

## POST /api/payment-intents/:id/confirm

Confirms a PaymentIntent with a payment method (card token).

### Request

```json
{
  "cardToken": "tok_live_abc123",
  "cardNumber": "4242424242424242",
  "clientSecret": "pi_xxx_secret_yyy"
}
```

### Parameters

- `cardToken` (required): Token from card tokenization
- `cardNumber` (required): Card number for authorization simulation
- `clientSecret` (optional): Client secret for CSRF protection

### Response - Success

```json
{
  "id": "pi_1MqLxKLkdIwHu7ixPt7u2uqC",
  "status": "succeeded",
  "charge": {
    "id": "ch_1MqLxKLkdIwHu7ixPt7u2uqD",
    "amount": 5000,
    "status": "succeeded",
    "cardLast4": "4242",
    "cardBrand": "visa",
    "authorizationCode": "auth_abc123",
    "createdAt": "2025-01-15T10:31:00.000Z"
  }
}
```

### Response - Requires 3D Secure

```json
{
  "id": "pi_1MqLxKLkdIwHu7ixPt7u2uqC",
  "status": "requires_action",
  "nextAction": {
    "type": "redirect_to_3ds",
    "redirectUrl": "/3ds/authenticate/pi_1MqLxKLkdIwHu7ixPt7u2uqC"
  }
}
```

### Response - Declined

```json
{
  "error": "Payment declined",
  "charge": {
    "id": "ch_1MqLxKLkdIwHu7ixPt7u2uqD",
    "status": "failed",
    "failureCode": "card_declined",
    "failureMessage": "Your card was declined. Please try a different payment method."
  }
}
```

### Error Codes

- `400` - Invalid request or payment blocked by fraud detection
- `401` - Authentication failed
- `402` - Payment declined
- `403` - PaymentIntent does not belong to merchant
- `404` - PaymentIntent not found
- `500` - Internal server error

---

## GET /api/payment-intents

Lists all PaymentIntents for the authenticated merchant.

### Query Parameters

- `limit` (optional): Number of results (1-100, default: 10)
- `offset` (optional): Number of results to skip (default: 0)
- `status` (optional): Filter by status

### Response

```json
{
  "data": [
    {
      "id": "pi_1MqLxKLkdIwHu7ixPt7u2uqC",
      "status": "succeeded",
      "amount": 5000,
      "currency": "usd",
      "description": "Widget purchase",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "totalCount": 42,
  "hasMore": true
}
```

---

## GET /api/charges

Lists all charges for the authenticated merchant.

### Query Parameters

- `limit` (optional): Number of results (1-100, default: 10)
- `offset` (optional): Number of results to skip (default: 0)
- `status` (optional): Filter by status (succeeded, failed, pending, refunded)

### Response

```json
{
  "data": [
    {
      "id": "ch_1MqLxKLkdIwHu7ixPt7u2uqD",
      "amount": 5000,
      "currency": "usd",
      "status": "succeeded",
      "cardLast4": "4242",
      "cardBrand": "visa",
      "authorizationCode": "auth_abc123",
      "fraudScore": 12.5,
      "fraudCheckStatus": "passed",
      "amountRefunded": 0,
      "isRefunded": false,
      "createdAt": "2025-01-15T10:31:00.000Z"
    }
  ],
  "totalCount": 156,
  "hasMore": true
}
```

---

## GET /api/charges/:id

Retrieves a single charge with full details.

### Response

```json
{
  "id": "ch_1MqLxKLkdIwHu7ixPt7u2uqD",
  "amount": 5000,
  "currency": "usd",
  "status": "succeeded",
  "cardLast4": "4242",
  "cardBrand": "visa",
  "cardToken": "tok_live_abc123",
  "authorizationStatus": "approved",
  "authorizationCode": "auth_abc123",
  "fraudCheckStatus": "passed",
  "fraudScore": 12.5,
  "amountRefunded": 0,
  "isRefunded": false,
  "metadata": {
    "orderId": "order_123"
  },
  "receiptEmail": "customer@example.com",
  "createdAt": "2025-01-15T10:31:00.000Z",
  "updatedAt": "2025-01-15T10:31:00.000Z",
  "paymentIntent": {
    "id": "pi_1MqLxKLkdIwHu7ixPt7u2uqC",
    "description": "Widget purchase"
  },
  "refunds": []
}
```

### Error Codes

- `401` - Authentication failed
- `403` - Charge does not belong to merchant
- `404` - Charge not found
- `500` - Internal server error

---

## POST /api/charges/:id/refund

Refunds a charge, either fully or partially.

### Request

```json
{
  "amount": 2500,
  "reason": "requested_by_customer",
  "metadata": {
    "reason_details": "Customer returned product"
  }
}
```

### Parameters

- `amount` (optional): Amount to refund in cents (defaults to full amount)
- `reason` (optional): One of: `requested_by_customer`, `duplicate`, `fraudulent`
- `metadata` (optional): Key-value pairs for custom data

### Response

```json
{
  "id": "re_1MqLxKLkdIwHu7ixPt7u2uqE",
  "chargeId": "ch_1MqLxKLkdIwHu7ixPt7u2uqD",
  "amount": 2500,
  "currency": "usd",
  "status": "succeeded",
  "reason": "requested_by_customer",
  "metadata": {},
  "createdAt": "2025-01-15T11:00:00.000Z"
}
```

### Error Codes

- `400` - Invalid request (refund amount exceeds available balance, charge cannot be refunded)
- `401` - Authentication failed
- `403` - Charge does not belong to merchant
- `404` - Charge not found
- `500` - Internal server error

---

## Webhook Events

The following webhook events are fired during payment processing:

### payment.succeeded

Fired when a charge is successfully created and approved.

```json
{
  "id": "evt_1MqLxKLkdIwHu7ixPt7u2uqF",
  "type": "payment.succeeded",
  "created": 1673782260,
  "data": {
    "object": {
      "id": "ch_1MqLxKLkdIwHu7ixPt7u2uqD",
      "amount": 5000,
      "currency": "usd",
      "status": "succeeded",
      "cardLast4": "4242",
      "cardBrand": "visa",
      "createdAt": "2025-01-15T10:31:00.000Z"
    }
  }
}
```

### payment.failed

Fired when a charge is declined or fails authorization.

```json
{
  "id": "evt_1MqLxKLkdIwHu7ixPt7u2uqF",
  "type": "payment.failed",
  "created": 1673782260,
  "data": {
    "object": {
      "id": "ch_1MqLxKLkdIwHu7ixPt7u2uqD",
      "paymentIntentId": "pi_1MqLxKLkdIwHu7ixPt7u2uqC",
      "amount": 5000,
      "status": "failed",
      "failureCode": "card_declined",
      "failureMessage": "Your card was declined."
    }
  }
}
```

### charge.refunded

Fired when a refund is issued for a charge.

```json
{
  "id": "evt_1MqLxKLkdIwHu7ixPt7u2uqF",
  "type": "charge.refunded",
  "created": 1673782260,
  "data": {
    "object": {
      "id": "re_1MqLxKLkdIwHu7ixPt7u2uqE",
      "chargeId": "ch_1MqLxKLkdIwHu7ixPt7u2uqD",
      "amount": 2500,
      "currency": "usd",
      "status": "succeeded",
      "reason": "requested_by_customer",
      "createdAt": "2025-01-15T11:00:00.000Z"
    }
  }
}
```

### Webhook Signature Verification

All webhooks include an `X-Stripe-Signature` header for verification:

```
X-Stripe-Signature: t=1673782260,v1=abc123def456...
```

The signature is computed as:

```
HMAC-SHA256(timestamp.payload, webhook_secret)
```

Always verify webhook signatures before processing events.
