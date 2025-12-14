import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user?.merchantId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!customer || customer.merchantId !== session.user.merchantId) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error("Error fetching customer:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user?.merchantId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
    })

    if (!customer || customer.merchantId !== session.user.merchantId) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json({ customer: updated })
  } catch (error) {
    console.error("Error updating customer:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user?.merchantId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
    })

    if (!customer || customer.merchantId !== session.user.merchantId) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      )
    }

    await prisma.customer.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting customer:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
