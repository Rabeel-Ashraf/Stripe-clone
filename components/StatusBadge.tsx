"use client"

interface StatusBadgeProps {
  status: "succeeded" | "failed" | "pending" | "refunded"
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    succeeded: {
      bg: "bg-[#31A24C]/20",
      text: "text-[#31A24C]",
      label: "Succeeded",
    },
    failed: {
      bg: "bg-[#FA5252]/20",
      text: "text-[#FA5252]",
      label: "Failed",
    },
    pending: {
      bg: "bg-[#FFA500]/20",
      text: "text-[#FFA500]",
      label: "Pending",
    },
    refunded: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "Refunded",
    },
  }

  const config = statusConfig[status]

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}
