import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { forgotPassword } from '../../api/auth'

export default function Login() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [fpEmail, setFpEmail]       = useState('')
  const [fpNewPass, setFpNewPass]   = useState('')
  const [fpLoading, setFpLoading]   = useState(false)

  const { login } = useAuth()

  const roleHome = { admin: '/admin', driver: '/driver', student: '/student' }


  // ── Login handler ───────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      const userData = await login(email, password)
      toast.success(`Welcome, ${userData.name}!`)
      const dest = roleHome[userData.role] || '/'
      setTimeout(() => { window.location.replace(dest) }, 500)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed. Check credentials.')
      setLoading(false)
    }
  }

  // ── Forgot Password ─────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!fpEmail || !fpNewPass) return toast.error('Fill in all fields')
    if (fpNewPass.length < 6) return toast.error('Password must be at least 6 characters')
    setFpLoading(true)
    try {
      await forgotPassword({ email: fpEmail, newPassword: fpNewPass })
      toast.success('Password reset! Please login.')
      setShowForgot(false)
      setEmail(fpEmail)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset failed.')
    } finally {
      setFpLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left Branding Panel ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-dark-900 flex-col items-center justify-center p-12 relative overflow-hidden"
      >
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary-700/30 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-accent-600/20 blur-3xl" />

        <div className="relative z-10 text-center w-full max-w-sm">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-8 shadow-2xl"
          >
            <span className="material-icons text-white text-5xl">directions_bus</span>
          </motion.div>

          <h1 className="text-4xl font-bold text-white mb-3">BusTrack</h1>
          <p className="text-primary-300 text-lg mb-10">Real-Time School Bus Tracking System</p>

          {[
            { icon: 'location_on',   text: 'Live GPS Tracking' },
            { icon: 'notifications', text: 'Instant Proximity Alerts' },
            { icon: 'schedule',      text: 'Accurate ETA Predictions' },
            { icon: 'security',      text: 'Secure & Role-Based Access' },
          ].map((feat, i) => (
            <motion.div
              key={feat.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="flex items-center gap-3 text-left mb-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10"
            >
              <div className="w-8 h-8 rounded-lg bg-primary-600/50 flex items-center justify-center shrink-0">
                <span className="material-icons text-primary-200 text-base">{feat.icon}</span>
              </div>
              <span className="text-primary-100 text-sm font-medium">{feat.text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Right Login Panel ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center p-6 bg-slate-50"
      >
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <span className="material-icons text-white text-xl">directions_bus</span>
            </div>
            <div>
              <p className="font-bold text-primary-700 text-lg leading-none">BusTrack</p>
              <p className="text-slate-500 text-xs">School Bus Tracking</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome back</h2>
            <p className="text-slate-500 text-sm mb-5">Sign in to your account to continue</p>

            <form onSubmit={handleLogin} className="space-y-4">

              {/* Email */}
              <div>
                <label className="input-label" htmlFor="email-input">Email Address</label>
                <div className="relative">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">email</span>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="input-field pl-10"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="input-label" htmlFor="password-input">Password</label>
                <div className="relative">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                  <input
                    id="password-input"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-field pl-10 pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    id="toggle-password"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-icons text-lg">
                      {showPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  id="forgot-password-btn"
                  onClick={() => setShowForgot(true)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <motion.button
                id="login-btn"
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="w-full btn-primary justify-center py-3.5 text-base"
              >
                {loading ? (
                  <>
                    <div className="spinner border-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span className="material-icons text-lg">login</span>
                    Sign In
                  </>
                )}
              </motion.button>

            </form>
          </div>
        </div>
      </motion.div>

      {/* ── Forgot Password Modal ── */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="modal-box p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Reset Password</h3>
                <button onClick={() => setShowForgot(false)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-icons">close</span>
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4">Enter your email and a new password.</p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="input-label" htmlFor="fp-email">Email</label>
                  <input id="fp-email" type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)} placeholder="your@email.com" className="input-field" required />
                </div>
                <div>
                  <label className="input-label" htmlFor="fp-newpass">New Password</label>
                  <input id="fp-newpass" type="password" value={fpNewPass} onChange={e => setFpNewPass(e.target.value)} placeholder="Min 6 characters" className="input-field" required minLength={6} />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowForgot(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                  <button type="submit" disabled={fpLoading} className="btn-primary flex-1 justify-center">
                    {fpLoading ? <div className="spinner border-white" /> : 'Reset Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
