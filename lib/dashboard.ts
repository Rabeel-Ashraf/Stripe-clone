import { prisma } from "@/lib/prisma"

export async function getMerchantMetrics(merchantId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

  // Current period charges
  const currentCharges = await prisma.charge.findMany({
    where: {
      merchantId,
      createdAt: { gte: thirtyDaysAgo },
    },
  })

  // Previous period charges
  const previousCharges = await prisma.charge.findMany({
    where: {
      merchantId,
      createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
    },
  })

  // Calculate metrics
  const currentSucceeded = currentCharges.filter(c => c.status === "succeeded")
  const previousSucceeded = previousCharges.filter(c => c.status === "succeeded")

  const currentRevenue = currentSucceeded.reduce((sum, c) => sum + c.amount, 0) / 100
  const previousRevenue = previousSucceeded.reduce((sum, c) => sum + c.amount, 0) / 100

  const currentCount = currentCharges.length
  const previousCount = previousCharges.length

  const currentSuccessRate = currentCharges.length > 0
    ? (currentSucceeded.length / currentCharges.length) * 100
    : 0

  const previousSuccessRate = previousCharges.length > 0
    ? (previousSucceeded.length / previousCharges.length) * 100
    : 0

  const currentAvg = currentSucceeded.length > 0
    ? currentRevenue / currentSucceeded.length
    : 0

  const previousAvg = previousSucceeded.length > 0
    ? previousRevenue / previousSucceeded.length
    : 0

  // Calculate trends
  const revenueTrend = previousRevenue > 0
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
    : 0

  const transactionTrend = previousCount > 0
    ? ((currentCount - previousCount) / previousCount) * 100
    : 0

  const successRateTrend = previousSuccessRate > 0
    ? currentSuccessRate - previousSuccessRate
    : 0

  const avgTrend = previousAvg > 0
    ? ((currentAvg - previousAvg) / previousAvg) * 100
    : 0

  return {
    totalRevenue: {
      value: currentRevenue,
      trend: revenueTrend,
      trendDirection: revenueTrend >= 0 ? "up" : "down",
    },
    transactionCount: {
      value: currentCount,
      trend: transactionTrend,
      trendDirection: transactionTrend >= 0 ? "up" : "down",
    },
    successRate: {
      value: currentSuccessRate.toFixed(1),
      trend: successRateTrend.toFixed(1),
      trendDirection: successRateTrend >= 0 ? "up" : "down",
    },
    avgTransactionValue: {
      value: currentAvg,
      trend: avgTrend,
      trendDirection: avgTrend >= 0 ? "up" : "down",
    },
    succeedCount: currentSucceeded.length,
    failedCount: currentCharges.filter(c => c.status === "failed").length,
    pendingCount: currentCharges.filter(c => c.status === "pending").length,
    refundedCount: currentCharges.filter(c => c.status === "refunded").length,
  }
}

export async function getChartData(merchantId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const charges = await prisma.charge.findMany({
    where: {
      merchantId,
      createdAt: { gte: thirtyDaysAgo },
      status: "succeeded",
    },
    orderBy: { createdAt: "asc" },
  })

  // Group by date
  const dateMap = new Map<string, number>()

  charges.forEach(charge => {
    const date = charge.createdAt.toISOString().split("T")[0]
    const current = dateMap.get(date) || 0
    dateMap.set(date, current + charge.amount / 100)
  })

  // Fill in missing dates
  const data = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split("T")[0]
    data.push({
      date: dateStr,
      revenue: dateMap.get(dateStr) || 0,
    })
  }

  return data
}

export async function getRecentTransactions(merchantId: string, limit: number = 10) {
  return prisma.charge.findMany({
    where: { merchantId },
    include: {
      paymentIntent: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
}

export async function getMerchantBalance(merchantId: string) {
  // This is a simplified calculation
  // In a real system, you'd have a separate ledger
  const charges = await prisma.charge.findMany({
    where: {
      merchantId,
      status: "succeeded",
    },
  })

  const refunds = await prisma.refund.findMany({
    where: {
      merchantId,
      status: "succeeded",
    },
  })

  const availableBalance =
    charges.reduce((sum, c) => sum + c.amount, 0) -
    refunds.reduce((sum, r) => sum + r.amount, 0)

  return {
    availableBalance: availableBalance / 100,
    pendingPayouts: 0, // Would be calculated from payment schedule
    nextPayout: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }
}
