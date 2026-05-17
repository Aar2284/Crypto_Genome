import { MOCK_MARKET_DATA, MOCK_CHART_DATA, MOCK_PIPELINE_METRICS } from "../utils/mockData.js"
import { formatCurrency, formatCompactNumber } from "../utils/formatters.js"
import StatCard from "../components/ui/StatCard.jsx"
import PriceLineChart from "../components/charts/PriceLineChart.jsx"
import CryptoTable from "../components/ui/CryptoTable.jsx"
import { Activity, Zap, Server, ShieldCheck } from "lucide-react"

export default function Dashboard() {
  // In Phase 3, we orchestrate static data. 
  // Phase 5 will swap this for Zustand selectors: const { data } = useCryptoStore()
  const marketData = MOCK_MARKET_DATA
  const chartData = MOCK_CHART_DATA
  const metrics = MOCK_PIPELINE_METRICS

  // Calculate high-level stats from mock data
  const btcPrice = marketData.find(d => d.symbol === "BTC")?.current_price
  const globalVolume = marketData.reduce((acc, curr) => acc + (curr.volume_24h || 0), 0)

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1600px] mx-auto pb-12 px-4 md:px-0">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2 md:mt-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-wide">
            MARKET OVERVIEW
          </h1>
          <p className="text-slate-400 font-mono text-xs md:text-sm mt-1">
            Real-time analytics engine
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2 sm:pb-0">
           <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs whitespace-nowrap">
             <ShieldCheck size={14} /> System {metrics.system_health}
           </span>
           <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent font-mono text-xs whitespace-nowrap">
             <Activity size={14} /> {metrics.events_per_second} ev/s
           </span>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Bitcoin Price" 
          value={formatCurrency(btcPrice)} 
          change="2.4%" 
          changeType="up"
          icon={Zap}
          accentColor="#FFD700"
          delay={0.1}
        />
        <StatCard 
          title="24h Volume" 
          value={formatCompactNumber(globalVolume)} 
          icon={Activity}
          accentColor="#00D4FF"
          delay={0.2}
        />
        <StatCard 
          title="Active Pipelines" 
          value={metrics.active_streams} 
          icon={Server}
          accentColor="#7B2FBE"
          delay={0.3}
        />
        <StatCard 
          title="Global Latency" 
          value={`${metrics.total_latency_ms}ms`} 
          icon={Activity}
          accentColor="#00C896"
          delay={0.4}
        />
      </div>

      {/* Chart & Deep Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Container */}
        <div className="col-span-1 lg:col-span-2 rounded-xl bg-navy-800/80 backdrop-blur-sm border border-white/5 p-4 md:p-6 shadow-xl shadow-black/20 flex flex-col">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h2 className="text-base md:text-lg font-display text-white font-bold tracking-wide">BTC/USD PRICE ACTION</h2>
            <div className="px-2 py-1 rounded bg-navy-900 border border-white/10 text-[10px] md:text-xs font-mono text-slate-400">
              24H
            </div>
          </div>
          {/* Chart Wrapper renders inside flex-1 to auto-fill space */}
          <div className="flex-1 w-full min-h-[250px] md:min-h-[320px]">
            <PriceLineChart data={chartData} color="#00D4FF" height="100%" />
          </div>
        </div>
        
        {/* Secondary Analytics Container */}
        <div className="col-span-1 rounded-xl bg-navy-800/80 backdrop-blur-sm border border-white/5 p-4 md:p-6 shadow-xl shadow-black/20 flex flex-col justify-center items-center min-h-[300px]">
             <div className="text-center space-y-4 w-full">
               <div className="w-16 h-16 mx-auto rounded-full border border-dashed border-slate-600 flex items-center justify-center">
                  <Activity size={24} className="text-slate-500" />
               </div>
               <h3 className="font-display text-slate-300">Market Dominance</h3>
               <p className="text-xs font-mono text-slate-500 max-w-[200px] mx-auto">
                 Secondary chart systems will orchestrate here.
               </p>
             </div>
        </div>
      </div>

      {/* Market Table */}
      <div>
        <h2 className="text-base md:text-lg font-display text-white font-bold tracking-wide mb-4 mt-2">LIVE PIPELINE ASSETS</h2>
        <CryptoTable data={marketData} />
      </div>
    </div>
  )
}
