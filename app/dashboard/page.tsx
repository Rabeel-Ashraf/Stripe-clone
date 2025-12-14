import { auth } from "@/lib/auth"
import { MetricCard } from "@/components/MetricCard"
import { StatusBadge } from "@/components/StatusBadge"
import { DataTable } from "@/components/DataTable"
import Link from "next/link"
import {
  getMerchantMetrics,
  getChartData,
  getRecentTransactions,
  getMerchantBalance,
} from "@/lib/dashboard"

export default async function OverviewPage() {
  const session = await auth()

  if (!session?.user?.merchantId) {
    return null
  }

  const merchantId = session.user.merchantId
  const [metrics, chartData, recentTransactions, balance] = await Promise.all([
    getMerchantMetrics(merchantId),
    getChartData(merchantId),
    getRecentTransactions(merchantId, 10),
    getMerchantBalance(merchantId),
  ])

  const transactionColumns = [
    {
      key: "createdAt",
      label: "Date",
      render: (value: Date) => value.toLocaleDateString(),
    },
    {
      key: "id",
      label: "Transaction ID",
      render: (value: string) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
          {value.slice(0, 8)}...
        </code>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (value: number) => `$${(value / 100).toFixed(2)}`,
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <StatusBadge
          status={
            value as
              | "succeeded"
              | "failed"
              | "pending"
              | "refunded"
          }
        />
      ),
    },
    {
      key: "cardBrand",
      label: "Card",
      render: (_: string, row: any) => `${row.cardBrand} ****${row.cardLast4}`,
    },
    {
      key: "paymentIntent.receiptEmail",
      label: "Customer",
      render: (_: string, row: any) => row.paymentIntent?.receiptEmail || "N/A",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="card p-6 border-l-4 border-l-[#635BFF]">
        <div className="grid grid-cols-3 gap-8">
          <div>
            <p className="text-sm text-gray-600 font-medium">Available Balance</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${balance.availableBalance.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Pending Payouts</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${balance.pendingPayouts.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Next Payout</p>
            <p className="text-xl font-bold text-gray-900 mt-2">
              {balance.nextPayout.toLocaleDateString()}
            </p>
            <Link
              href="/dashboard/settings?tab=payouts"
              className="text-sm text-[#635BFF] hover:underline mt-2"
            >
              Payout settings →
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total Revenue"
          value={`$${metrics.totalRevenue.value.toFixed(2)}`}
          trend={Math.abs(metrics.totalRevenue.trend)}
          trendDirection={metrics.totalRevenue.trendDirection as "up" | "down"}
          subtext="Last 30 days"
        />
        <MetricCard
          label="Total Transactions"
          value={metrics.transactionCount.value}
          trend={Math.abs(metrics.transactionCount.trend)}
          trendDirection={metrics.transactionCount.trendDirection as "up" | "down"}
          subtext="Last 30 days"
        />
        <MetricCard
          label="Success Rate"
          value={`${metrics.successRate.value}%`}
          trend={Math.abs(Number(metrics.successRate.trend))}
          trendDirection={metrics.successRate.trendDirection as "up" | "down"}
          subtext="Succeeded / Total"
        />
        <MetricCard
          label="Avg Transaction Value"
          value={`$${metrics.avgTransactionValue.value.toFixed(2)}`}
          trend={Math.abs(metrics.avgTransactionValue.trend)}
          trendDirection={metrics.avgTransactionValue.trendDirection as "up" | "down"}
          subtext="Last 30 days"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
            <button className="text-sm text-[#635BFF] hover:underline">
              Export CSV
            </button>
          </div>
          <div className="h-64 flex items-end gap-1 bg-gray-50 p-4 rounded">
            {chartData.map((item, idx) => {
              const maxRevenue = Math.max(
                ...chartData.map(d => d.revenue),
                1
              )
              const height = (item.revenue / maxRevenue) * 100
              return (
                <div
                  key={idx}
                  className="flex-1 bg-[#635BFF]/80 hover:bg-[#635BFF] transition-colors rounded-t"
                  style={{ height: `${Math.max(height, 5)}%` }}
                  title={`${item.date}: $${item.revenue.toFixed(2)}`}
                />
              )
            })}
          </div>
          <div className="mt-4 text-xs text-gray-500 text-center">
            Last 30 days
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Status Breakdown
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Succeeded</span>
                <span className="text-sm font-semibold text-gray-900">
                  {metrics.succeedCount}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#31A24C] h-2 rounded-full"
                  style={{
                    width: `${
                      metrics.transactionCount.value > 0
                        ? (metrics.succeedCount / metrics.transactionCount.value) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Failed</span>
                <span className="text-sm font-semibold text-gray-900">
                  {metrics.failedCount}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#FA5252] h-2 rounded-full"
                  style={{
                    width: `${
                      metrics.transactionCount.value > 0
                        ? (metrics.failedCount / metrics.transactionCount.value) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="text-sm font-semibold text-gray-900">
                  {metrics.pendingCount}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#FFA500] h-2 rounded-full"
                  style={{
                    width: `${
                      metrics.transactionCount.value > 0
                        ? (metrics.pendingCount / metrics.transactionCount.value) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Refunded</span>
                <span className="text-sm font-semibold text-gray-900">
                  {metrics.refundedCount}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${
                      metrics.transactionCount.value > 0
                        ? (metrics.refundedCount / metrics.transactionCount.value) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <Link
            href="/dashboard/transactions"
            className="text-sm text-[#635BFF] hover:underline"
          >
            View all →
          </Link>
        </div>
        <DataTable
          columns={transactionColumns}
          data={recentTransactions}
          onRowClick={(row) => {
            // Navigate to transaction details
            window.location.href = `/dashboard/transactions/${row.id}`
          }}
        />
      </div>
    </div>
  )
}
