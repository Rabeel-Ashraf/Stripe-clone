#!/usr/bin/env ts-node
/*
  API Key Management CLI Tool
  
  Command-line utility for managing API keys:
  - generate: Create new API key for merchant
  - list-all: List all API keys (with filtering)
  - revoke: Deactivate an API key
  - rotate: Rotate secret key for security
*/

import { prisma } from "../lib/prisma"
import { createApiKey, rotateApiKey, revokeApiKey } from "../lib/api-key"
import bcrypt from "bcryptjs"
import { Command } from "commander"

const program = new Command()

interface CliOptions {
  merchantEmail?: string
  keyId?: string
  action: "generate" | "list-all" | "revoke" | "rotate"
  name?: string
  reason?: string
}

// Set up CLI options
program
  .name("manage-api-keys")
  .description("Manage API keys for merchants")
  .version("1.0.0")

program
  .command("generate")
  .description("Generate a new API key for a merchant")
  .requiredOption("--merchant-email <email>", "Merchant email address")
  .option("--name <name>", "API key name", "CLI Generated Key")
  .action(async (options) => {
    await handleGenerate(options.merchantEmail, options.name)
  })

program
  .command("list-all")
  .description("List all API keys (optionally filtered by merchant)")
  .option("--merchant-email <email>", "Filter by merchant email")
  .action(async (options) => {
    await handleListAll(options.merchantEmail)
  })

program
  .command("revoke")
  .description("Revoke/deactivate an API key")
  .requiredOption("--key-id <id>", "API key ID to revoke")
  .action(async (options) => {
    await handleRevoke(options.keyId)
  })

program
  .command("rotate")
  .description("Rotate secret key for an API key")
  .requiredOption("--key-id <id>", "API key ID to rotate")
  .option("--reason <reason>", "Rotation reason", "user_initiated")
  .action(async (options) => {
    await handleRotate(options.keyId, options.reason)
  })

// Parse command line arguments
program.parse(process.argv)

async function handleGenerate(merchantEmail: string, name: string) {
  try {
    console.log(`🔍 Looking up merchant: ${merchantEmail}`)
    
    const merchant = await prisma.merchant.findUnique({
      where: { email: merchantEmail.toLowerCase() },
    })

    if (!merchant) {
      console.error(`❌ Merchant not found: ${merchantEmail}`)
      process.exit(1)
    }

    console.log(`✅ Found merchant: ${merchant.businessName} (${merchant.id})`)
    
    const result = await createApiKey(merchant.id, name, {})
    
    console.log(`\n🎉 API Key generated successfully!`)
    console.log(`📝 Name: ${name}`)
    console.log(`🔑 Publishable Key: ${result.publishableKey}`)
    console.log(`🔒 Secret Key: ${result.secretKey}`)
    console.log(`⚠️  IMPORTANT: Store the secret key securely. It will not be shown again!`)
    console.log(`🆔 API Key ID: ${result.apiKey.id}`)
    
    // Log the creation
    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        action: "api_key_created",
        resource: "api_key",
        resourceId: result.apiKey.id,
        status: "success",
        requestId: `cli-${Date.now()}`,
        details: {
          name,
          createdVia: "cli",
          keyId: result.apiKey.id,
        },
      },
    })
    
  } catch (error) {
    console.error(`❌ Error generating API key:`, error)
    process.exit(1)
  }
}

async function handleListAll(merchantEmail?: string) {
  try {
    let whereClause: any = {}
    
    if (merchantEmail) {
      const merchant = await prisma.merchant.findUnique({
        where: { email: merchantEmail.toLowerCase() },
      })
      
      if (!merchant) {
        console.error(`❌ Merchant not found: ${merchantEmail}`)
        process.exit(1)
      }
      
      whereClause.merchantId = merchant.id
      console.log(`🔍 Listing API keys for: ${merchant.businessName} (${merchant.email})`)
    } else {
      console.log(`📋 Listing all API keys`)
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: whereClause,
      include: {
        merchant: {
          select: {
            businessName: true,
            email: true,
          },
        },
        _count: {
          select: {
            rotations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    if (apiKeys.length === 0) {
      console.log(`📭 No API keys found`)
      return
    }

    console.log(`\n📊 API Keys (${apiKeys.length} total):`)
    console.log(`─`.repeat(80))
    
    apiKeys.forEach((key, index) => {
      console.log(`${index + 1}. ${key.name}`)
      console.log(`   🏢 Merchant: ${key.merchant.businessName} (${key.merchant.email})`)
      console.log(`   🔑 Publishable: ${key.publishableKey.slice(0, 20)}...${key.publishableKey.slice(-8)}`)
      console.log(`   🔒 Prefix: ...${key.secretKeyPrefix}`)
      console.log(`   📅 Created: ${new Date(key.createdAt).toISOString()}`)
      console.log(`   🕐 Last Used: ${key.lastUsedAt ? new Date(key.lastUsedAt).toISOString() : 'Never'}`)
      console.log(`   📊 Status: ${key.isActive ? 'Active' : 'Inactive'}`)
      console.log(`   🔄 Rotations: ${key._count.rotations}`)
      console.log(`   🆔 ID: ${key.id}`)
      console.log(`─`.repeat(80))
    })

  } catch (error) {
    console.error(`❌ Error listing API keys:`, error)
    process.exit(1)
  }
}

async function handleRevoke(keyId: string) {
  try {
    console.log(`🔍 Looking up API key: ${keyId}`)
    
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      include: {
        merchant: {
          select: {
            businessName: true,
            email: true,
          },
        },
      },
    })

    if (!apiKey) {
      console.error(`❌ API key not found: ${keyId}`)
      process.exit(1)
    }

    if (!apiKey.isActive) {
      console.log(`⚠️  API key is already inactive`)
      return
    }

    console.log(`📝 API Key Details:`)
    console.log(`   Name: ${apiKey.name}`)
    console.log(`   Merchant: ${apiKey.merchant.businessName} (${apiKey.merchant.email})`)
    console.log(`   Publishable: ${apiKey.publishableKey.slice(0, 20)}...${apiKey.publishableKey.slice(-8)}`)

    // Confirm revocation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const answer = await new Promise<string>((resolve) => {
      readline.question(`\n⚠️  Are you sure you want to revoke this API key? (yes/no): `, resolve)
    })

    readline.close()

    if (answer.toLowerCase() !== 'yes') {
      console.log(`❌ Operation cancelled`)
      process.exit(0)
    }

    await revokeApiKey(keyId)
    
    console.log(`✅ API key revoked successfully`)

    // Log the revocation
    await prisma.auditLog.create({
      data: {
        merchantId: apiKey.merchantId,
        action: "api_key_revoked",
        resource: "api_key",
        resourceId: keyId,
        status: "success",
        requestId: `cli-${Date.now()}`,
        details: {
          name: apiKey.name,
          revokedVia: "cli",
          keyId,
        },
      },
    })
    
  } catch (error) {
    console.error(`❌ Error revoking API key:`, error)
    process.exit(1)
  }
}

async function handleRotate(keyId: string, reason: string) {
  try {
    console.log(`🔍 Looking up API key: ${keyId}`)
    
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      include: {
        merchant: {
          select: {
            businessName: true,
            email: true,
          },
        },
      },
    })

    if (!apiKey) {
      console.error(`❌ API key not found: ${keyId}`)
      process.exit(1)
    }

    if (!apiKey.isActive) {
      console.error(`❌ Cannot rotate inactive API key`)
      process.exit(1)
    }

    console.log(`📝 API Key Details:`)
    console.log(`   Name: ${apiKey.name}`)
    console.log(`   Merchant: ${apiKey.merchant.businessName} (${apiKey.merchant.email})`)
    console.log(`   Current Secret Prefix: ...${apiKey.secretKeyPrefix}`)
    console.log(`   Reason: ${reason}`)

    // Confirm rotation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const answer = await new Promise<string>((resolve) => {
      readline.question(`\n⚠️  This will invalidate the current secret key. Continue? (yes/no): `, resolve)
    })

    readline.close()

    if (answer.toLowerCase() !== 'yes') {
      console.log(`❌ Operation cancelled`)
      process.exit(0)
    }

    const result = await rotateApiKey(keyId, reason)
    
    console.log(`\n🎉 API key rotated successfully!`)
    console.log(`🔑 New Publishable Key: ${result.publishableKey}`)
    console.log(`🔒 New Secret Key: ${result.secretKey}`)
    console.log(`⚠️  IMPORTANT: Store the new secret key securely. Update your applications immediately!`)
    console.log(`🔄 Rotations completed: ${apiKey.merchantId}`)

    // Log the rotation
    await prisma.auditLog.create({
      data: {
        merchantId: apiKey.merchantId,
        action: "api_key_rotated",
        resource: "api_key",
        resourceId: keyId,
        status: "success",
        requestId: `cli-${Date.now()}`,
        details: {
          name: apiKey.name,
          reason,
          rotatedVia: "cli",
          keyId,
        },
      },
    })
    
  } catch (error) {
    console.error(`❌ Error rotating API key:`, error)
    process.exit(1)
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error)
  process.exit(1)
})
