"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/DataTable"
import { Modal } from "@/components/Modal"

interface Product {
  id: string
  name: string
  description?: string
  priceCount: number
  createdAt: string
  status: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/products")
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProduct = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        await fetchProducts()
        setCreateModal(false)
        setFormData({ name: "", description: "" })
      }
    } catch (error) {
      console.error("Failed to create product:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const productColumns = [
    {
      key: "name",
      label: "Product Name",
      sortable: true,
    },
    {
      key: "priceCount",
      label: "Prices",
      render: (value: number) => `${value} price${value !== 1 ? "s" : ""}`,
    },
    {
      key: "createdAt",
      label: "Created Date",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (value: string) => (
        <div className="flex gap-2">
          <button className="text-xs text-[#635BFF] hover:underline">Edit</button>
          <button className="text-xs text-[#FA5252] hover:underline">Delete</button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={() => setCreateModal(true)}
          className="btn-primary"
        >
          Create Product
        </button>
      </div>

      {/* Products Table */}
      <DataTable
        columns={productColumns}
        data={products}
        isLoading={isLoading}
        onRowClick={(row) => {
          // Navigate to product details
          window.location.href = `/dashboard/products/${row.id}`
        }}
      />

      {/* Create Modal */}
      <Modal
        isOpen={createModal}
        title="Create Product"
        onClose={() => setCreateModal(false)}
        onSubmit={handleCreateProduct}
        submitLabel="Create"
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Premium Subscription"
              className="input-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe your product..."
              rows={4}
              className="input-base"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
