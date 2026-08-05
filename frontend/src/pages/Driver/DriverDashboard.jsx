import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { getMyAssignment } from '../../api/drivers'
import { useGeolocation, useSimulatedGPS } from '../../hooks/useGeolocation'
import LiveMap from '../../components/Map/LiveMap'

export default function DriverDashboard() {
  const { user } = useAuth()
  const { emit, on, off, connected } = useSocket()

  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [tripActive, setTripActive] = useState(false)
  const [simulate, setSimulate]     = useState(false)
  const [currentSpeed, setCurrentSpeed] = useState(0)

  // Real GPS
  const { location: gpsLocation, error: gpsError } = useGeolocation()

  // Simulated GPS (along route polyline)
  const routePolyline = assignment?.route?.polyline || []
  const simLocation   = useSimulatedGPS(routePolyline, 30, simulate && tripActive)

  const activeLocation = (simulate && tripActive) ? simLocation : gpsLocation
  const locationIntervalRef = useRef(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyAssignment()
        setAssignment(res.data.assignment)
      } catch { toast.error('Failed to load assignment') }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  // Emit location updates while trip is active
  useEffect(() => {
    if (!tripActive || !activeLocation || !assignment?.bus?._id) return

    const emitLocation = () => {
      emit('driver:location', {
        busId: assignment.bus._id,
        driverId: user._id,
        lat: activeLocation.lat,
        lng: activeLocation.lng,
        speed: activeLocation.speed || currentSpeed,
        heading: activeLocation.heading || 0,
      })
      setCurrentSpeed(Math.round(activeLocation.speed || 0))
    }

    emitLocation()
    locationIntervalRef.current = setInterval(emitLocation, 3000)
    return () => clearInterval(locationIntervalRef.current)
  }, [tripActive, activeLocation, assignment])

  const handleStartTrip = () => {
    if (!assignment) return toast.error('No assignment found. Contact admin.')
    if (!assignment.bus) return toast.error('No bus assigned')

    emit('driver:join', { busId: assignment.bus._id, driverId: user._id })
    emit('driver:trip_start', { busId: assignment.bus._id, driverId: user._id })
    setTripActive(true)
    toast.success('Trip started! Broadcasting location...')
  }

  const handleStopTrip = () => {
    if (assignment?.bus?._id) {
      emit('driver:trip_stop', { busId: assignment.bus._id, driverId: user._id })
    }
    clearInterval(locationIntervalRef.current)
    setTripActive(false)
    toast('Trip ended.', { icon: '🔴' })
  }

  const handleEmergency = () => {
    const msg = window.prompt('Describe the emergency:')
    if (!msg) return
    emit('driver:emergency', {
      busId: assignment?.bus?._id,
      driverId: user._id,
      message: msg,
    })
    toast.error('🚨 Emergency alert sent to admin!')
  }

  const mapBuses = assignment?.bus
    ? [{
        ...assignment.bus,
        assignedDriver: { name: user.name, phone: user.phone },
        assignedRoute: assignment.route,
        currentLocation: activeLocation ? { lat: activeLocation.lat, lng: activeLocation.lng } : assignment.bus.currentLocation,
        currentSpeed,
        status: tripActive ? 'active' : 'offline',
      }]
    : []

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner border-primary-500 w-8 h-8" />
    </div>
  )

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Driver Profile Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{user.name[0]}</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-xl">{user.name}</p>
            <p className="text-primary-200 text-sm">{user.email}</p>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-1.5 text-sm font-semibold ${tripActive ? 'text-green-300' : 'text-primary-300'}`}>
              <span className={`w-2 h-2 rounded-full ${tripActive ? 'bg-green-400 animate-pulse' : 'bg-primary-400'}`} />
              {tripActive ? 'On Trip' : 'Off Duty'}
            </div>
            {tripActive && (
              <p className="text-primary-200 text-xs mt-1">{currentSpeed} km/h</p>
            )}
          </div>
        </div>

        {assignment && (
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-primary-300 text-xs">Bus</p>
              <p className="font-bold text-sm">{assignment.bus?.busNumber || '—'}</p>
            </div>
            <div>
              <p className="text-primary-300 text-xs">Route</p>
              <p className="font-bold text-sm truncate">{assignment.route?.name || '—'}</p>
            </div>
            <div>
              <p className="text-primary-300 text-xs">Students</p>
              <p className="font-bold text-sm">{assignment.students?.length || 0}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Map */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" style={{ height: 340 }}>
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="font-semibold text-slate-800 flex items-center gap-2">
            <span className="material-icons text-primary-600 text-base">map</span>
            Your Location
          </span>
          {gpsError && <span className="text-xs text-amber-600">GPS: {gpsError}</span>}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-slate-500">Simulate GPS</span>
            <div className={`relative w-9 h-5 rounded-full transition-colors ${simulate ? 'bg-primary-500' : 'bg-slate-300'}`}
              onClick={() => setSimulate(!simulate)}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${simulate ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </label>
        </div>
        <div style={{ height: 'calc(100% - 49px)' }}>
          <LiveMap
            buses={mapBuses}
            height="100%"
            center={activeLocation ? [activeLocation.lat, activeLocation.lng] : [28.6448, 77.2167]}
            zoom={14}
            autoPan={!!activeLocation && tripActive}
            panTarget={activeLocation ? [activeLocation.lat, activeLocation.lng] : null}
          />
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-1 gap-3">
        {!tripActive ? (
          <motion.button
            id="start-trip-btn"
            onClick={handleStartTrip}
            whileTap={{ scale: 0.97 }}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
          >
            <span className="material-icons text-3xl">play_circle</span>
            START BUS TRIP
          </motion.button>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <motion.button
                id="stop-trip-btn"
                onClick={handleStopTrip}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-slate-600 to-slate-800 text-white font-bold text-base shadow-lg flex items-center justify-center gap-3"
              >
                <span className="material-icons text-2xl">stop_circle</span>
                Stop Trip
              </motion.button>
              <motion.button
                id="emergency-btn"
                onClick={handleEmergency}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-700 text-white font-bold text-base shadow-lg flex items-center justify-center gap-3 animate-pulse"
              >
                <span className="material-icons text-2xl">emergency</span>
                Emergency Alert
              </motion.button>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      {/* Student List */}
      {assignment?.students?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <span className="material-icons text-primary-600 text-base">people</span>
              Assigned Students ({assignment.students.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {assignment.students.map(s => (
              <div key={s._id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-sm">{s.name[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800 text-sm">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.grade || s.email}</p>
                </div>
                {s.phone && (
                  <a href={`tel:${s.phone}`} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                    <span className="material-icons text-base">call</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Connection Status */}
      <div className={`text-center text-sm py-2 rounded-xl font-medium ${connected ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-50'}`}>
        {connected ? '🟢 Connected to real-time server' : '⚠️ Disconnected — reconnecting...'}
      </div>
    </div>
  )
}
