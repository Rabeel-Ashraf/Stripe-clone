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

    const products = await prisma.product.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
    })

    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const priceCount = await prisma.price.count({
          where: { productId: product.id },
        })

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          priceCount,
          createdAt: product.createdAt,
          status: "active",
        }
      })
    )

    return NextResponse.json({ products: enrichedProducts })
  } catch (error) {
    console.error("Error fetching products:", error)
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
    const { name, description } = body

    const product = await prisma.product.create({
      data: {
        merchantId: session.user.merchantId,
        name,
        description,
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
