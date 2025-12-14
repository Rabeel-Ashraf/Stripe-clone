import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()

  if (!session?.user?.merchantId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const merchantId = session.user.merchantId

    const customers = await prisma.customer.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
    })

    // Enrich customers with transaction data
    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const charges = await prisma.charge.findMany({
          where: {
            merchantId,
            paymentIntent: {
              receiptEmail: customer.email,
            },
          },
        })

        const totalSpent = charges
          .filter(c => c.status === "succeeded")
          .reduce((sum, c) => sum + c.amount, 0)

        return {
          id: customer.id,
          name: customer.name || "Unknown",
          email: customer.email,
          totalSpent,
          createdAt: customer.createdAt,
          transactionCount: charges.length,
        }
      })
    )

    return NextResponse.json({ customers: enrichedCustomers })
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.merchantId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { email, name, phone, address } = body

    const customer = await prisma.customer.create({
      data: {
        merchantId: session.user.merchantId,
        email,
        name,
        phone,
        address,
      },
    })

    return NextResponse.json({ customer })
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
