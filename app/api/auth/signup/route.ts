/*
  Signup API Route
  
  Creates new merchant accounts with password hashing
  Includes comprehensive validation and audit logging
*/

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signupSchema } from "@/lib/validation"
import { validatePassword } from "@/lib/password"
import { generateRequestId, extractRequestContext } from "@/lib/request-id"
import { auditLogger } from "@/lib/logger"
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestContext = extractRequestContext(request)
  
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = signupSchema.parse(body)
    
    // Check rate limiting for signup attempts
    const rateLimitCheck = await checkRateLimit(validatedData.email)
    if (rateLimitCheck.isLocked) {
      await auditLogger.log("signup_failed", "rate_limit", validatedData.email, {
        status: "failure",
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
        requestId: requestContext.requestId,
        details: { 
          reason: "Account creation locked",
          remainingTime: rateLimitCheck.remainingTime,
          attempts: rateLimitCheck.attempts 
        },
      })
      
      return NextResponse.json(
        {
          success: false,
          error: "Account creation temporarily locked due to too many failed attempts",
          requestId: requestContext.requestId,
        },
        { status: 429 }
      )
    }

    // Check if merchant already exists
    const existingMerchant = await prisma.merchant.findUnique({
      where: { email: validatedData.email },
    })

    if (existingMerchant) {
      await recordFailedAttempt(validatedData.email)
      await auditLogger.log("signup_failed", "merchant", validatedData.email, {
        status: "failure",
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
        requestId: requestContext.requestId,
        details: { reason: "Email already exists" },
      })

      return NextResponse.json(
        {
          success: false,
          error: "Email already registered",
          requestId: requestContext.requestId,
        },
        { status: 400 }
      )
    }

    // Double-check password strength (additional security layer)
    const passwordValidation = validatePassword(validatedData.password)
    if (!passwordValidation.valid) {
      await recordFailedAttempt(validatedData.email)
      await auditLogger.log("signup_failed", "password", validatedData.email, {
        status: "failure",
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
        requestId: requestContext.requestId,
        details: { 
          reason: "Weak password",
          errors: passwordValidation.errors 
        },
      })

      return NextResponse.json(
        {
          success: false,
          error: "Password does not meet security requirements",
          details: passwordValidation.errors,
          requestId: requestContext.requestId,
        },
        { status: 400 }
      )
    }

    // Hash password with bcrypt (12 rounds for security)
    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    // Create merchant in transaction
    const merchant = await prisma.$transaction(async (tx) => {
      // Create the merchant
      const newMerchant = await tx.merchant.create({
        data: {
          email: validatedData.email,
          passwordHash,
          businessName: validatedData.businessName,
          displayName: validatedData.displayName,
          website: validatedData.website || null,
          country: validatedData.country || null,
          timezone: validatedData.timezone || "UTC",
          status: "active",
          tier: "starter",
        },
      })

      // Create default settings
      await tx.merchantSettings.create({
        data: {
          merchantId: newMerchant.id,
        },
      })

      // Generate initial API key for the merchant
      const { publishableKey, secretKey } = await import("@/lib/api-key").then(
        m => m.generateApiKeys()
      )
      
      const secretKeyHash = await bcrypt.hash(secretKey, 12)
      
      await tx.apiKey.create({
        data: {
          merchantId: newMerchant.id,
          publishableKey,
          secretKeyHash,
          secretKeyPrefix: secretKey.slice(-4),
          name: "Default Production Key",
        },
      })

      return newMerchant
    })

    // Clear rate limit on successful signup
    await clearRateLimit(validatedData.email)

    // Log successful signup
    await auditLogger.log("signup", "merchant", merchant.id, {
      status: "success",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      requestId: requestContext.requestId,
      details: { 
        email: merchant.email,
        tier: merchant.tier,
        processingTime: Date.now() - startTime 
      },
    })

    // Return success response (without sensitive data)
    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        data: {
          merchant: {
            id: merchant.id,
            email: merchant.email,
            businessName: merchant.businessName,
            displayName: merchant.displayName,
            tier: merchant.tier,
            status: merchant.status,
          },
        },
        requestId: requestContext.requestId,
      },
      { status: 201 }
    )

  } catch (error) {
    // Handle validation errors
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
          details: error.message,
          requestId: requestContext.requestId,
        },
        { status: 400 }
      )
    }

    // Handle database errors
    await auditLogger.log("signup_failed", "error", requestContext.requestId, {
      status: "failure",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      requestId: requestContext.requestId,
      details: { 
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
    })

    // Return generic error for security
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create account",
        requestId: requestContext.requestId,
      },
      { status: 500 }
    )
  }
}
