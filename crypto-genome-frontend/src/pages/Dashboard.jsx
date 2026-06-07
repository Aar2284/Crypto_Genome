import { Suspense } from "react"
import { Activity, Zap, Server, ShieldCheck, Database, Cpu } from "lucide-react"
import { formatCurrency, formatCompactNumber } from "../utils/formatters.js"
import StatCard from "../components/ui/StatCard.jsx"
import PriceLineChart from "../components/charts/PriceLineChart.jsx"
import CryptoTable from "../components/ui/CryptoTable.jsx"
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx"
import useCryptoStore from "../store/useCryptoStore.js"
import GenomeSpace from "../components/3d/GenomeSpace.jsx"

export default function Dashboard() {
  const { cryptoData, metrics, btcHistory, loading, wsStatus, wsLatency } = useCryptoStore()

  const btcPrice    = cryptoData?.find(d => d.symbol === "BTC")?.current_price
  const globalVolume = cryptoData?.reduce((acc, curr) => acc + (curr.volume_24h || 0), 0)

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1600px] mx-auto pb-12 px-4 md:px-0">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2 md:mt-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-wide">
            MARKET OVERVIEW
          </h1>
          <p className="text-slate-400 font-mono text-xs md:text-sm mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyber animate-pulse" />
            Live Analytics Engine
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2 sm:pb-0">
          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs whitespace-nowrap
            ${wsStatus === "connected"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
            <ShieldCheck size={14} />
            {wsStatus === "connected" ? "Stream Online" : "Demo Mode"}
          </span>
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent font-mono text-xs whitespace-nowrap">
            <Activity size={14} />
            {wsLatency > 0 ? `${wsLatency}ms ping` : metrics?.events_per_second ? `${metrics.events_per_second.toLocaleString()} ev/s` : "Mock Data"}
          </span>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative min-h-[120px]">
        {loading && !metrics && (
          <div className="absolute inset-0 z-10 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
            <LoadingSpinner size={32} />
          </div>
        )}
        <StatCard title="Bitcoin Price"   value={btcPrice ? formatCurrency(btcPrice) : "—"} change="Live" changeType="up" icon={Zap}      accentColor="#FFD700" delay={0.1} />
        <StatCard title="Active Streams"  value={metrics?.active_streams?.toLocaleString() ?? "—"}                            icon={Database} accentColor="#00D4FF" delay={0.2} />
        <StatCard title="Events / Sec"    value={metrics?.events_per_second?.toLocaleString() ?? "—"}                         icon={Server}   accentColor="#7B2FBE" delay={0.3} />
        <StatCard title="API Latency"     value={metrics?.total_latency_ms ? `${metrics.total_latency_ms}ms` : "—"} change={metrics?.system_health ?? ""} changeType="up" icon={Cpu} accentColor="#00C896" delay={0.4} />
      </div>

      {/* ── Row 2: BTC chart (50%) + Live Assets Table (50%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* BTC Price Chart */}
        <div className="rounded-xl bg-navy-800/80 backdrop-blur-sm border border-white/5 p-4 md:p-5 shadow-xl shadow-black/20 flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-base font-display text-white font-bold tracking-wide">BTC/USD PRICE ACTION</h2>
            <div className="px-2 py-1 rounded bg-navy-900 border border-white/10 text-[10px] font-mono text-slate-400">24H</div>
          </div>
          <div className="flex-1 min-h-0">
            {loading && (!btcHistory || btcHistory.length === 0)
              ? <LoadingSpinner size={40} />
              : <PriceLineChart data={btcHistory} color="#00D4FF" height="100%" />
            }
          </div>
        </div>

        {/* Live Assets Table — fixed height, independently scrollable */}
        <div className="rounded-xl bg-navy-800/80 backdrop-blur-sm border border-white/5 p-4 md:p-5 shadow-xl shadow-black/20 flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h2 className="text-base font-display text-white font-bold tracking-wide">LIVE PIPELINE ASSETS</h2>
            <span className="text-[10px] font-mono text-slate-500 border border-white/5 px-2 py-0.5 rounded">
              {cryptoData.length} assets
            </span>
          </div>
          {/* Scrolls independently — page does not scroll with it */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <CryptoTable data={cryptoData} isLoading={loading && cryptoData.length === 0} />
          </div>
        </div>
      </div>

      {/* ── Row 3: Genome Space — 3D behavioral scatter plot ── */}
      <div className="rounded-xl bg-navy-800/80 backdrop-blur-sm border border-white/5 shadow-xl shadow-black/20 overflow-hidden" style={{ height: "580px" }}>
        <div className="px-4 pt-3 pb-0 flex items-center justify-between">
          <div>
            <h2 className="text-base font-display text-white font-bold tracking-wide">GENOME SPACE</h2>
            <p className="text-[9px] font-mono text-slate-600 mt-0.5">3D behavioral fingerprint — volatility · liquidity · momentum</p>
          </div>
          <span className="text-[9px] font-mono text-slate-600 border border-white/5 px-2 py-0.5 rounded">
            {cryptoData.length} ASSETS MAPPED
          </span>
        </div>
        <div className="h-full">
          <Suspense fallback={<div className="h-full flex items-center justify-center"><LoadingSpinner size={40} /></div>}>
            <GenomeSpace />
          </Suspense>
        </div>
      </div>

    </div>
  )
}
