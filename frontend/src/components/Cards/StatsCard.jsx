import { motion } from 'framer-motion'

const iconColors = {
  blue:  { bg: 'bg-blue-100',   icon: 'text-blue-600',   border: 'border-blue-200' },
  green: { bg: 'bg-green-100',  icon: 'text-green-600',  border: 'border-green-200' },
  amber: { bg: 'bg-amber-100',  icon: 'text-amber-600',  border: 'border-amber-200' },
  red:   { bg: 'bg-red-100',    icon: 'text-red-600',    border: 'border-red-200' },
  slate: { bg: 'bg-slate-100',  icon: 'text-slate-600',  border: 'border-slate-200' },
  purple:{ bg: 'bg-purple-100', icon: 'text-purple-600', border: 'border-purple-200' },
}

export default function StatsCard({ icon, label, value, color = 'blue', trend, delay = 0 }) {
  const colors = iconColors[color] || iconColors.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center`}>
          <span className={`material-icons text-xl ${colors.icon}`}>{icon}</span>
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <motion.p
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl font-bold text-slate-800"
        >
          {value ?? <span className="text-slate-300">—</span>}
        </motion.p>
        <p className="text-sm text-slate-500 mt-1 font-medium">{label}</p>
      </div>
    </motion.div>
  )
}
