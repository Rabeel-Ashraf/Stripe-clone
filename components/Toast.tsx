"use client"

import { useEffect, useState } from "react"

interface ToastProps {
  message: string
  type: "success" | "error" | "info"
  duration?: number
  onClose?: () => void
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const bgColor =
    type === "success"
      ? "bg-stripe-success"
      : type === "error"
        ? "bg-stripe-danger"
        : "bg-stripe-blue"

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg text-white font-medium ${bgColor} shadow-lg z-50 animate-fade-in`}>
      {message}
    </div>
  )
}
