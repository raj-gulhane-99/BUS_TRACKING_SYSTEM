import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/admin',           icon: 'dashboard',   label: 'Dashboard',     end: true },
  { to: '/admin/students',  icon: 'people',      label: 'Students' },
  { to: '/admin/drivers',   icon: 'drive_eta',   label: 'Drivers' },
  { to: '/admin/assign-bus',icon: 'assignment',  label: 'Assign Buses' },
  { to: '/admin/tracking',  icon: 'location_on', label: 'Live Tracking' },
  { to: '/admin/settings',  icon: 'settings',    label: 'Settings' },
]

export default function AdminSidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex flex-col h-full bg-dark-900 border-r border-dark-800 overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-800 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shrink-0">
          <span className="material-icons text-white text-lg">directions_bus</span>
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="overflow-hidden"
          >
            <p className="text-white font-bold text-base leading-none">BusTrack</p>
            <p className="text-primary-400 text-xs">Admin Panel</p>
          </motion.div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-slate-500 hover:text-white transition-colors"
        >
          <span className="material-icons text-lg">
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="material-icons text-xl shrink-0">{item.icon}</span>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="truncate"
              >
                {item.label}
              </motion.span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className="px-2 pb-4 space-y-1 border-t border-dark-800 pt-4 shrink-0">
        {!collapsed && (
          <div className="px-4 py-2 mb-2">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <span className="material-icons text-xl shrink-0">logout</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </motion.aside>
  )
}
