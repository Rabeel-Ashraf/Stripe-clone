"use client"

import { useState } from "react"
import { Modal } from "@/components/Modal"

type TabType = "api-keys" | "webhooks" | "account" | "payouts" | "billing"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("api-keys")
  const [apiKeyModal, setApiKeyModal] = useState(false)
  const [webhookModal, setWebhookModal] = useState(false)
  const [passwordModal, setPasswordModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const tabs: { value: TabType; label: string }[] = [
    { value: "api-keys", label: "API Keys" },
    { value: "webhooks", label: "Webhooks" },
    { value: "account", label: "Account Settings" },
    { value: "payouts", label: "Payout Settings" },
    { value: "billing", label: "Billing & Plan" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-1 py-4 border-b-2 font-medium ${
                activeTab === tab.value
                  ? "border-[#635BFF] text-[#635BFF]"
                  : "border-transparent text-gray-700 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* API Keys Tab */}
      {activeTab === "api-keys" && (
        <APIKeysTab
          onCreateClick={() => setApiKeyModal(true)}
        />
      )}

      {/* Webhooks Tab */}
      {activeTab === "webhooks" && (
        <WebhooksTab
          onCreateClick={() => setWebhookModal(true)}
        />
      )}

      {/* Account Settings Tab */}
      {activeTab === "account" && (
        <AccountSettingsTab
          onPasswordClick={() => setPasswordModal(true)}
        />
      )}

      {/* Payouts Tab */}
      {activeTab === "payouts" && <PayoutsTab />}

      {/* Billing Tab */}
      {activeTab === "billing" && <BillingTab />}

      {/* Modals */}
      <Modal
        isOpen={apiKeyModal}
        title="Create API Key"
        onClose={() => setApiKeyModal(false)}
        submitLabel="Create"
        isLoading={isSubmitting}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Key Name
          </label>
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="e.g., My Integration"
            className="input-base"
          />
        </div>
      </Modal>

      <Modal
        isOpen={webhookModal}
        title="Create Webhook"
        onClose={() => setWebhookModal(false)}
        submitLabel="Create"
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              placeholder="https://your-domain.com/webhooks"
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Events
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm">payment.succeeded</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">payment.failed</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">charge.refunded</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={passwordModal}
        title="Change Password"
        onClose={() => setPasswordModal(false)}
        submitLabel="Update"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input type="password" className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input type="password" className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input type="password" className="input-base" />
          </div>
        </div>
      </Modal>
    </div>
  )
}

function APIKeysTab({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
        <button onClick={onCreateClick} className="btn-primary">
          Create New Key
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Type
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Key
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Last Used
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900">My Integration</td>
              <td className="px-6 py-4 text-sm text-gray-600">Publishable</td>
              <td className="px-6 py-4 text-sm font-mono text-gray-600">
                pk_live_abcd1234...
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">Today</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </td>
              <td className="px-6 py-4 text-sm space-x-2">
                <button className="text-[#635BFF] hover:underline">Copy</button>
                <button className="text-[#FA5252] hover:underline">Revoke</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function WebhooksTab({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Webhook Endpoints</h2>
        <button onClick={onCreateClick} className="btn-primary">
          Create Webhook
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                URL
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Events
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Last Triggered
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900">
                https://example.com/webhooks
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                payment.succeeded, charge.refunded
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">5 minutes ago</td>
              <td className="px-6 py-4 text-sm space-x-2">
                <button className="text-[#635BFF] hover:underline">Edit</button>
                <button className="text-[#FA5252] hover:underline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AccountSettingsTab({ onPasswordClick }: { onPasswordClick: () => void }) {
  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Business Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                defaultValue="Acme Inc."
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                defaultValue="Acme"
                className="input-base"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Email</h3>
          <div className="flex items-center gap-3">
            <input
              type="email"
              defaultValue="admin@acme.com"
              className="input-base"
            />
            <button className="btn-secondary whitespace-nowrap">Change Email</button>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Password</h3>
          <button onClick={onPasswordClick} className="btn-secondary">
            Change Password
          </button>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Two-Factor Authentication
          </h3>
          <button className="btn-secondary">Enable TOTP</button>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sessions</h3>
          <button className="btn-secondary">Logout All Devices</button>
        </div>

        <div className="border-t border-gray-200 pt-6 bg-red-50 p-4 rounded">
          <h3 className="text-lg font-semibold text-[#FA5252] mb-2">
            Danger Zone
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Permanently delete your account. This action cannot be undone.
          </p>
          <button className="btn-danger">Delete Account</button>
        </div>
      </div>
    </div>
  )
}

function PayoutsTab() {
  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Bank Account
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                defaultValue="****3456"
                disabled
                className="input-base opacity-75 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Routing Number
              </label>
              <input
                type="text"
                defaultValue="****1234"
                disabled
                className="input-base opacity-75 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Holder
              </label>
              <input
                type="text"
                defaultValue="Acme Inc."
                className="input-base"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Payout Schedule
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select className="input-base">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Payout Amount
              </label>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-900 mr-2">$</span>
                <input
                  type="number"
                  defaultValue="100"
                  className="input-base"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Last Payout
          </h3>
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm font-semibold text-gray-900">
              December 14, 2024 • $2,450.00 • Completed
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function BillingTab() {
  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Plan
          </h3>
          <div className="p-4 bg-[#635BFF]/10 rounded border border-[#635BFF]">
            <p className="text-xl font-bold text-[#635BFF]">Pro Plan</p>
            <p className="text-sm text-gray-600 mt-1">$99/month</p>
            <a
              href="#"
              className="text-sm text-[#635BFF] hover:underline mt-3 block"
            >
              Upgrade to Enterprise →
            </a>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Plan Features
          </h3>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Feature
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Included
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    Transaction Limit
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-[#31A24C]">✓ Unlimited</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    API Requests
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-[#31A24C]">✓ Unlimited</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    Webhooks
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-[#31A24C]">✓ Unlimited</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Billing History
          </h3>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    Dec 14, 2024
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">$99.00</td>
                  <td className="px-6 py-4 text-sm text-gray-600">INV-2024-12</td>
                  <td className="px-6 py-4 text-sm">
                    <a href="#" className="text-[#635BFF] hover:underline">
                      Download
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
