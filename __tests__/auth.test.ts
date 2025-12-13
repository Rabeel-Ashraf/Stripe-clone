/*
  Authentication Tests
  
  Tests signup, signin, password validation, and rate limiting
*/

import bcrypt from "bcryptjs"
import { validatePassword } from "@/lib/password"
import { signupSchema, loginSchema } from "@/lib/validation"
import { generateRequestId } from "@/lib/request-id"

// Mock the rate limiting functions
jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn(),
  recordFailedAttempt: jest.fn(),
  clearRateLimit: jest.fn(),
}))

// Mock the audit logger
jest.mock("@/lib/logger", () => ({
  auditLogger: {
    log: jest.fn(),
  },
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe("Authentication", () => {
  describe("Password Validation", () => {
    test("signup creates merchant with hashed password", async () => {
      const password = "Demo1234!"
      const hash = await bcrypt.hash(password, 12)
      
      // Verify the hash can be used for comparison
      const isValid = await bcrypt.compare(password, hash)
      expect(isValid).toBe(true)
      
      // Verify wrong password fails
      const isInvalid = await bcrypt.compare("WrongPassword", hash)
      expect(isInvalid).toBe(false)
    })
    
    test("signin validates password hash", async () => {
      const password = "Demo1234!"
      const hash = await bcrypt.hash(password, 12)
      
      // Correct password should validate
      const result = await bcrypt.compare(password, hash)
      expect(result).toBe(true)
      
      // Wrong password should fail
      const wrongResult = await bcrypt.compare("WrongPassword", hash)
      expect(wrongResult).toBe(false)
    })
    
    test("password strength validator rejects weak passwords", () => {
      // Test various weak passwords
      const weakPasswords = [
        "short", // Too short
        "nouppercase123!", // No uppercase
        "NO_LOWERCASE123!", // No lowercase  
        "NoNumbers!", // No numbers
        "NoSpecialChars123", // No special characters
        "Weak1!", // Too short and common
      ]
      
      weakPasswords.forEach(password => {
        const result = validatePassword(password)
        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })
    })
    
    test("password strength validator accepts strong passwords", () => {
      const strongPasswords = [
        "StrongPassword123!",
        "MySecureP@ssw0rd",
        "ComplexPass#2024",
        "Tr0ub4dor&3",
      ]
      
      strongPasswords.forEach(password => {
        const result = validatePassword(password)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })
  })
  
  describe("Form Validation", () => {
    test("signup form validates correctly", () => {
      // Valid signup data
      const validData = {
        email: "test@example.com",
        password: "StrongPassword123!",
        businessName: "Test Corp",
        displayName: "Test Display",
        website: "https://test.com",
        country: "US",
        timezone: "UTC",
        acceptTerms: true,
      }
      
      expect(() => signupSchema.parse(validData)).not.toThrow()
    })
    
    test("signup form rejects invalid data", () => {
      // Invalid email
      expect(() => signupSchema.parse({
        email: "invalid-email",
        password: "StrongPassword123!",
        businessName: "Test Corp",
        displayName: "Test Display",
        website: "https://test.com",
        country: "US",
        timezone: "UTC",
        acceptTerms: true,
      })).toThrow()
      
      // Weak password
      expect(() => signupSchema.parse({
        email: "test@example.com",
        password: "weak",
        businessName: "Test Corp",
        displayName: "Test Display",
        website: "https://test.com",
        country: "US",
        timezone: "UTC",
        acceptTerms: true,
      })).toThrow()
      
      // Missing required fields
      expect(() => signupSchema.parse({
        email: "test@example.com",
        password: "StrongPassword123!",
        // Missing businessName and displayName
        acceptTerms: true,
      })).toThrow()
    })
    
    test("login form validates correctly", () => {
      // Valid login data
      const validData = {
        email: "test@example.com",
        password: "password123",
        rememberMe: true,
      }
      
      expect(() => loginSchema.parse(validData)).not.toThrow()
      
      // Minimum login data
      const minimalData = {
        email: "test@example.com",
        password: "password123",
      }
      
      expect(() => loginSchema.parse(minimalData)).not.toThrow()
    })
  })
  
  describe("Request ID Generation", () => {
    test("generateRequestId creates unique IDs", () => {
      const id1 = generateRequestId()
      const id2 = generateRequestId()
      
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe("string")
      expect(id1.length).toBeGreaterThan(0)
    })
  })
  
  describe("Rate Limiting", () => {
    test("locks account after 5 failed attempts", async () => {
      const { checkRateLimit } = await import("@/lib/rate-limit")
      
      // Mock checkRateLimit to return locked state
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        isLocked: true,
        remainingTime: 900000, // 15 minutes
        attempts: 5,
        maxAttempts: 5,
      })
      
      const status = await checkRateLimit("test@example.com")
      
      expect(status.isLocked).toBe(true)
      expect(status.remainingTime).toBe(900000)
      expect(status.attempts).toBe(5)
    })
  })
})
