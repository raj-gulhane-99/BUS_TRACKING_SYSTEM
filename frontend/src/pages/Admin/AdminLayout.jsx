import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from '../../components/Sidebar/AdminSidebar'
import TopNav from '../../components/Navbar/TopNav'

const pageTitles = {
  '/admin':             'Dashboard',
  '/admin/students':    'Students Management',
  '/admin/drivers':     'Drivers Management',
  '/admin/assign-bus':  'Assign Buses',
  '/admin/tracking':    'Live Tracking',
  '/admin/settings':    'Settings',
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Admin Panel'

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav title={title} />
        <main className="flex-1 overflow-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
