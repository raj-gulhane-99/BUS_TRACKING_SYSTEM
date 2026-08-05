import api from './axios'

export const getBuses       = ()         => api.get('/buses')
export const getBus         = (id)       => api.get(`/buses/${id}`)
export const createBus      = (data)     => api.post('/buses', data)
export const updateBus      = (id, data) => api.put(`/buses/${id}`, data)
export const deleteBus      = (id)       => api.delete(`/buses/${id}`)
export const getActiveBuses = ()         => api.get('/buses/active')
export const getBusStats    = ()         => api.get('/buses/stats')
