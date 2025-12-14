"use client"

import { useState } from "react"
import { requireAdminRole } from "@/lib/admin"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("platform")
  const [settings, setSettings] = useState({
    platformName: "Stripe Clone",
    supportEmail: "support@stripe-clone.test",
    timezone: "America/New_York",
    apiCallLimit: 1000,
    webhookRetries: 3,
    passwordMinLength: 8,
    sessionTimeout: 30,
  })

  const tabs = [
    { id: "platform", label: "Platform Settings" },
    { id: "tiers", label: "Merchant Tiers" },
    { id: "limits", label: "Rate Limiting" },
    { id: "email", label: "Email Configuration" },
    { id: "security", label: "Security" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Settings</h1>
        <p className="text-gray-400">Configure platform behavior and features</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 transition-colors font-medium ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "platform" && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">Platform Name</label>
            <input
              type="text"
              value={settings.platformName}
              onChange={(e) =>
                setSettings({ ...settings, platformName: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Support Email</label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) =>
                setSettings({ ...settings, supportEmail: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) =>
                setSettings({ ...settings, timezone: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option>America/New_York</option>
              <option>America/Los_Angeles</option>
              <option>Europe/London</option>
              <option>Europe/Paris</option>
              <option>Asia/Tokyo</option>
            </select>
          </div>
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Save Changes
          </button>
        </div>
      )}

      {activeTab === "tiers" && (
        <div className="space-y-6">
          {["Starter", "Pro", "Enterprise"].map((tier) => (
            <div key={tier} className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-4">{tier} Tier</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    API Calls/Month
                  </label>
                  <input
                    type="number"
                    defaultValue={tier === "Starter" ? 10000 : tier === "Pro" ? 100000 : 1000000}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Webhook Endpoints
                  </label>
                  <input
                    type="number"
                    defaultValue={tier === "Starter" ? 1 : tier === "Pro" ? 5 : -1}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
            </div>
          ))}
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Save Tier Changes
          </button>
        </div>
      )}

      {activeTab === "limits" && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">
              API Rate Limit (requests/minute)
            </label>
            <input
              type="number"
              value={settings.apiCallLimit}
              onChange={(e) =>
                setSettings({ ...settings, apiCallLimit: parseInt(e.target.value) })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">
              Webhook Max Retries
            </label>
            <input
              type="number"
              value={settings.webhookRetries}
              onChange={(e) =>
                setSettings({ ...settings, webhookRetries: parseInt(e.target.value) })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Save Rate Limits
          </button>
        </div>
      )}

      {activeTab === "email" && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="SMTP Host"
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
            />
            <input
              type="number"
              placeholder="SMTP Port"
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
            />
          </div>
          <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
            Test Email
          </button>
        </div>
      )}

      {activeTab === "security" && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">
              Password Minimum Length
            </label>
            <input
              type="number"
              value={settings.passwordMinLength}
              onChange={(e) =>
                setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) =>
                setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-white font-medium">Require 2FA for Admins</span>
            </label>
          </div>
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Save Security Settings
          </button>
        </div>
      )}
    </div>
  )
}
