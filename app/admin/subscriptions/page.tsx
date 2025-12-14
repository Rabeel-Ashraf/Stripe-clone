import { prisma } from "@/lib/prisma"
import { requireAdminRole } from "@/lib/admin"

export default async function SubscriptionsPage() {
  await requireAdminRole()

  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const activeCount = subscriptions.filter((s: any) => s.status === "active").length
  const cancelledCount = subscriptions.filter((s: any) => s.status === "cancelled").length
  const pastDueCount = subscriptions.filter((s: any) => s.status === "past_due").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Subscriptions Analytics</h1>
        <p className="text-gray-400">Monitor recurring revenue and subscription health</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <p className="text-gray-400 text-sm font-medium">Active Subscriptions</p>
          <p className="text-3xl font-bold text-white mt-2">{activeCount}</p>
          <p className="text-gray-500 text-sm mt-2">↑ 6% vs last month</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <p className="text-gray-400 text-sm font-medium">MRR</p>
          <p className="text-3xl font-bold text-white mt-2">$45,600</p>
          <p className="text-gray-500 text-sm mt-2">Monthly recurring</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <p className="text-gray-400 text-sm font-medium">Churn Rate</p>
          <p className="text-3xl font-bold text-white mt-2">3.2%</p>
          <p className="text-gray-500 text-sm mt-2">Last month</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <p className="text-gray-400 text-sm font-medium">ARR</p>
          <p className="text-3xl font-bold text-white mt-2">$547,200</p>
          <p className="text-gray-500 text-sm mt-2">Annual recurring</p>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-white font-semibold mb-4">Status Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Active</span>
                <span className="text-white font-medium">{activeCount}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${subscriptions.length > 0 ? (activeCount / subscriptions.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Cancelled</span>
                <span className="text-white font-medium">{cancelledCount}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${subscriptions.length > 0 ? (cancelledCount / subscriptions.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Past Due</span>
                <span className="text-white font-medium">{pastDueCount}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{
                    width: `${subscriptions.length > 0 ? (pastDueCount / subscriptions.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-white font-semibold mb-4">Trend Analytics</h3>
          <div className="text-center py-8">
            <div className="text-gray-400">
              <p className="text-sm mb-2">MRR Trend (Last 12 Months)</p>
              <div className="flex items-end justify-center gap-1 h-24">
                {[40, 45, 48, 42, 45, 47, 46, 44, 43, 45, 45, 45.6].map((value, i) => (
                  <div
                    key={i}
                    className="bg-blue-500 rounded-t-sm"
                    style={{
                      height: `${(value / 50) * 100}%`,
                      width: "20px",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800">
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">ID</th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Merchant
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Current Period
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
              {subscriptions.map((sub: any) => (
                <tr key={sub.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="py-4 px-6 text-blue-400 font-mono text-sm">{sub.id.slice(0, 8)}</td>
                  <td className="py-4 px-6 text-gray-300">-</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      sub.status === "active"
                        ? "bg-green-900 text-green-200"
                        : sub.status === "cancelled"
                        ? "bg-red-900 text-red-200"
                        : "bg-amber-900 text-amber-200"
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-300 text-sm">
                    {sub.currentPeriodStart && sub.currentPeriodEnd
                      ? `${new Date(sub.currentPeriodStart).toLocaleDateString()} - ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                      : "-"}
                  </td>
                  <td className="py-4 px-6 text-gray-400 text-sm">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
