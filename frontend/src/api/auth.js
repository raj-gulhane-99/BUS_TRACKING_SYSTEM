import api from './axios'

export const login           = (data)    => api.post('/auth/login', data)
export const getMe           = ()        => api.get('/auth/me')
export const changePassword  = (data)    => api.put('/auth/change-password', data)
export const forgotPassword  = (data)    => api.post('/auth/forgot-password', data)
