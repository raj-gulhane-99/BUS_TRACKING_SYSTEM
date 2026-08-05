import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Pages
import Login from './pages/Auth/Login'
import AdminLayout  from './pages/Admin/AdminLayout'
import Dashboard    from './pages/Admin/Dashboard'
import Students     from './pages/Admin/Students'
import Drivers      from './pages/Admin/Drivers'
import AssignBus    from './pages/Admin/AssignBus'
import LiveTracking from './pages/Admin/LiveTracking'
import AdminSettings from './pages/Admin/Settings'

import DriverLayout    from './pages/Driver/DriverLayout'
import DriverDashboard from './pages/Driver/DriverDashboard'
import DriverSettings  from './pages/Driver/Settings'

import StudentLayout    from './pages/Student/StudentLayout'
import StudentDashboard from './pages/Student/StudentDashboard'
import StudentSettings  from './pages/Student/Settings'

import ProtectedRoute from './routes/ProtectedRoute'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 to-dark-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Loading BusTrack...</p>
        </div>
      </div>
    )
  }

  // Default redirect based on role
  const getRoleHome = () => {
    if (!user) return '/login'
    if (user.role === 'admin')   return '/admin'
    if (user.role === 'driver')  return '/driver'
    if (user.role === 'student') return '/student'
    return '/login'
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to={getRoleHome()} replace />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index             element={<Dashboard />} />
        <Route path="students"   element={<Students />} />
        <Route path="drivers"    element={<Drivers />} />
        <Route path="assign-bus" element={<AssignBus />} />
        <Route path="tracking"   element={<LiveTracking />} />
        <Route path="settings"   element={<AdminSettings />} />
      </Route>

      {/* Driver */}
      <Route path="/driver" element={<ProtectedRoute role="driver"><DriverLayout /></ProtectedRoute>}>
        <Route index           element={<DriverDashboard />} />
        <Route path="settings" element={<DriverSettings />} />
      </Route>

      {/* Student */}
      <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
        <Route index           element={<StudentDashboard />} />
        <Route path="settings" element={<StudentSettings />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={getRoleHome()} replace />} />
    </Routes>
  )
}
