import Link from "next/link"

export const metadata = {
  title: "Stripe Clone - Learn Payment Processing",
  description: "The complete open-source Stripe replica to learn how payment processing works",
  openGraph: {
    title: "Stripe Clone - Learn Payment Processing",
    description: "The complete open-source Stripe replica to learn how payment processing works",
    type: "website",
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600">Stripe Clone</div>
          <div className="flex gap-8 items-center">
            <a href="#features" className="text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </a>
            <a href="/docs" className="text-gray-600 hover:text-gray-900">
              Docs
            </a>
            <Link href="/auth/signin" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
            The Complete Open-Source Stripe Replica
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn how payment processing works by building your own production-ready payment system. 
            Full source code, comprehensive documentation, and real-world examples.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/auth/signup" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Get Started
            </Link>
            <a href="#docs" className="px-8 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium">
              View Docs
            </a>
          </div>
          <div className="flex gap-4 justify-center pt-6 text-sm">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">📚 Educational</span>
            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full">🔓 Open Source</span>
            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full">⚙️ Production-Ready</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                emoji: "💳",
                title: "Complete Payment Processing",
                description: "Simulate card tokenization, authorization, and capture with fraud detection",
              },
              {
                emoji: "📊",
                title: "Merchant Dashboard",
                description: "View transactions, revenue, customer metrics, and real-time analytics",
              },
              {
                emoji: "🔄",
                title: "Subscription Billing",
                description: "Recurring charges with trial periods, retries, and cancellation handling",
              },
              {
                emoji: "🔗",
                title: "Webhooks & Events",
                description: "Real-time event delivery with retry logic and signature verification",
              },
              {
                emoji: "🛡️",
                title: "Admin Oversight",
                description: "Manage merchants, view platform metrics, and review fraud cases",
              },
              {
                emoji: "⚙️",
                title: "Production-Ready Code",
                description: "Full source code, tests, documentation, and TypeScript throughout",
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-lg p-8 border border-gray-200">
                <div className="text-4xl mb-4">{feature.emoji}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: "1",
                title: "Sign Up",
                description: "Create a merchant account and get API keys",
              },
              {
                number: "2",
                title: "Build Integration",
                description: "Add payment forms to your application",
              },
              {
                number: "3",
                title: "Process Payments",
                description: "Accept payments and manage subscriptions",
              },
            ].map((step, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto">
                  {step.number}
                </div>
                <h3 className="text-2xl font-semibold">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Simple Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: "Free",
                features: [
                  "Up to 10,000 API calls/month",
                  "1 webhook endpoint",
                  "Basic analytics",
                  "Email support",
                ],
              },
              {
                name: "Pro",
                price: "$99",
                period: "/month",
                features: [
                  "100,000 API calls/month",
                  "5 webhook endpoints",
                  "Advanced analytics",
                  "Priority support",
                  "Custom branding",
                ],
                highlighted: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                features: [
                  "Unlimited API calls",
                  "Unlimited webhook endpoints",
                  "White-label solution",
                  "Dedicated support",
                  "Custom integrations",
                ],
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`rounded-lg p-8 ${
                  plan.highlighted
                    ? "bg-blue-600 text-white border-2 border-blue-600 transform scale-105"
                    : "bg-white border border-gray-200"
                }`}
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold mb-6">
                  {plan.price}
                  {plan.period && <span className="text-lg font-normal">{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex gap-2">
                      <span>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className={`block text-center py-2 px-4 rounded-lg font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-white text-blue-600 hover:bg-gray-100"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Built With Modern Technology</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { name: "Next.js", icon: "▲" },
              { name: "React", icon: "⚛️" },
              { name: "TypeScript", icon: "TS" },
              { name: "PostgreSQL", icon: "🐘" },
              { name: "Prisma", icon: "🔷" },
              { name: "Tailwind", icon: "🎨" },
              { name: "Jest", icon: "✓" },
              { name: "NextAuth.js", icon: "🔐" },
            ].map((tech, i) => (
              <div key={i} className="p-6 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">{tech.icon}</div>
                <p className="font-semibold text-gray-900">{tech.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "Is this real payment processing?",
                a: "No, this is a simulation for educational purposes. It demonstrates how payment systems work with fake payment processing.",
              },
              {
                q: "Can I use this in production?",
                a: "Not for processing real payments, but you can deploy the code to learn or use it as a foundation for your own system.",
              },
              {
                q: "How do I deploy it?",
                a: "Deploy to Vercel, Netlify, or any Node.js host. See the documentation for step-by-step instructions.",
              },
              {
                q: "Is the code open source?",
                a: "Yes! The complete source code is available on GitHub. You can fork, modify, and learn from it.",
              },
              {
                q: "What are the limitations?",
                a: "This is an educational project. For production payments, use Stripe or Adyen directly.",
              },
              {
                q: "How is my data handled?",
                a: "All data is handled according to the terms of service. Card data is never stored - only tokenized.",
              },
            ].map((item, i) => (
              <details key={i} className="group p-6 bg-white rounded-lg border border-gray-200">
                <summary className="cursor-pointer font-semibold text-gray-900 group-open:text-blue-600">
                  {item.q}
                </summary>
                <p className="mt-4 text-gray-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to Learn?</h2>
          <p className="text-xl text-gray-600">
            Start building your own payment processing system today.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signup" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Get Started Free
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="/docs" className="hover:text-white">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/docs" className="hover:text-white">
                    Getting Started
                  </a>
                </li>
                <li>
                  <a href="/docs" className="hover:text-white">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="/docs" className="hover:text-white">
                    Examples
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 Stripe Clone. Educational project.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
