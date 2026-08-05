import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { getAssignments, createAssignment, deleteAssignment } from '../../api/assignments'
import { getDrivers } from '../../api/drivers'
import { getBuses } from '../../api/buses'
import { getRoutes } from '../../api/routes'
import { getStudents } from '../../api/students'

export default function AssignBus() {
  const [assignments, setAssignments] = useState([])
  const [drivers,     setDrivers]     = useState([])
  const [buses,       setBuses]       = useState([])
  const [routes,      setRoutes]      = useState([])
  const [students,    setStudents]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)

  const [form, setForm] = useState({
    driverId: '', busId: '', routeId: '', studentIds: [],
  })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [aRes, dRes, bRes, rRes, sRes] = await Promise.all([
        getAssignments(), getDrivers(), getBuses(), getRoutes(), getStudents(),
      ])
      setAssignments(aRes.data.assignments || [])
      setDrivers(dRes.data.drivers || [])
      setBuses(bRes.data.buses || [])
      setRoutes(rRes.data.routes || [])
      setStudents(sRes.data.students || [])
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  const toggleStudent = (id) => {
    setForm(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(id)
        ? prev.studentIds.filter(s => s !== id)
        : [...prev.studentIds, id],
    }))
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!form.driverId || !form.busId || !form.routeId) {
      return toast.error('Please select driver, bus, and route')
    }
    setSaving(true)
    try {
      await createAssignment(form)
      toast.success('Bus assigned successfully!')
      setForm({ driverId: '', busId: '', routeId: '', studentIds: [] })
      fetchAll()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Assignment failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this assignment?')) return
    try {
      await deleteAssignment(id)
      toast.success('Assignment removed')
      fetchAll()
    } catch { toast.error('Failed to remove') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner border-primary-500 w-8 h-8" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="material-icons text-primary-600">assignment</span>
            New Assignment
          </h2>
          <form onSubmit={handleAssign} className="space-y-4">
            {/* Driver */}
            <div>
              <label className="input-label" htmlFor="sel-driver">Select Driver *</label>
              <select id="sel-driver" value={form.driverId} onChange={e => setForm({...form, driverId: e.target.value})} className="input-field" required>
                <option value="">— Choose Driver —</option>
                {drivers.map(d => <option key={d._id} value={d._id}>{d.name} ({d.phone || 'No phone'})</option>)}
              </select>
            </div>
            {/* Bus */}
            <div>
              <label className="input-label" htmlFor="sel-bus">Select Bus *</label>
              <select id="sel-bus" value={form.busId} onChange={e => setForm({...form, busId: e.target.value})} className="input-field" required>
                <option value="">— Choose Bus —</option>
                {buses.map(b => <option key={b._id} value={b._id}>{b.busNumber} — {b.plateNumber} (Capacity: {b.capacity})</option>)}
              </select>
            </div>
            {/* Route */}
            <div>
              <label className="input-label" htmlFor="sel-route">Select Route *</label>
              <select id="sel-route" value={form.routeId} onChange={e => setForm({...form, routeId: e.target.value})} className="input-field" required>
                <option value="">— Choose Route —</option>
                {routes.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </div>
            {/* Students */}
            <div>
              <label className="input-label">Assign Students</label>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                {students.length === 0 ? (
                  <p className="p-3 text-sm text-slate-400">No students available</p>
                ) : (
                  students.map(s => (
                    <label key={s._id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
                      <input
                        type="checkbox"
                        checked={form.studentIds.includes(s._id)}
                        onChange={() => toggleStudent(s._id)}
                        className="w-4 h-4 accent-primary-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.grade || 'No grade'} · {s.address || s.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              {form.studentIds.length > 0 && (
                <p className="text-xs text-primary-600 mt-1.5 font-medium">{form.studentIds.length} students selected</p>
              )}
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3">
              {saving ? <div className="spinner border-white" /> : (
                <><span className="material-icons text-lg">assignment_turned_in</span>Save Assignment</>
              )}
            </button>
          </form>
        </motion.div>

        {/* Existing Assignments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="material-icons text-accent-600">list_alt</span>
              Current Assignments
            </h2>
          </div>
          <div className="overflow-y-auto max-h-[520px]">
            {assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <span className="material-icons text-4xl mb-2">assignment</span>
                <p className="text-sm">No assignments yet</p>
              </div>
            ) : (
              assignments.map((a, i) => (
                <motion.div key={a._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-primary-600 text-base">directions_bus</span>
                        <span className="font-bold text-slate-800">{a.bus?.busNumber}</span>
                        <span className={`badge-${a.isActive ? 'active' : 'offline'}`}>{a.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                      <p className="text-sm text-slate-600 flex items-center gap-1.5">
                        <span className="material-icons text-slate-400 text-sm">drive_eta</span>
                        {a.driver?.name}
                      </p>
                      <p className="text-sm text-slate-600 flex items-center gap-1.5">
                        <span className="material-icons text-slate-400 text-sm">route</span>
                        {a.route?.name}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <span className="material-icons text-slate-400 text-xs">people</span>
                        {a.students?.length || 0} students
                      </p>
                    </div>
                    <button onClick={() => handleDelete(a._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <span className="material-icons text-base">delete_outline</span>
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
