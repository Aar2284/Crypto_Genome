import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Activity, BarChart2, Dna, FlaskConical, Search, SlidersHorizontal, TrendingUp } from "lucide-react"
import GenomeRadarChart from "../components/charts/GenomeRadarChart.jsx"
import OHLCVChart from "../components/charts/OHLCVChart.jsx"
import VolumeBarChart from "../components/charts/VolumeBarChart.jsx"
import useCryptoStore from "../store/useCryptoStore.js"
import { mockGenome, mockAssetHistory } from "../utils/mockData.js"
import { formatCompactNumber, formatCurrency } from "../utils/formatters.js"

const ASSETS = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "DOT", "LINK", "MATIC"]
const dimensions = ["Volatility", "Correlation", "Momentum", "Drawdown", "Liquidity"]

export default function Analytics() {
  const [selectedAsset, setSelectedAsset] = useState("BTC")
  const cryptoData = useCryptoStore((state) => state.cryptoData)
  const selectedGenome = useMemo(() => mockGenome.find((entry) => entry.symbol === selectedAsset), [selectedAsset])
  const historyData = useMemo(() => mockAssetHistory[selectedAsset] || [], [selectedAsset])
  const assetInfo = cryptoData.find((asset) => asset.symbol === selectedAsset)
  const change = assetInfo?.change_24h_pct ?? 0
  const metrics = [
    { label: "Spot price", value: assetInfo ? formatCurrency(assetInfo.current_price) : "—", tone: "accent" },
    { label: "24H delta", value: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`, tone: change >= 0 ? "positive" : "negative" },
    { label: "Liquidity", value: assetInfo ? `$${formatCompactNumber(assetInfo.volume_24h)}` : "—", tone: "cyber" },
    { label: "Market cap", value: assetInfo ? `$${formatCompactNumber(assetInfo.market_cap)}` : "—", tone: "neon" },
  ]

  return <div className="research-page space-y-6 max-w-[1600px] mx-auto pb-12 px-4 md:px-0">
    <section className="research-hero">
      <div className="research-title"><div className="research-kicker"><FlaskConical size={13} /> Quantitative research lab</div><h1>ASSET<br /><span>GENOME ANALYSIS</span></h1><p>Inspect the behavioral signature behind each market. Every panel is a different lens on price, liquidity, and risk.</p></div>
      <div className="research-asset-readout"><div className="readout-header"><span>ACTIVE SUBJECT</span><span>GEN-5 MODEL</span></div><strong>{selectedAsset}</strong><div className="readout-meter"><i /><i /><i /><i /><i /><i /><i /><i /></div><small>Five-dimensional behavioral profile</small></div>
    </section>

    <section className="asset-library market-card">
      <div className="library-head"><div><span className="panel-code">LAB-01 / UNIVERSE SELECTOR</span><h2>Asset library</h2></div><span className="library-search"><Search size={13} /> {ASSETS.length} instruments</span></div>
      <div className="asset-lane">{ASSETS.map((symbol, index) => <button key={symbol} type="button" onClick={() => setSelectedAsset(symbol)} className={selectedAsset === symbol ? "asset-chip active" : "asset-chip"}><span>{String(index + 1).padStart(2, "0")}</span><strong>{symbol}</strong><i /></button>)}</div>
    </section>

    <section className="research-metric-grid">{metrics.map((metric, index) => <motion.article key={metric.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .06 }} className={`research-metric tone-${metric.tone}`}><span>{metric.label}</span><strong>{metric.value}</strong><i /><small>Selected asset reading</small></motion.article>)}</section>

    <section className="research-board grid grid-cols-1 xl:grid-cols-[1.32fr_.68fr] gap-6">
      <article className="market-card research-chart-card rounded-2xl bg-navy-800/80 p-5 min-h-[410px] flex flex-col"><div className="lab-panel-head"><div><span className="panel-code">LAB-02 / TEMPORAL SERIES</span><h2><TrendingUp size={17} /> Price & volume study</h2></div><div className="lab-controls"><span className="active">60D</span><span>90D</span><span>1Y</span></div></div><div className="research-chart flex-1 min-h-[320px]"><OHLCVChart data={historyData} /></div></article>
      <article className="market-card genome-profile-card rounded-2xl bg-navy-800/80 p-5 min-h-[410px] flex flex-col"><div className="lab-panel-head"><div><span className="panel-code">LAB-03 / DIMENSIONAL PROFILE</span><h2><Dna size={17} /> Genome radar</h2></div><span className="genome-subject">{selectedAsset}</span></div><div className="flex-1 min-h-[285px]">{selectedGenome ? <GenomeRadarChart genomeData={[selectedGenome]} /> : <div className="h-full grid place-items-center text-slate-500 font-mono text-sm">No genome sample</div>}</div><div className="dimension-key">{dimensions.map((dimension, index) => <span key={dimension}><i style={{ "--i": index }} />{dimension}</span>)}</div></article>
    </section>

    <section className="research-board grid grid-cols-1 xl:grid-cols-2 gap-6">
      <article className="market-card research-volume-card rounded-2xl bg-navy-800/80 p-5 min-h-[330px] flex flex-col"><div className="lab-panel-head"><div><span className="panel-code">LAB-04 / LIQUIDITY COMPARISON</span><h2><BarChart2 size={17} /> Market participation</h2></div><span className="panel-note">TOP UNIVERSE</span></div><div className="flex-1 min-h-[235px]"><VolumeBarChart data={cryptoData} color="#34D399" /></div></article>
      <article className="market-card research-overlay-card rounded-2xl bg-navy-800/80 p-5 min-h-[330px] flex flex-col"><div className="lab-panel-head"><div><span className="panel-code">LAB-05 / COHORT OVERLAY</span><h2><Activity size={17} /> Behavioral divergence</h2></div><span className="panel-note">3 ASSETS</span></div><div className="flex-1 min-h-[235px]"><GenomeRadarChart genomeData={mockGenome.slice(0, 3)} /></div><div className="cohort-footer"><SlidersHorizontal size={13} /><span>Compare relative dimension intensity across the leading cohort.</span></div></article>
    </section>
  </div>
}