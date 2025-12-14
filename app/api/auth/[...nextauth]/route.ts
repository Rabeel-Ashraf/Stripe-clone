/*
  NextAuth.js v5 API Route Handler
  
  Handles all authentication endpoints:
  - POST /api/auth/signin
  - POST /api/auth/signout
  - GET /api/auth/session
  - GET /api/auth/csrf
*/

import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers

// Use Node.js runtime for bcrypt support
export const runtime = "nodejs"
