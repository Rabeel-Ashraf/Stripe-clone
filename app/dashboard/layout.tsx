import { auth, signOut } from "@/lib/auth"
import { Sidebar } from "@/components/Sidebar"
import { Header } from "@/components/Header"
import Link from "next/link"

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: "📊" },
  { label: "Transactions", href: "/dashboard/transactions", icon: "💳" },
  { label: "Products", href: "/dashboard/products", icon: "📦" },
  { label: "Customers", href: "/dashboard/customers", icon: "👥" },
  { label: "Settings", href: "/dashboard/settings", icon: "⚙️" },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  const merchantName = session.user.businessName || "Dashboard"

  const handleLogout = async () => {
    "use server"
    await signOut()
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        merchantName={merchantName}
        items={NAV_ITEMS}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header
          breadcrumbs={[{ label: "Dashboard" }]}
          searchPlaceholder="Search transactions, products, customers..."
          merchantName={merchantName}
        />

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4 text-center text-sm text-gray-600">
          <p>
            © {new Date().getFullYear()} Payment Platform. |{" "}
            <Link href="/docs" className="text-[#635BFF] hover:underline">
              Documentation
            </Link>
            {" "}| Environment: development
          </p>
        </footer>
      </div>
    </div>
  )
}
