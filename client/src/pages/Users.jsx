import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  UserPlus,
  ShieldOff,
  ShieldCheck,
  KeyRound
} from 'lucide-react'

const Users = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)
  const [resetPassword, setResetPassword] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    roleId: ''
  })

  useEffect(() => {
    if (user?.roleName === 'Administrator') {
      fetchUsers()
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/users', formData)
      toast.success('User created successfully')
      setShowModal(false)
      resetForm()
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user')
    }
  }

  const handleUpdate = async (e) => {
  e.preventDefault()
  const { password, ...updateData } = formData
  try {
    await api.put(`/users/${editingUser.id}`, updateData)
    toast.success('User updated successfully')
    setShowModal(false)
    resetForm()
    fetchUsers()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to update user')
  }
}

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      await api.delete(`/users/${userId}`)
      toast.success('User deleted successfully')
      fetchUsers()
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  const handleToggleStatus = async (userId, isActive) => {
    try {
      const endpoint = isActive ? 'disable' : 'enable'
      await api.put(`/users/${userId}/${endpoint}`)
      toast.success(`User ${isActive ? 'disabled' : 'enabled'} successfully`)
      fetchUsers()
    } catch (error) {
      toast.error('Failed to update user status')
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!resetPassword || resetPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      await api.post(`/users/${resetTarget.id}/reset-password`, { newPassword: resetPassword })
      toast.success(`Password reset for ${resetTarget.first_name} ${resetTarget.last_name}`)
      setShowResetModal(false)
      setResetTarget(null)
      setResetPassword('')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
    }
  }

  const openEditModal = (userData) => {
    setEditingUser(userData)
    setFormData({
      firstName: userData.first_name,
      lastName: userData.last_name,
      email: userData.email,
      password: '',
      phone: userData.phone || '',
      department: userData.department || '',
      roleId: userData.role_id
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      department: '',
      roleId: ''
    })
    setEditingUser(null)
  }

  const filteredUsers = users.filter(u => 
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (user?.roleName !== 'Administrator') {
    return (
      <div className="text-center py-12">
        <ShieldOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage system users and permissions</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="inline-flex items-center gap-2 btn btn-primary"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                        {u.first_name[0]}{u.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {u.first_name} {u.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{u.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full">
                      {u.role_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.department || '-'}</td>
                  <td className="px-6 py-4">
                    {u.is_active ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title={u.is_active ? 'Disable' : 'Enable'}
                      >
                        {u.is_active ? (
                          <ShieldOff className="w-4 h-4" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setResetTarget(u)
                          setResetPassword('')
                          setShowResetModal(true)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="Reset password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && resetTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Reset Password</h2>
              <p className="text-sm text-gray-600 mt-1">
                Set a new password for {resetTarget.first_name} {resetTarget.last_name}
              </p>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="input"
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="submit" className="flex-1 btn btn-primary">
                  Reset Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false)
                    setResetTarget(null)
                    setResetPassword('')
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
            </div>
            <form onSubmit={editingUser ? handleUpdate : handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input"
                  required
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="input"
                    required
                  />
                </div>
              )}
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select
                  name="roleId"
                  value={formData.roleId}
                  onChange={(e) => setFormData({...formData, roleId: e.target.value})}
                  className="input"
                  required
                >
                  <option value="">Select role</option>
                  <option value="1">Staff User</option>
                  <option value="2">IT Technician</option>
                  <option value="3">Administrator</option>
                  <option value="4">School Management</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 btn btn-primary">
                  {editingUser ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
