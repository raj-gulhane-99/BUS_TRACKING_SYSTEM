import { motion } from 'framer-motion'

export default function ETACard({ eta, busStatus, busNumber }) {
  const isActive  = busStatus === 'active'
  const hasETA    = eta && eta.etaMinutes !== null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <span className="material-icons text-primary-600">schedule</span>
          ETA Information
        </h3>
        <span className={`badge-${isActive ? 'active' : 'offline'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
          {busStatus ? busStatus.toUpperCase() : 'UNKNOWN'}
        </span>
      </div>

      {!isActive ? (
        <div className="text-center py-4">
          <span className="material-icons text-slate-300 text-4xl">directions_bus</span>
          <p className="text-slate-500 text-sm mt-2">Bus is currently offline</p>
          {busNumber && <p className="text-slate-400 text-xs mt-1">Bus {busNumber}</p>}
        </div>
      ) : !hasETA ? (
        <div className="text-center py-4">
          <div className="spinner border-primary-500 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">Calculating ETA...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* ETA highlight */}
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4 text-center border border-primary-100">
            <motion.p
              key={eta.etaMinutes}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-4xl font-bold text-primary-700"
            >
              {eta.etaMinutes < 1 ? '<1' : eta.etaMinutes}
              <span className="text-lg font-medium ml-1">min</span>
            </motion.p>
            <p className="text-sm text-primary-600 mt-1">Estimated Arrival Time</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 font-medium">Distance</p>
              <p className="text-lg font-bold text-slate-700 mt-0.5">
                {eta.distanceKm} <span className="text-sm font-normal">km</span>
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 font-medium">Bus Speed</p>
              <p className="text-lg font-bold text-slate-700 mt-0.5">
                {eta.speed ?? 0} <span className="text-sm font-normal">km/h</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
