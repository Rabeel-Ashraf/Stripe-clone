"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/DataTable"
import Link from "next/link"

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
}

interface Transaction {
  id: string
  createdAt: Date
  amount: number
  status: string
}

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCustomer = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/customers/${params.id}`)
        const data = await res.json()
        setCustomer(data.customer)
      } catch (error) {
        console.error("Failed to fetch customer:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomer()
  }, [params.id])

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!customer) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Customer not found</p>
        <Link href="/dashboard/customers" className="text-[#635BFF] hover:underline mt-2">
          Back to customers
        </Link>
      </div>
    )
  }

  const transactionColumns = [
    {
      key: "createdAt",
      label: "Date",
      render: (value: Date) => new Date(value).toLocaleDateString(),
    },
    {
      key: "id",
      label: "Transaction ID",
      render: (value: string) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
          {value.slice(0, 12)}...
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
        <span className={`text-sm font-medium ${
          value === "succeeded" ? "text-[#31A24C]" : "text-[#FA5252]"
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/customers"
          className="text-sm text-[#635BFF] hover:underline mb-4 block"
        >
          ← Back to customers
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
        <p className="text-gray-600">{customer.email}</p>
      </div>

      {/* Customer Info */}
      <div className="card p-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-gray-600 font-medium">Email</p>
          <p className="text-gray-900 mt-1">{customer.email}</p>
        </div>
        {customer.phone && (
          <div>
            <p className="text-sm text-gray-600 font-medium">Phone</p>
            <p className="text-gray-900 mt-1">{customer.phone}</p>
          </div>
        )}
        {customer.address && (
          <div className="col-span-2">
            <p className="text-sm text-gray-600 font-medium mb-2">Address</p>
            <div className="text-sm text-gray-900 space-y-1">
              {customer.address.street && <p>{customer.address.street}</p>}
              <p>
                {customer.address.city}, {customer.address.state} {customer.address.zip}
              </p>
              {customer.address.country && <p>{customer.address.country}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transactions</h2>
        <DataTable
          columns={transactionColumns}
          data={transactions}
          onRowClick={(row) => {
            window.location.href = `/dashboard/transactions/${row.id}`
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="btn-secondary">Edit Customer</button>
        <button className="btn-danger">Delete Customer</button>
      </div>
    </div>
  )
}
