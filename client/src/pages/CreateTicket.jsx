import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'

const CreateTicket = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    priorityId: ''
  })
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [priorities, setPriorities] = useState([])

  useEffect(() => {
    fetchOptions()
  }, [])

  const fetchOptions = async () => {
    try {
      const [categoriesRes, prioritiesRes] = await Promise.all([
        api.get('/categories'),
        api.get('/priorities')
      ])
      setCategories(categoriesRes.data)
      setPriorities(prioritiesRes.data)
    } catch (error) {
      console.error('Error fetching options:', error)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post('/tickets', formData)
      toast.success('Ticket created successfully')
      navigate('/tickets')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/tickets" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Ticket</h1>
          <p className="text-gray-600">Submit an IT support request</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="label">Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="input"
            placeholder="Brief description of the issue"
            required
            minLength={5}
          />
        </div>

        <div>
          <label className="label">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="input"
            rows={5}
            placeholder="Detailed description of the issue, including any error messages or steps to reproduce"
            required
            minLength={10}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Category *</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Priority *</label>
            <select
              name="priorityId"
              value={formData.priorityId}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Select priority</option>
              {priorities.map((prio) => (
                <option key={prio.id} value={prio.id}>{prio.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Attachments (Optional)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Drag and drop files here, or click to select
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Maximum file size: 5MB. Allowed types: Images, PDF, DOC
            </p>
            <input type="file" className="hidden" multiple />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Ticket'}
          </button>
          <Link
            to="/tickets"
            className="btn btn-secondary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

export default CreateTicket
