/*
  Next.js Middleware
  
  ⚠️ HTTPS required in production. Insecure cookies over HTTP expose JWTs.
  Set NEXTAUTH_URL=https://yourdomain.com to enable secure flag.
*/

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
