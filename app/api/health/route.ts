/*
  Health Check Endpoint
  
  GET /api/health
  Used for deployment health monitors and uptime checks
*/

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    const uptime = process.uptime()
    
    const healthData = {
      status: "ok" as const,
      uptime: Math.round(uptime * 1000), // Convert to milliseconds
      dbConnection: "ok" as const,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    }
    
    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  } catch (error) {
    console.error("Health check failed:", error)
    
    const healthData = {
      status: "error" as const,
      uptime: Math.round(process.uptime() * 1000),
      dbConnection: "error" as const,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      error: error instanceof Error ? error.message : "Unknown error",
    }
    
    return NextResponse.json(healthData, {
      status: 503, // Service Unavailable
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  }
}
