/*
  Structured Logging System
  
  Provides consistent JSON logging across the application
  Includes audit logging for compliance requirements
*/

import { prisma } from "./prisma"

export const logger = {
  info: (msg: string, meta?: object) => {
    const logEntry = {
      level: "info",
      msg,
      timestamp: new Date().toISOString(),
      ...meta
    }
    console.log(JSON.stringify(logEntry))
  },

  warn: (msg: string, meta?: object) => {
    const logEntry = {
      level: "warn",
      msg,
      timestamp: new Date().toISOString(),
      ...meta
    }
    console.warn(JSON.stringify(logEntry))
  },

  error: (msg: string, meta?: object) => {
    const logEntry = {
      level: "error",
      msg,
      timestamp: new Date().toISOString(),
      ...meta
    }
    console.error(JSON.stringify(logEntry))
  },

  audit: (msg: string, meta?: object) => {
    const logEntry = {
      level: "audit",
      msg,
      timestamp: new Date().toISOString(),
      ...meta
    }
    console.log(JSON.stringify(logEntry))
  }
}

export const auditLogger = {
  async log(
    action: string,
    resource: string,
    merchantIdOrResourceId: string,
    options?: {
      resourceId?: string
      status?: "success" | "failure"
      ipAddress?: string
      userAgent?: string
      requestId?: string
      details?: object
    }
  ) {
    const {
      resourceId,
      status = "success",
      ipAddress,
      userAgent,
      requestId,
      details
    } = options || {}

    // Determine if first param is merchantId or resourceId
    const merchantId = resource === "merchant" ? merchantIdOrResourceId : undefined
    const actualResourceId = resource === "merchant" ? resourceId : merchantIdOrResourceId

    try {
      await prisma.auditLog.create({
        data: {
          merchantId: merchantId || "system", // Use "system" for cross-merchant actions
          action,
          resource,
          resourceId: actualResourceId,
          status,
          ipAddress,
          userAgent,
          requestId: requestId || "unknown",
          details: details || {},
        },
      })

      // Also log to console for development
      logger.audit(`${action} on ${resource}`, {
        merchantId: merchantId || "system",
        resourceId: actualResourceId,
        status,
        requestId,
      })
    } catch (error) {
      logger.error("Failed to create audit log", {
        action,
        resource,
        merchantId: merchantId || "system",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  },

  // Convenience methods for common actions
  async signin(merchantId: string, success: boolean, meta?: object) {
    return this.log(success ? "signin" : "signin_failed", "merchant", merchantId, {
      status: success ? "success" : "failure",
      ...meta,
    })
  },

  async signup(merchantId: string, meta?: object) {
    return this.log("signup", "merchant", merchantId, meta)
  },

  async apiKeyCreated(merchantId: string, apiKeyId: string, meta?: object) {
    return this.log("api_key_created", "api_key", merchantId, {
      resourceId: apiKeyId,
      ...meta,
    })
  },

  async passwordChanged(merchantId: string, meta?: object) {
    return this.log("password_changed", "merchant", merchantId, meta)
  },

  async rateLimitExceeded(identifier: string, meta?: object) {
    return this.log("rate_limit_exceeded", "auth", "system", {
      details: { identifier },
      ...meta,
    })
  },
}
