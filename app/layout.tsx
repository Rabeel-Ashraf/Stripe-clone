import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Merchant Dashboard",
  description: "Stripe-style merchant dashboard for payment processing",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
