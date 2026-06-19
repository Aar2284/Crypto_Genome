import { motion } from "framer-motion"

const trendStyles = { up: "text-emerald-400 bg-emerald-400/10", down: "text-rose-400 bg-rose-400/10", neutral: "text-slate-400 bg-slate-400/10" }

export default function StatCard({ title, value, change, changeType = "neutral", icon: Icon, accentColor = "#00D4FF", delay = 0 }) {
  const bars = Array.from({ length: 18 }, (_, index) => 24 + ((title.length * 17 + index * 19) % 64))

  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay }} className="market-card stat-card group relative overflow-hidden rounded-xl border border-white/[0.07] bg-navy-800/80 p-4 shadow-xl shadow-black/20 backdrop-blur-sm">
      <div className="stat-glow" style={{ background: `radial-gradient(circle at 100% 0%, ${accentColor}26, transparent 54%)` }} />
      <div className="relative flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{title}</p><p className="mt-2 text-xl font-semibold tracking-tight text-white">{value}</p>{change && <span className={`mt-2 inline-flex rounded px-1.5 py-0.5 font-mono text-[10px] ${trendStyles[changeType] || trendStyles.neutral}`}>{change}</span>}</div>{Icon && <span className="stat-icon rounded-lg p-2" style={{ color: accentColor, backgroundColor: `${accentColor}18` }}><Icon size={18} /></span>}</div>
      <div className="stat-spark" aria-hidden="true">{bars.map((height, index) => <i key={index} style={{ height: `${height}%`, animationDelay: `${index * 55}ms` }} />)}</div>
      <div className="stat-footer"><span>LIVE INDEX</span><span>01 / 04</span></div>
    </motion.article>
  )
}