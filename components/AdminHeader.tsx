"use client"

import { signOut } from "next-auth/react"
import type { Session } from "next-auth"

interface AdminHeaderProps {
  session: Session | null
}

export default function AdminHeader({ session }: AdminHeaderProps) {
  return (
    <div className="h-16 bg-gray-950 border-b border-gray-700 flex items-center justify-between px-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-400">Platform Overview & Management</p>
      </div>

      <div className="flex items-center gap-6">
        {session?.user && (
          <>
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {session.user.displayName}
              </p>
              <p className="text-xs text-gray-400">{session.user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </div>
  )
}
