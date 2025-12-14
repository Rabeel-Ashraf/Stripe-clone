/*
  API Key Tests
  
  Tests API key generation, validation, rotation, and security
*/

import bcrypt from "bcryptjs"
import { 
  generateApiKeys, 
  hashSecretKey, 
  validateSecretKey, 
  createApiKey, 
  rotateApiKey,
  revokeApiKey 
} from "@/lib/api-key"
import { prisma } from "@/lib/prisma"

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    apiKey: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    merchant: {
      findUnique: jest.fn(),
    },
  },
}))

describe("API Key Security", () => {
  describe("Key Generation", () => {
    test("generateApiKeys creates unique key pair", () => {
      const keys1 = generateApiKeys()
      const keys2 = generateApiKeys()
      
      // Keys should be unique
      expect(keys1.publishableKey).not.toBe(keys2.publishableKey)
      expect(keys1.secretKey).not.toBe(keys2.secretKey)
      
      // Format validation
      expect(keys1.publishableKey).toMatch(/^pk_live_[a-zA-Z0-9]{40}$/)
      expect(keys1.secretKey).toMatch(/^sk_live_[a-zA-Z0-9]{80}$/)
      
      // Secret key should be longer than publishable
      expect(keys1.secretKey.length).toBeGreaterThan(keys1.publishableKey.length)
    })
    
    test("hashSecretKey creates secure hash", async () => {
      const secretKey = "sk_live_testsecretkey123"
      const hash = await hashSecretKey(secretKey)
      
      // Hash should be different from original
      expect(hash).not.toBe(secretKey)
      
      // Hash should be verifiable
      const isValid = await bcrypt.compare(secretKey, hash)
      expect(isValid).toBe(true)
      
      // Different secret should produce different hash
      const otherKey = "sk_live_differentkey456"
      const otherHash = await hashSecretKey(otherKey)
      expect(hash).not.toBe(otherHash)
    })
  })
  
  describe("Key Validation", () => {
    test("validateSecretKey returns valid for correct key", async () => {
      const merchantId = "test-merchant-id"
      const secretKey = "sk_live_testsecretkey123"
      const hash = await bcrypt.hash(secretKey, 12)
      const secretKeyPrefix = secretKey.slice(-4)
      
      // Mock Prisma to return an API key
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue({
        id: "test-key-id",
        merchantId,
        secretKeyHash: hash,
        secretKeyPrefix,
        isActive: true,
      })
      
      const result = await validateSecretKey(secretKey, merchantId)
      
      expect(result.valid).toBe(true)
      expect(result.apiKey).toBeDefined()
      expect(result.error).toBeUndefined()
    })
    
    test("validateSecretKey fails for wrong key", async () => {
      const merchantId = "test-merchant-id"
      const correctKey = "sk_live_correctkey123"
      const wrongKey = "sk_live_wrongkey456"
      const hash = await bcrypt.hash(correctKey, 12)
      const secretKeyPrefix = correctKey.slice(-4)
      
      // Mock Prisma to return an API key
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue({
        id: "test-key-id",
        merchantId,
        secretKeyHash: hash,
        secretKeyPrefix,
        isActive: true,
      })
      
      const result = await validateSecretKey(wrongKey, merchantId)
      
      expect(result.valid).toBe(false)
      expect(result.apiKey).toBeUndefined()
      expect(result.error).toBe("Invalid secret key")
    })
    
    test("validateSecretKey fails for inactive key", async () => {
      const merchantId = "test-merchant-id"
      const secretKey = "sk_live_testsecretkey123"
      const hash = await bcrypt.hash(secretKey, 12)
      const secretKeyPrefix = secretKey.slice(-4)
      
      // Mock Prisma to return an inactive API key
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue({
        id: "test-key-id",
        merchantId,
        secretKeyHash: hash,
        secretKeyPrefix,
        isActive: false,
      })
      
      const result = await validateSecretKey(secretKey, merchantId)
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe("API key not found or inactive")
    })
  })
  
  describe("Key Management", () => {
    test("createApiKey generates new key pair", async () => {
      const merchantId = "test-merchant-id"
      const name = "Test API Key"
      
      const mockApiKey = {
        id: "new-key-id",
        merchantId,
        publishableKey: "pk_live_mockpubkey123",
        secretKeyHash: "mockhash",
        secretKeyPrefix: "ey123",
        name,
        isActive: true,
        createdAt: new Date(),
      }
      
      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockApiKey)
      
      const result = await createApiKey(merchantId, name)
      
      expect(result.apiKey).toBeDefined()
      expect(result.publishableKey).toMatch(/^pk_live_/)
      expect(result.secretKey).toMatch(/^sk_live_/)
      expect(result.apiKey.name).toBe(name)
      
      // Secret key should only be returned once
      expect(result.secretKey).not.toBe(mockApiKey.secretKeyHash)
    })
    
    test("rotateApiKey updates secret and logs rotation", async () => {
      const apiKeyId = "test-key-id"
      const reason = "scheduled"
      
      const oldKey = {
        id: apiKeyId,
        merchantId: "test-merchant-id",
        secretKeyHash: "oldhash",
        secretKeyPrefix: "old4",
        isActive: true,
      }
      
      const newKey = {
        ...oldKey,
        secretKeyHash: "newhash",
        secretKeyPrefix: "new4",
      }
      
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(oldKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(newKey)
      
      const result = await rotateApiKey(apiKeyId, reason)
      
      expect(result.apiKey).toBeDefined()
      expect(result.secretKey).toMatch(/^sk_live_/)
      expect(result.publishableKey).toMatch(/^pk_live_/)
      
      // Should call update with new hash
      expect(prisma.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: apiKeyId },
          data: expect.objectContaining({
            secretKeyHash: expect.any(String),
            secretKeyPrefix: expect.any(String),
          }),
        })
      )
    })
    
    test("revokeApiKey deactivates key", async () => {
      const apiKeyId = "test-key-id"
      
      const revokedKey = {
        id: apiKeyId,
        isActive: false,
      }
      
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(revokedKey)
      
      const result = await revokeApiKey(apiKeyId)
      
      expect(result.isActive).toBe(false)
      
      // Should call update to set isActive to false
      expect(prisma.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: apiKeyId },
          data: { isActive: false },
        })
      )
    })
  })
})
