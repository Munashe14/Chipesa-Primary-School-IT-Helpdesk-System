import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, Globe2, Server, WifiOff } from 'lucide-react'

const NETWORK_TESTS = [
  {
    id: 'api',
    label: 'Application API',
    url: '/api/health'
  },
  {
    id: 'public',
    label: 'Public Internet',
    url: 'https://1.1.1.1'
  }
]

const getStatusTone = (status) => {
  switch (status) {
    case 'Reachable':
      return 'text-green-700 bg-green-50 border-green-200'
    case 'Slow':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200'
    default:
      return 'text-red-700 bg-red-50 border-red-200'
  }
}

const NetworkAnalyzer = () => {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const runChecks = async () => {
    setLoading(true)
    setError('')

    try {
      const checks = await Promise.all(
        NETWORK_TESTS.map(async (test) => {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 7000)

          const startedAt = performance.now()

          try {
            const response = await fetch(test.url, {
              method: 'GET',
              mode: test.url.startsWith('http') ? 'no-cors' : 'same-origin',
              signal: controller.signal
            })

            const elapsed = Math.round(performance.now() - startedAt)
            const status = elapsed > 2000 ? 'Slow' : 'Reachable'
            return {
              ...test,
              status,
              latency: `${elapsed}ms`,
              detail: response.ok || response.type === 'opaque' ? 'Connection succeeded' : `HTTP ${response.status}`
            }
          } catch (err) {
            return {
              ...test,
              status: 'Failed',
              latency: '—',
              detail: err.name === 'AbortError' ? 'Timed out after 7 seconds' : err.message
            }
          } finally {
            clearTimeout(timeout)
          }
        })
      )

      setResults(checks)
    } catch (err) {
      setError(err.message || 'Unable to run diagnostics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runChecks()
  }, [])

  const summary = useMemo(() => {
    const online = navigator.onLine
    const reachableCount = results.filter((item) => item.status === 'Reachable').length
    const failedCount = results.filter((item) => item.status === 'Failed').length

    if (!online) {
      return 'The browser reports that the device is offline. Check the local Wi-Fi or wired connection first.'
    }

    if (failedCount > 0) {
      return 'At least one connectivity check failed. Review firewall rules, DNS settings, or the service endpoint.'
    }

    if (reachableCount === results.length) {
      return 'All checks are healthy. The network path appears to be working normally.'
    }

    return 'Some checks are slow. Review bandwidth or upstream service performance.'
  }, [results])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Network Analyzer</h1>
          <p className="text-gray-600">Quick checks for day-to-day connectivity and service health</p>
        </div>
        <button
          onClick={runChecks}
          className="inline-flex items-center gap-2 btn btn-primary"
        >
          <Activity className="w-4 h-4" />
          Run checks
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Globe2 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Browser status</p>
              <p className="text-xl font-semibold text-gray-900">{navigator.onLine ? 'Online' : 'Offline'}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Healthy checks</p>
              <p className="text-xl font-semibold text-gray-900">{results.filter((item) => item.status === 'Reachable').length}/{results.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Server className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Suggested action</p>
              <p className="text-sm font-medium text-gray-900">{summary}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="card border border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="card space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((item) => (
              <div key={item.id} className={`rounded-lg border p-4 ${getStatusTone(item.status)}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-sm opacity-80">{item.detail}</p>
                  </div>
                  <div className="text-sm font-medium">
                    <span className="mr-2">{item.status}</span>
                    <span className="text-gray-600">{item.latency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <WifiOff className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Troubleshooting tips</h2>
        </div>
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
          <li>If the browser is offline, reconnect to the local network or VPN.</li>
          <li>If the API check fails, confirm the server is running and the app URL is reachable.</li>
          <li>If public internet fails but the API works, inspect proxy, firewall, or DNS settings.</li>
          <li>Record the failing test result and timestamp so helpdesk tickets are easier to resolve.</li>
        </ul>
      </div>
    </div>
  )
}

export default NetworkAnalyzer
