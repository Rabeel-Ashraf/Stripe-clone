"use client"

import Link from "next/link"

interface Breadcrumb {
  label: string
  href?: string
}

interface HeaderProps {
  breadcrumbs?: Breadcrumb[]
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  merchantName?: string
}

export function Header({
  breadcrumbs,
  searchPlaceholder,
  onSearch,
  merchantName,
}: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {crumb.href ? (
                  <Link href={crumb.href} className="text-[#635BFF] hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-600">{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && (
                  <span className="text-gray-400">/</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 ml-auto">
          {/* Search */}
          {searchPlaceholder && onSearch && (
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch(e.target.value)}
              className="input-base w-64"
            />
          )}

          {/* Notifications */}
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            🔔
          </button>

          {/* Merchant Menu */}
          {merchantName && (
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <span className="text-sm font-medium text-gray-900">
                {merchantName}
              </span>
              <button className="w-8 h-8 bg-[#635BFF] text-white rounded-full flex items-center justify-center text-sm font-bold">
                {merchantName.charAt(0).toUpperCase()}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
