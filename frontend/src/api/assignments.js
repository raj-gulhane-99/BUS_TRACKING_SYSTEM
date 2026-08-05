import api from './axios'

export const getAssignments    = ()         => api.get('/assignments')
export const createAssignment  = (data)     => api.post('/assignments', data)
export const updateAssignment  = (id, data) => api.put(`/assignments/${id}`, data)
export const deleteAssignment  = (id)       => api.delete(`/assignments/${id}`)
export const getStats          = ()         => api.get('/assignments/stats')
