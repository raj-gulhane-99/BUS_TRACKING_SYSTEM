import api from './axios'

export const getRoutes    = ()         => api.get('/routes')
export const getRoute     = (id)       => api.get(`/routes/${id}`)
export const createRoute  = (data)     => api.post('/routes', data)
export const updateRoute  = (id, data) => api.put(`/routes/${id}`, data)
export const deleteRoute  = (id)       => api.delete(`/routes/${id}`)
