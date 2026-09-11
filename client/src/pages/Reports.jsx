import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { 
  Download, 
  FileText, 
  TrendingUp,
  Calendar,
  Filter
} from 'lucide-react'

const Reports = () => {
  const { user } = useAuth()
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    priority: '',
    status: ''
  })

  useEffect(() => {
    if (user?.roleName === 'Administrator' || user?.roleName === 'School Management') {
      fetchReportData()
    }
  }, [user, filters])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const params = { ...filters }
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key]
      })

      const response = await api.get('/reports/tickets', { params })
      setReportData(response.data)
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      const params = { ...filters }
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key]
      })

      const response = await api.get('/reports/export/pdf', { 
        params,
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'tickets-report.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting PDF:', error)
    }
  }

  const handleExportExcel = async () => {
    try {
      const params = { ...filters }
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key]
      })

      const response = await api.get('/reports/export/excel', { 
        params,
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'tickets-report.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting Excel:', error)
    }
  }

  if (user?.roleName !== 'Administrator' && user?.roleName !== 'School Management') {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">You don't have permission to access this page</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const stats = reportData?.stats || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and export ticket reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 btn btn-secondary"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 btn btn-secondary"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="input"
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="input"
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="input"
            >
              <option value="">All Categories</option>
              <option value="1">Computer Hardware</option>
              <option value="2">Printer</option>
              <option value="3">Network</option>
              <option value="4">Software</option>
              <option value="5">Internet</option>
              <option value="6">Projector</option>
              <option value="7">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              className="input"
            >
              <option value="">All Priorities</option>
              <option value="1">Low</option>
              <option value="2">Medium</option>
              <option value="3">High</option>
              <option value="4">Critical</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="input"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Resolution Time</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgResolutionTime || 0}h</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.byStatus?.Resolved || 0}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.byStatus?.Pending || 0) + (stats.byStatus?.['In Progress'] || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* By Status */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Tickets by Status</h3>
        <div className="space-y-3">
          {Object.entries(stats.byStatus || {}).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <span className="text-gray-700">{status}</span>
              <span className="font-medium text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* By Category */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Tickets by Category</h3>
        <div className="space-y-3">
          {Object.entries(stats.byCategory || {}).map(([category, count]) => (
            <div key={category} className="flex items-center justify-between">
              <span className="text-gray-700">{category}</span>
              <span className="font-medium text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* By Priority */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Tickets by Priority</h3>
        <div className="space-y-3">
          {Object.entries(stats.byPriority || {}).map(([priority, count]) => (
            <div key={priority} className="flex items-center justify-between">
              <span className="text-gray-700">{priority}</span>
              <span className="font-medium text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Reports
