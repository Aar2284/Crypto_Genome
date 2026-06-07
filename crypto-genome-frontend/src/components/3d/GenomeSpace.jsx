import { useRef, useMemo, useState, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Stars, Html } from "@react-three/drei"
import { motion, AnimatePresence } from "framer-motion"
import useCryptoStore from "../../store/useCryptoStore.js"

// ─── Colors ──────────────────────────────────────────────────────────────────
function getColor(change) {
  if (change >  5) return "#00FF88"
  if (change >  0) return "#00CFFF"
  if (change > -5) return "#FF8C00"
  return "#FF3366"
}

// ─── Orbit ring config ────────────────────────────────────────────────────────
const ORBIT_CONFIG = [
  { radius: 3.0,  tiltDeg: 6,  speed: 0.55, ringColor: "#FFD700", tierLabel: "Tier 1 — Mega Cap" },
  { radius: 5.2,  tiltDeg: 18, speed: 0.35, ringColor: "#00CFFF", tierLabel: "Tier 2 — Large Cap" },
  { radius: 7.8,  tiltDeg: 28, speed: 0.22, ringColor: "#00FF88", tierLabel: "Tier 3 — Mid Cap"   },
  { radius: 11.0, tiltDeg: 12, speed: 0.13, ringColor: "#7B2FBE", tierLabel: "Tier 4 — Small Cap" },
]
// Coins per ring
const COINS_PER_RING = [2, 6, 14, 18]

// ─── Pulsing market core ──────────────────────────────────────────────────────
function MarketCore() {
  const innerRef = useRef()
  const haloRef  = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (innerRef.current) {
      innerRef.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.1)
      innerRef.current.material.emissiveIntensity = 1.8 + Math.sin(t * 3) * 0.6
    }
    if (haloRef.current) {
      haloRef.current.scale.setScalar(1 + Math.sin(t * 1.6 + 1) * 0.15)
      haloRef.current.material.opacity = 0.06 + Math.sin(t * 2) * 0.03
    }
  })

  return (
    <group>
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshStandardMaterial color="#00CFFF" emissive="#00CFFF" emissiveIntensity={1.8} />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[1.1, 16, 16]} />
        <meshBasicMaterial color="#00CFFF" transparent opacity={0.06} />
      </mesh>
      <Html center position={[0, 1.5, 0]} style={{ pointerEvents: "none" }}>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: "8px", color: "#00CFFF80", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
          ◆ MARKET CORE
        </div>
      </Html>
    </group>
  )
}

// ─── Single coin node on orbit ────────────────────────────────────────────────
function OrbitalCoin({ coin, isSelected, onSelect }) {
  const meshRef = useRef()
  const haloRef = useRef()
  const [hovered, setHovered] = useState(false)

  const active = isSelected || hovered
  const color  = getColor(coin.change_24h_pct ?? 0)
  const change = coin.change_24h_pct ?? 0
  // Size: BTC=0.42, ETH=0.32, small caps ~0.12
  const r = useMemo(() => Math.max(0.12, Math.min(0.44, Math.log10((coin.market_cap ?? 1e9) + 1) / 26)), [coin.market_cap])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (meshRef.current) {
      const s = active ? 1 + Math.sin(t * 7) * 0.18 : 1 + Math.sin(t * 1.4) * 0.04
      meshRef.current.scale.setScalar(s)
      meshRef.current.material.emissiveIntensity = active ? 5 : 2.2
    }
    if (haloRef.current) {
      haloRef.current.material.opacity = active ? 0.18 + Math.sin(t * 5) * 0.06 : 0
    }
  })

  return (
    <group>
      {/* invisible hit sphere */}
      <mesh
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={(e) => { e.stopPropagation(); onSelect(coin) }}
      >
        <sphereGeometry args={[r * 3.5, 6, 6]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* halo */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[r * 2.4, 10, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0} />
      </mesh>

      {/* core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[r, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} roughness={0.15} />
      </mesh>

      {/* Label floats above */}
      <Html
        center
        distanceFactor={14}
        position={[0, r + 0.35, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div style={{
          fontFamily: "JetBrains Mono, monospace",
          textAlign: "center",
          userSelect: "none",
          lineHeight: 1.35,
        }}>
          <div style={{
            fontSize: active ? "10.5px" : "8px",
            fontWeight: 700,
            color: active ? "#fff" : "rgba(200,218,235,0.72)",
            textShadow: `0 0 12px ${color}`,
            background: active ? "rgba(1,6,20,0.94)" : "rgba(1,6,20,0.55)",
            border: `1px solid ${color}${active ? "90" : "38"}`,
            borderRadius: "4px",
            padding: active ? "2px 6px" : "1px 4px",
            whiteSpace: "nowrap",
            transition: "all 0.12s",
          }}>
            {coin.symbol}
          </div>
          {active && (
            <div style={{ fontSize: "8px", color, fontWeight: 700, marginTop: "2px", textShadow: `0 0 6px ${color}` }}>
              {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}

// ─── One complete orbital ring (tilt + rotate) ────────────────────────────────
function OrbitalRing({ coins, radius, tiltDeg, speed, ringColor, selectedSymbol, onSelect }) {
  const spinRef = useRef()

  useFrame((_, dt) => {
    if (spinRef.current) spinRef.current.rotation.y += speed * dt
  })

  const tiltRad = (tiltDeg * Math.PI) / 180

  return (
    // Outer group = static tilt
    <group rotation={[tiltRad, 0, 0]}>
      {/* Orbit path visual */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.016, 4, 180]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.22} />
      </mesh>

      {/* Spinning group = coins orbit */}
      <group ref={spinRef}>
        {coins.map((coin, i) => {
          const angle = (i / coins.length) * Math.PI * 2
          const x = radius * Math.cos(angle)
          const z = radius * Math.sin(angle)
          return (
            <group key={coin.symbol} position={[x, 0, z]}>
              <OrbitalCoin
                coin={coin}
                isSelected={selectedSymbol === coin.symbol}
                onSelect={onSelect}
              />
            </group>
          )
        })}
      </group>
    </group>
  )
}

// ─── Genome / detail panel (DOM) ──────────────────────────────────────────────
function GenomePanel({ coin, tierLabel, onClose }) {
  if (!coin) return null
  const change = coin.change_24h_pct ?? 0
  const color  = getColor(change)
  const isUp   = change >= 0
  const fmt    = (n, o) => n != null ? new Intl.NumberFormat("en-US", o).format(n) : "—"
  const price  = fmt(coin.current_price, { style: "currency", currency: "USD", minimumFractionDigits: coin.current_price < 1 ? 4 : 2 })
  const mcap   = coin.market_cap ? `$${fmt(coin.market_cap, { notation: "compact", maximumFractionDigits: 2 })}` : "—"
  const vol    = coin.volume_24h ? `$${fmt(coin.volume_24h, { notation: "compact", maximumFractionDigits: 2 })}` : "—"

  const volPct     = Math.min(1, Math.abs(change) / 12)
  const liqRatio   = Math.min(1, ((coin.volume_24h ?? 0) / (coin.market_cap ?? 1)) * 6)
  const dominance  = Math.min(1, (coin.market_cap ?? 0) / 1.3e12)
  const momScore   = Math.max(0, (change + 12) / 24)

  return (
    <motion.div
      key={coin.symbol}
      initial={{ opacity: 0, x: 16, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 12, scale: 0.95 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute top-3 right-3 z-30 w-60"
      style={{
        background: "#010a18",
        border: `1.5px solid ${color}50`,
        borderRadius: "16px",
        boxShadow: `0 24px 64px rgba(0,0,0,0.98), 0 0 32px ${color}18, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="font-display font-extrabold text-white text-lg leading-none">{coin.name}</div>
            <div className="font-mono text-[9px] mt-1.5 flex items-center gap-2" style={{ color }}>
              <span className="w-2 h-2 rounded-full animate-pulse inline-block" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              {coin.symbol}
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-white text-sm transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            ✕
          </button>
        </div>

        {/* Price */}
        <div className="font-display font-extrabold text-white text-2xl tabular-nums leading-none">{price}</div>
        <div className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-full mt-1.5 mb-4"
          style={{ background: `${color}1a`, border: `1px solid ${color}40`, color }}>
          {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)}% past 24 hours
        </div>

        {/* Orbit tier */}
        <div className="flex items-center gap-2 mb-4 p-2 rounded-lg"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-lg">🪐</span>
          <div>
            <div className="font-mono text-[9px] text-slate-500 uppercase tracking-wide">Market Cap Orbit</div>
            <div className="font-mono text-[11px] text-slate-200 font-bold">{tierLabel}</div>
          </div>
        </div>

        {/* Genome bars */}
        <div className="space-y-2 mb-4">
          {[
            { label: "Volatility",    value: volPct,    desc: "How wildly this coin swings" },
            { label: "Liquidity",     value: liqRatio,  desc: "Volume relative to market cap" },
            { label: "Momentum",      value: momScore,  desc: "Price direction strength" },
            { label: "Mkt Dominance", value: dominance, desc: "Share of all crypto value" },
          ].map(({ label, value, desc }) => (
            <div key={label}>
              <div className="flex justify-between font-mono text-[8px] mb-1">
                <span className="text-slate-400">{label}</span>
                <span className="font-bold" style={{ color }}>{(value * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${color}70, ${color})` }}
                  initial={{ width: 0 }} animate={{ width: `${value * 100}%` }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                />
              </div>
              <div className="font-mono text-[7px] text-slate-600 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>

        {/* Market stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { l: "Market Cap",  v: mcap, s: "Total value" },
            { l: "24h Volume",  v: vol,  s: "USD traded today" },
          ].map(({ l, v, s }) => (
            <div key={l} className="p-2.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="font-mono text-[7px] text-slate-600 uppercase tracking-wide">{l}</div>
              <div className="font-mono text-[12px] text-white font-bold mt-0.5">{v}</div>
              <div className="font-mono text-[7px] text-slate-700 mt-0.5">{s}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 font-mono text-[7px] text-slate-700 text-center border-t pt-2"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          Click anywhere to deselect
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function GenomeSpace() {
  const cryptoData = useCryptoStore((s) => s.cryptoData)

  // Sort by market cap → assign to rings
  const ranked = useMemo(() =>
    [...(cryptoData ?? [])].sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0)),
    [cryptoData]
  )

  // Distribute top 40 across 4 rings
  const ringCoins = useMemo(() => {
    const top40 = ranked.slice(0, 40)
    const rings = []
    let offset = 0
    for (const count of COINS_PER_RING) {
      rings.push(top40.slice(offset, offset + count))
      offset += count
    }
    return rings
  }, [ranked])

  // Which tier is a coin in?
  const tierOf = useCallback((symbol) => {
    for (let r = 0; r < ringCoins.length; r++) {
      if (ringCoins[r].some(c => c.symbol === symbol)) return ORBIT_CONFIG[r].tierLabel
    }
    return ""
  }, [ringCoins])

  const [selectedCoin, setSelectedCoin] = useState(null)

  const handleSelect = useCallback((coin) => {
    setSelectedCoin(prev => prev?.symbol === coin.symbol ? null : coin)
  }, [])
  const handleDeselect = useCallback(() => setSelectedCoin(null), [])

  return (
    <div className="w-full h-full relative select-none overflow-hidden">

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 12, 22], fov: 52 }} dpr={[1, 1.5]} gl={{ antialias: true }}
        onPointerMissed={handleDeselect}>
        <Stars radius={140} depth={80} count={2800} factor={3} fade speed={0.5} />
        <ambientLight intensity={0.10} />
        <pointLight position={[0, 10, 0]}    color="#00CFFF" intensity={1.2} />
        <pointLight position={[-12, -6, -8]} color="#7B2FBE" intensity={0.9} />
        <pointLight position={[12, 4, 8]}    color="#00FF88" intensity={0.5} />

        <MarketCore />

        {ringCoins.map((coins, ri) => (
          <OrbitalRing
            key={ri}
            coins={coins}
            radius={ORBIT_CONFIG[ri].radius}
            tiltDeg={ORBIT_CONFIG[ri].tiltDeg}
            speed={ORBIT_CONFIG[ri].speed}
            ringColor={ORBIT_CONFIG[ri].ringColor}
            selectedSymbol={selectedCoin?.symbol}
            onSelect={handleSelect}
          />
        ))}

        <OrbitControls
          enablePan={false}
          enableZoom
          autoRotate={!selectedCoin}
          autoRotateSpeed={0.18}
          minDistance={8}
          maxDistance={32}
          dampingFactor={0.06}
          enableDamping
        />
      </Canvas>

      {/* Description */}
      <div className="absolute top-2 left-3 z-10 pointer-events-none">
        <p className="text-[9px] font-mono text-slate-500 leading-relaxed max-w-xs">
          <span className="font-bold" style={{ color: "#00CFFF" }}>MARKET ORBITS</span> —
          inner ring = biggest coins. Outer = smaller caps.
          Color = 24h change. Click any coin to inspect.
        </p>
      </div>

      {/* Orbit tier legend */}
      <div className="absolute bottom-3 left-3 z-10 p-2.5 rounded-xl border space-y-1.5"
        style={{ background: "#010a18", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="font-mono text-[8px] text-slate-600 uppercase tracking-widest mb-2">Market Cap Tiers</div>
        {ORBIT_CONFIG.map((cfg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 h-px rounded-full shrink-0" style={{ background: cfg.ringColor, boxShadow: `0 0 4px ${cfg.ringColor}`, display: "inline-block", height: "2px" }} />
            <span className="font-mono text-[9px] text-slate-400">{cfg.tierLabel.split(" — ")[1]}</span>
          </div>
        ))}
        <div className="border-t mt-2 pt-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="font-mono text-[8px] text-slate-600 uppercase tracking-widest mb-1.5">24h Performance</div>
          {[
            { color: "#00FF88", label: "Strong gain  > +5%" },
            { color: "#00CFFF", label: "Mild gain    0 – +5%" },
            { color: "#FF8C00", label: "Mild loss    0 – −5%" },
            { color: "#FF3366", label: "Strong loss  < −5%" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
              <span className="font-mono text-[8px] text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Coin detail panel */}
      <AnimatePresence>
        {selectedCoin && (
          <GenomePanel
            coin={selectedCoin}
            tierLabel={tierOf(selectedCoin.symbol)}
            onClose={handleDeselect}
          />
        )}
      </AnimatePresence>

      {/* Hint */}
      <AnimatePresence>
        {!selectedCoin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="font-mono text-[9px] text-slate-500 whitespace-nowrap px-3 py-1.5 rounded-full border"
              style={{ background: "rgba(1,10,24,0.85)", borderColor: "rgba(255,255,255,0.07)" }}>
              🖱 Scroll to zoom · Drag to tilt view · Click any coin to inspect
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
