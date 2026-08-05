import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { changePassword } from '../../api/auth'

export default function Settings() {
  const { user } = useAuth()
  const [form, setForm]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match')
    if (form.newPassword.length < 6) return toast.error('New password must be at least 6 characters')
    setSaving(true)
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      toast.success('Password changed successfully!')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password')
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="material-icons text-primary-600">account_circle</span>
          Profile Information
        </h2>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <p className="text-xl font-bold text-slate-800">{user?.name}</p>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <span className="mt-1 inline-block badge-active capitalize">{user?.role}</span>
          </div>
        </div>
      </motion.div>

      {/* Change Password Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="material-icons text-primary-600">lock</span>
          Change Password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label" htmlFor="cur-pass">Current Password</label>
            <div className="relative">
              <input id="cur-pass" type={showCur ? 'text' : 'password'} required value={form.currentPassword}
                onChange={e => setForm({...form, currentPassword: e.target.value})}
                placeholder="Enter current password" className="input-field pr-10" />
              <button type="button" onClick={() => setShowCur(!showCur)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <span className="material-icons text-lg">{showCur ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
          <div>
            <label className="input-label" htmlFor="new-pass">New Password</label>
            <div className="relative">
              <input id="new-pass" type={showNew ? 'text' : 'password'} required value={form.newPassword}
                onChange={e => setForm({...form, newPassword: e.target.value})}
                placeholder="Min 6 characters" className="input-field pr-10" minLength={6} />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <span className="material-icons text-lg">{showNew ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
          <div>
            <label className="input-label" htmlFor="conf-pass">Confirm New Password</label>
            <input id="conf-pass" type="password" required value={form.confirmPassword}
              onChange={e => setForm({...form, confirmPassword: e.target.value})}
              placeholder="Re-enter new password" className="input-field" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3">
            {saving ? <div className="spinner border-white" /> : (
              <><span className="material-icons text-lg">lock_reset</span>Update Password</>
            )}
          </button>
        </form>
      </motion.div>

      {/* Security Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
        <div className="flex gap-3">
          <span className="material-icons text-blue-500 text-xl">info</span>
          <div>
            <p className="font-semibold text-blue-800 text-sm">Security Tips</p>
            <ul className="text-blue-700 text-sm mt-1.5 space-y-1 list-disc list-inside">
              <li>Use a strong password with at least 8 characters</li>
              <li>Include numbers, letters, and special characters</li>
              <li>Never share your password with anyone</li>
              <li>Log out when using shared devices</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
