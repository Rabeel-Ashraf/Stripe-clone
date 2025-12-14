import { prisma } from "@/lib/prisma"
import { requireAdminRole } from "@/lib/admin"

export default async function MerchantsPage() {
  await requireAdminRole()

  const merchants = await prisma.merchant.findMany({
    where: { role: "merchant" },
    include: {
      apiKeys: true,
      _count: {
        select: { charges: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Calculate revenue for each merchant
  const merchantsWithStats = await Promise.all(
    merchants.map(async (merchant: any) => {
      const revenue = await prisma.charge.aggregate({
        where: { merchantId: merchant.id, status: "succeeded" },
        _sum: { amount: true },
      })
      return {
        ...merchant,
        revenue: revenue._sum.amount || 0,
      }
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Merchants Management</h1>
          <p className="text-gray-400">View and manage all merchant accounts</p>
        </div>
        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          + Add Merchant
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by email or name..."
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
          />
          <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
            <option>All Status</option>
            <option>Active</option>
            <option>Suspended</option>
            <option>Deleted</option>
          </select>
          <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
            <option>All Tiers</option>
            <option>Starter</option>
            <option>Pro</option>
            <option>Enterprise</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Filter
          </button>
        </div>
      </div>

      {/* Merchants Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800">
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Merchant
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Business
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Tier
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Revenue
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Transactions
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Created
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {merchantsWithStats.map((merchant) => (
                <tr key={merchant.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="py-4 px-6 text-white font-medium">{merchant.email}</td>
                  <td className="py-4 px-6 text-gray-300">{merchant.businessName}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      merchant.tier === "starter"
                        ? "bg-blue-900 text-blue-200"
                        : merchant.tier === "pro"
                        ? "bg-purple-900 text-purple-200"
                        : "bg-amber-900 text-amber-200"
                    }`}>
                      {merchant.tier}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      merchant.status === "active"
                        ? "bg-green-900 text-green-200"
                        : "bg-red-900 text-red-200"
                    }`}>
                      {merchant.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-white">
                    ${(merchant.revenue / 100).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-gray-300">{merchant._count.charges}</td>
                  <td className="py-4 px-6 text-gray-400 text-sm">
                    {new Date(merchant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                        View
                      </button>
                      <button className="text-amber-400 hover:text-amber-300 text-sm font-medium">
                        Suspend
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {merchantsWithStats.length === 0 && (
        <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-700">
          <p className="text-gray-400">No merchants found</p>
        </div>
      )}
    </div>
  )
}
