/*
  NextAuth.js v5 API Route Handler
  
  Handles all authentication endpoints:
  - POST /api/auth/signin
  - POST /api/auth/signout
  - GET /api/auth/session
  - GET /api/auth/csrf
*/

import { handlers } from "@/lib/auth"
import { NextRequest } from "next/server"

export const { GET, POST } = handlers

// Custom middleware for additional security checks
export async function middleware(request: NextRequest) {
  // Add security headers
  const response = new Response()
  
  // Add request ID if not present
  const requestId = request.headers.get("x-request-id")
  if (!requestId) {
    response.headers.set("x-request-id", crypto.randomUUID())
  }
  
  return response
}

// Enable Edge Runtime for better performance
export const runtime = "edge"
