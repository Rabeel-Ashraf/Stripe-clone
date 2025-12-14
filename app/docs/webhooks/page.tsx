export default function WebhooksPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Webhooks</h1>
        <p className="text-xl text-gray-600">
          Receive real-time notifications about payment events.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">What are Webhooks?</h2>
        <p className="text-gray-600">
          Webhooks allow Stripe Clone to notify your application about events as they happen. 
          Instead of polling the API, we push event data to your specified endpoint.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Types</h2>
        <div className="space-y-3">
          {[
            { event: "payment.succeeded", description: "A payment was successful" },
            { event: "payment.failed", description: "A payment failed" },
            { event: "charge.refunded", description: "A charge was refunded" },
            { event: "subscription.created", description: "A subscription was created" },
            { event: "subscription.cancelled", description: "A subscription was cancelled" },
          ].map((item) => (
            <div key={item.event} className="border-l-4 border-blue-600 pl-4">
              <p className="font-mono font-semibold text-gray-900">{item.event}</p>
              <p className="text-gray-600 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Setting Up Webhooks</h2>
        <ol className="space-y-4 list-decimal list-inside text-gray-600">
          <li>
            Go to your merchant dashboard Settings → Webhooks
          </li>
          <li>
            Click "Add Endpoint" and enter your webhook URL
          </li>
          <li>
            Select which events you want to receive
          </li>
          <li>
            Copy the webhook signing secret (keep this secure!)
          </li>
        </ol>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Webhook Payload</h2>
        <p className="text-gray-600 mb-4">
          Each webhook is sent as a POST request with a JSON payload:
        </p>
        <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
{`{
  "id": "evt_1234567890",
  "object": "event",
  "type": "payment.succeeded",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "ch_1234567890",
    "amount": 2999,
    "currency": "usd",
    "status": "succeeded",
    "cardLast4": "4242",
    "cardBrand": "visa",
    "fraudScore": 15
  }
}`}
          </pre>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Signature Verification</h2>
        <p className="text-gray-600 mb-4">
          Every webhook includes an HMAC-SHA256 signature header for verification. Always verify the signature!
        </p>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">JavaScript/Node.js</h3>
          <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
{`import crypto from 'crypto'

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return hash === signature
}

// In your Express handler:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature']
  const payload = JSON.stringify(req.body)
  
  if (!verifyWebhook(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }
  
  // Process webhook
  res.json({ success: true })
})`}
            </pre>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <h3 className="font-semibold text-gray-900">Python</h3>
          <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
{`import hmac
import hashlib
import json

def verify_webhook(payload, signature, secret):
    computed_hash = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return computed_hash == signature

@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Webhook-Signature')
    payload = request.get_data(as_text=True)
    
    if not verify_webhook(payload, signature, os.environ['WEBHOOK_SECRET']):
        return {'error': 'Invalid signature'}, 401
    
    data = json.loads(payload)
    # Process webhook
    return {'success': True}`}
            </pre>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Retry Policy</h2>
        <p className="text-gray-600 mb-4">
          If your endpoint doesn't return a 200 status within 30 seconds, we'll retry:
        </p>
        <ul className="space-y-2 text-gray-600 list-disc list-inside">
          <li>Attempt 1: Immediately</li>
          <li>Attempt 2: 1 minute later</li>
          <li>Attempt 3: 5 minutes later</li>
          <li>Attempt 4: 1 hour later</li>
          <li>Attempt 5: 24 hours later</li>
        </ul>
        <p className="text-gray-600 mt-4">
          After 5 failed attempts, the webhook endpoint is disabled.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Testing Webhooks</h2>
        <p className="text-gray-600 mb-4">
          You can test your webhook endpoint from the dashboard:
        </p>
        <ol className="space-y-2 list-decimal list-inside text-gray-600">
          <li>Go to Settings → Webhooks</li>
          <li>Click the "Test" button next to your endpoint</li>
          <li>Select an event type to send</li>
          <li>Check that your endpoint received the webhook</li>
        </ol>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Practices</h2>
        <ul className="space-y-3">
          {[
            "Always verify webhook signatures",
            "Use a separate endpoint for webhooks",
            "Return 200 immediately, process asynchronously",
            "Log all webhook events for debugging",
            "Handle duplicate events (use event ID)",
            "Test with the dashboard webhook tester",
            "Use ngrok or similar for local testing",
          ].map((practice) => (
            <li key={practice} className="text-gray-600 flex gap-2">
              <span>✓</span>
              <span>{practice}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="bg-gray-100 p-6 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Common Issues</h3>
        <p className="text-gray-600 text-sm mb-2">
          <strong>Webhook not being received?</strong> Check that:
        </p>
        <ul className="text-gray-600 text-sm list-disc list-inside space-y-1">
          <li>Your endpoint is publicly accessible</li>
          <li>Your server accepts POST requests</li>
          <li>You return 200 status within 30 seconds</li>
          <li>Check the webhook delivery logs in your dashboard</li>
        </ul>
      </div>
    </div>
  )
}
