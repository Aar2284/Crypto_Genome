import { useMemo } from "react"
import { motion } from "framer-motion"
import { Activity, ArrowRight, Database, GitBranch, Radio, RefreshCw, Server, ShieldCheck, Zap } from "lucide-react"
import PipelineStatus from "../components/ui/PipelineStatus.jsx"
import useCryptoStore from "../store/useCryptoStore.js"
import { mockAssets } from "../utils/mockData.js"

const streamLogs = [
  ["NOW", "OK", "BTC/USD candle batch committed"], ["-02S", "OK", "ETH/USD stream synchronized"], ["-05S", "INFO", "Genome recalculation queued"], ["-08S", "OK", "Dimension vectors persisted"], ["-18S", "WARN", "SOL latency threshold observed"], ["-30S", "INFO", "Airflow DAG healthy"],
]
const stages = [
  ["01", "Ingest", "Exchange adapters", Zap], ["02", "Stream", "Kafka transit", RefreshCw], ["03", "Compute", "Genome engine", Activity], ["04", "Store", "PostgreSQL", Database], ["05", "Serve", "API + sockets", Server],
]

export default function PipelineMonitor() {
  const metrics = useCryptoStore((state) => state.metrics) || {}
  const wsStatus = useCryptoStore((state) => state.wsStatus)
  const cryptoData = useCryptoStore((state) => state.cryptoData)
  const isLive = wsStatus === "connected"
  const recentAssets = useMemo(() => (cryptoData || mockAssets).slice(0, 7), [cryptoData])
  const statCells = [["Events / sec", metrics.events_per_second ?? 4230, "cyan"], ["Active streams", metrics.active_streams ?? 15, "green"], ["Transit latency", `${metrics.total_latency_ms ?? 45}ms`, "violet"], ["Assets in scope", cryptoData.length, "gold"]]

  return <div className="noc-page space-y-6 max-w-[1600px] mx-auto pb-12 px-4 md:px-0">
    <section className="noc-hero"><div><div className="noc-kicker"><Radio size={13} /> Operations control room</div><h1>PIPELINE<br /><span>NOC CONSOLE</span></h1><p>Observe live market ingestion from exchange feed to behavioral intelligence.</p></div><div className="noc-health"><ShieldCheck size={28} /><div><span>Network posture</span><strong>{isLive ? "ALL SYSTEMS NOMINAL" : "REPLAY MONITORING"}</strong></div><i className={isLive ? "online" : "idle"} /></div></section>

    <section className="noc-services"><div className="section-kicker"><span>01</span> Service mesh <i /></div><PipelineStatus metrics={metrics} isConnected={isLive} /></section>

    <section className="market-card flowboard rounded-2xl bg-navy-800/80 p-5"><div className="flowboard-head"><div><span className="panel-code">NOC-01 / EVENT PATH</span><h2><GitBranch size={17} /> Data flow topology</h2></div><span><i /> {isLive ? "Packets are flowing" : "Awaiting upstream feed"}</span></div><div className="flow-stages">{stages.map(([id, label, detail, Icon], index) => <div className="flow-stage-wrap" key={label}><motion.article initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * .08 }} className="flow-stage"><span>{id}</span><div className="flow-icon"><Icon size={20} /></div><strong>{label}</strong><small>{detail}</small><i /></motion.article>{index < stages.length - 1 && <div className="flow-link"><b /><ArrowRight size={14} /></div>}</div>)}</div><div className="flow-foot">{["EXCHANGE TICKS", "VALIDATED EVENTS", "GENOME SIGNALS", "CLIENT DELIVERY"].map((label) => <span key={label}>{label}</span>)}</div></section>

    <section className="noc-board grid grid-cols-1 xl:grid-cols-[.9fr_1.1fr] gap-6"><article className="market-card noc-stats rounded-2xl bg-navy-800/80 p-5"><div className="lab-panel-head"><div><span className="panel-code">NOC-02 / THROUGHPUT</span><h2><Zap size={17} /> Ingestion telemetry</h2></div><span className="panel-note">LIVE SAMPLE</span></div><div className="noc-stat-grid">{statCells.map(([label, value, tone]) => <div key={label} className={`noc-stat tone-${tone}`}><span>{label}</span><strong>{typeof value === "number" ? value.toLocaleString() : value}</strong><i /></div>)}</div><div className="processed-assets"><span>Recently processed</span><div>{recentAssets.map((asset) => <b key={asset.symbol}>{asset.symbol}</b>)}</div></div></article><article className="market-card stream-terminal rounded-2xl bg-navy-800/80 p-5"><div className="lab-panel-head"><div><span className="panel-code">NOC-03 / STREAM TERMINAL</span><h2><Activity size={17} /> Event console</h2></div><span className="terminal-status"><i /> BUFFER CLEAR</span></div><div className="terminal-window"><div className="terminal-head"><span>TIME</span><span>LEVEL</span><span>MESSAGE</span></div>{streamLogs.map(([time, level, message], index) => <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .05 }} className="terminal-row" key={message}><time>{time}</time><b className={level.toLowerCase()}>{level}</b><span>{message}</span></motion.div>)}</div></article></section>
  </div>
}