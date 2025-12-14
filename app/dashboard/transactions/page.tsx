"use client"

import { useState, useEffect } from "react"
import { auth } from "@/lib/auth"
import { StatusBadge } from "@/components/StatusBadge"
import { DataTable } from "@/components/DataTable"
import Link from "next/link"

interface Transaction {
  id: string
  createdAt: Date
  amount: number
  status: "succeeded" | "failed" | "pending" | "refunded"
  cardBrand: string
  cardLast4: string
  receiptEmail?: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [filters, setFilters] = useState({
    status: "all",
    searchId: "",
    searchEmail: "",
    amountMin: "",
    amountMax: "",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true)
      try {
        const res = await fetch("/api/charges")
        const data = await res.json()
        setTransactions(data.charges || [])
        setFilteredTransactions(data.charges || [])
      } catch (error) {
        console.error("Failed to fetch transactions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const applyFilters = () => {
    let filtered = transactions

    if (filters.status !== "all") {
      filtered = filtered.filter(t => t.status === filters.status)
    }

    if (filters.searchId) {
      filtered = filtered.filter(t =>
        t.id.toLowerCase().includes(filters.searchId.toLowerCase())
      )
    }

    if (filters.searchEmail) {
      filtered = filtered.filter(t =>
        t.receiptEmail?.toLowerCase().includes(filters.searchEmail.toLowerCase())
      )
    }

    if (filters.amountMin) {
      filtered = filtered.filter(t => (t.amount / 100) >= parseFloat(filters.amountMin))
    }

    if (filters.amountMax) {
      filtered = filtered.filter(t => (t.amount / 100) <= parseFloat(filters.amountMax))
    }

    setFilteredTransactions(filtered)
  }

  const clearFilters = () => {
    setFilters({
      status: "all",
      searchId: "",
      searchEmail: "",
      amountMin: "",
      amountMax: "",
    })
    setFilteredTransactions(transactions)
  }

  const transactionColumns = [
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleDateString(),
    },
    {
      key: "id",
      label: "Transaction ID",
      sortable: true,
      render: (value: string) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
          {value.slice(0, 12)}...
        </code>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (value: number) => `$${(value / 100).toFixed(2)}`,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
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
      key: "receiptEmail",
      label: "Customer",
      render: (value: string) => value || "N/A",
    },
    {
      key: "id",
      label: "Actions",
      render: (value: string) => (
        <div className="flex gap-2">
          <Link
            href={`/dashboard/transactions/${value}`}
            className="text-xs text-[#635BFF] hover:underline"
          >
            View
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <button className="btn-secondary text-sm">
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Filters</h3>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction ID
            </label>
            <input
              type="text"
              value={filters.searchId}
              onChange={(e) =>
                setFilters({ ...filters, searchId: e.target.value })
              }
              placeholder="Search..."
              className="input-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="input-base"
            >
              <option value="all">All</option>
              <option value="succeeded">Succeeded</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Email
            </label>
            <input
              type="text"
              value={filters.searchEmail}
              onChange={(e) =>
                setFilters({ ...filters, searchEmail: e.target.value })
              }
              placeholder="Search..."
              className="input-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount Range
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={filters.amountMin}
                onChange={(e) =>
                  setFilters({ ...filters, amountMin: e.target.value })
                }
                placeholder="Min"
                className="input-base w-1/2"
              />
              <input
                type="number"
                value={filters.amountMax}
                onChange={(e) =>
                  setFilters({ ...filters, amountMax: e.target.value })
                }
                placeholder="Max"
                className="input-base w-1/2"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={applyFilters} className="btn-primary text-sm">
            Apply Filters
          </button>
          <button onClick={clearFilters} className="btn-secondary text-sm">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={transactionColumns}
        data={filteredTransactions}
        isLoading={isLoading}
        pageSize={50}
      />
    </div>
  )
}
