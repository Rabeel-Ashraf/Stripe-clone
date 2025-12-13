/*
  API Key Security Layer
  
  ⚠️ Never log raw secret keys. Only log hash or first 4 chars.
  Treat secret keys like passwords — rotate if exposed.
*/

import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export function generateApiKeys(): {
  publishableKey: string
  secretKey: string
} {
  const publishable = `pk_live_${nanoid(40)}`
  const secret = `sk_live_${nanoid(80)}`
  return { publishableKey: publishable, secretKey: secret }
}

export async function hashSecretKey(secretKey: string): Promise<string> {
  return bcrypt.hash(secretKey, 12)
}

export async function validateSecretKey(
  secretKey: string,
  merchantId: string
): Promise<{ valid: boolean; apiKey?: any; error?: string }> {
  try {
    // Find API key by merchant and prefix (last 4 chars)
    const secretKeyPrefix = secretKey.slice(-4)
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        merchantId,
        secretKeyPrefix,
        isActive: true,
      },
    })

    if (!apiKey) {
      return { valid: false, error: "API key not found or inactive" }
    }

    // Verify the full secret key matches
    const isValid = await bcrypt.compare(secretKey, apiKey.secretKeyHash)
    if (!isValid) {
      return { valid: false, error: "Invalid secret key" }
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })

    return { valid: true, apiKey }
  } catch (error) {
    console.error("API key validation error:", error)
    return { valid: false, error: "Validation error" }
  }
}

export function extractApiKey(req: Request): string | null {
  // Try Authorization Bearer token first
  const auth = req.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7)
  }
  
  // Try x-api-key header
  const apiKey = req.headers.get("x-api-key")
  if (apiKey) {
    return apiKey
  }
  
  return null
}

export async function createApiKey(
  merchantId: string,
  name: string,
  options?: {
    ipWhitelist?: string[]
    restrictedTo?: string[]
    expiresAt?: Date
  }
) {
  const { publishableKey, secretKey } = generateApiKeys()
  const secretKeyHash = await hashSecretKey(secretKey)
  
  const apiKey = await prisma.apiKey.create({
    data: {
      merchantId,
      publishableKey,
      secretKeyHash,
      secretKeyPrefix: secretKey.slice(-4),
      name,
      ipWhitelist: options?.ipWhitelist || [],
      restrictedTo: options?.restrictedTo || [],
      expiresAt: options?.expiresAt,
    },
  })

  return {
    apiKey,
    publishableKey,
    secretKey, // Only returned once - store securely!
  }
}

export async function rotateApiKey(apiKeyId: string, reason: string) {
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
  })

  if (!apiKey) {
    throw new Error("API key not found")
  }

  const { publishableKey, secretKey } = generateApiKeys()
  const newSecretKeyHash = await hashSecretKey(secretKey)

  // Update the API key
  const updated = await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: {
      secretKeyHash: newSecretKeyHash,
      secretKeyPrefix: secretKey.slice(-4),
    },
  })

  // Log the rotation
  await prisma.apiKeyRotation.create({
    data: {
      apiKeyId: apiKey.id,
      merchantId: apiKey.merchantId,
      oldSecretKeyHash: apiKey.secretKeyHash,
      newSecretKeyHash,
      reason,
    },
  })

  return {
    apiKey: updated,
    publishableKey,
    secretKey, // Only returned once!
  }
}

export async function revokeApiKey(apiKeyId: string) {
  return await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { isActive: false },
  })
}

export async function validateApiKeyRestrictions(
  apiKey: any,
  endpoint: string,
  clientIp: string
): Promise<{ valid: boolean; error?: string }> {
  // Check if API key is active
  if (!apiKey.isActive) {
    return { valid: false, error: "API key is inactive" }
  }

  // Check expiration
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
    return { valid: false, error: "API key has expired" }
  }

  // Check IP whitelist
  if (apiKey.ipWhitelist.length > 0 && !apiKey.ipWhitelist.includes(clientIp)) {
    return { valid: false, error: "IP address not whitelisted" }
  }

  // Check endpoint restrictions
  if (apiKey.restrictedTo.length > 0 && !apiKey.restrictedTo.includes(endpoint)) {
    return { valid: false, error: "Endpoint not allowed for this API key" }
  }

  return { valid: true }
}
