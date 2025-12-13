/*
  Core TypeScript Types
  
  Centralized type definitions for the entire application
*/

// Merchant Types
export interface Merchant {
  id: string
  email: string
  businessName: string
  displayName: string
  tier: "starter" | "pro" | "enterprise"
  status: "active" | "suspended" | "deleted"
  createdAt: Date
  emailVerified?: Date | null
  website?: string | null
  country?: string | null
  timezone: string
  totpEnabled: boolean
  metadata: Record<string, any>
}

// Session Types
export interface Session {
  user: {
    id: string
    email: string
    merchantId: string
    tier: string
    businessName: string
    displayName: string
  }
  expires: string
}

// API Key Types
export interface ApiKey {
  id: string
  merchantId: string
  publishableKey: string
  name: string
  lastUsedAt?: Date | null
  createdAt: Date
  expiresAt?: Date | null
  isActive: boolean
  ipWhitelist: string[]
  restrictedTo: string[]
  secretKeyPrefix: string
}

// API Key with Secret (for creation responses)
export interface ApiKeyWithSecret extends ApiKey {
  secretKey: string // Only returned once during creation
}

// API Key Rotation Types
export interface ApiKeyRotation {
  id: string
  apiKeyId: string
  merchantId: string
  oldSecretKeyHash: string
  newSecretKeyHash: string
  reason: string
  rotatedAt: Date
}

// Webhook Endpoint Types
export interface WebhookEndpoint {
  id: string
  merchantId: string
  url: string
  secret: string
  events: string[]
  isActive: boolean
  failureCount: number
  lastFailedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

// Merchant Settings Types
export interface MerchantSettings {
  id: string
  merchantId: string
  notifyOnPayment: boolean
  notifyOnRefund: boolean
  payoutSchedule: "daily" | "weekly" | "monthly"
  webhookRetryCount: number
  createdAt: Date
  updatedAt: Date
}

// Audit Log Types
export interface AuditLog {
  id: string
  merchantId: string
  action: string
  resource?: string | null
  resourceId?: string | null
  status: "success" | "failure"
  ipAddress?: string | null
  userAgent?: string | null
  requestId: string
  details: Record<string, any>
  createdAt: Date
}

// Request/Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  requestId: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta
}

// Rate Limiting Types
export interface RateLimitStatus {
  isLocked: boolean
  remainingTime: number
  attempts: number
  maxAttempts: number
}

// Form Types
export interface SignupFormData {
  email: string
  password: string
  businessName: string
  displayName: string
  website?: string
  country?: string
  timezone?: string
  acceptTerms: boolean
}

export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

// Validation Error Types
export interface ValidationError {
  field: string
  message: string
}

export interface FormState {
  errors: ValidationError[]
  message?: string
  success: boolean
}

// Environment Types
export interface EnvironmentConfig {
  DATABASE_URL: string
  NEXTAUTH_URL: string
  NEXTAUTH_SECRET: string
  EMAIL_PROVIDER: "resend" | "nodemailer" | "console"
  RESEND_API_KEY?: string
  NODEMAILER_HOST?: string
  NODEMAILER_PORT?: string
  NODEMAILER_USER?: string
  NODEMAILER_PASS?: string
  RATE_LIMIT_ATTEMPTS: string
  RATE_LIMIT_WINDOW_MS: string
  JWT_EXPIRY_DAYS: string
  LOG_LEVEL: "info" | "warn" | "error"
}

// Health Check Types
export interface HealthCheckResponse {
  status: "ok" | "error"
  uptime: number
  dbConnection: "ok" | "error"
  timestamp: string
  version: string
}

// Request Context Types
export interface RequestContext {
  requestId: string
  ipAddress?: string
  userAgent?: string
  merchantId?: string
}

// API Key Management CLI Types
export interface CliOptions {
  merchantEmail?: string
  keyId?: string
  action: "generate" | "list-all" | "revoke" | "rotate"
  name?: string
  reason?: string
}

// Product/Price/Customer Types (Phase 2+)
export interface Product {
  id: string
  merchantId: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface Price {
  id: string
  merchantId: string
  productId: string
  amount: number
  currency: string
  type: "one_time" | "recurring"
  recurringInterval?: "month" | "year"
  createdAt: Date
}

export interface Customer {
  id: string
  merchantId: string
  email: string
  name?: string
  createdAt: Date
}

export interface PaymentIntent {
  id: string
  merchantId: string
  clientSecret: string
  status: "requires_payment_method" | "succeeded" | "failed"
  amount: number
  currency: string
  createdAt: Date
}

export interface Charge {
  id: string
  merchantId: string
  amount: number
  status: "succeeded" | "failed" | "refunded"
  createdAt: Date
}

export interface Subscription {
  id: string
  merchantId: string
  status: "active" | "cancelled" | "past_due"
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  createdAt: Date
}
