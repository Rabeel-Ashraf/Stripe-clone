import { prisma } from "@/lib/prisma"
import { requireAdminRole } from "@/lib/admin"

export default async function AuditLogsPage() {
  await requireAdminRole()

  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      merchant: { select: { businessName: true, email: true } },
    },
  })

  const successCount = auditLogs.filter((log) => log.status === "success").length
  const failureCount = auditLogs.filter((log) => log.status === "failure").length

  // Get unique actions
  const actions = Array.from(new Set(auditLogs.map((log: any) => log.action)))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-gray-400">Platform-wide activity and compliance trail</p>
        </div>
        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Events</p>
          <p className="text-2xl font-bold text-white mt-2">{auditLogs.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Successful</p>
          <p className="text-2xl font-bold text-green-400 mt-2">{successCount}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Failed</p>
          <p className="text-2xl font-bold text-red-400 mt-2">{failureCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search merchant..."
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
          />
          <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
            <option>All Actions</option>
            {actions.map((action: string) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
            <option>All Status</option>
            <option>Success</option>
            <option>Failure</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Filter
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800">
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Timestamp
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Merchant
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Action
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Resource
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log: any) => (
                <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="py-4 px-6 text-gray-300 text-sm">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-gray-300">
                    {log.merchant.businessName}
                  </td>
                  <td className="py-4 px-6 text-blue-400 font-medium text-sm">{log.action}</td>
                  <td className="py-4 px-6 text-gray-300 text-sm">
                    {log.resource ? `${log.resource}` : "-"}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      log.status === "success"
                        ? "bg-green-900 text-green-200"
                        : "bg-red-900 text-red-200"
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-400 text-sm">
                    {log.ipAddress || "-"}
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
