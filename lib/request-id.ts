/*
  Request ID Tracking
  
  Generates UUID for each request for tracing and debugging
  Attaches to response headers for support correlation
*/

export function generateRequestId(): string {
  return crypto.randomUUID()
}

export function getRequestIdFromHeaders(headers: Headers): string | null {
  return headers.get("x-request-id")
}

export function createRequestId(headers: Headers): string {
  const existing = getRequestIdFromHeaders(headers)
  if (existing) {
    return existing
  }
  
  const newRequestId = generateRequestId()
  headers.set("x-request-id", newRequestId)
  
  return newRequestId
}

export interface RequestContext {
  requestId: string
  ipAddress?: string
  userAgent?: string
}

export function extractRequestContext(request: Request): RequestContext {
  const headers = request.headers
  const requestId = createRequestId(headers)
  const ipAddress = extractClientIP(request)
  const userAgent = headers.get("user-agent") || undefined
  
  return {
    requestId,
    ipAddress,
    userAgent,
  }
}

function extractClientIP(request: Request): string | undefined {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  
  const realIP = request.headers.get("x-real-ip")
  if (realIP) {
    return realIP
  }
  
  const cfConnectingIP = request.headers.get("cf-connecting-ip")
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback - this might be the proxy IP in serverless environments
  return undefined
}
