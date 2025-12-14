/*
  Database Seeding Script
  
  Creates 3 test merchants with different tiers:
  1. demo@stripe-clone.test (Starter) - Demo1234!
  2. pro@stripe-clone.test (Pro) - ProDemo1234!
  3. enterprise@stripe-clone.test (Enterprise) - EntDemo1234!
  
  Each merchant gets API keys, webhook endpoints, and settings.
*/

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { generateApiKeys } from "../lib/api-key"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seeding...")

  // Clear existing data in reverse order of dependencies
  await prisma.apiKeyRotation.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.webhookEndpoint.deleteMany()
  await prisma.apiKey.deleteMany()
  await prisma.merchantSettings.deleteMany()
  await prisma.merchant.deleteMany()

  console.log("🧹 Cleared existing data")

  // Define test merchants
  const merchants = [
    {
      email: "demo@stripe-clone.test",
      password: "Demo1234!",
      businessName: "Acme Corporation",
      displayName: "Acme Demo",
      website: "https://acme-demo.example.com",
      country: "US",
      timezone: "America/New_York",
      tier: "starter" as const,
      status: "active" as const,
    },
    {
      email: "pro@stripe-clone.test",
      password: "ProDemo1234!",
      businessName: "TechFlow Labs",
      displayName: "TechFlow Pro",
      website: "https://techflow.example.com",
      country: "CA",
      timezone: "America/Los_Angeles",
      tier: "pro" as const,
      status: "active" as const,
    },
    {
      email: "enterprise@stripe-clone.test",
      password: "EntDemo1234!",
      businessName: "Global Fintech Inc",
      displayName: "Global Fintech",
      website: "https://globalfintech.example.com",
      country: "GB",
      timezone: "Europe/London",
      tier: "enterprise" as const,
      status: "active" as const,
    },
  ]

  // Create merchants with their related data
  for (const merchantData of merchants) {
    console.log(`👤 Creating merchant: ${merchantData.businessName}`)
    
    // Hash password
    const passwordHash = await bcrypt.hash(merchantData.password, 12)

    // Create merchant and related data in transaction
    const merchant = await prisma.$transaction(async (tx) => {
      // Create merchant
      const newMerchant = await tx.merchant.create({
        data: {
          email: merchantData.email,
          passwordHash,
          businessName: merchantData.businessName,
          displayName: merchantData.displayName,
          website: merchantData.website,
          country: merchantData.country,
          timezone: merchantData.timezone,
          tier: merchantData.tier,
          status: merchantData.status,
        },
      })

      // Create default settings
      const settings = await tx.merchantSettings.create({
        data: {
          merchantId: newMerchant.id,
          notifyOnPayment: merchantData.tier !== "starter",
          notifyOnRefund: true,
          payoutSchedule: merchantData.tier === "enterprise" ? "daily" : "weekly",
          webhookRetryCount: merchantData.tier === "enterprise" ? 5 : 3,
        },
      })

      // Generate API keys
      const productionKey = generateApiKeys()
      const secretKeyHash = await bcrypt.hash(productionKey.secretKey, 12)
      
      await tx.apiKey.create({
        data: {
          merchantId: newMerchant.id,
          publishableKey: productionKey.publishableKey,
          secretKeyHash,
          secretKeyPrefix: productionKey.secretKey.slice(-4),
          name: "Production Key",
        },
      })

      // Generate test key
      const testKey = generateApiKeys()
      const testSecretKeyHash = await bcrypt.hash(testKey.secretKey, 12)
      
      await tx.apiKey.create({
        data: {
          merchantId: newMerchant.id,
          publishableKey: testKey.publishableKey,
          secretKeyHash: testSecretKeyHash,
          secretKeyPrefix: testKey.secretKey.slice(-4),
          name: "Test Key",
        },
      })

      // Create webhook endpoint
      await tx.webhookEndpoint.create({
        data: {
          merchantId: newMerchant.id,
          url: `https://webhooks.${merchantData.businessName.toLowerCase().replace(/\s+/g, "")}.example.com/webhook`,
          secret: `whsec_${merchantData.email.split('@')[0]}_secret_key_32_chars_long`,
          events: ["payment.succeeded", "payment.failed", "charge.refunded"],
        },
      })

      // Create initial audit log entry
      await tx.auditLog.create({
        data: {
          merchantId: newMerchant.id,
          action: "signup",
          resource: "merchant",
          resourceId: newMerchant.id,
          status: "success",
          ipAddress: "127.0.0.1",
          userAgent: "Seed Script",
          requestId: `seed-${Date.now()}`,
          details: {
            createdVia: "seed_script",
            tier: merchantData.tier,
          },
        },
      })

      return newMerchant
    })

    console.log(`✅ Created merchant: ${merchant.businessName} (${merchant.tier})`)
    console.log(`   🔑 API Keys: 2 created`)
    console.log(`   🔗 Webhooks: 1 created`)
    console.log(`   ⚙️  Settings: Created`)
    console.log(`   📝 Audit: Initial signup logged`)
    
    // Show the API keys (important for testing)
    const apiKeys = await prisma.apiKey.findMany({
      where: { merchantId: merchant.id },
    })
    
    console.log(`   🔍 API Key Details:`)
    for (const key of apiKeys) {
      console.log(`      - ${key.name}: ${key.publishableKey}`)
      console.log(`        Prefix: ...${key.secretKeyPrefix}`)
    }
  }

  console.log("\n🎉 Database seeding completed successfully!")
  console.log("\n📋 Test Accounts:")
  console.log("1. Starter Account:")
  console.log("   Email: demo@stripe-clone.test")
  console.log("   Password: Demo1234!")
  console.log("   Business: Acme Corporation")
  console.log("")
  console.log("2. Pro Account:")
  console.log("   Email: pro@stripe-clone.test")
  console.log("   Password: ProDemo1234!")
  console.log("   Business: TechFlow Labs")
  console.log("")
  console.log("3. Enterprise Account:")
  console.log("   Email: enterprise@stripe-clone.test")
  console.log("   Password: EntDemo1234!")
  console.log("   Business: Global Fintech Inc")
  console.log("")
  console.log("🔐 API Keys have been generated for each account")
  console.log("🔗 Webhook endpoints have been created")
  console.log("📊 Initial audit logs have been created")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
