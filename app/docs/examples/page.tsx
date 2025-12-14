export default function ExamplesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Code Examples</h1>
        <p className="text-xl text-gray-600">
          Ready-to-use code samples for common payment scenarios.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">JavaScript / TypeScript</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Payment Intent</h3>
            <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`const response = await fetch('/api/payment-intents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 2999,
    currency: 'usd',
    description: 'Order #123'
  })
});

const { client_secret, id } = await response.json();
console.log('Payment intent created:', id);`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Process Payment</h3>
            <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`// First tokenize the card
const tokenResponse = await fetch('/api/tokenize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cardNumber: '4242424242424242',
    expMonth: 12,
    expYear: 25,
    cvc: '123'
  })
});

const { token } = await tokenResponse.json();

// Then confirm the payment
const confirmResponse = await fetch(
  \`/api/payment-intents/\${intentId}/confirm\`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_live_...',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cardToken: token,
      client_secret: clientSecret
    })
  }
);

const result = await confirmResponse.json();
if (result.status === 'succeeded') {
  console.log('Payment successful!', result);
}`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">List Charges</h3>
            <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`const response = await fetch('/api/charges', {
  headers: {
    'Authorization': 'Bearer sk_live_...'
  }
});

const charges = await response.json();
charges.forEach(charge => {
  console.log(\`\${charge.id}: $\${charge.amount / 100}\`);
});`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Python</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Payment Intent</h3>
            <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`import requests

response = requests.post(
    'https://api.example.com/api/payment-intents',
    headers={
        'Authorization': 'Bearer sk_live_...',
        'Content-Type': 'application/json'
    },
    json={
        'amount': 2999,
        'currency': 'usd',
        'description': 'Order #123'
    }
)

data = response.json()
print(f"Payment intent created: {data['id']}")`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Handle Webhook</h3>
            <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`from flask import Flask, request
import hmac
import hashlib
import json
import os

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Webhook-Signature')
    payload = request.get_data(as_text=True)
    
    # Verify signature
    expected_sig = hmac.new(
        os.environ['WEBHOOK_SECRET'].encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    if signature != expected_sig:
        return {'error': 'Invalid signature'}, 401
    
    # Process webhook
    event = json.loads(payload)
    
    if event['type'] == 'payment.succeeded':
        charge = event['data']
        print(f"Payment received: {charge['id']}")
    
    return {'success': True}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">cURL</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Payment Intent</h3>
            <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`curl -X POST https://api.example.com/api/payment-intents \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 2999,
    "currency": "usd",
    "description": "Order #123"
  }'`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Charge Details</h3>
            <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`curl -X GET https://api.example.com/api/charges/ch_123 \\
  -H "Authorization: Bearer sk_live_..."`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Refund a Charge</h3>
            <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`curl -X POST https://api.example.com/api/charges/ch_123/refund \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 1000,
    "reason": "customer_request"
  }'`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">React Component</h2>
        <p className="text-gray-600 mb-4">
          Using the Stripe Clone embedded checkout form:
        </p>
        <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
{`import { StripeCheckoutForm } from '@/components/StripeCheckoutForm'

export default function CheckoutPage() {
  const handleSuccess = (result) => {
    console.log('Payment successful:', result)
    // Redirect to success page
  }

  return (
    <div>
      <h1>Checkout</h1>
      <StripeCheckoutForm
        amount={2999}
        description="Order #123"
        primaryColor="#3B82F6"
        onSuccess={handleSuccess}
      />
    </div>
  )
}`}
          </pre>
        </div>
      </section>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">📝 Test Credentials</h3>
        <p className="text-blue-800 text-sm">
          Use these test cards in all examples:
        </p>
        <div className="mt-3 space-y-2 font-mono text-sm text-blue-900">
          <div>4242 4242 4242 4242 - Success</div>
          <div>4000 0000 0000 0002 - Decline</div>
          <div>4000 0025 0000 3155 - 3DS Required</div>
        </div>
      </div>
    </div>
  )
}
