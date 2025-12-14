/*
  Zod Validation Schemas
  
  Centralized input validation for all API endpoints and forms
*/

import { z } from "zod"

// Merchant schemas
export const signupSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(14, "Password must be at least 14 characters")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least 1 special character"),
  businessName: z.string().min(1, "Business name is required").max(100, "Business name too long"),
  displayName: z.string().min(1, "Display name is required").max(100, "Display name too long"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  country: z.string().length(2, "Country must be 2-letter code").optional(),
  timezone: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, "Must accept terms and conditions"),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
})

// API Key schemas
export const createApiKeySchema = z.object({
  name: z.string().min(1, "API key name is required").max(100, "Name too long"),
  ipWhitelist: z.array(z.string().ip()).optional().default([]),
  restrictedTo: z.array(z.string()).optional().default([]),
  expiresAt: z.string().datetime().optional(),
})

export const rotateApiKeySchema = z.object({
  reason: z.enum(["scheduled", "compromised", "user_initiated"], {
    errorMap: () => ({ message: "Invalid rotation reason" })
  }),
})

// Webhook schemas
export const createWebhookSchema = z.object({
  url: z.string().url("Invalid webhook URL"),
  events: z.array(z.string()).min(1, "At least one event must be specified"),
  secret: z.string().min(32, "Webhook secret must be at least 32 characters"),
})

// Settings schemas
export const updateSettingsSchema = z.object({
  notifyOnPayment: z.boolean().optional(),
  notifyOnRefund: z.boolean().optional(),
  payoutSchedule: z.enum(["daily", "weekly", "monthly"]).optional(),
  webhookRetryCount: z.number().int().min(1).max(10).optional(),
})

// Password reset schemas
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(14, "Password must be at least 14 characters")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least 1 special character"),
})

// Email verification schemas
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
})

export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
})

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

// Generic API response schema
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  requestId: z.string(),
})

// Health check schema
export const healthCheckSchema = z.object({
  status: z.string(),
  uptime: z.number(),
  dbConnection: z.string(),
  timestamp: z.string(),
})

// Audit log filtering
export const auditLogFilterSchema = z.object({
  action: z.string().optional(),
  resource: z.string().optional(),
  status: z.enum(["success", "failure"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>
export type RotateApiKeyInput = z.infer<typeof rotateApiKeySchema>
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>
