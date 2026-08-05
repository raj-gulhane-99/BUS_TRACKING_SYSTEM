import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { getMyAssignment } from '../../api/students'
import { useGeolocation } from '../../hooks/useGeolocation'
import LiveMap from '../../components/Map/LiveMap'
import ETACard from '../../components/Cards/ETACard'

export default function StudentDashboard() {
  const { user }  = useAuth()
  const { emit, on, off, connected, busLocations } = useSocket()
  const { location: studentLocation, error: gpsError } = useGeolocation()

  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [eta, setEta]               = useState(null)
  const [proximityAlert, setProximityAlert] = useState(null)

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await getMyAssignment()
        setAssignment(res.data.assignment)
      } catch { toast.error('Could not load your bus assignment') }
      finally { setLoading(false) }
    }
    fetchAssignment()
  }, [])

  // Join bus socket room once assignment is loaded — only once
  useEffect(() => {
    if (!assignment?.bus?._id) return
    emit('student:join', { studentId: user._id, busId: assignment.bus._id })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment?._id, user._id])

  // Share student location for proximity detection
  useEffect(() => {
    if (!studentLocation) return
    emit('student:location', { studentId: user._id, lat: studentLocation.lat, lng: studentLocation.lng })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentLocation?.lat, studentLocation?.lng, user._id])

  // Listen for bus nearby alert
  useEffect(() => {
    const handler = (data) => {
      setProximityAlert(data)
      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40 }}
          className={`${t.visible ? 'opacity-100' : 'opacity-0'} flex items-start gap-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 py-4 rounded-2xl shadow-2xl max-w-sm`}
        >
          <span className="material-icons text-2xl">directions_bus</span>
          <div>
            <p className="font-bold">Bus Nearby! 🚌</p>
            <p className="text-sm text-primary-200 mt-0.5">{data.message}</p>
          </div>
        </motion.div>
      ), { duration: 8000, position: 'top-center' })
      // Auto-dismiss
      setTimeout(() => setProximityAlert(null), 15000)
    }

    const unsub = on('bus:nearby', handler)
    return () => { if (typeof unsub === 'function') unsub() }
  }, [on])

  // Listen for ETA updates
  useEffect(() => {
    const handler = (data) => setEta(data)
    const unsub = on('bus:eta_update', handler)
    return () => { if (typeof unsub === 'function') unsub() }
  }, [on])

  // Listen for trip events
  useEffect(() => {
    const startHandler = () => {
      toast.success('🟢 Your bus has started the trip!', { duration: 5000 })
      setAssignment(prev => prev ? { ...prev, bus: { ...prev.bus, status: 'active' } } : prev)
    }
    const endHandler = () => {
      toast('🔴 Trip has ended for today.', { icon: '🛑', duration: 5000 })
      setAssignment(prev => prev ? { ...prev, bus: { ...prev.bus, status: 'offline' } } : prev)
    }
    const unsubStart = on('trip:started', startHandler)
    const unsubEnd   = on('trip:ended', endHandler)
    return () => {
      if (typeof unsubStart === 'function') unsubStart()
      if (typeof unsubEnd === 'function') unsubEnd()
    }
  }, [on])

  // Calculate ETA client-side from live locations
  useEffect(() => {
    if (!studentLocation || !assignment?.bus?._id) return
    const live = busLocations[assignment.bus._id]
    if (!live) return

    const R = 6371000
    const dLat = ((live.lat - studentLocation.lat) * Math.PI) / 180
    const dLng = ((live.lng - studentLocation.lng) * Math.PI) / 180
    const a = Math.sin(dLat/2)**2 + Math.cos(studentLocation.lat*Math.PI/180)*Math.cos(live.lat*Math.PI/180)*Math.sin(dLng/2)**2
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const speedMs = live.speed > 0 ? live.speed / 3.6 : 8.33
    const etaSec  = Math.round(dist / speedMs)

    setEta({
      distanceMeters: Math.round(dist),
      distanceKm: (dist / 1000).toFixed(2),
      etaMinutes: Math.round(etaSec / 60),
      etaSeconds: etaSec,
      speed: Math.round(live.speed || 0),
    })
  }, [busLocations, assignment, studentLocation])

  const liveBusLoc = assignment?.bus?._id ? busLocations[assignment.bus._id] : null

  const mapBuses = assignment?.bus
    ? [{
        ...assignment.bus,
        assignedDriver: assignment.driver,
        assignedRoute: assignment.route,
        currentLocation: liveBusLoc
          ? { lat: liveBusLoc.lat, lng: liveBusLoc.lng }
          : assignment.bus.currentLocation,
        currentSpeed: liveBusLoc?.speed ?? assignment.bus.currentSpeed ?? 0,
        status: liveBusLoc ? 'active' : (assignment.bus.status || 'offline'),
      }]
    : []

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner border-primary-500 w-8 h-8" />
    </div>
  )

  if (!assignment) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-6 text-center">
      <span className="material-icons text-5xl mb-3">directions_bus</span>
      <p className="font-semibold text-slate-600">No Bus Assigned</p>
      <p className="text-sm mt-1">Contact your admin to assign you a bus.</p>
    </div>
  )

  const bus    = assignment.bus
  const driver = assignment.driver
  const route  = assignment.route
  const isActive = bus?.status === 'active' || !!liveBusLoc

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Proximity Alert Banner */}
      <AnimatePresence>
        {proximityAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-4 flex items-center gap-3 shadow-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 animate-bounce">
              <span className="material-icons text-white text-xl">notifications_active</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">Bus Nearby!</p>
              <p className="text-primary-100 text-sm">{proximityAlert.message}</p>
            </div>
            <button onClick={() => setProximityAlert(null)} className="text-white/70 hover:text-white">
              <span className="material-icons">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bus Info Card */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-600/30 border border-primary-500/30 flex items-center justify-center">
              <span className="material-icons text-primary-300 text-2xl">directions_bus</span>
            </div>
            <div>
              <p className="text-lg font-bold">Bus {bus?.busNumber}</p>
              <p className="text-slate-400 text-xs">{bus?.plateNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
              {isActive ? 'On Route' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
          <div>
            <p className="text-slate-400 text-xs mb-0.5">Driver</p>
            <p className="font-semibold text-sm text-white">{driver?.name || '—'}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-0.5">Contact</p>
            {driver?.phone
              ? <a href={`tel:${driver.phone}`} className="font-semibold text-sm text-primary-400 hover:text-primary-300">{driver.phone}</a>
              : <p className="font-semibold text-sm text-white">—</p>
            }
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-0.5">Route</p>
            <p className="font-semibold text-sm text-white truncate">{route?.name || '—'}</p>
          </div>
        </div>
      </motion.div>

      {/* Live Map */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" style={{ height: 320 }}>
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="font-semibold text-slate-800 flex items-center gap-2">
            <span className="material-icons text-primary-600 text-base">my_location</span>
            Live Tracking
          </span>
          <div className="flex items-center gap-2">
            {gpsError && <span className="text-xs text-amber-500">{gpsError}</span>}
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
          </div>
        </div>
        <div style={{ height: 'calc(100% - 49px)' }}>
          <LiveMap
            buses={mapBuses}
            liveLocations={assignment?.bus?._id ? { [assignment.bus._id]: liveBusLoc } : {}}
            studentLocation={studentLocation}
            height="100%"
            center={
              liveBusLoc
                ? [liveBusLoc.lat, liveBusLoc.lng]
                : studentLocation
                  ? [studentLocation.lat, studentLocation.lng]
                  : [28.6448, 77.2167]
            }
            zoom={14}
            autoPan={!!liveBusLoc}
          />
        </div>
      </motion.div>

      {/* ETA Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <ETACard eta={eta} busStatus={bus?.status || (liveBusLoc ? 'active' : 'offline')} busNumber={bus?.busNumber} />
      </motion.div>

      {/* Route Stops */}
      {route?.stops?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <span className="material-icons text-accent-600 text-base">route</span>
              Route Stops
            </h3>
          </div>
          <div className="p-4">
            {route.stops.sort((a, b) => a.order - b.order).map((stop, i) => (
              <div key={stop._id || i} className="flex items-start gap-3 mb-3 last:mb-0">
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-green-100 text-green-700' :
                    i === route.stops.length - 1 ? 'bg-red-100 text-red-700' :
                    'bg-primary-100 text-primary-700'
                  }`}>{stop.order}</div>
                  {i < route.stops.length - 1 && <div className="w-0.5 h-4 bg-slate-200 mt-1" />}
                </div>
                <div className="pt-1">
                  <p className="text-sm font-medium text-slate-800">{stop.name}</p>
                  <p className="text-xs text-slate-400">{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Connection Status */}
      <div className={`text-center text-sm py-2 rounded-xl font-medium ${connected ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-50'}`}>
        {connected ? '🟢 Live updates active' : '⚠️ Reconnecting...'}
      </div>
    </div>
  )
}
