/*
  Dashboard Page
  
  Protected route showing merchant overview
  API keys, settings, and audit logs
*/

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    return null // This will be handled by middleware
  }

  const { merchantId, tier, businessName } = session.user

  // Get merchant data with related information
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: {
      apiKeys: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      webhookEndpoints: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      merchantSettings: true,
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          action: true,
          resource: true,
          status: true,
          createdAt: true,
          details: true,
        },
      },
    },
  })

  if (!merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Account not found</h1>
          <p className="text-gray-600 mt-2">Unable to load your account information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {merchant.displayName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Quick Stats */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">API Keys</dt>
                        <dd className="text-lg font-medium text-gray-900">{merchant.apiKeys.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link href="/dashboard/api-keys" className="font-medium text-indigo-600 hover:text-indigo-500">
                      Manage API keys
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Webhooks</dt>
                        <dd className="text-lg font-medium text-gray-900">{merchant.webhookEndpoints.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link href="/dashboard/webhooks" className="font-medium text-indigo-600 hover:text-indigo-500">
                      Configure webhooks
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Audit Events</dt>
                        <dd className="text-lg font-medium text-gray-900">{merchant.auditLogs.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link href="/dashboard/audit" className="font-medium text-indigo-600 hover:text-indigo-500">
                      View all events
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* API Keys */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Recent API Keys</h3>
                  <Link
                    href="/dashboard/api-keys/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Create New Key
                  </Link>
                </div>
                <div className="space-y-3">
                  {merchant.apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{apiKey.name}</p>
                        <p className="text-sm text-gray-500">
                          {apiKey.publishableKey.slice(0, 20)}...{apiKey.publishableKey.slice(-8)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Created {new Date(apiKey.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          apiKey.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {apiKey.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {apiKey.lastUsedAt && (
                          <span className="text-xs text-gray-500">
                            Used {new Date(apiKey.lastUsedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {merchant.apiKeys.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No API keys found</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Account Settings</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Business Name</p>
                    <p className="text-sm text-gray-500">{merchant.businessName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-500">{merchant.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Timezone</p>
                    <p className="text-sm text-gray-500">{merchant.timezone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Plan</p>
                    <p className="text-sm text-gray-500 capitalize">{merchant.tier}</p>
                  </div>
                  <div className="pt-3">
                    <Link
                      href="/dashboard/settings"
                      className="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      Edit settings →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {merchant.auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {log.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {log.resource} {log.status}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        log.status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                  {merchant.auditLogs.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
