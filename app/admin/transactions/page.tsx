import { prisma } from "@/lib/prisma"
import { requireAdminRole } from "@/lib/admin"

export default async function TransactionsPage() {
  await requireAdminRole()

  const charges = await prisma.charge.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      merchant: { select: { businessName: true, email: true } },
    },
  })

  // Get fraud flagged transactions
  const flaggedCharges = charges.filter((c: any) => c.fraudScore >= 70)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Transactions Ledger</h1>
        <p className="text-gray-400">View all transactions across the platform</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Transactions</p>
          <p className="text-2xl font-bold text-white mt-2">{charges.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Succeeded</p>
          <p className="text-2xl font-bold text-green-400 mt-2">
            {charges.filter((c: any) => c.status === "succeeded").length}
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Failed</p>
          <p className="text-2xl font-bold text-red-400 mt-2">
            {charges.filter((c: any) => c.status === "failed").length}
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Flagged (High Risk)</p>
          <p className="text-2xl font-bold text-amber-400 mt-2">{flaggedCharges.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
            <option>All Status</option>
            <option>Succeeded</option>
            <option>Failed</option>
            <option>Pending</option>
            <option>Refunded</option>
          </select>
          <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
            <option>All Merchants</option>
          </select>
          <input
            type="date"
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Filter
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800">
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  ID
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Merchant
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Amount
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Card
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Fraud Score
                </th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold text-sm">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {charges.map((charge: any) => (
                <tr key={charge.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="py-4 px-6 text-blue-400 font-mono text-sm">{charge.id.slice(0, 8)}</td>
                  <td className="py-4 px-6 text-gray-300">{charge.merchant.businessName}</td>
                  <td className="py-4 px-6 text-white font-medium">
                    ${(charge.amount / 100).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-gray-300">
                    {charge.cardBrand.charAt(0).toUpperCase() + charge.cardBrand.slice(1)} •{" "}
                    {charge.cardLast4}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      charge.status === "succeeded"
                        ? "bg-green-900 text-green-200"
                        : charge.status === "failed"
                        ? "bg-red-900 text-red-200"
                        : "bg-gray-700 text-gray-200"
                    }`}>
                      {charge.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      charge.fraudScore >= 70
                        ? "bg-red-900 text-red-200"
                        : charge.fraudScore >= 40
                        ? "bg-amber-900 text-amber-200"
                        : "bg-green-900 text-green-200"
                    }`}>
                      {charge.fraudScore.toFixed(0)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-400 text-sm">
                    {new Date(charge.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fraud Review Section */}
      {flaggedCharges.length > 0 && (
        <div className="bg-gray-900 rounded-lg border border-red-700 p-6">
          <h3 className="text-white font-semibold mb-4">⚠️ Fraud Review Required</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                    Transaction
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                    Score
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {flaggedCharges.slice(0, 5).map((charge: any) => (
                  <tr key={charge.id} className="border-b border-gray-800">
                    <td className="py-3 px-4 text-blue-400 font-mono text-sm">
                      {charge.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-red-900 text-red-200 px-2 py-1 rounded text-sm font-medium">
                        {charge.fraudScore.toFixed(0)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white">
                      ${(charge.amount / 100).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">Pending Review</td>
                    <td className="py-3 px-4">
                      <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
