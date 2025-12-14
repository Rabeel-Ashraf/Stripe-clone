import { prisma } from "@/lib/prisma"
import { requireAdminRole } from "@/lib/admin"

export default async function WebhooksPage() {
  await requireAdminRole()

  const webhooks = await prisma.webhookEndpoint.findMany({
    include: {
      merchant: { select: { businessName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const activeCount = webhooks.filter((w: any) => w.isActive).length
  const failedInLast24h = webhooks.filter((w: any) => w.failureCount > 0).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Webhooks Status</h1>
        <p className="text-gray-400">Monitor webhook delivery and health</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Endpoints</p>
          <p className="text-2xl font-bold text-white mt-2">{webhooks.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-400 mt-2">{activeCount}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Failed (24h)</p>
          <p className="text-2xl font-bold text-red-400 mt-2">{failedInLast24h}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Pending Deliveries</p>
          <p className="text-2xl font-bold text-amber-400 mt-2">24</p>
        </div>
      </div>

      {/* Event Stats */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <h3 className="text-white font-semibold mb-4">Event Types (Last 24h)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { event: "payment.succeeded", count: 1234, color: "bg-green-500" },
            { event: "payment.failed", count: 45, color: "bg-red-500" },
            { event: "charge.refunded", count: 12, color: "bg-blue-500" },
          ].map((item) => (
            <div key={item.event} className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-300 text-sm font-medium">{item.event}</p>
              <p className="text-white text-lg font-bold mt-2">{item.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800">
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Merchant
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Endpoint URL
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Failures
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Last Delivery
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((webhook: any) => (
                <tr key={webhook.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="py-4 px-6 text-gray-300">{webhook.merchant.businessName}</td>
                  <td className="py-4 px-6 text-blue-400 text-sm break-all">{webhook.url}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      webhook.isActive
                        ? "bg-green-900 text-green-200"
                        : "bg-red-900 text-red-200"
                    }`}>
                      {webhook.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-300">{webhook.failureCount}</td>
                  <td className="py-4 px-6 text-gray-400 text-sm">
                    {webhook.lastFailedAt
                      ? new Date(webhook.lastFailedAt).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                        Details
                      </button>
                      {webhook.failureCount > 0 && (
                        <button className="text-amber-400 hover:text-amber-300 text-sm font-medium">
                          Retry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Failed Deliveries */}
      <div className="bg-gray-900 rounded-lg border border-red-700 p-6">
        <h3 className="text-white font-semibold mb-4">Recent Failed Deliveries</h3>
        <div className="space-y-3">
          <div className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-white font-medium">payment.succeeded</p>
              <p className="text-gray-400 text-sm">webhook.example.com/api/payment</p>
            </div>
            <div className="text-right">
              <p className="text-red-400 text-sm font-medium">Error 500</p>
              <p className="text-gray-400 text-xs">2 hours ago</p>
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-white font-medium">charge.refunded</p>
              <p className="text-gray-400 text-sm">webhook2.example.com/hooks</p>
            </div>
            <div className="text-right">
              <p className="text-red-400 text-sm font-medium">Timeout</p>
              <p className="text-gray-400 text-xs">5 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
