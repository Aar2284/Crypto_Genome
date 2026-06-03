import { Suspense } from "react"
import { Activity, Zap, Server, ShieldCheck, Database, Cpu } from "lucide-react"
import { formatCurrency, formatCompactNumber } from "../utils/formatters.js"
import StatCard from "../components/ui/StatCard.jsx"
import PriceLineChart from "../components/charts/PriceLineChart.jsx"
import CryptoTable from "../components/ui/CryptoTable.jsx"
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx"
import useCryptoStore from "../store/useCryptoStore.js"
import CryptoGlobe from "../components/3d/CryptoGlobe.jsx"

export default function Dashboard() {
  const { cryptoData, metrics, btcHistory, loading, wsStatus, wsLatency } = useCryptoStore()

  // Extract BTC price
  const btcPrice = cryptoData?.find(d => d.symbol === "BTC")?.current_price
  
  // Calculate global volume dynamically from live data
  const globalVolume = cryptoData?.reduce((acc, curr) => acc + (curr.volume_24h || 0), 0)

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1600px] mx-auto pb-12 px-4 md:px-0">
      
      {/* Header section */}
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
           <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs whitespace-nowrap transition-colors
             ${wsStatus === "connected" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
             }`}>
             <ShieldCheck size={14} /> 
             {wsStatus === "connected" ? "Stream Online" : "Demo Mode"}
           </span>
           <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent font-mono text-xs whitespace-nowrap">
             <Activity size={14} /> 
             {wsLatency > 0 ? `${wsLatency}ms ping` : metrics?.events_per_second ? `${metrics.events_per_second.toLocaleString()} ev/s` : "Mock Data"}
           </span>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative min-h-[120px]">
        {loading && !metrics && (
          <div className="absolute inset-0 z-10 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
             <LoadingSpinner size={32} />
          </div>
        )}
        <StatCard 
          title="Bitcoin Price" 
          value={btcPrice ? formatCurrency(btcPrice) : "—"} 
          change="Live" 
          changeType="up"
          icon={Zap}
          accentColor="#FFD700"
          delay={0.1}
        />
        <StatCard 
          title="Active Streams" 
          value={metrics?.active_streams?.toLocaleString() ?? "—"} 
          icon={Database}
          accentColor="#00D4FF"
          delay={0.2}
        />
        <StatCard 
          title="Events / Sec" 
          value={metrics?.events_per_second?.toLocaleString() ?? "—"} 
          icon={Server}
          accentColor="#7B2FBE"
          delay={0.3}
        />
        <StatCard 
          title="API Latency" 
          value={metrics?.total_latency_ms ? `${metrics.total_latency_ms}ms` : "—"} 
          change={metrics?.system_health ?? ""}
          changeType="up"
          icon={Cpu}
          accentColor="#00C896"
          delay={0.4}
        />
      </div>

      {/* Chart & Deep Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Container */}
        <div className="col-span-1 lg:col-span-2 rounded-xl bg-navy-800/80 backdrop-blur-sm border border-white/5 p-4 md:p-6 shadow-xl shadow-black/20 flex flex-col relative">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h2 className="text-base md:text-lg font-display text-white font-bold tracking-wide">BTC/USD PRICE ACTION</h2>
            <div className="px-2 py-1 rounded bg-navy-900 border border-white/10 text-[10px] md:text-xs font-mono text-slate-400">
              24H
            </div>
          </div>
          {/* Chart Wrapper renders inside flex-1 to auto-fill space */}
          <div className="flex-1 w-full min-h-[250px] md:min-h-[320px]">
            {loading && (!btcHistory || btcHistory.length === 0) ? (
              <LoadingSpinner size={40} />
            ) : (
              <PriceLineChart data={btcHistory} color="#00D4FF" height="100%" />
            )}
          </div>
        </div>
        
        {/* Secondary Analytics Container (Crypto Globe) */}
        <div className="col-span-1 rounded-xl bg-navy-800/80 backdrop-blur-sm border border-white/5 p-4 md:p-6 shadow-xl shadow-black/20 flex flex-col relative min-h-[300px]">
           <div className="flex items-center justify-between mb-4 shrink-0 relative z-10">
             <h2 className="text-base md:text-lg font-display text-white font-bold tracking-wide">GLOBAL MARKET</h2>
           </div>
           <div className="flex-1 w-full h-full min-h-[250px] relative">
             <Suspense fallback={<LoadingSpinner size={40} />}>
               <CryptoGlobe />
             </Suspense>
           </div>
        </div>
      </div>

      {/* Market Table */}
      <div>
        <h2 className="text-base md:text-lg font-display text-white font-bold tracking-wide mb-4 mt-2">LIVE PIPELINE ASSETS</h2>
        <CryptoTable data={cryptoData} isLoading={loading && cryptoData.length === 0} />
      </div>
    </div>
  )
}
