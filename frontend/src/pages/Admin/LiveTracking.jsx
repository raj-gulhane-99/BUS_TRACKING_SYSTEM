import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getBuses } from '../../api/buses'
import { useSocket } from '../../context/SocketContext'
import LiveMap from '../../components/Map/LiveMap'

export default function LiveTracking() {
  const [buses, setBuses]           = useState([])
  const [selectedBus, setSelectedBus] = useState(null)
  const [loading, setLoading]       = useState(true)
  const { busLocations, connected } = useSocket()

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getBuses()
        setBuses(res.data.buses || [])
      } finally { setLoading(false) }
    }
    fetch()
    const iv = setInterval(fetch, 30000)
    return () => clearInterval(iv)
  }, [])

  const enrichedBuses = buses.map(b => ({
    ...b,
    currentLocation: busLocations[b._id]
      ? { lat: busLocations[b._id].lat, lng: busLocations[b._id].lng }
      : b.currentLocation,
    currentSpeed: busLocations[b._id]?.speed ?? b.currentSpeed,
  }))

  const activeBuses = enrichedBuses.filter(b => b.status === 'active')
  const selected = selectedBus ? enrichedBuses.find(b => b._id === selectedBus) : null

  return (
    <div className="flex gap-5 h-[calc(100vh-160px)]">
      {/* Map */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-icons text-primary-600">gps_fixed</span>
            <h2 className="font-bold text-slate-800">Live Fleet Tracking</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 text-xs font-medium ${connected ? 'text-green-600' : 'text-slate-400'}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
              {connected ? 'Live Feed' : 'Disconnected'}
            </span>
            <span className="text-xs bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full font-semibold">
              {activeBuses.length} / {buses.length} Active
            </span>
          </div>
        </div>
        <div className="flex-1">
          {!loading && (
            <LiveMap
              buses={enrichedBuses}
              liveLocations={busLocations}
              height="100%"
              autoPan={!!selected}
              panTarget={selected?.currentLocation ? [selected.currentLocation.lat, selected.currentLocation.lng] : null}
            />
          )}
        </div>
      </div>

      {/* Bus List Panel */}
      <div className="w-72 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-slate-800">All Buses</h3>
        </div>
        <div className="overflow-y-auto flex-1">
          {buses.map((bus, i) => {
            const live = busLocations[bus._id]
            const isSelected = selectedBus === bus._id
            return (
              <motion.button
                key={bus._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedBus(isSelected ? null : bus._id)}
                className={`w-full text-left px-4 py-3.5 border-b border-slate-50 last:border-0 transition-colors
                  ${isSelected ? 'bg-primary-50 border-l-4 border-l-primary-500' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bus.status === 'active' ? 'bg-primary-100' : 'bg-slate-100'}`}>
                    <span className={`material-icons text-base ${bus.status === 'active' ? 'text-primary-600' : 'text-slate-400'}`}>directions_bus</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{bus.busNumber}</p>
                    <p className="text-xs text-slate-500 truncate">{bus.assignedDriver?.name || 'Unassigned'}</p>
                  </div>
                  <span className={`badge-${bus.status === 'active' ? 'active' : 'offline'} shrink-0`}>
                    {bus.status === 'active' ? '●' : '○'}
                  </span>
                </div>
                <div className="ml-11 space-y-0.5">
                  {bus.assignedRoute && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="material-icons text-xs">route</span>
                      {bus.assignedRoute.name}
                    </p>
                  )}
                  {live && (
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <span className="material-icons text-xs">speed</span>
                      {Math.round(live.speed)} km/h
                    </p>
                  )}
                </div>
              </motion.button>
            )
          })}
          {buses.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <span className="material-icons text-4xl mb-2">directions_bus</span>
              <p className="text-sm">No buses</p>
            </div>
          )}
        </div>

        {/* Selected bus details */}
        {selected && (
          <div className="border-t border-slate-100 p-4 bg-primary-50 shrink-0">
            <p className="text-xs font-semibold text-primary-700 mb-2 uppercase tracking-wide">Selected Bus</p>
            <p className="font-bold text-slate-800">{selected.busNumber}</p>
            <p className="text-sm text-slate-600">{selected.assignedDriver?.name}</p>
            {selected.currentLocation?.lat && (
              <p className="text-xs text-slate-500 mt-1">
                {selected.currentLocation.lat.toFixed(5)}, {selected.currentLocation.lng.toFixed(5)}
              </p>
            )}
            <p className="text-sm font-semibold text-green-600 mt-1">{Math.round(selected.currentSpeed)} km/h</p>
          </div>
        )}
      </div>
    </div>
  )
}
