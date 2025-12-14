export default function APIPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">API Reference</h1>
        <p className="text-xl text-gray-600">
          Complete documentation for all Stripe Clone API endpoints.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Base URL</h2>
        <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
          https://your-domain.com/api
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication</h2>
        <p className="text-gray-600 mb-4">
          Include your API key in the Authorization header:
        </p>
        <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
{`Authorization: Bearer sk_live_your_secret_key
Content-Type: application/json`}
          </pre>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Intents</h2>
        <p className="text-gray-600 mb-4">
          Payment intents represent a customer's intent to pay. Use them to create, confirm, and process payments.
        </p>

        <div className="space-y-6">
          <div className="border-l-4 border-blue-600 pl-4">
            <h3 className="font-semibold text-gray-900">POST /payment-intents</h3>
            <p className="text-gray-600 text-sm mb-2">Create a new payment intent</p>
            <div className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              <pre>
{`{
  "amount": 2999,
  "currency": "usd",
  "description": "Order #123"
}`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-blue-600 pl-4">
            <h3 className="font-semibold text-gray-900">GET /payment-intents/:id</h3>
            <p className="text-gray-600 text-sm mb-2">Retrieve a payment intent</p>
          </div>

          <div className="border-l-4 border-blue-600 pl-4">
            <h3 className="font-semibold text-gray-900">POST /payment-intents/:id/confirm</h3>
            <p className="text-gray-600 text-sm mb-2">Confirm and process a payment</p>
            <div className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              <pre>
{`{
  "cardToken": "tok_visa",
  "client_secret": "pi_secret_..."
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Charges</h2>
        <p className="text-gray-600 mb-4">
          Charges represent successful payments. You can refund charges and check their details.
        </p>

        <div className="space-y-6">
          <div className="border-l-4 border-green-600 pl-4">
            <h3 className="font-semibold text-gray-900">GET /charges</h3>
            <p className="text-gray-600 text-sm mb-2">List all charges for your merchant</p>
          </div>

          <div className="border-l-4 border-green-600 pl-4">
            <h3 className="font-semibold text-gray-900">GET /charges/:id</h3>
            <p className="text-gray-600 text-sm mb-2">Retrieve a specific charge</p>
          </div>

          <div className="border-l-4 border-green-600 pl-4">
            <h3 className="font-semibold text-gray-900">POST /charges/:id/refund</h3>
            <p className="text-gray-600 text-sm mb-2">Refund a charge (full or partial)</p>
            <div className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              <pre>
{`{
  "amount": 1000,
  "reason": "customer_request"
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Customers</h2>
        <p className="text-gray-600 mb-4">
          Store customer information and manage payment methods.
        </p>

        <div className="space-y-6">
          <div className="border-l-4 border-purple-600 pl-4">
            <h3 className="font-semibold text-gray-900">POST /customers</h3>
            <p className="text-gray-600 text-sm mb-2">Create a new customer</p>
          </div>

          <div className="border-l-4 border-purple-600 pl-4">
            <h3 className="font-semibold text-gray-900">GET /customers</h3>
            <p className="text-gray-600 text-sm mb-2">List all customers</p>
          </div>

          <div className="border-l-4 border-purple-600 pl-4">
            <h3 className="font-semibold text-gray-900">GET /customers/:id</h3>
            <p className="text-gray-600 text-sm mb-2">Retrieve a customer</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Handling</h2>
        <p className="text-gray-600 mb-4">
          All errors include an error code and message:
        </p>
        <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
{`{
  "error": "card_declined",
  "message": "Your card was declined",
  "status": 402
}`}
          </pre>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Rate Limiting</h2>
        <p className="text-gray-600 mb-4">
          API requests are rate limited based on your merchant tier:
        </p>
        <ul className="space-y-2 text-gray-600 list-disc list-inside">
          <li>Starter: 1,000 requests/month</li>
          <li>Pro: 100,000 requests/month</li>
          <li>Enterprise: Unlimited</li>
        </ul>
      </section>

      <div className="bg-gray-100 p-6 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Need More Details?</h3>
        <p className="text-gray-600 text-sm">
          Check out the full API documentation or{" "}
          <a href="/docs/examples" className="text-blue-600 hover:text-blue-700">
            view code examples
          </a>
          .
        </p>
      </div>
    </div>
  )
}
