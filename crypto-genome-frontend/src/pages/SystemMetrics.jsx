import { motion } from "framer-motion"
import { Activity, Cpu, Database, Gauge, HardDrive, Radio, Server, ShieldCheck, Wifi } from "lucide-react"
import useCryptoStore from "../store/useCryptoStore.js"

const services = [
  ["FastAPI", "Gateway + websocket", Server, "accent"],
  ["PostgreSQL", "Historical warehouse", HardDrive, "cyber"],
  ["Kafka", "Event transit", Wifi, "neon"],
  ["Compute", "System capacity", Cpu, "gold"],
]

export default function SystemMetrics() {
  const metrics = useCryptoStore((state) => state.metrics) || {}
  const wsStatus = useCryptoStore((state) => state.wsStatus)
  const isLive = wsStatus === "connected"
  const latency = metrics.total_latency_ms ?? 45
  const events = metrics.events_per_second ?? 4230
  const streams = metrics.active_streams ?? 15
  const gauge = Math.min(92, Math.max(28, Math.round((events / 6000) * 100)))

  return (
    <div className="observatory-page space-y-6 max-w-[1600px] mx-auto pb-12 px-4 md:px-0">
      <section className="observatory-hero">
        <div className="observatory-title">
          <div className="observatory-kicker"><Gauge size={13} /> Infrastructure observatory</div>
          <h1>SYSTEM<br /><span>TELEMETRY</span></h1>
          <p>Read the live health of the infrastructure that turns market events into genome intelligence.</p>
        </div>
        <div className="health-dial" style={{ "--gauge": `${gauge * 3.6}deg` }}>
          <div><strong>{gauge}%</strong><span>CAPACITY</span></div>
        </div>
        <div className="observatory-status">
          <ShieldCheck size={17} /><span>Backend state</span><strong>{isLive ? "ONLINE" : "STANDBY"}</strong><i className={isLive ? "online" : "idle"} />
        </div>
      </section>

      <section className="metrics-rack">
        {[
          ["System health", metrics.system_health ?? "healthy", "status"],
          ["API latency", `${latency}ms`, "latency"],
          ["Active streams", streams.toLocaleString(), "streams"],
          ["Events / sec", events.toLocaleString(), "events"],
        ].map(([label, value, type], index) => (
          <motion.article key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }} className={`rack-unit rack-${type}`}>
            <span>{label}</span><strong>{value}</strong><div>{Array.from({ length: 8 }, (_, led) => <i key={led} />)}</div>
          </motion.article>
        ))}
      </section>

      <section className="service-rack">
        <div className="section-kicker"><span>01</span> Service rack <i /></div>
        <div className="service-grid">
          {services.map(([name, description, Icon, tone], index) => (
            <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} key={name} className={`service-module tone-${tone}`}>
              <div className="module-head"><span>NODE {String(index + 1).padStart(2, "0")}</span><i className={isLive ? "online" : "idle"} /></div>
              <Icon size={24} /><h2>{name}</h2><p>{description}</p>
              <div className="module-load"><span>Readiness</span><b style={{ "--load": `${68 + index * 7}%` }} /></div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="observatory-board grid grid-cols-1 xl:grid-cols-[1.1fr_.9fr] gap-6">
        <article className="market-card telemetry-field rounded-2xl bg-navy-800/80 p-5">
          <div className="lab-panel-head"><div><span className="panel-code">OBS-01 / EVENT VELOCITY</span><h2><Activity size={17} /> Throughput field</h2></div><span className="panel-note">1 MIN WINDOW</span></div>
          <div className="velocity-field">{Array.from({ length: 36 }, (_, index) => <i key={index} style={{ "--height": `${20 + ((index * 29 + 17) % 72)}%`, "--delay": `${index * 45}ms` }} />)}</div>
          <div className="velocity-axis"><span>-60s</span><span>-45s</span><span>-30s</span><span>-15s</span><span>NOW</span></div>
        </article>
        <article className="market-card observatory-ledger rounded-2xl bg-navy-800/80 p-5">
          <div className="lab-panel-head"><div><span className="panel-code">OBS-02 / NODE LEDGER</span><h2><Database size={17} /> Infrastructure notes</h2></div><span className="panel-note">SYNCHRONIZED</span></div>
          <div className="ledger-list">
            <div><span>API gateway</span><b>{latency}ms response</b><i /></div>
            <div><span>Stream processor</span><b>{events.toLocaleString()} events/s</b><i /></div>
            <div><span>Storage queue</span><b>0 pending writes</b><i /></div>
            <div><span>Websocket fleet</span><b>{streams} active channels</b><i /></div>
          </div>
          <div className="ledger-foot"><Radio size={13} /> Observability sample refreshed from active store.</div>
        </article>
      </section>
    </div>
  )
}