import { prisma } from "@/lib/prisma"
import { requireAdminRole } from "@/lib/admin"

export default async function AdminOverview() {
  await requireAdminRole()

  // Fetch platform-wide metrics
  const [
    totalMerchants,
    activeMerchants,
    totalCharges,
    totalRevenue,
    succeededCharges,
    failedCharges,
    totalRefunds,
    subscriptions,
    auditLogs,
    webhookEndpoints,
  ] = await Promise.all([
    prisma.merchant.count({ where: { isDeleted: false } }),
    prisma.merchant.count({ where: { status: "active", isDeleted: false } }),
    prisma.charge.count(),
    prisma.charge.aggregate({
      _sum: { amount: true },
      where: { status: "succeeded" },
    }),
    prisma.charge.count({ where: { status: "succeeded" } }),
    prisma.charge.count({ where: { status: "failed" } }),
    prisma.refund.count({ where: { status: "succeeded" } }),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { merchant: { select: { businessName: true, email: true } } },
    }),
    prisma.webhookEndpoint.count({ where: { isActive: true } }),
  ])

  const totalRevenueAmount = totalRevenue._sum.amount || 0
  const successRate = totalCharges > 0 ? ((succeededCharges / totalCharges) * 100).toFixed(1) : 0

  // Mock data for charts (in production, calculate from actual data)
  const revenueData = [
    { date: "Day 1", amount: 4200 },
    { date: "Day 2", amount: 3800 },
    { date: "Day 3", amount: 5100 },
    { date: "Day 4", amount: 4600 },
    { date: "Day 5", amount: 6200 },
    { date: "Day 6", amount: 5400 },
    { date: "Day 7", amount: 7200 },
  ]

  const volumeData = [
    { label: "Succeeded", value: succeededCharges, color: "bg-green-500" },
    { label: "Failed", value: failedCharges, color: "bg-red-500" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Platform Overview</h1>
        <p className="text-gray-400">Monitor system health and key metrics</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Merchants */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Merchants</p>
              <p className="text-3xl font-bold text-white mt-2">{totalMerchants}</p>
            </div>
            <span className="text-3xl">👥</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-sm">↑ 8%</span>
            <span className="text-gray-500 text-sm">vs last month</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-white mt-2">
                ${(totalRevenueAmount / 100).toLocaleString()}
              </p>
            </div>
            <span className="text-3xl">💰</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-sm">↑ 15%</span>
            <span className="text-gray-500 text-sm">vs last month</span>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium">Transactions</p>
              <p className="text-3xl font-bold text-white mt-2">{totalCharges}</p>
            </div>
            <span className="text-3xl">💳</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-sm">↑ 12%</span>
            <span className="text-gray-500 text-sm">({successRate}% success)</span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium">Active Subscriptions</p>
              <p className="text-3xl font-bold text-white mt-2">{subscriptions}</p>
            </div>
            <span className="text-3xl">🔄</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-sm">↑ 6%</span>
            <span className="text-gray-500 text-sm">vs last month</span>
          </div>
        </div>

        {/* Webhook Endpoints */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium">Webhook Endpoints</p>
              <p className="text-3xl font-bold text-white mt-2">{webhookEndpoints}</p>
            </div>
            <span className="text-3xl">🔗</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-sm">All Active</span>
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium">Uptime</p>
              <p className="text-3xl font-bold text-white mt-2">99.98%</p>
            </div>
            <span className="text-3xl">🟢</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Last downtime: 2h ago (5min)</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-white font-semibold mb-4">Revenue Trend</h3>
          <div className="space-y-4">
            {revenueData.map((point: any) => {
              const maxAmount = Math.max(...revenueData.map((d) => d.amount))
              const percentage = (point.amount / maxAmount) * 100
              return (
                <div key={point.date}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">{point.date}</span>
                    <span className="text-white">${point.amount}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Transaction Volume */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-white font-semibold mb-4">Transaction Volume</h3>
          <div className="space-y-4">
            {volumeData.map((item) => {
              const total = volumeData.reduce((sum, d) => sum + d.value, 0)
              const percentage = (item.value / total) * 100
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-white">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div
                      className={`${item.color} h-3 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Platform Health */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <h3 className="text-white font-semibold mb-6">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: "Database", status: "Connected", latency: "12ms", color: "bg-green-500" },
            { name: "Redis", status: "Connected", latency: "3ms", color: "bg-green-500" },
            { name: "Queue", status: "Running", jobs: "24 pending", color: "bg-green-500" },
            { name: "Email", status: "Operational", sent: "1,245 today", color: "bg-green-500" },
          ].map((service) => (
            <div key={service.name} className="p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${service.color}`} />
                <p className="text-gray-300 font-medium">{service.name}</p>
              </div>
              <p className="text-sm text-gray-400">
                {service.status}
                {service.latency ? ` (${service.latency})` : ""}
                {service.jobs ? ` - ${service.jobs}` : ""}
                {service.sent ? ` - ${service.sent}` : ""}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-semibold">Recent Activity</h3>
          <a href="/admin/audit-logs" className="text-blue-400 text-sm hover:text-blue-300">
            View all
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Time</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Event</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Merchant</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log: any) => (
                <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="py-3 px-4 text-sm text-gray-300">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300">{log.action}</td>
                  <td className="py-3 px-4 text-sm text-gray-300">
                    {log.merchant.businessName}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      log.status === "success" ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"
                    }`}>
                      {log.status}
                    </span>
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
