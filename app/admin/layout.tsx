import { requireAdminRole } from "@/lib/admin"
import { ReactNode } from "react"
import AdminSidebar from "@/components/AdminSidebar"
import AdminHeader from "@/components/AdminHeader"

export const metadata = {
  title: "Admin Dashboard - Stripe Clone",
  description: "Platform admin dashboard for oversight and management",
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminRole()
  
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader session={session} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-800">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
