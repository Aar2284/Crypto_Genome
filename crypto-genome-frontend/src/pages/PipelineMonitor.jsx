import { useMemo } from "react"
import { motion } from "framer-motion"
import { GitBranch, Database, RefreshCw, Activity, Server, Zap, Clock, ArrowRight } from "lucide-react"
import PipelineStatus from "../components/ui/PipelineStatus.jsx"
import useCryptoStore from "../store/useCryptoStore.js"
import { mockAssets } from "../utils/mockData.js"
import { formatCompactNumber } from "../utils/formatters.js"

const cardClass = "rounded-2xl border border-white/5 bg-navy-800/60 backdrop-blur-sm p-5 shadow-xl shadow-black/20"

// Simulated log entries — in production these would come from the backend
const STREAM_LOGS = [
  { time: "now",    type: "ok",   msg: "Processed 420 OHLCV candles (BTC/USD)" },
  { time: "-2s",    type: "ok",   msg: "Processed 381 OHLCV candles (ETH/USD)" },
  { time: "-5s",    type: "info", msg: "Genome recalculation triggered (3 assets)" },
  { time: "-8s",    type: "ok",   msg: "Updated 3 genome dimension vectors" },
  { time: "-12s",   type: "ok",   msg: "Market cap rankings synced (10 assets)" },
  { time: "-18s",   type: "warn", msg: "SOL WebSocket latency spike: 342ms" },
  { time: "-22s",   type: "ok",   msg: "Kafka consumer lag: 0 messages" },
  { time: "-30s",   type: "info", msg: "Airflow DAG 'genome_compute' completed OK" },
  { time: "-45s",   type: "ok",   msg: "PostgreSQL checkpoint completed (85ms)" },
  { time: "-60s",   type: "info", msg: "Health check passed — all systems nominal" },
]

// Pipeline stage definitions
const PIPELINE_STAGES = [
  { id: "ingest",    label: "Ingest",    icon: Zap,       detail: "CoinGecko / Exchange APIs" },
  { id: "stream",    label: "Stream",    icon: RefreshCw, detail: "Kafka → Airflow DAG" },
  { id: "compute",   label: "Compute",   icon: Activity,  detail: "Genome dimension calc" },
  { id: "store",     label: "Store",     icon: Database,  detail: "PostgreSQL / TimescaleDB" },
  { id: "serve",     label: "Serve",     icon: Server,    detail: "FastAPI + WebSocket" },
]

export default function PipelineMonitor() {
  const metrics   = useCryptoStore((s) => s.metrics)
  const wsStatus  = useCryptoStore((s) => s.wsStatus)
  const cryptoData = useCryptoStore((s) => s.cryptoData)
  const isLive    = wsStatus === "connected"

  const m = metrics || {}

  // Recent assets sorted by last updated
  const recentAssets = useMemo(() =>
    (cryptoData || mockAssets).slice(0, 6), [cryptoData])

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 px-4 md:px-0">
      {/* Header */}
      <div className="mt-2 md:mt-4">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-wide flex items-center gap-3">
          <GitBranch className="text-accent" size={28} />
          PIPELINE MONITOR
        </h1>
        <p className="text-slate-400 font-mono text-xs mt-1">
          Real-time data ingestion and genome computation status
        </p>
      </div>

      {/* Service health cards */}
      <PipelineStatus metrics={m} isConnected={isLive} />

      {/* Pipeline Flow Diagram */}
      <div className={cardClass}>
        <h2 className="text-base font-display font-bold text-white mb-6 flex items-center gap-2">
          <GitBranch size={16} className="text-accent" /> Data Flow Topology
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-0">
          {PIPELINE_STAGES.map((stage, i) => {
            const Icon = stage.icon
            return (
              <div key={stage.id} className="flex items-center gap-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center
                    ${isLive
                      ? "border-accent/60 bg-accent/10 text-accent"
                      : "border-amber-400/40 bg-amber-400/5 text-amber-400"
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="text-[11px] font-display font-bold text-white">{stage.label}</div>
                  <div className="text-[9px] font-mono text-slate-500 max-w-[80px] leading-tight">{stage.detail}</div>
                </motion.div>

                {i < PIPELINE_STAGES.length - 1 && (
                  <div className="hidden md:flex items-center mx-2 pb-8">
                    <div className="w-8 h-0.5 bg-accent/20 relative">
                      <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-accent/40">
                        <ArrowRight size={12} />
                      </span>
                      {isLive && (
                        <span className="absolute left-0 top-0 h-full w-2 bg-accent/60 animate-[flow_1.5s_linear_infinite] rounded-full" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats + Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingestion Stats */}
        <div className={`${cardClass} flex flex-col gap-4`}>
          <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
            <Zap size={16} className="text-amber-400" /> Ingestion Stats
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Active Streams",    value: m.active_streams    ?? 15,     color: "text-cyber" },
              { label: "Events / Sec",      value: m.events_per_second ?? 4230,   color: "text-accent" },
              { label: "Latency (ms)",      value: m.total_latency_ms  ?? 45,     color: "text-neon" },
              { label: "Assets Tracked",    value: recentAssets.length,            color: "text-white" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-black/20 rounded-xl p-4 border border-white/5">
                <div className="text-slate-500 text-[10px] font-mono uppercase tracking-wider mb-1">{label}</div>
                <div className={`text-2xl font-display font-bold ${color}`}>
                  {typeof value === "number" ? value.toLocaleString() : value}
                </div>
              </div>
            ))}
          </div>

          {/* Recent assets */}
          <div>
            <div className="text-slate-500 text-[10px] font-mono uppercase tracking-wider mb-2 flex items-center gap-2">
              <Clock size={10} /> Recently Processed
            </div>
            <div className="flex flex-wrap gap-2">
              {recentAssets.map((a) => (
                <span key={a.symbol} className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-mono text-slate-300">
                  {a.symbol}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stream Logs */}
        <div className={`${cardClass} flex flex-col`}>
          <h2 className="text-base font-display font-bold text-white flex items-center gap-2 mb-4">
            <Activity size={16} className="text-cyber" /> Stream Logs
          </h2>
          <div className="flex-1 bg-black/40 rounded-xl p-4 border border-white/5 overflow-hidden font-mono text-[11px] space-y-2">
            <div className="text-slate-600 border-b border-white/5 pb-2 mb-2 flex justify-between">
              <span>timestamp</span><span>message</span>
            </div>
            {STREAM_LOGS.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3"
              >
                <span className="text-slate-600 shrink-0 w-10">{log.time}</span>
                <span className={
                  log.type === "ok"   ? "text-emerald-400" :
                  log.type === "warn" ? "text-amber-400"   :
                  "text-cyan-400"
                }>
                  [{log.type.toUpperCase().padEnd(4)}]
                </span>
                <span className="text-slate-400">{log.msg}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
