"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  {
    group: "Getting Started",
    items: [
      { href: "/docs", label: "Introduction" },
      { href: "/docs/quickstart", label: "Quick Start" },
      { href: "/docs/setup", label: "Setup Guide" },
    ],
  },
  {
    group: "API Reference",
    items: [
      { href: "/docs/api", label: "API Overview" },
      { href: "/docs/api/payment-intents", label: "Payment Intents" },
      { href: "/docs/api/charges", label: "Charges" },
      { href: "/docs/api/customers", label: "Customers" },
      { href: "/docs/api/subscriptions", label: "Subscriptions" },
    ],
  },
  {
    group: "Guides",
    items: [
      { href: "/docs/webhooks", label: "Webhooks" },
      { href: "/docs/fraud-detection", label: "Fraud Detection" },
      { href: "/docs/3ds", label: "3D Secure" },
      { href: "/docs/testing", label: "Testing" },
    ],
  },
  {
    group: "Examples",
    items: [
      { href: "/docs/examples", label: "Code Examples" },
      { href: "/docs/examples/javascript", label: "JavaScript" },
      { href: "/docs/examples/python", label: "Python" },
      { href: "/docs/examples/curl", label: "cURL" },
    ],
  },
]

export default function DocsNavigation() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:block w-64 bg-white border-r border-gray-200 p-8 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="space-y-8">
        {navItems.map((group) => (
          <div key={group.group}>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{group.group}</h3>
            <ul className="space-y-2">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`text-sm transition-colors ${
                        isActive
                          ? "text-blue-600 font-medium"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  )
}
