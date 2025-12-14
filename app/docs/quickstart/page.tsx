export default function QuickStartPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Quick Start</h1>
        <p className="text-xl text-gray-600">
          Get up and running with Stripe Clone in 5 minutes.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Before you start</h3>
        <p className="text-blue-800 text-sm">
          You'll need a test merchant account. Use the demo account credentials or create a new one.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 1: Sign In</h2>
        <p className="text-gray-600 mb-4">
          Create an account or sign in with a test merchant account:
        </p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
          <p>Email: demo@stripe-clone.test</p>
          <p>Password: Demo1234!</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 2: Get API Keys</h2>
        <p className="text-gray-600 mb-4">
          In your merchant dashboard, navigate to Settings → API Keys to view your keys:
        </p>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Publishable Key (pk_live_...)</p>
          <p className="text-sm text-gray-600">Used in frontend code</p>
          <p className="text-sm text-gray-600 mb-4 font-mono">pk_live_abc123xyz789</p>

          <p className="text-sm text-gray-600 mb-2">Secret Key (sk_live_...)</p>
          <p className="text-sm text-gray-600">Never share! Keep secure on server</p>
          <p className="text-sm text-gray-600 font-mono">sk_live_secret_key_here</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 3: Create Your First Payment</h2>
        <p className="text-gray-600 mb-4">
          Use the hosted checkout page or call the API:
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Option A: Use Hosted Checkout</h3>
            <p className="text-gray-600 mb-2">
              The simplest way is to use our hosted checkout page:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`// Create a payment intent
const response = await fetch('/api/payment-intents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 2999, // $29.99 in cents
    currency: 'usd',
    description: 'Test payment'
  })
});

const { client_secret } = await response.json();

// Redirect to checkout
window.location.href = \`/checkout/\${client_secret}\`;`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Option B: Call API Directly</h3>
            <p className="text-gray-600 mb-2">
              For more control, use the API endpoints:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`// 1. Create payment intent
POST /api/payment-intents
Authorization: Bearer sk_live_...
{
  "amount": 2999,
  "currency": "usd"
}

// 2. Tokenize card
POST /api/tokenize
{
  "cardNumber": "4242424242424242",
  "expMonth": 12,
  "expYear": 25,
  "cvc": "123"
}

// 3. Confirm payment
POST /api/payment-intents/{intent_id}/confirm
{
  "cardToken": "tok_...",
  "client_secret": "..."
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 4: Test Card Numbers</h2>
        <p className="text-gray-600 mb-4">
          Use these test card numbers in the checkout form:
        </p>
        <div className="space-y-3">
          {[
            {
              number: "4242 4242 4242 4242",
              status: "Successful",
              color: "bg-green-50",
            },
            {
              number: "4000 0000 0000 0002",
              status: "Declined",
              color: "bg-red-50",
            },
            {
              number: "4000 0025 0000 3155",
              status: "Requires 3DS",
              color: "bg-amber-50",
            },
          ].map((card) => (
            <div key={card.number} className={`p-4 rounded-lg ${card.color}`}>
              <p className="font-mono text-sm">{card.number}</p>
              <p className="text-sm text-gray-600">{card.status}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 5: Handle the Response</h2>
        <p className="text-gray-600 mb-4">
          After payment processing, you'll receive a status:
        </p>
        <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
{`{
  "id": "ch_1234567890",
  "amount": 2999,
  "currency": "usd",
  "status": "succeeded",
  "cardLast4": "4242",
  "cardBrand": "visa",
  "fraudScore": 15,
  "authorizationCode": "AUTH123",
  "createdAt": "2024-01-15T10:30:00Z"
}`}
          </pre>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
        <ul className="space-y-2 text-gray-600">
          <li>
            📚{" "}
            <a href="/docs/api" className="text-blue-600 hover:text-blue-700">
              Read the API reference
            </a>{" "}
            for complete endpoint documentation
          </li>
          <li>
            🔗{" "}
            <a href="/docs/webhooks" className="text-blue-600 hover:text-blue-700">
              Set up webhooks
            </a>{" "}
            to receive payment notifications
          </li>
          <li>
            💻{" "}
            <a href="/docs/examples" className="text-blue-600 hover:text-blue-700">
              Check out code examples
            </a>{" "}
            in your programming language
          </li>
          <li>
            🧪{" "}
            <a href="/docs/testing" className="text-blue-600 hover:text-blue-700">
              Learn testing best practices
            </a>{" "}
            for payment integrations
          </li>
        </ul>
      </section>

      <div className="bg-gray-100 p-6 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
        <p className="text-gray-600 text-sm">
          Check out the{" "}
          <a href="/docs" className="text-blue-600 hover:text-blue-700">
            full documentation
          </a>{" "}
          or view{" "}
          <a href="/docs/examples" className="text-blue-600 hover:text-blue-700">
            code examples
          </a>
          .
        </p>
      </div>
    </div>
  )
}
