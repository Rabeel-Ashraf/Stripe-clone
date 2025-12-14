import { ReactNode } from "react"
import DocsNavigation from "@/components/DocsNavigation"

export const metadata = {
  title: "Documentation - Stripe Clone",
  description: "Learn how to integrate and use Stripe Clone",
}

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold text-blue-600">
            Stripe Clone
          </a>
          <a href="/auth/signin" className="text-gray-600 hover:text-gray-900">
            Sign In
          </a>
        </div>
      </nav>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <DocsNavigation />

        {/* Main Content */}
        <main className="flex-1 p-8 md:p-12 max-w-4xl">
          {children}
        </main>

        {/* Right Sidebar - TOC */}
        <aside className="hidden lg:block w-64 p-8 border-l border-gray-200">
          <div className="sticky top-24">
            <p className="text-sm font-semibold text-gray-900 mb-4">On this page</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="hover:text-blue-600 cursor-pointer">Getting Started</p>
              <p className="hover:text-blue-600 cursor-pointer">Installation</p>
              <p className="hover:text-blue-600 cursor-pointer">Configuration</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
