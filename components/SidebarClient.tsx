"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

interface NavItem {
  label: string
  href: string
  icon: string
}

interface SidebarClientProps {
  merchantName: string
  items: NavItem[]
  onLogout: () => Promise<void>
}

export default function SidebarClient({
  merchantName,
  items,
  onLogout,
}: SidebarClientProps) {
  const pathname = usePathname()
  const [darkMode, setDarkMode] = useState(false)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    if (!darkMode) {
      document.body.classList.add("dark")
    } else {
      document.body.classList.remove("dark")
    }
  }

  const handleLogout = async () => {
    await onLogout()
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo/Branding */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-[#635BFF]">{merchantName}</h1>
        <p className="text-xs text-gray-500 mt-1">Merchant Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive
                  ? "bg-[#635BFF]/10 text-[#635BFF]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        <button
          onClick={toggleDarkMode}
          className="w-full px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium transition-colors text-sm"
        >
          {darkMode ? "☀️" : "🌙"} {darkMode ? "Light" : "Dark"}
        </button>

        <form
          action={async () => {
            await handleLogout()
          }}
        >
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium transition-colors text-sm"
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  )
}
