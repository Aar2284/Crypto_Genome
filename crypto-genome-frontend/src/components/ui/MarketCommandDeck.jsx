import { Activity, BarChart3, Radio, ShieldCheck, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

const depthBars = [88, 71, 56, 83, 46, 67, 91, 52]

export default function MarketCommandDeck({ btcPrice, btcChange, volume, assets, isLive, latency }) {
  const positive = (btcChange || 0) >= 0

  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="command-deck">
      <div className="command-main">
        <div className="command-eyebrow"><Radio size={12} /><span>Realtime crypto intelligence</span><i /></div>
        <h1>MARKET<br /><span>COMMAND DECK</span></h1>
        <p>Price discovery, live pipeline telemetry, and behavioral genome signals in one institutional workspace.</p>
        <div className="command-tags">
          <span><ShieldCheck size={13} /> {isLive ? "Backend stream verified" : "Market replay mode"}</span>
          <span><Activity size={13} /> {latency ? `${latency}ms telemetry` : "Signal latency nominal"}</span>
        </div>
      </div>

      <div className="command-quote">
        <div className="quote-topline"><span>BTC / USD</span><span className={positive ? "quote-positive" : "quote-negative"}>{positive ? "▲" : "▼"} {Math.abs(btcChange || 0).toFixed(2)}%</span></div>
        <div className="quote-value">{btcPrice || "—"}</div>
        <div className="quote-meta"><span>24H NOTIONAL</span><strong>{volume}</strong></div>
        <div className="depth-stack" aria-label="Visual market depth">
          {depthBars.map((width, index) => <i key={index} className={index < 4 ? "depth-bid" : "depth-ask"} style={{ "--depth": `${width}%` }} />)}
        </div>
        <div className="quote-foot"><TrendingUp size={13} /> Active price discovery</div>
      </div>

      <div className="command-snapshot">
        <div className="snapshot-label"><BarChart3 size={14} /> Market snapshot</div>
        <div className="snapshot-grid">
          <div><span>Tracked assets</span><strong>{assets}</strong></div>
          <div><span>Execution mode</span><strong>{isLive ? "LIVE" : "DEMO"}</strong></div>
          <div><span>Signal quality</span><strong>HIGH</strong></div>
        </div>
        <div className="snapshot-line"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
      </div>
    </motion.section>
  )
}