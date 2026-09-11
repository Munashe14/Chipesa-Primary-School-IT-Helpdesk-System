import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Users,
  ArrowUpRight
} from 'lucide-react'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value || 0}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.roleName === 'Staff User' && (
          <>
            <StatCard 
              title="Total Tickets" 
              value={stats?.total_tickets} 
              icon={Ticket} 
              color="bg-primary-600" 
            />
            <StatCard 
              title="Pending" 
              value={stats?.pending_tickets} 
              icon={Clock} 
              color="bg-yellow-500" 
            />
            <StatCard 
              title="In Progress" 
              value={stats?.in_progress_tickets} 
              icon={AlertCircle} 
              color="bg-blue-500" 
            />
            <StatCard 
              title="Resolved" 
              value={stats?.resolved_tickets} 
              icon={CheckCircle} 
              color="bg-green-500" 
            />
          </>
        )}

        {user?.roleName === 'IT Technician' && (
          <>
            <StatCard 
              title="Assigned Tickets" 
              value={stats?.total_assigned} 
              icon={Ticket} 
              color="bg-primary-600" 
            />
            <StatCard 
              title="Pending" 
              value={stats?.pending_tickets} 
              icon={Clock} 
              color="bg-yellow-500" 
            />
            <StatCard 
              title="In Progress" 
              value={stats?.in_progress_tickets} 
              icon={AlertCircle} 
              color="bg-blue-500" 
            />
            <StatCard 
              title="Resolved" 
              value={stats?.resolved_tickets} 
              icon={CheckCircle} 
              color="bg-green-500" 
            />
          </>
        )}

        {(user?.roleName === 'Administrator' || user?.roleName === 'School Management') && (
          <>
            <StatCard 
              title="Total Users" 
              value={stats?.totalUsers} 
              icon={Users} 
              color="bg-primary-600" 
            />
            <StatCard 
              title="Total Tickets" 
              value={stats?.total_tickets} 
              icon={Ticket} 
              color="bg-blue-500" 
            />
            <StatCard 
              title="Open Tickets" 
              value={stats?.pending_tickets + stats?.in_progress_tickets} 
              icon={AlertCircle} 
              color="bg-yellow-500" 
            />
            <StatCard 
              title="Closed Tickets" 
              value={stats?.closed_tickets} 
              icon={CheckCircle} 
              color="bg-green-500" 
            />
          </>
        )}
      </div>

      {/* Recent Tickets */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
          <Link 
            to="/tickets" 
            className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View All <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {stats?.recentTickets && stats.recentTickets.length > 0 ? (
          <div className="space-y-4">
            {stats.recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-primary-600">{ticket.ticket_number}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900">{ticket.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{ticket.category_name}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-gray-500">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                    <span 
                      className="inline-block w-3 h-3 rounded-full mt-2"
                      style={{ backgroundColor: ticket.priority_color }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No tickets found
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {user?.roleName === 'Staff User' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <Link
            to="/tickets/create"
            className="inline-flex items-center gap-2 btn btn-primary"
          >
            <Ticket className="w-4 h-4" />
            Create New Ticket
          </Link>
        </div>
      )}
    </div>
  )
}

export default Dashboard
