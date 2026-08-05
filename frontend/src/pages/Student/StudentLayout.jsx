import { Outlet, NavLink } from 'react-router-dom'
import TopNav from '../../components/Navbar/TopNav'

export default function StudentLayout() {
  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <TopNav title="My Bus Tracker" />
      <div className="flex-1 overflow-auto pb-16 md:pb-0">
        <Outlet />
      </div>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-800 flex md:hidden z-30">
        {[
          { to: '/student', icon: 'directions_bus', label: 'My Bus', end: true },
          { to: '/student/settings', icon: 'settings', label: 'Settings' },
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
