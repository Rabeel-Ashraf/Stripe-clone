/*
  Rate Limiting System
  
  Tracks failed login attempts per IP + email
  Implements exponential backoff for security
*/

import { prisma } from "./prisma"
import crypto from "crypto"

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number; lockedUntil?: number }>()

export interface RateLimitStatus {
  isLocked: boolean
  remainingTime: number
  attempts: number
  maxAttempts: number
}

const MAX_ATTEMPTS = parseInt(process.env.RATE_LIMIT_ATTEMPTS || "5")
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000") // 15 minutes
const LOCK_MULTIPLIER = 5 // Each lock adds 5 more minutes

export function generateRateLimitKey(identifier: string): string {
  return crypto.createHash("sha256").update(identifier).digest("hex")
}

export function getRemainingTime(resetTime: number): number {
  const now = Date.now()
  return Math.max(0, resetTime - now)
}

export async function checkRateLimit(identifier: string): Promise<RateLimitStatus> {
  const key = generateRateLimitKey(identifier.toLowerCase())
  const record = rateLimitStore.get(key)
  
  const now = Date.now()
  
  if (!record) {
    return {
      isLocked: false,
      remainingTime: 0,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
    }
  }
  
  // If locked, check if lock period has expired
  if (record.lockedUntil && now < record.lockedUntil) {
    return {
      isLocked: true,
      remainingTime: getRemainingTime(record.lockedUntil),
      attempts: record.count,
      maxAttempts: MAX_ATTEMPTS,
    }
  }
  
  // Lock has expired, clear the record
  if (record.lockedUntil && now >= record.lockedUntil) {
    rateLimitStore.delete(key)
    return {
      isLocked: false,
      remainingTime: 0,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
    }
  }
  
  // Check if window has expired (reset count)
  if (now >= record.resetTime) {
    rateLimitStore.delete(key)
    return {
      isLocked: false,
      remainingTime: 0,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
    }
  }
  
  return {
    isLocked: false,
    remainingTime: getRemainingTime(record.resetTime),
    attempts: record.count,
    maxAttempts: MAX_ATTEMPTS,
  }
}

export async function recordFailedAttempt(identifier: string): Promise<void> {
  const key = generateRateLimitKey(identifier.toLowerCase())
  const now = Date.now()
  
  const record = rateLimitStore.get(key)
  
  if (!record) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + WINDOW_MS,
    })
    return
  }
  
  // If currently locked, don't increment
  if (record.lockedUntil && now < record.lockedUntil) {
    return
  }
  
  // If window has expired, reset
  if (now >= record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + WINDOW_MS,
    })
    return
  }
  
  // Increment attempt count
  record.count += 1
  
  // Check if we need to lock the account
  if (record.count >= MAX_ATTEMPTS) {
    const additionalTime = (record.count - MAX_ATTEMPTS + 1) * LOCK_MULTIPLIER * 60 * 1000
    record.lockedUntil = now + additionalTime
  }
  
  rateLimitStore.set(key, record)
}

export async function clearRateLimit(identifier: string): Promise<void> {
  const key = generateRateLimitKey(identifier.toLowerCase())
  rateLimitStore.delete(key)
}

export async function getRateLimitStatus(identifier: string): Promise<RateLimitStatus> {
  return checkRateLimit(identifier)
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now >= record.resetTime && (!record.lockedUntil || now >= record.lockedUntil)) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute
