import { Outlet, useLocation, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import TopNav from '../../components/Navbar/TopNav'

const pageTitles = {
  '/driver': 'Driver Dashboard',
  '/driver/settings': 'Settings',
}

export default function DriverLayout() {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Driver'

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <TopNav title={title} />
      {/* Mobile bottom nav */}
      <div className="flex-1 overflow-auto pb-16 md:pb-0">
        <Outlet />
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-800 flex md:hidden z-30">
        {[
          { to: '/driver', icon: 'map', label: 'Dashboard', end: true },
          { to: '/driver/settings', icon: 'settings', label: 'Settings' },
        ].map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${isActive ? 'text-primary-400' : 'text-slate-500'}`
            }>
            <span className="material-icons text-xl">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
