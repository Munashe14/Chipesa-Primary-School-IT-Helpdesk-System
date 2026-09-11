import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  Clock, 
  User, 
  MessageSquare, 
  Paperclip,
  Edit,
  Save,
  X
} from 'lucide-react'

const TicketDetails = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [status, setStatus] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')

  useEffect(() => {
    fetchTicketDetails()
    fetchComments()
    fetchHistory()
  }, [id])

  const fetchTicketDetails = async () => {
    try {
      const response = await api.get(`/tickets/${id}`)
      setTicket(response.data)
      setStatus(response.data.status)
      setResolutionNotes(response.data.resolution_notes || '')
    } catch (error) {
      toast.error('Failed to load ticket details')
      navigate('/tickets')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await api.get(`/tickets/${id}/comments`)
      setComments(response.data)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await api.get(`/tickets/${id}/history`)
      setHistory(response.data)
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await api.post(`/tickets/${id}/comments`, {
        comment: newComment,
        isInternal: false
      })
      setNewComment('')
      toast.success('Comment added')
      fetchComments()
    } catch (error) {
      toast.error('Failed to add comment')
    }
  }

  const handleUpdateStatus = async () => {
    try {
      await api.put(`/tickets/${id}/status`, { status })
      toast.success('Status updated')
      setEditing(false)
      fetchTicketDetails()
      fetchHistory()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const StatusBadge = ({ status }) => {
    const styles = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Closed': 'bg-gray-100 text-gray-800',
      'Overdue': 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-3 py-1 text-sm rounded-full ${styles[status] || styles['Pending']}`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ticket not found</p>
        <Link to="/tickets" className="text-primary-600 hover:text-primary-700">
          Back to Tickets
        </Link>
      </div>
    )
  }

  const canEdit = user?.roleName === 'IT Technician' || user?.roleName === 'Administrator'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/tickets" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.ticket_number}</h1>
          <p className="text-gray-600">{ticket.title}</p>
        </div>
      </div>

      {/* Ticket Details */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{ticket.title}</h2>
            <p className="text-gray-600">{ticket.description}</p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="font-medium text-gray-900">{ticket.category_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Priority</p>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ticket.priority_color }}
              />
              <p className="font-medium text-gray-900">{ticket.priority_name}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Reporter</p>
            <p className="font-medium text-gray-900">
              {ticket.reporter_first_name} {ticket.reporter_last_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Assigned To</p>
            <p className="font-medium text-gray-900">
              {ticket.technician_first_name ? 
                `${ticket.technician_first_name} ${ticket.technician_last_name}` : 
                'Unassigned'
              }
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium text-gray-900">
              {new Date(ticket.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="font-medium text-gray-900">
              {new Date(ticket.updated_at).toLocaleString()}
            </p>
          </div>
          {ticket.resolved_at && (
            <div>
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="font-medium text-gray-900">
                {new Date(ticket.resolved_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Resolution Notes */}
        {ticket.resolution_notes && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium text-gray-900 mb-2">Resolution Notes</h3>
            <p className="text-gray-600">{ticket.resolution_notes}</p>
          </div>
        )}

        {/* Status Update (for technicians/admins) */}
        {canEdit && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Update Status</h3>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="label">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="label">Resolution Notes</label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="Add resolution notes..."
                  />
                </div>
                <button
                  onClick={handleUpdateStatus}
                  className="flex items-center gap-2 btn btn-primary"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <StatusBadge status={status} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments ({comments.length})
        </h2>

        <form onSubmit={handleAddComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="input mb-3"
            rows={3}
          />
          <button type="submit" className="btn btn-primary">
            Add Comment
          </button>
        </form>

        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {comment.first_name[0]}{comment.last_name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {comment.first_name} {comment.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {comment.is_internal && (
                    <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                      Internal
                    </span>
                  )}
                </div>
                <p className="text-gray-700">{comment.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No comments yet</p>
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          History
        </h2>

        <div className="space-y-3">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 bg-primary-600 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-gray-900">
                    <span className="font-medium">{item.first_name} {item.last_name}</span>
                    {' '}{item.action.toLowerCase()}
                    {item.field_changed && (
                      <span className="text-gray-600">
                        {' '}{item.field_changed}
                      </span>
                    )}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No history available</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TicketDetails
