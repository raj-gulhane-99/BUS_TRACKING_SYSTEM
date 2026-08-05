import api from './axios'

export const updateLocation  = (data)              => api.post('/gps/update', data)
export const getActiveBuses  = ()                  => api.get('/gps/active-buses')
export const getBusLocation  = (busId)             => api.get(`/gps/bus/${busId}`)
export const getETA          = (busId, lat, lng)   => api.get(`/gps/eta/${busId}?studentLat=${lat}&studentLng=${lng}`)
