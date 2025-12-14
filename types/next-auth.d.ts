import NextAuth, { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    merchantId: string
    email: string
    tier: string
    businessName: string
    displayName: string
  }

  interface Session {
    user: {
      id: string
      merchantId: string
      email: string
      tier: string
      businessName: string
      displayName: string
    } & DefaultSession["user"]
  }

  interface JWT {
    merchantId: string
    tier: string
    businessName: string
    displayName: string
  }
}
