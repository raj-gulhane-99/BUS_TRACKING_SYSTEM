import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../../api/drivers'

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', licenseNumber: '', experience: '' }

export default function Drivers() {
  const [drivers, setDrivers]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(null)

  useEffect(() => { fetchDrivers() }, [])

  const fetchDrivers = async () => {
    try {
      const res = await getDrivers()
      setDrivers(res.data.drivers || [])
    } catch { toast.error('Failed to load drivers') }
    finally { setLoading(false) }
  }

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (d) => {
    setEditing(d)
    setForm({ ...EMPTY_FORM, name: d.name, email: d.email, phone: d.phone || '',
      licenseNumber: d.licenseNumber || '', experience: d.experience || '' })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await updateDriver(editing._id, form)
        toast.success('Driver updated!')
      } else {
        if (!form.password) form.password = 'driver123'
        await createDriver(form)
        toast.success('Driver created!')
      }
      setShowModal(false)
      fetchDrivers()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Operation failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this driver?')) return
    setDeleting(id)
    try {
      await deleteDriver(id)
      toast.success('Driver deleted')
      setDrivers(prev => prev.filter(d => d._id !== id))
    } catch { toast.error('Delete failed') }
    finally { setDeleting(null) }
  }

  const filtered = drivers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Drivers</h2>
          <p className="text-sm text-slate-500">{drivers.length} drivers registered</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drivers..." className="input-field pl-9 w-56" />
          </div>
          <button id="add-driver-btn" onClick={openAdd} className="btn-primary">
            <span className="material-icons text-lg">person_add</span>
            Add Driver
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="spinner border-primary-500 w-8 h-8" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <span className="material-icons text-4xl mb-2">drive_eta</span>
            <p>No drivers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Driver</th><th>Phone</th><th>License No.</th><th>Experience</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <motion.tr key={d._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-700 font-bold text-sm">{d.name[0]}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{d.name}</p>
                          <p className="text-xs text-slate-500">{d.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{d.phone || '—'}</td>
                    <td className="font-mono text-xs text-slate-600">{d.licenseNumber || '—'}</td>
                    <td>{d.experience || '—'}</td>
                    <td><span className={d.isActive ? 'badge-active' : 'badge-offline'}>{d.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors" title="Edit">
                          <span className="material-icons text-base">edit</span>
                        </button>
                        <button onClick={() => handleDelete(d._id)} disabled={deleting === d._id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors" title="Delete">
                          <span className="material-icons text-base">{deleting === d._id ? 'hourglass_empty' : 'delete'}</span>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="modal-box p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-800">{editing ? 'Edit Driver' : 'Add New Driver'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><span className="material-icons">close</span></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label" htmlFor="d-name">Full Name *</label>
                    <input id="d-name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Driver Name" className="input-field" />
                  </div>
                  <div>
                    <label className="input-label" htmlFor="d-email">Email *</label>
                    <input id="d-email" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="driver@school.edu" className="input-field" />
                  </div>
                  {!editing && (
                    <div>
                      <label className="input-label" htmlFor="d-pass">Password</label>
                      <input id="d-pass" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Default: driver123" className="input-field" />
                    </div>
                  )}
                  <div>
                    <label className="input-label" htmlFor="d-phone">Phone</label>
                    <input id="d-phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91-9876543210" className="input-field" />
                  </div>
                  <div>
                    <label className="input-label" htmlFor="d-lic">License Number</label>
                    <input id="d-lic" value={form.licenseNumber} onChange={e => setForm({...form, licenseNumber: e.target.value})} placeholder="DL-HR-2019-12345" className="input-field" />
                  </div>
                  <div>
                    <label className="input-label" htmlFor="d-exp">Experience</label>
                    <input id="d-exp" value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} placeholder="5 years" className="input-field" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                    {saving ? <div className="spinner border-white" /> : (editing ? 'Save Changes' : 'Add Driver')}
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
