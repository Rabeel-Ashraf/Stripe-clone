import { requireAdminRole } from "@/lib/admin"

export default async function HealthPage() {
  await requireAdminRole()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Health</h1>
        <p className="text-gray-400">Monitor system components and performance</p>
      </div>

      {/* Service Status */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <h3 className="text-white font-semibold mb-6">Service Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              name: "Database",
              status: "Connected",
              metric: "Latency: 12ms",
              isHealthy: true,
            },
            {
              name: "Redis Cache",
              status: "Connected",
              metric: "Latency: 3ms",
              isHealthy: true,
            },
            {
              name: "Message Queue",
              status: "Running",
              metric: "24 jobs pending",
              isHealthy: true,
            },
            {
              name: "Email Service",
              status: "Operational",
              metric: "1,245 sent today",
              isHealthy: true,
            },
          ].map((service) => (
            <div key={service.name} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${service.isHealthy ? "bg-green-500" : "bg-red-500"}`} />
                <p className="text-white font-medium">{service.name}</p>
              </div>
              <p className="text-gray-400 text-sm">{service.status}</p>
              <p className="text-gray-500 text-xs mt-2">{service.metric}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Server Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-white font-semibold mb-6">Resource Usage</h3>
          <div className="space-y-6">
            {[
              { label: "CPU Usage", value: 34, max: 100, unit: "%" },
              { label: "Memory", value: 62, max: 100, unit: "%" },
              { label: "Disk", value: 45, max: 100, unit: "%" },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300 font-medium">{metric.label}</span>
                  <span className="text-white font-bold">
                    {metric.value}{metric.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      metric.value > 80
                        ? "bg-red-500"
                        : metric.value > 50
                        ? "bg-amber-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-white font-semibold mb-6">Request Metrics</h3>
          <div className="space-y-4">
            {[
              { label: "Requests (24h)", value: "234,567", color: "bg-blue-500" },
              { label: "Avg Response Time", value: "145ms", color: "bg-green-500" },
              { label: "P95 Latency", value: "342ms", color: "bg-amber-500" },
              { label: "P99 Latency", value: "487ms", color: "bg-orange-500" },
            ].map((metric) => (
              <div
                key={metric.label}
                className="flex justify-between items-center p-3 bg-gray-800 rounded-lg"
              >
                <span className="text-gray-300">{metric.label}</span>
                <span className="text-white font-bold">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Uptime History */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <h3 className="text-white font-semibold mb-6">Uptime History</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Current Uptime</span>
            <span className="text-green-400 font-bold">99.98%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Last 30 Days</span>
            <span className="text-green-400 font-bold">99.95%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Last Incident</span>
            <span className="text-gray-400">2 hours ago - 5 min duration</span>
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <h3 className="text-white font-semibold mb-6">Recent Logs</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-sm">
          {[
            { level: "info", time: "14:23:45", message: "Payment processed successfully" },
            { level: "info", time: "14:23:42", message: "Webhook delivered to merchant" },
            { level: "warn", time: "14:23:38", message: "High fraud score detected: 72" },
            { level: "info", time: "14:23:35", message: "New merchant registered" },
            { level: "error", time: "14:23:30", message: "Failed to send email: timeout" },
          ].map((log, i) => (
            <div key={i} className="text-gray-400">
              <span className={`${
                log.level === "error"
                  ? "text-red-400"
                  : log.level === "warn"
                  ? "text-amber-400"
                  : "text-green-400"
              }`}>
                [{log.level.toUpperCase()}]
              </span>{" "}
              <span className="text-gray-500">{log.time}</span> {log.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
