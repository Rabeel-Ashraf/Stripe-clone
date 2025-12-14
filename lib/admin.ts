import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function requireAdminRole() {
  const session = await auth()
  
  if (!session?.user?.merchantId) {
    redirect("/auth/signin")
  }
  
  // Check if user has admin role
  const merchant = await prisma.merchant.findUnique({
    where: { id: session.user.merchantId },
    select: { role: true, status: true, isDeleted: true }
  })
  
  if (!merchant || merchant.role !== "admin" || merchant.status !== "active" || merchant.isDeleted) {
    redirect("/dashboard")
  }
  
  return session
}
