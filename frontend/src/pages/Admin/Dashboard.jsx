import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import StatsCard from '../../components/Cards/StatsCard'
import LiveMap from '../../components/Map/LiveMap'
import { getStats } from '../../api/assignments'
import { getBuses } from '../../api/buses'
import { useSocket } from '../../context/SocketContext'

export default function Dashboard() {
  const [stats, setStats]   = useState(null)
  const [buses, setBuses]   = useState([])
  const [loading, setLoading] = useState(true)
  const { busLocations }    = useSocket()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, busRes] = await Promise.all([getStats(), getBuses()])
        setStats(statsRes.data.stats)
        setBuses(busRes.data.buses || [])
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const statsCards = [
    { icon: 'people',           label: 'Total Students', value: stats?.totalStudents, color: 'blue',   delay: 0 },
    { icon: 'drive_eta',        label: 'Total Drivers',  value: stats?.totalDrivers,  color: 'purple', delay: 0.1 },
    { icon: 'directions_bus',   label: 'Total Buses',    value: stats?.totalBuses,    color: 'amber',  delay: 0.2 },
    { icon: 'gps_fixed',        label: 'Active Buses',   value: stats?.activeBuses,   color: 'green',  delay: 0.3 },
    { icon: 'gps_off',          label: 'Offline Buses',  value: stats?.offlineBuses,  color: 'slate',  delay: 0.4 },
  ]

  // Merge live socket locations into bus objects
  const enrichedBuses = buses.map(bus => ({
    ...bus,
    currentLocation: busLocations[bus._id]
      ? { lat: busLocations[bus._id].lat, lng: busLocations[bus._id].lng }
      : bus.currentLocation,
    currentSpeed: busLocations[bus._id]?.speed ?? bus.currentSpeed,
  }))

  const activeBuses = enrichedBuses.filter(b => b.status === 'active')

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statsCards.map(card => (
          <StatsCard key={card.label} {...card} />
        ))}
      </div>

      {/* Map + Bus List */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Map */}
        <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" style={{ height: 520 }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-icons text-primary-600">map</span>
              <h2 className="font-bold text-slate-800">Live Fleet Map</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-600 font-medium">
                {activeBuses.length} Active
              </span>
            </div>
          </div>
          <div style={{ height: 'calc(100% - 53px)' }}>
            {!loading && (
              <LiveMap
                buses={enrichedBuses}
                liveLocations={busLocations}
                height="100%"
              />
            )}
          </div>
        </div>

        {/* Bus Status List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" style={{ height: 520 }}>
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Fleet Status</h2>
          </div>
          <div className="overflow-y-auto h-full pb-14">
            {buses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <span className="material-icons text-4xl mb-2">directions_bus</span>
                <p className="text-sm">No buses found</p>
              </div>
            ) : (
              buses.map((bus, i) => {
                const isLive = !!busLocations[bus._id]
                return (
                  <motion.div
                    key={bus._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      bus.status === 'active' ? 'bg-primary-100' : 'bg-slate-100'
                    }`}>
                      <span className={`material-icons text-lg ${
                        bus.status === 'active' ? 'text-primary-600' : 'text-slate-400'
                      }`}>directions_bus</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{bus.busNumber}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {bus.assignedDriver?.name || 'Unassigned'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`badge-${bus.status === 'active' ? 'active' : 'offline'}`}>
                        {bus.status}
                      </span>
                      {isLive && (
                        <p className="text-xs text-slate-400 mt-1">
                          {Math.round(busLocations[bus._id]?.speed || 0)} km/h
                        </p>
                      )}
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
