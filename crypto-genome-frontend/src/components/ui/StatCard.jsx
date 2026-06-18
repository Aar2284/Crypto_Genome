import { motion } from "framer-motion"
import useThemeColor from "../../hooks/useThemeColor.js"
const trendStyles = { up: "text-emerald-400 bg-emerald-400/10", down: "text-rose-400 bg-rose-400/10", neutral: "text-slate-400 bg-slate-400/10" }
const CYAN_ALIASES = new Set(["#00D4FF", "#00d4ff", "#00C896", "#00c896", "#7B2FBE", "#7b2fbe"])
export default function StatCard({ title, value, change, changeType = "neutral", icon: Icon, accentColor: accentProp = "#00D4FF", delay = 0 }) {
  const { accent, cyber, neon } = useThemeColor()
  const REMAP = { "#00D4FF": accent, "#00d4ff": accent, "#00C896": cyber, "#00c896": cyber, "#7B2FBE": neon, "#7b2fbe": neon }
  const accentColor = REMAP[accentProp] || accentProp
  return <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay }} className="market-card stat-card group relative overflow-hidden rounded-xl border border-white/[0.07] bg-navy-800/80 p-4 shadow-xl shadow-black/20 backdrop-blur-sm"><div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(circle at 100% 0%, ${accentColor}1c, transparent 45%)` }} /><div className="relative flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{title}</p><p className="mt-2 text-xl font-semibold tracking-tight text-white">{value}</p>{change && <span className={`mt-2 inline-flex rounded px-1.5 py-0.5 font-mono text-[10px] ${trendStyles[changeType] || trendStyles.neutral}`}>{change}</span>}</div>{Icon && <span className="rounded-lg p-2" style={{ color: accentColor, backgroundColor: `${accentColor}18` }}><Icon size={18} /></span>}</div><div className="absolute bottom-0 left-4 right-4 h-px opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} /></motion.article>
}
