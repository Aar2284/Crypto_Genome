import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Activity, BarChart2, Dna, TrendingUp } from "lucide-react"
import GenomeRadarChart from "../components/charts/GenomeRadarChart.jsx"
import OHLCVChart from "../components/charts/OHLCVChart.jsx"
import VolumeBarChart from "../components/charts/VolumeBarChart.jsx"
import useCryptoStore from "../store/useCryptoStore.js"
import { mockGenome, mockAssetHistory } from "../utils/mockData.js"
import { formatCurrency, formatCompactNumber } from "../utils/formatters.js"

const ASSETS = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "DOT", "LINK", "MATIC"]

const cardClass = "rounded-2xl border border-white/5 bg-navy-800/60 backdrop-blur-sm p-5 shadow-xl shadow-black/20"

export default function Analytics() {
  const [selectedAsset, setSelectedAsset] = useState("BTC")
  const cryptoData = useCryptoStore((s) => s.cryptoData)

  // Use mock genome — will be replaced by real API data when backend is live
  const genomeData = mockGenome

  // OHLCV history from mock (in future: from API)
  const historyData = useMemo(() => mockAssetHistory[selectedAsset] || [], [selectedAsset])

  // Genome for selected asset
  const assetGenome = useMemo(() => {
    const g = genomeData.find((d) => d.symbol === selectedAsset)
    if (!g) return null
    return [
      { subject: "Volatility",  value: g.dimension_1 },
      { subject: "Correlation", value: g.dimension_2 },
      { subject: "Momentum",    value: g.dimension_3 },
      { subject: "Drawdown",    value: g.dimension_4 },
      { subject: "Liquidity",   value: g.dimension_5 },
    ]
  }, [selectedAsset, genomeData])

  const assetInfo = cryptoData.find((d) => d.symbol === selectedAsset)

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2 md:mt-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-wide">
            GENOME ANALYTICS
          </h1>
          <p className="text-slate-400 font-mono text-xs mt-1 flex items-center gap-2">
            <Dna size={12} className="text-accent" />
            Multi-dimensional asset intelligence
          </p>
        </div>

        {/* Asset Selector */}
        <div className="flex flex-wrap gap-2">
          {ASSETS.map((sym) => (
            <button
              key={sym}
              onClick={() => setSelectedAsset(sym)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all duration-150
                ${selectedAsset === sym
                  ? "bg-accent/20 border-accent/50 text-accent"
                  : "bg-white/5 border-white/5 text-slate-400 hover:text-accent hover:border-accent/30"
                }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Summary Row */}
      {assetInfo && (
        <motion.div
          key={selectedAsset}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { label: "Price", value: formatCurrency(assetInfo.current_price) },
            { label: "24h Change", value: `${assetInfo.change_24h_pct > 0 ? "+" : ""}${assetInfo.change_24h_pct?.toFixed(2)}%`, positive: assetInfo.change_24h_pct >= 0 },
            { label: "Volume 24h", value: `$${formatCompactNumber(assetInfo.volume_24h)}` },
            { label: "Market Cap",  value: `$${formatCompactNumber(assetInfo.market_cap)}` },
          ].map(({ label, value, positive }) => (
            <div key={label} className={`${cardClass} flex flex-col gap-1`}>
              <span className="text-slate-500 text-[11px] font-mono uppercase tracking-wider">{label}</span>
              <span className={`text-xl font-display font-bold ${positive === false ? "text-rose-400" : positive ? "text-emerald-400" : "text-white"}`}>
                {value}
              </span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Main Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Price + Volume History — 3 cols */}
        <div className={`${cardClass} lg:col-span-3 flex flex-col`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-cyber" /> Price History
            </h2>
            <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-1 rounded">60D OHLCV</span>
          </div>
          <div className="flex-1 min-h-[280px]">
            <OHLCVChart data={historyData} />
          </div>
        </div>

        {/* Genome Radar — 2 cols */}
        <div className={`${cardClass} lg:col-span-2 flex flex-col`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
              <Dna size={16} className="text-accent" /> Genome Profile
            </h2>
            <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20">
              {selectedAsset}
            </span>
          </div>
          <div className="flex-1 min-h-[280px]">
            {assetGenome ? (
              <GenomeRadarChart genomeData={[genomeData.find(g => g.symbol === selectedAsset)].filter(Boolean)} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-sm">
                No genome data for {selectedAsset}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparative Volume */}
        <div className={`${cardClass} flex flex-col`}>
          <h2 className="text-base font-display font-bold text-white flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-neon" /> Comparative Volume (24h)
          </h2>
          <div className="flex-1 min-h-[220px]">
            <VolumeBarChart data={cryptoData} color="#00C896" />
          </div>
        </div>

        {/* Multi-asset Genome Comparison */}
        <div className={`${cardClass} flex flex-col`}>
          <h2 className="text-base font-display font-bold text-white flex items-center gap-2 mb-4">
            <Activity size={16} className="text-cyber" /> Genome Comparison (Top 3)
          </h2>
          <div className="flex-1 min-h-[220px]">
            <GenomeRadarChart genomeData={genomeData.slice(0, 3)} />
          </div>
        </div>
      </div>
    </div>
  )
}
