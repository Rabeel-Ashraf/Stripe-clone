"use client"

import { ReactNode } from "react"

interface ModalProps {
  isOpen: boolean
  title: string
  children: ReactNode
  onClose: () => void
  onSubmit?: (e: React.FormEvent) => Promise<void> | void
  submitLabel?: string
  isLoading?: boolean
  closeLabel?: string
}

export function Modal({
  isOpen,
  title,
  children,
  onClose,
  onSubmit,
  submitLabel = "Save",
  isLoading = false,
  closeLabel = "Cancel",
}: ModalProps) {
  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      await onSubmit(e)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">{children}</div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              {closeLabel}
            </button>
            {onSubmit && (
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "..." : submitLabel}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
