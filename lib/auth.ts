/*
  NextAuth.js v5 Configuration
  
  ⚠️ CRITICAL: This demo uses basic bcrypt + JWT.
  Real Stripe uses:
  - OAuth 2.0 / OIDC for enterprise SSO
  - Multi-factor authentication (TOTP, WebAuthn)
  - Hardware security module (HSM) for key signing
  - Regular security audits & penetration testing
  - Rate limiting on all endpoints
  - API key rotation enforcement
*/

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import { validatePassword } from "./password"
import { checkRateLimit, recordFailedAttempt } from "./rate-limit"
import { generateRequestId } from "./request-id"
import { auditLogger } from "./logger"
import { z } from "zod"

// Input validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const requestId = generateRequestId()
        
        try {
          // Validate input
          const parsed = loginSchema.parse(credentials)
          const { email, password } = parsed

          // Check rate limiting
          const rateLimitCheck = await checkRateLimit(email)
          if (rateLimitCheck.isLocked) {
            await auditLogger.log("signin_failed", "rate_limit", {
              email,
              reason: "Account locked",
              remainingTime: rateLimitCheck.remainingTime,
              requestId,
            })
            return null
          }

          // Find merchant
          const merchant = await prisma.merchant.findUnique({
            where: { email: email.toLowerCase() },
            include: { merchantSettings: true },
          })

          // Check if merchant exists and is active
          if (!merchant || merchant.isDeleted) {
            await recordFailedAttempt(email)
            await auditLogger.log("signin_failed", "merchant_not_found", {
              email,
              reason: "Invalid credentials",
              requestId,
            })
            return null
          }

          if (merchant.status !== "active") {
            await auditLogger.log("signin_failed", "merchant_suspended", {
              merchantId: merchant.id,
              email,
              reason: `Account status: ${merchant.status}`,
              requestId,
            })
            return null
          }

          // Validate password
          const bcrypt = await import("bcryptjs")
          const isValidPassword = await bcrypt.compare(password, merchant.passwordHash)
          
          if (!isValidPassword) {
            await recordFailedAttempt(email)
            await auditLogger.log("signin_failed", "invalid_password", {
              merchantId: merchant.id,
              email,
              requestId,
            })
            return null
          }

          // Success - return user data for JWT
          const user = {
            id: merchant.id,
            email: merchant.email,
            merchantId: merchant.id,
            tier: merchant.tier,
            businessName: merchant.businessName,
            displayName: merchant.displayName,
          }

          await auditLogger.log("signin", "merchant", merchant.id, {
            requestId,
            details: { loginMethod: "password" },
          })

          return user
        } catch (error) {
          await auditLogger.log("signin_failed", "error", {
            email: credentials?.email,
            reason: "Authentication error",
            requestId,
            details: { error: error instanceof Error ? error.message : "Unknown error" },
          })
          return null
        }
      },
    }),
  ],
  callbacks: {
    // JWT callback - inject custom claims for tenant isolation
    async jwt({ token, user }) {
      if (user) {
        // Add merchant-specific data to JWT
        token.merchantId = user.merchantId
        token.tier = user.tier
        token.businessName = user.businessName
        token.displayName = user.displayName
      }
      return token
    },
    
    // Session callback - expose merchant context
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub as string
        session.user.merchantId = token.merchantId as string
        session.user.tier = token.tier as string
        session.user.businessName = token.businessName as string
        session.user.displayName = token.displayName as string
      }
      return session
    },
  },
  events: {
    // Sign up event handler
    async createUser({ user }) {
      const requestId = generateRequestId()
      await auditLogger.log("signup", "merchant", user.id, {
        requestId,
        details: { email: user.email },
      })
    },
  },
})

export type SessionUser = {
  id: string
  email: string
  merchantId: string
  tier: string
  businessName: string
  displayName: string
}
