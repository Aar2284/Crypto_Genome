import { motion } from "framer-motion"

export default function StatCard({
  title, value, change, changeType = "up",
  icon: Icon, accentColor = "#00D4FF", delay = 0
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden rounded-xl
                 bg-navy-800/80 backdrop-blur-sm
                 border border-white/5
                 p-5 md:p-6 group hover:border-accent/30
                 transition-all duration-300"
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100
                   transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${accentColor}15 0%, transparent 70%)` }}
      />
      
      {/* Top row */}
      <div className="relative z-10 flex items-start justify-between mb-4">
        <span className="text-slate-400 text-[10px] md:text-xs font-mono uppercase tracking-widest break-words pr-2">
          {title}
        </span>
        {Icon && (
          <div className="p-1.5 md:p-2 rounded-lg shrink-0" style={{ background: `${accentColor}20` }}>
            <Icon size={16} style={{ color: accentColor }} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="relative z-10 text-2xl md:text-3xl font-display font-bold text-white mb-2 truncate">
        {value}
      </div>

      {/* Change indicator */}
      {change && (
        <div className={`relative z-10 text-[10px] md:text-xs font-mono flex items-center gap-1
          ${changeType === "up" ? "text-emerald-400" : "text-red-400"}`}
        >
          <span>{changeType === "up" ? "▲" : "▼"}</span>
          <span className="truncate">{change}</span>
        </div>
      )}
    </motion.div>
  )
}
