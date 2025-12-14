"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { StatusBadge } from "@/components/StatusBadge"
import { Modal } from "@/components/Modal"
import Link from "next/link"

interface Refund {
  id: string
  amount: number
  reason: string
  status: string
  createdAt: string
}

interface Transaction {
  id: string
  amount: number
  status: string
  currency: string
  cardBrand: string
  cardLast4: string
  cardExpMonth?: number
  cardExpYear?: number
  fraudScore: number
  fraudCheckStatus: string
  authorizationCode?: string
  authorizationStatus: string
  description?: string
  metadata: any
  createdAt: string
  updatedAt: string
  receiptEmail?: string
  receiptUrl?: string
  amountRefunded: number
  refunds: Refund[]
}

export default function TransactionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refundModal, setRefundModal] = useState(false)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundReason, setRefundReason] = useState("requested_by_customer")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchTransaction = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/charges/${params.id}`)
        const data = await res.json()
        setTransaction(data.charge)
      } catch (error) {
        console.error("Failed to fetch transaction:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransaction()
  }, [params.id])

  const handleRefund = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/charges/${params.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(parseFloat(refundAmount) * 100),
          reason: refundReason,
        }),
      })

      if (res.ok) {
        // Refresh transaction
        const updatedRes = await fetch(`/api/charges/${params.id}`)
        const updatedData = await updatedRes.json()
        setTransaction(updatedData.charge)
        setRefundModal(false)
        setRefundAmount("")
      }
    } catch (error) {
      console.error("Failed to refund:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!transaction) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Transaction not found</p>
        <Link href="/dashboard/transactions" className="text-[#635BFF] hover:underline mt-2">
          Back to transactions
        </Link>
      </div>
    )
  }

  const maxRefundAmount = (transaction.amount - transaction.amountRefunded) / 100

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/transactions"
          className="text-sm text-[#635BFF] hover:underline mb-4 block"
        >
          ← Back to transactions
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
      </div>

      {/* Main Details */}
      <div className="card p-6 space-y-6">
        {/* Amount & Status */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div>
            <p className="text-sm text-gray-600 font-medium">Amount</p>
            <p className="text-4xl font-bold text-gray-900">
              ${(transaction.amount / 100).toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 font-medium mb-2">Status</p>
            <StatusBadge
              status={
                transaction.status as
                  | "succeeded"
                  | "failed"
                  | "pending"
                  | "refunded"
              }
            />
          </div>
        </div>

        {/* Card & Customer Info */}
        <div className="grid grid-cols-2 gap-6 py-6 border-b border-gray-200">
          <div>
            <p className="text-sm text-gray-600 font-medium mb-2">Card Details</p>
            <div className="space-y-1">
              <p className="font-mono text-sm">
                {transaction.cardBrand} ****{transaction.cardLast4}
              </p>
              {transaction.cardExpMonth && transaction.cardExpYear && (
                <p className="text-sm text-gray-600">
                  Expires: {transaction.cardExpMonth}/{transaction.cardExpYear}
                </p>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium mb-2">Customer</p>
            <p className="text-sm">{transaction.receiptEmail || "Unknown"}</p>
          </div>
        </div>

        {/* Authorization & Fraud */}
        <div className="grid grid-cols-3 gap-6 py-6 border-b border-gray-200">
          <div>
            <p className="text-sm text-gray-600 font-medium mb-2">Authorization</p>
            <p className="text-sm font-mono">
              {transaction.authorizationStatus || "N/A"}
            </p>
            {transaction.authorizationCode && (
              <p className="text-xs text-gray-500 mt-1">
                Code: {transaction.authorizationCode}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium mb-2">Fraud Check</p>
            <p className="text-sm">
              <span
                className={`${
                  transaction.fraudCheckStatus === "passed"
                    ? "text-[#31A24C]"
                    : transaction.fraudCheckStatus === "flagged"
                      ? "text-[#FFA500]"
                      : "text-[#FA5252]"
                }`}
              >
                {transaction.fraudCheckStatus || "N/A"}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Score: {transaction.fraudScore?.toFixed(1) || 0}/100
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium mb-2">Timestamps</p>
            <p className="text-xs text-gray-600">
              Created: {new Date(transaction.createdAt).toLocaleString()}
            </p>
            <p className="text-xs text-gray-600">
              Updated: {new Date(transaction.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Metadata */}
        {transaction.description && (
          <div className="py-4 border-b border-gray-200">
            <p className="text-sm text-gray-600 font-medium mb-2">Description</p>
            <p className="text-sm">{transaction.description}</p>
          </div>
        )}
      </div>

      {/* Refunds */}
      {transaction.refunds.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Refunds</h3>
          <div className="space-y-3">
            {transaction.refunds.map((refund) => (
              <div key={refund.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    ${(refund.amount / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600 capitalize">
                    {refund.reason} · {new Date(refund.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge
                  status={
                    refund.status as
                      | "succeeded"
                      | "failed"
                      | "pending"
                      | "refunded"
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {transaction.status === "succeeded" && maxRefundAmount > 0 && (
          <button
            onClick={() => setRefundModal(true)}
            className="btn-primary"
          >
            Refund
          </button>
        )}

        {transaction.receiptUrl && (
          <a
            href={transaction.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Download Receipt
          </a>
        )}
      </div>

      {/* Refund Modal */}
      <Modal
        isOpen={refundModal}
        title="Issue Refund"
        onClose={() => setRefundModal(false)}
        onSubmit={handleRefund}
        submitLabel="Refund"
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refund Amount
            </label>
            <div className="flex items-center">
              <span className="text-lg font-semibold text-gray-900 mr-2">$</span>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
                max={maxRefundAmount}
                step="0.01"
                className="input-base"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Max: ${maxRefundAmount.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <select
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="input-base"
            >
              <option value="requested_by_customer">Requested by customer</option>
              <option value="duplicate">Duplicate charge</option>
              <option value="fraudulent">Fraudulent</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
