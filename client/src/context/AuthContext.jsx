import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

const normalizeRoleName = (roleName) => {
  const mapping = {
    'IT Chief Officer': 'Administrator',
    'IT Chief': 'Administrator',
    'Admin': 'Administrator',
    'Employee': 'Staff User',
    'Staff': 'Staff User'
  }
  return mapping[roleName] || roleName
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const getDisplayRoleName = (roleName) => {
    const mapping = {
      'Administrator': 'IT Chief Officer',
      'Staff User': 'Employee',
      'IT Technician': 'IT Technician',
      'School Management': 'School Management'
    }
    return mapping[roleName] || roleName
  }

  const normalizeUser = (userData) => {
    if (!userData) return null

    const rawRoleName = userData.roleName || userData.role_name
    const roleName = normalizeRoleName(rawRoleName)
    const displayRoleName = getDisplayRoleName(roleName)

    return {
      ...userData,
      id: userData.id,
      firstName: userData.firstName || userData.first_name,
      lastName: userData.lastName || userData.last_name,
      roleName,
      displayRoleName,
      roleId: userData.roleId || userData.role_id,
      email: userData.email,
      phone: userData.phone,
      department: userData.department,
      isActive: userData.isActive !== undefined ? userData.isActive : userData.is_active,
      createdAt: userData.createdAt || userData.created_at,
      lastLogin: userData.lastLogin || userData.last_login
    }
  }

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await api.get('/users/me')
        setUser(normalizeUser(response.data))
      } catch (error) {
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', response.data.token)
    setUser(normalizeUser(response.data.user))
    return response.data
  }

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData)
    localStorage.setItem('token', response.data.token)
    setUser(normalizeUser(response.data.user))
    return response.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
