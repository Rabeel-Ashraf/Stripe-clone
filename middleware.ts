/*
  Next.js Middleware
  
  ⚠️ HTTPS required in production. Insecure cookies over HTTP expose JWTs.
  Set NEXTAUTH_URL=https://yourdomain.com to enable secure flag.
*/

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Define protected routes
const PROTECTED_PATHS = [
  "/dashboard",
  "/api/auth", // Allow auth endpoints
  "/api/auth/signout", // Allow logout
]

// Define public routes that should redirect authenticated users
const PUBLIC_PATHS_ONLY = [
  "/auth/signin",
  "/auth/signup",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID()
  
  // Handle API key authentication for payment endpoints
  if (pathname.startsWith("/api/payment-intents") || 
      pathname.startsWith("/api/charges") ||
      pathname.startsWith("/api/subscriptions") ||
      pathname.startsWith("/api/webhook-endpoints")) {
    return await handleApiKeyAuth(request, requestId)
  }
  
  // Add request ID to all responses
  const response = NextResponse.next()
  response.headers.set("x-request-id", requestId)
  
  // Add security headers
  response.headers.set("x-content-type-options", "nosniff")
  response.headers.set("x-frame-options", "DENY")
  response.headers.set("x-xss-protection", "1; mode=block")
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin")
  
  // CSP header for additional security
  response.headers.set(
    "content-security-policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self'; object-src 'none'; frame-src 'none';"
  )
  
  // Skip middleware for static files and health checks
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/favicon") ||
    pathname === "/api/health"
  ) {
    return response
  }
  
  // Check if route requires authentication
  const requiresAuth = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  const isPublicOnly = PUBLIC_PATHS_ONLY.some(path => pathname.startsWith(path))
  
  // Get session for authenticated routes
  let session = null
  if (requiresAuth || isPublicOnly) {
    session = await auth()
  }
  
  // Redirect unauthenticated users to signin for protected routes
  if (requiresAuth && !session?.user) {
    const signinUrl = new URL("/auth/signin", request.url)
    signinUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signinUrl)
  }
  
  // Redirect authenticated users away from public-only routes
  if (isPublicOnly && session?.user) {
    const dashboardUrl = new URL("/dashboard", request.url)
    return NextResponse.redirect(dashboardUrl)
  }
  
  // Check merchant status for authenticated users
  if (session?.user?.merchantId) {
    try {
      const merchant = await prisma.merchant.findUnique({
        where: { id: session.user.merchantId },
        select: { status: true, isDeleted: true }
      })
      
      // Redirect suspended or deleted merchants to error page
      if (!merchant || merchant.isDeleted || merchant.status !== "active") {
        const errorUrl = new URL("/auth/error", request.url)
        errorUrl.searchParams.set("error", "account_suspended")
        return NextResponse.redirect(errorUrl)
      }
    } catch (error) {
      console.error("Error checking merchant status:", error)
      // Continue on error to avoid blocking legitimate requests
    }
  }
  
  // Add tenant context for API routes
  if (pathname.startsWith("/api/") && session?.user?.merchantId) {
    response.headers.set("x-merchant-id", session.user.merchantId)
    response.headers.set("x-merchant-tier", session.user.tier)
  }
  
  return response
}

async function handleApiKeyAuth(request: NextRequest, requestId: string) {
  // Extract API key from Authorization header
  const authHeader = request.headers.get("authorization")
  const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API key. Include 'Authorization: Bearer sk_live_xxx' header." },
      { status: 401, headers: { "x-request-id": requestId } }
    )
  }
  
  // Validate API key format
  if (!apiKey.startsWith("sk_live_") && !apiKey.startsWith("pk_live_")) {
    return NextResponse.json(
      { error: "Invalid API key format" },
      { status: 401, headers: { "x-request-id": requestId } }
    )
  }
  
  try {
    // For secret keys (sk_live_*)
    if (apiKey.startsWith("sk_live_")) {
      const secretKeyPrefix = apiKey.slice(-4)
      
      // Find API key by prefix
      const apiKeyRecord = await prisma.apiKey.findFirst({
        where: {
          secretKeyPrefix,
          isActive: true,
        },
        include: {
          merchant: {
            select: {
              id: true,
              status: true,
              isDeleted: true,
            },
          },
        },
      })
      
      if (!apiKeyRecord) {
        return NextResponse.json(
          { error: "Invalid API key" },
          { status: 401, headers: { "x-request-id": requestId } }
        )
      }
      
      // Verify hash
      const isValid = await bcrypt.compare(apiKey, apiKeyRecord.secretKeyHash)
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid API key" },
          { status: 401, headers: { "x-request-id": requestId } }
        )
      }
      
      // Check merchant status
      if (apiKeyRecord.merchant.isDeleted || apiKeyRecord.merchant.status !== "active") {
        return NextResponse.json(
          { error: "Merchant account is not active" },
          { status: 403, headers: { "x-request-id": requestId } }
        )
      }
      
      // Check expiration
      if (apiKeyRecord.expiresAt && new Date() > apiKeyRecord.expiresAt) {
        return NextResponse.json(
          { error: "API key has expired" },
          { status: 401, headers: { "x-request-id": requestId } }
        )
      }
      
      // Update last used timestamp
      await prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() },
      })
      
      // Add merchant context to request headers
      const response = NextResponse.next()
      response.headers.set("x-request-id", requestId)
      response.headers.set("x-merchant-id", apiKeyRecord.merchantId)
      response.headers.set("x-publishable-key", apiKeyRecord.publishableKey)
      
      return response
    }
    
    // For publishable keys (pk_live_*) - limited access
    if (apiKey.startsWith("pk_live_")) {
      const apiKeyRecord = await prisma.apiKey.findFirst({
        where: {
          publishableKey: apiKey,
          isActive: true,
        },
        include: {
          merchant: {
            select: {
              id: true,
              status: true,
              isDeleted: true,
            },
          },
        },
      })
      
      if (!apiKeyRecord) {
        return NextResponse.json(
          { error: "Invalid publishable key" },
          { status: 401, headers: { "x-request-id": requestId } }
        )
      }
      
      // Check merchant status
      if (apiKeyRecord.merchant.isDeleted || apiKeyRecord.merchant.status !== "active") {
        return NextResponse.json(
          { error: "Merchant account is not active" },
          { status: 403, headers: { "x-request-id": requestId } }
        )
      }
      
      // Publishable keys can only create payment intents, not list/retrieve
      const { pathname } = request.nextUrl
      if (request.method === "POST" && pathname === "/api/payment-intents") {
        const response = NextResponse.next()
        response.headers.set("x-request-id", requestId)
        response.headers.set("x-merchant-id", apiKeyRecord.merchantId)
        response.headers.set("x-publishable-key", apiKeyRecord.publishableKey)
        return response
      }
      
      return NextResponse.json(
        { error: "This endpoint requires a secret key" },
        { status: 403, headers: { "x-request-id": requestId } }
      )
    }
  } catch (error) {
    console.error("API key authentication error:", error)
    return NextResponse.json(
      { error: "Authentication error" },
      { status: 500, headers: { "x-request-id": requestId } }
    )
  }
  
  return NextResponse.json(
    { error: "Invalid API key" },
    { status: 401, headers: { "x-request-id": requestId } }
  )
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
}
