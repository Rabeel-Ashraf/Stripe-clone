"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/DataTable"
import Link from "next/link"

interface Customer {
  id: string
  name: string
  email: string
  totalSpent: number
  createdAt: string
  transactionCount: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState("")

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/customers")
      const data = await res.json()
      setCustomers(data.customers || [])
      setFilteredCustomers(data.customers || [])
    } catch (error) {
      console.error("Failed to fetch customers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (email: string) => {
    setSearchEmail(email)
    if (email) {
      setFilteredCustomers(
        customers.filter(c =>
          c.email.toLowerCase().includes(email.toLowerCase())
        )
      )
    } else {
      setFilteredCustomers(customers)
    }
  }

  const customerColumns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
    },
    {
      key: "totalSpent",
      label: "Total Spent",
      sortable: true,
      render: (value: number) => `$${(value / 100).toFixed(2)}`,
    },
    {
      key: "transactionCount",
      label: "Transactions",
      sortable: true,
    },
    {
      key: "createdAt",
      label: "Created Date",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "id",
      label: "Actions",
      render: (value: string) => (
        <div className="flex gap-2">
          <Link
            href={`/dashboard/customers/${value}`}
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
      <h1 className="text-2xl font-bold text-gray-900">Customers</h1>

      {/* Search */}
      <div className="card p-6">
        <input
          type="text"
          value={searchEmail}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by email..."
          className="input-base"
        />
      </div>

      {/* Customers Table */}
      <DataTable
        columns={customerColumns}
        data={filteredCustomers}
        isLoading={isLoading}
        onRowClick={(row) => {
          window.location.href = `/dashboard/customers/${row.id}`
        }}
      />
    </div>
  )
}
