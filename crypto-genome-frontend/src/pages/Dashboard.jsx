import { Suspense } from "react"
import { Activity, Zap, Server, Database, Cpu } from "lucide-react"
import { formatCompactNumber, formatCurrency } from "../utils/formatters.js"
import StatCard from "../components/ui/StatCard.jsx"
import MarketCommandDeck from "../components/ui/MarketCommandDeck.jsx"
import PriceLineChart from "../components/charts/PriceLineChart.jsx"
import CryptoTable from "../components/ui/CryptoTable.jsx"
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx"
import useCryptoStore from "../store/useCryptoStore.js"
import GenomeSpace from "../components/3d/GenomeSpace.jsx"
import useThemeColor from "../hooks/useThemeColor.js"

export default function Dashboard() {
  const { cryptoData, metrics, btcHistory, loading, wsStatus, wsLatency } = useCryptoStore()
  const btcAsset = cryptoData?.find((asset) => asset.symbol === "BTC")
  const btcPrice = btcAsset?.current_price
  const btcChange = btcAsset?.change_24h_pct ?? 0
  const globalVolume = cryptoData?.reduce((sum, asset) => sum + (asset.volume_24h || 0), 0) || 0
  const isLive = wsStatus === "connected"
  const { accent } = useThemeColor()

  return (
    <div className="dashboard-shell space-y-6 md:space-y-8 max-w-[1600px] mx-auto pb-12 px-4 md:px-0">
      <MarketCommandDeck
        btcPrice={btcPrice ? formatCurrency(btcPrice) : "—"}
        btcChange={btcChange}
        volume={`$${formatCompactNumber(globalVolume)}`}
        assets={cryptoData.length}
        isLive={isLive}
        latency={wsLatency}
      />

      <section className="market-stats relative">
        <div className="section-kicker"><span>01</span> Market pulse <i /></div>
        {loading && !metrics && <div className="absolute inset-0 z-10 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center rounded-xl"><LoadingSpinner size={32} /></div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <StatCard title="Bitcoin Price" value={btcPrice ? formatCurrency(btcPrice) : "—"} change={`${btcChange >= 0 ? "+" : ""}${btcChange.toFixed(2)}% · 24H`} changeType={btcChange >= 0 ? "up" : "down"} icon={Zap} accentColor="#FBBF24" delay={0.05} />
          <StatCard title="Market Volume" value={`$${formatCompactNumber(globalVolume)}`} change="Aggregate liquidity" changeType="neutral" icon={Activity} accentColor={accent} delay={0.1} />
          <StatCard title="Active Streams" value={metrics?.active_streams?.toLocaleString() ?? "—"} change={isLive ? "Stream synchronized" : "Replay mode"} changeType={isLive ? "up" : "neutral"} icon={Database} accentColor="#34D399" delay={0.15} />
          <StatCard title="API Latency" value={metrics?.total_latency_ms ? `${metrics.total_latency_ms}ms` : "—"} change={metrics?.system_health || "Health checking"} changeType="up" icon={Cpu} accentColor="#818CF8" delay={0.2} />
        </div>
      </section>

      <section className="regime-ribbon" aria-label="Market regime summary">
        <div className="regime-intro"><span>MARKET REGIME / LIVE</span><strong>Liquidity is <em>{btcChange >= 0 ? "risk-on" : "defensive"}</em></strong></div>
        <div className="regime-meter"><span>Momentum</span><div><i style={{ width: `${Math.min(92, 48 + Math.abs(btcChange) * 6)}%` }} /></div><b>{Math.abs(btcChange).toFixed(1)}%</b></div>
        <div className="regime-meter"><span>Feed health</span><div><i style={{ width: isLive ? "88%" : "42%" }} /></div><b>{isLive ? "NOMINAL" : "REPLAY"}</b></div>
        <div className="regime-pulse" aria-hidden="true">{Array.from({ length: 22 }, (_, index) => <i key={index} style={{ "--bar": `${18 + ((index * 17) % 72)}%` }} />)}</div>
      </section>
      <section className="dashboard-grid grid grid-cols-1 xl:grid-cols-[1.18fr_.82fr] gap-6">
        <div className="market-card chart-terminal rounded-2xl bg-navy-800/80 backdrop-blur-sm border border-white/5 p-4 md:p-5 shadow-xl shadow-black/20 flex flex-col h-[456px]">
          <div className="instrument-header">
            <div><span className="instrument-code">MKT-01 · PRICE DISCOVERY</span><h2>BTC/USD PRICE ACTION</h2></div>
            <div className="instrument-quote"><span>{btcPrice ? formatCurrency(btcPrice) : "—"}</span><em className={btcChange >= 0 ? "quote-positive" : "quote-negative"}>{btcChange >= 0 ? "▲" : "▼"} {Math.abs(btcChange).toFixed(2)}%</em></div>
          </div>
          <div className="chart-controls"><span className="active">24H</span><span>7D</span><span>30D</span><span>90D</span><i>LIVE FEED</i></div>
          <div className="flex-1 min-h-0 pt-2">{loading && (!btcHistory || btcHistory.length === 0) ? <LoadingSpinner size={40} /> : <PriceLineChart data={btcHistory} height="100%" />}</div>
        </div>

        <div className="market-card assets-terminal rounded-2xl bg-navy-800/80 backdrop-blur-sm border border-white/5 p-4 md:p-5 shadow-xl shadow-black/20 flex flex-col h-[456px]">
          <div className="instrument-header compact"><div><span className="instrument-code">MKT-02 · WATCHLIST</span><h2>LIVE PIPELINE ASSETS</h2></div><span className="watch-count"><i /> {cryptoData.length} symbols</span></div>
          <div className="table-ruler"><span>Price</span><span>Momentum</span><span>Liquidity</span></div>
          <div className="flex-1 min-h-0 overflow-y-auto"><CryptoTable data={cryptoData} isLoading={loading && cryptoData.length === 0} /></div>
        </div>
      </section>

      <section className="market-card genome-terminal rounded-2xl bg-navy-800/80 backdrop-blur-sm border border-white/5 shadow-xl shadow-black/20 overflow-hidden" style={{ height: "620px" }}>
        <div className="genome-header"><div><span className="instrument-code">GEN-01 · BEHAVIORAL MARKET MAP</span><h2>GENOME SPACE</h2><p>Live clustering across volatility, liquidity, momentum, correlation, and drawdown behavior.</p></div><div className="genome-status"><span><i /> {cryptoData.length} assets mapped</span><span>Interactive field</span></div></div>
        <div className="h-full"><Suspense fallback={<div className="h-full flex items-center justify-center"><LoadingSpinner size={40} /></div>}><GenomeSpace /></Suspense></div>
      </section>
    </div>
  )
}