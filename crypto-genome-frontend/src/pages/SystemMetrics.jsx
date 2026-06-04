import { motion } from "framer-motion"
import { Database, Cpu, HardDrive, Wifi, ExternalLink } from "lucide-react"
import useCryptoStore from "../store/useCryptoStore.js"

const cardClass = "rounded-2xl border border-white/5 bg-navy-800/60 backdrop-blur-sm p-5 shadow-xl shadow-black/20"

const METRIC_CARDS = [
  { label: "FastAPI",        icon: Database, color: "text-accent",  desc: "REST + WebSocket server" },
  { label: "PostgreSQL",     icon: HardDrive,color: "text-cyber",   desc: "Primary time-series store" },
  { label: "Kafka",          icon: Wifi,     color: "text-neon",    desc: "Event streaming layer" },
  { label: "CPU / Memory",   icon: Cpu,      color: "text-amber-400", desc: "Host resource usage" },
]

export default function SystemMetrics() {
  const metrics  = useCryptoStore((s) => s.metrics)
  const wsStatus = useCryptoStore((s) => s.wsStatus)
  const isLive   = wsStatus === "connected"
  const m = metrics || {}

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 px-4 md:px-0">
      {/* Header */}
      <div className="mt-2 md:mt-4">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-wide flex items-center gap-3">
          <Database className="text-accent" size={28} />
          SYSTEM METRICS
        </h1>
        <p className="text-slate-400 font-mono text-xs mt-1">
          Infrastructure health and resource monitoring
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "System Health", value: m.system_health   ?? "healthy",  badge: true },
          { label: "API Latency",   value: `${m.total_latency_ms ?? 45}ms`            },
          { label: "Active Streams",value: m.active_streams  ?? 15                    },
          { label: "Events / Sec",  value: m.events_per_second ?? 4230               },
        ].map(({ label, value, badge }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`${cardClass} flex flex-col gap-1`}
          >
            <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">{label}</span>
            {badge ? (
              <span className={`text-sm font-mono px-2 py-1 rounded-md w-fit mt-1
                ${value === "healthy" ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" : "bg-amber-400/10 text-amber-400 border border-amber-400/20"}`}>
                ● {value}
              </span>
            ) : (
              <span className="text-2xl font-display font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Service tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRIC_CARDS.map(({ label, icon: Icon, color, desc }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className={`${cardClass} flex flex-col gap-3`}
          >
            <div className="flex justify-between items-start">
              <Icon size={22} className={color} />
              <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border
                ${isLive
                  ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                  : "bg-amber-400/10 border-amber-400/20 text-amber-400"}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                {isLive ? "Online" : "Demo"}
              </span>
            </div>
            <div>
              <div className={`font-display font-bold text-lg ${color}`}>{label}</div>
              <div className="text-slate-500 text-xs font-mono mt-0.5">{desc}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Grafana embed placeholder */}
      <div className={`${cardClass} flex flex-col items-center justify-center text-center gap-4 py-16`}>
        <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
          <Database size={28} className="text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-display font-bold text-white mb-1">Grafana Dashboard</h2>
          <p className="text-slate-400 font-mono text-sm max-w-md">
            Connect your Grafana instance to embed live infrastructure dashboards (Prometheus metrics, DB stats, Kafka lag).
          </p>
        </div>
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm font-mono hover:bg-accent/20 transition-colors"
        >
          <ExternalLink size={14} /> Open Grafana
        </a>
      </div>
    </div>
  )
}
