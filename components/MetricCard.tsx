"use client"

interface MetricCardProps {
  label: string
  value: string | number
  trend?: number
  trendDirection?: "up" | "down"
  subtext?: string
}

export function MetricCard({
  label,
  value,
  trend,
  trendDirection,
  subtext,
}: MetricCardProps) {
  return (
    <div className="card p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{label}</h3>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        {trend !== undefined && trendDirection && (
          <div
            className={`flex items-center gap-1 ${
              trendDirection === "up" ? "text-[#31A24C]" : "text-[#FA5252]"
            }`}
          >
            <span className="text-lg">
              {trendDirection === "up" ? "↑" : "↓"}
            </span>
            <span className="text-sm font-medium">{trend}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
