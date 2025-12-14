export default function DocsHome() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Documentation</h1>
        <p className="text-xl text-gray-600">
          Learn how to build with Stripe Clone, from getting started to advanced integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="/docs/quickstart"
          className="p-6 border border-gray-200 rounded-lg hover:border-blue-600 hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">🚀 Quick Start</h3>
          <p className="text-gray-600">
            Get up and running in 5 minutes with our quick start guide.
          </p>
        </a>

        <a
          href="/docs/api"
          className="p-6 border border-gray-200 rounded-lg hover:border-blue-600 hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">📚 API Reference</h3>
          <p className="text-gray-600">
            Complete API documentation for all endpoints and methods.
          </p>
        </a>

        <a
          href="/docs/webhooks"
          className="p-6 border border-gray-200 rounded-lg hover:border-blue-600 hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">🔗 Webhooks</h3>
          <p className="text-gray-600">
            Learn how to receive real-time events from Stripe Clone.
          </p>
        </a>

        <a
          href="/docs/examples"
          className="p-6 border border-gray-200 rounded-lg hover:border-blue-600 hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">💻 Code Examples</h3>
          <p className="text-gray-600">
            Ready-to-use code samples in JavaScript, Python, and more.
          </p>
        </a>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Welcome to Stripe Clone!</h2>
        <p className="text-blue-800 mb-4">
          Stripe Clone is an open-source educational project that demonstrates how modern payment processing systems work. 
          This documentation will guide you through setting up a test merchant account, integrating payment processing into your application, 
          and managing transactions.
        </p>
        <p className="text-blue-800">
          The project is built with Next.js, PostgreSQL, and TypeScript, making it a great learning resource for building 
          production-grade payment systems.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Core Concepts</h2>
        <div className="space-y-4">
          {[
            {
              title: "Payment Intents",
              description: "The primary way to accept payments. Create an intent, collect card details, and confirm payment.",
            },
            {
              title: "Charges",
              description: "Represent successful payments. Each charge has a status, fraud score, and can be refunded.",
            },
            {
              title: "Customers",
              description: "Represent buyers. Store customer information and card tokens for future purchases.",
            },
            {
              title: "Subscriptions",
              description: "Handle recurring billing with configurable intervals and trial periods.",
            },
            {
              title: "Webhooks",
              description: "Real-time event delivery. Get notified when payments succeed, fail, or are refunded.",
            },
            {
              title: "Fraud Detection",
              description: "Automatic fraud scoring helps identify risky transactions that need verification.",
            },
          ].map((concept) => (
            <div key={concept.title} className="border-l-4 border-blue-600 pl-4 py-2">
              <h3 className="font-semibold text-gray-900">{concept.title}</h3>
              <p className="text-gray-600 text-sm">{concept.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Accounts</h2>
        <p className="text-gray-600 mb-4">
          Use these test accounts to explore Stripe Clone without creating your own account:
        </p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <p>Email: demo@stripe-clone.test</p>
          <p>Password: Demo1234!</p>
          <p className="mt-2 text-gray-500">
            (Note: For admin features, use admin@stripe-clone.test / Admin1234!)
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Next Steps</h2>
        <ol className="space-y-3 list-decimal list-inside text-gray-600">
          <li>
            <a href="/docs/quickstart" className="text-blue-600 hover:text-blue-700">
              Follow the quick start guide
            </a>{" "}
            to create your first payment
          </li>
          <li>
            <a href="/docs/api" className="text-blue-600 hover:text-blue-700">
              Read the API reference
            </a>{" "}
            to understand available endpoints
          </li>
          <li>
            <a href="/docs/examples" className="text-blue-600 hover:text-blue-700">
              Check out code examples
            </a>{" "}
            in your preferred language
          </li>
          <li>
            <a href="/docs/webhooks" className="text-blue-600 hover:text-blue-700">
              Set up webhooks
            </a>{" "}
            to receive real-time events
          </li>
        </ol>
      </div>
    </div>
  )
}
