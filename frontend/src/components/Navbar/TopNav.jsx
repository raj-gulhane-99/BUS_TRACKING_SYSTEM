import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { getNotifications, markAllRead } from '../../api/notifications'
import { useNavigate } from 'react-router-dom'

export default function TopNav({ title }) {
  const { user, logout } = useAuth()
  const { connected } = useSocket()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs]   = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifs, setNotifs]           = useState([])
  const [unread, setUnread]           = useState(0)
  const notifRef  = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifs = async () => {
    try {
      const res = await getNotifications()
      setNotifs(res.data.notifications || [])
      setUnread(res.data.unreadCount || 0)
    } catch {}
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleMarkAll = async () => {
    await markAllRead()
    setUnread(0)
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const settingsPath = `/${user?.role}/settings`

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 shrink-0 z-20">
      {/* Page Title */}
      <h1 className="text-lg font-bold text-slate-800 flex-1">{title}</h1>

      {/* Connection Indicator */}
      <div className="flex items-center gap-1.5 text-xs font-medium">
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
        <span className={connected ? 'text-green-600' : 'text-slate-400'}>
          {connected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          id="notif-btn"
          onClick={() => setShowNotifs(!showNotifs)}
          className="relative w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <span className="material-icons text-slate-600 text-lg">notifications</span>
          {unread > 0 && (
            <span className="notif-dot">{unread > 9 ? '9+' : unread}</span>
          )}
        </button>

        <AnimatePresence>
          {showNotifs && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="font-semibold text-slate-800">Notifications</span>
                {unread > 0 && (
                  <button onClick={handleMarkAll} className="text-xs text-primary-600 hover:underline font-medium">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">No notifications</div>
                ) : (
                  notifs.slice(0, 10).map(n => (
                    <div
                      key={n._id}
                      className={`px-4 py-3 border-b border-slate-50 last:border-0 ${!n.isRead ? 'bg-blue-50' : ''}`}
                    >
                      <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile Dropdown */}
      <div className="relative" ref={profileRef}>
        <button
          id="profile-btn"
          onClick={() => setShowProfile(!showProfile)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <span className="text-white text-sm font-bold">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
          <span className="material-icons text-slate-400 text-sm">expand_more</span>
        </button>

        <AnimatePresence>
          {showProfile && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
            >
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="font-semibold text-slate-800 text-sm truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { navigate(settingsPath); setShowProfile(false) }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="material-icons text-base">settings</span>
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-slate-100"
              >
                <span className="material-icons text-base">logout</span>
                Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
