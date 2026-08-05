import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a route so only authenticated users with the required role can access it.
 * Redirects unauthenticated users to /login, wrong-role users to their own dashboard.
 */
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) return <Navigate to="/login" replace />

  if (user.role !== role) {
    const home = { admin: '/admin', driver: '/driver', student: '/student' }[user.role] || '/login'
    return <Navigate to={home} replace />
  }

  return children
}
