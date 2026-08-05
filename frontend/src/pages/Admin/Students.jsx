import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { getStudents, createStudent, updateStudent, deleteStudent } from '../../api/students'

const EMPTY_FORM = {
  name: '', email: '', password: '', phone: '',
  studentId: '', grade: '', parentContact: '', address: '',
}

export default function Students() {
  const [students, setStudents]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(null)

  useEffect(() => { fetchStudents() }, [])

  const fetchStudents = async () => {
    try {
      const res = await getStudents()
      setStudents(res.data.students || [])
    } catch { toast.error('Failed to load students') }
    finally { setLoading(false) }
  }

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (s) => {
    setEditing(s)
    setForm({ ...EMPTY_FORM, name: s.name, email: s.email, phone: s.phone || '',
      studentId: s.studentId || '', grade: s.grade || '',
      parentContact: s.parentContact || '', address: s.address || '' })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await updateStudent(editing._id, form)
        toast.success('Student updated!')
      } else {
        if (!form.password) form.password = 'student123'
        await createStudent(form)
        toast.success('Student created!')
      }
      setShowModal(false)
      fetchStudents()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Operation failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return
    setDeleting(id)
    try {
      await deleteStudent(id)
      toast.success('Student deleted')
      setStudents(prev => prev.filter(s => s._id !== id))
    } catch { toast.error('Delete failed') }
    finally { setDeleting(null) }
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.studentId || '').includes(search)
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Students</h2>
          <p className="text-sm text-slate-500">{students.length} students registered</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search students..."
              className="input-field pl-9 w-64"
            />
          </div>
          <button id="add-student-btn" onClick={openAdd} className="btn-primary">
            <span className="material-icons text-lg">person_add</span>
            Add Student
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="spinner border-primary-500 w-8 h-8" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <span className="material-icons text-4xl mb-2">people</span>
            <p>No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Grade</th>
                  <th>Phone</th>
                  <th>Parent Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <motion.tr
                    key={s._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-bold text-sm">{s.name[0]}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-slate-600">{s.studentId || '—'}</td>
                    <td>{s.grade || '—'}</td>
                    <td>{s.phone || '—'}</td>
                    <td>{s.parentContact || '—'}</td>
                    <td>
                      <span className={s.isActive ? 'badge-active' : 'badge-offline'}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <span className="material-icons text-base">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          disabled={deleting === s._id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <span className="material-icons text-base">
                            {deleting === s._id ? 'hourglass_empty' : 'delete'}
                          </span>
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

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
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
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-800">
                  {editing ? 'Edit Student' : 'Add New Student'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label" htmlFor="s-name">Full Name *</label>
                    <input id="s-name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="John Doe" className="input-field" />
                  </div>
                  <div>
                    <label className="input-label" htmlFor="s-email">Email *</label>
                    <input id="s-email" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="john@school.edu" className="input-field" />
                  </div>
                  {!editing && (
                    <div>
                      <label className="input-label" htmlFor="s-pass">Password</label>
                      <input id="s-pass" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Default: student123" className="input-field" />
                    </div>
                  )}
                  <div>
                    <label className="input-label" htmlFor="s-phone">Phone</label>
                    <input id="s-phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91-9876543210" className="input-field" />
                  </div>
                  <div>
                    <label className="input-label" htmlFor="s-sid">Student ID</label>
                    <input id="s-sid" value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} placeholder="STU-001" className="input-field" />
                  </div>
                  <div>
                    <label className="input-label" htmlFor="s-grade">Grade / Class</label>
                    <input id="s-grade" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} placeholder="Class 10-A" className="input-field" />
                  </div>
                  <div>
                    <label className="input-label" htmlFor="s-parent">Parent Contact</label>
                    <input id="s-parent" value={form.parentContact} onChange={e => setForm({...form, parentContact: e.target.value})} placeholder="+91-9900000001" className="input-field" />
                  </div>
                  <div>
                    <label className="input-label" htmlFor="s-addr">Address</label>
                    <input id="s-addr" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Street, City" className="input-field" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                    {saving ? <div className="spinner border-white" /> : (editing ? 'Save Changes' : 'Add Student')}
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
