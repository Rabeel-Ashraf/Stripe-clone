"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/admin", label: "Overview", emoji: "📊" },
  { href: "/admin/merchants", label: "Merchants", emoji: "👥" },
  { href: "/admin/transactions", label: "Transactions", emoji: "💳" },
  { href: "/admin/subscriptions", label: "Subscriptions", emoji: "🔄" },
  { href: "/admin/webhooks", label: "Webhooks", emoji: "🔗" },
  { href: "/admin/audit-logs", label: "Audit Logs", emoji: "📝" },
  { href: "/admin/health", label: "System Health", emoji: "🏥" },
  { href: "/admin/settings", label: "Settings", emoji: "⚙️" },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-950 border-r border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-700">
        <Link href="/admin" className="text-2xl font-bold text-blue-400">
          Admin
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          ← Back to Merchant Dashboard
        </Link>
      </div>
    </div>
  )
}
