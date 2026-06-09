import { useRef, useMemo, useState, useCallback, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Stars, Html, Line } from "@react-three/drei"
import { motion, AnimatePresence } from "framer-motion"
import * as THREE from "three"
import useCryptoStore from "../../store/useCryptoStore.js"

// ── Config ────────────────────────────────────────────────────────────────────
const ORBIT_CONFIG = [
  { radius: 3.2, tiltDeg: 6, speed: 0.55, ringColor: "#FFD700", tier: "Tier 1 · Mega Cap" },
  { radius: 5.5, tiltDeg: 20, speed: 0.35, ringColor: "#00CFFF", tier: "Tier 2 · Large Cap" },
  { radius: 8.2, tiltDeg: 30, speed: 0.21, ringColor: "#00FF88", tier: "Tier 3 · Mid Cap" },
  { radius: 11.4, tiltDeg: 12, speed: 0.12, ringColor: "#A855F7", tier: "Tier 4 · Small Cap" },
]
const COINS_PER_RING = [2, 6, 14, 18]

function getColor(change) {
  if (change > 5) return "#00FF88"
  if (change > 0) return "#00CFFF"
  if (change > -5) return "#FF8C00"
  return "#FF3366"
}
function getCoinRadius(mcap) {
  return Math.max(0.25, Math.min(0.75, Math.log10((mcap ?? 1e9) + 1) / 16))
}

function formatPrice(price) {
  if (price == null) return "—"
  if (price < 0.01) {
    return "$" + price.toLocaleString(undefined, { maximumSignificantDigits: 4 })
  }
  return "$" + price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Instanced dust particles along each orbit ──────────────────────────────────
function OrbitalDust({ radius, tiltDeg, color }) {
  const ref = useRef()
  const COUNT = 140

  useEffect(() => {
    if (!ref.current) return
    const m = new THREE.Matrix4()
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * Math.PI * 2
      const jitter = (Math.sin(i * 7.3) * 0.04)
      m.setPosition(
        (radius + jitter) * Math.cos(a),
        (Math.sin(i * 3.7) * 0.05),
        (radius + jitter) * Math.sin(a)
      )
      ref.current.setMatrixAt(i, m)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [radius])

  return (
    <group rotation={[(tiltDeg * Math.PI) / 180, 0, 0]}>
      <instancedMesh ref={ref} args={[null, null, COUNT]}>
        <sphereGeometry args={[0.012, 4, 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} />
      </instancedMesh>
    </group>
  )
}

// ── Pulsing gyroscope core ────────────────────────────────────────────────────
function MarketCore() {
  const innerRef = useRef()
  const ring1Ref = useRef()
  const ring2Ref = useRef()
  const ring3Ref = useRef()
  const halos = [useRef(), useRef()]

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (innerRef.current) {
      innerRef.current.scale.setScalar(1 + Math.sin(t * 2.4) * 0.12)
      innerRef.current.material.emissiveIntensity = 2 + Math.sin(t * 3.2) * 0.7
    }
    if (ring1Ref.current) ring1Ref.current.rotation.y = t * 1.1
    if (ring2Ref.current) ring2Ref.current.rotation.x = t * 0.8
    if (ring3Ref.current) ring3Ref.current.rotation.z = t * 0.6
    halos.forEach((h, i) => {
      if (h.current) {
        h.current.scale.setScalar(1 + Math.sin(t * 1.5 + i * 1.2) * 0.18)
        h.current.material.opacity = 0.04 + Math.sin(t * 1.8 + i) * 0.02
      }
    })
  })

  return (
    <group>
      {/* Atmosphere halos */}
      {halos.map((h, i) => (
        <mesh key={i} ref={h}>
          <sphereGeometry args={[1.4 + i * 0.5, 16, 16]} />
          <meshBasicMaterial color="#00CFFF" transparent opacity={0.04} />
        </mesh>
      ))}

      {/* Core sphere */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.55, 28, 28]} />
        <meshStandardMaterial color="#00CFFF" emissive="#00CFFF" emissiveIntensity={2} />
      </mesh>

      {/* Gyroscope rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.1, 0.022, 4, 80]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.7} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.018, 4, 80]} />
        <meshBasicMaterial color="#00FF88" transparent opacity={0.55} />
      </mesh>
      <mesh ref={ring3Ref} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[1.1, 0.014, 4, 80]} />
        <meshBasicMaterial color="#A855F7" transparent opacity={0.5} />
      </mesh>

      {/* Label */}
      <Html center position={[0, 1.8, 0]} style={{ pointerEvents: "none" }}>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: "7.5px", color: "#00CFFF", opacity: 0.55, letterSpacing: "0.12em", whiteSpace: "nowrap" }}>
          ◆ MARKET CORE
        </div>
      </Html>
    </group>
  )
}

// ── Comet trail ───────────────────────────────────────────────────────────────
function CometTrail({ angle, radius, color }) {
  const pts = useMemo(() => {
    const all = []
    for (let i = 0; i <= 22; i++) {
      const a = angle - (i / 22) * 0.55
      all.push([radius * Math.cos(a), 0, radius * Math.sin(a)])
    }
    return all
  }, [angle, radius])

  return (
    <>
      <Line points={pts} color={color} lineWidth={0.8} transparent opacity={0.12} />
      <Line points={pts.slice(0, 14)} color={color} lineWidth={1.5} transparent opacity={0.25} />
      <Line points={pts.slice(0, 7)} color={color} lineWidth={2.5} transparent opacity={0.65} />
    </>
  )
}

// ── Sparkle ring (selected state) ─────────────────────────────────────────────
function SparkleRing({ r, color }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 3.5
  })
  const pts = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2
    return [(r + 0.3) * Math.cos(a), 0, (r + 0.3) * Math.sin(a)]
  }), [r])

  return (
    <group ref={ref}>
      {pts.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.022, 4, 4]} />
          <meshBasicMaterial color={color} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  )
}

// ── Single coin on orbit ───────────────────────────────────────────────────────
function OrbitalCoin({ coin, ringColor, isSelected, isDimmed, onSelect, onHover }) {
  const coreRef = useRef()
  const haloRef = useRef()
  const [hov, setHov] = useState(false)
  const active = isSelected || hov
  const color = getColor(coin.change_24h_pct ?? 0)
  const r = getCoinRadius(coin.market_cap)
  const change = coin.change_24h_pct ?? 0

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (coreRef.current) {
      const scale = isSelected
        ? 1.5 + Math.sin(t * 6) * 0.18
        : hov
          ? 1.2 + Math.sin(t * 4) * 0.08
          : 1 + Math.sin(t * 1.3) * 0.04
      coreRef.current.scale.setScalar(scale)
      coreRef.current.material.emissiveIntensity = isSelected ? 4 : hov ? 2.8 : isDimmed ? 0.4 : 1.4
      coreRef.current.material.opacity = isDimmed ? 0.35 : 1
    }
    if (haloRef.current) {
      haloRef.current.material.opacity = active
        ? 0.2 + Math.sin(t * 5) * 0.08
        : isDimmed ? 0 : 0
    }
  })

  return (
    <group>
      {/* Hit area */}
      <mesh
        onPointerEnter={(e) => { e.stopPropagation(); setHov(true); onHover(coin.symbol) }}
        onPointerLeave={() => { setHov(false); onHover(null) }}
        onPointerDown={(e) => { e.stopPropagation(); onSelect(coin) }}
      >
        <sphereGeometry args={[r * 3.5, 6, 6]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Halo */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[r * 2.6, 10, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0} />
      </mesh>

      {/* Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[r, 18, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} transparent roughness={0.2} />
      </mesh>

      {/* Selection fx */}
      {isSelected && <SparkleRing r={r} color={color} />}
      {isSelected && (
        <group>
          <mesh>
            <torusGeometry args={[r * 1.5, 0.03, 4, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r * 1.5, 0.03, 4, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
          </mesh>
        </group>
      )}

      {/* Label */}
      {!isDimmed && (
        <Html center distanceFactor={14} position={[0, r + 0.6, 0]} style={{ pointerEvents: "none" }}>
          <div style={{
            fontFamily: "JetBrains Mono, monospace",
            textAlign: "center",
            userSelect: "none",
          }}>
            <div style={{
              fontSize: isSelected ? "15px" : hov ? "13px" : "11px",
              fontWeight: 700,
              color: active ? "#fff" : "rgba(195,215,235,0.85)",
              textShadow: `0 0 7px ${color}88`,
              background: active ? "rgba(0,4,16,0.97)" : "rgba(0,4,14,0.7)",
              border: `1px solid ${color}${active ? "80" : "45"}`,
              borderRadius: "5px",
              padding: active ? "3px 9px" : "2px 6px",
              whiteSpace: "nowrap",
              transition: "all 0.12s ease",
              letterSpacing: "0.04em",
            }}>
              <span style={{ color: ringColor, marginRight: "5px", fontSize: "0.75em", opacity: 0.85 }}>●</span>
              {coin.symbol}
            </div>
            {active && (
              <div style={{ fontSize: "10px", color, fontWeight: 700, marginTop: "3px", textShadow: `0 0 5px ${color}88` }}>
                {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

// ── One orbital ring with dust + trail + coins ─────────────────────────────────
function OrbitalRing({ coins, cfgIdx, selectedSymbol, hoveredSymbol, onSelect, onHover }) {
  const { radius, tiltDeg, speed, ringColor } = ORBIT_CONFIG[cfgIdx]
  const spinRef = useRef()
  const tiltRad = (tiltDeg * Math.PI) / 180

  useFrame((_, dt) => {
    if (spinRef.current) spinRef.current.rotation.y += speed * dt
  })

  return (
    <group rotation={[tiltRad, 0, 0]}>
      {/* Orbit path */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.015, 4, 200]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.4} />
      </mesh>

      {/* Orbital dust */}
      <OrbitalDust radius={radius} tiltDeg={0} color={ringColor} />

      {/* Spinning group (coins + trails rotate together) */}
      <group ref={spinRef}>
        {coins.map((coin, i) => {
          const angle = (i / coins.length) * Math.PI * 2
          const x = radius * Math.cos(angle)
          const z = radius * Math.sin(angle)
          const isDimmed = !!hoveredSymbol && hoveredSymbol !== coin.symbol && selectedSymbol !== coin.symbol

          return (
            <group key={coin.symbol}>
              {/* Comet trail */}
              {!isDimmed && (
                <CometTrail
                  angle={angle}
                  radius={radius}
                  color={getColor(coin.change_24h_pct ?? 0)}
                />
              )}
              {/* Coin */}
              <group position={[x, 0, z]}>
                <OrbitalCoin
                  coin={coin}
                  ringColor={ringColor}
                  isSelected={selectedSymbol === coin.symbol}
                  isDimmed={isDimmed}
                  onSelect={onSelect}
                  onHover={onHover}
                />
              </group>
            </group>
          )
        })}
      </group>
    </group>
  )
}

// ── Scrolling price ticker ─────────────────────────────────────────────────────
function PriceTicker({ coins }) {
  const items = useMemo(() =>
    [...coins, ...coins].map((c, i) => ({
      ...c,
      key: `${c.symbol}-${i}`,
    })),
    [coins]
  )

  return (
    <div className="absolute top-0 left-0 right-0 z-20 h-7 overflow-hidden flex items-center"
      style={{ background: "linear-gradient(90deg, rgba(1,10,24,0.98) 0%, rgba(1,10,24,0.7) 8%, rgba(1,10,24,0.7) 92%, rgba(1,10,24,0.98) 100%)" }}>
      <style>{`@keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div style={{ display: "flex", gap: "28px", animation: "tickerScroll 55s linear infinite", whiteSpace: "nowrap", willChange: "transform" }}>
        {items.map(c => {
          const color = getColor(c.change_24h_pct ?? 0)
          const price = formatPrice(c.current_price)
          return (
            <span key={c.key} style={{ fontFamily: "JetBrains Mono", fontSize: "10px", display: "inline-flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
              <span style={{ color, fontWeight: 700 }}>{c.symbol}</span>
              <span style={{ color: "rgba(200,215,235,0.75)" }}>{price}</span>
              <span style={{ color, fontWeight: 600 }}>{c.change_24h_pct >= 0 ? "▲" : "▼"}{Math.abs(c.change_24h_pct ?? 0).toFixed(1)}%</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────────
function GenomePanel({ coin, cfgIdx, onClose }) {
  if (!coin) return null
  const change = coin.change_24h_pct ?? 0
  const color = getColor(change)
  const isUp = change >= 0
  const cfg = ORBIT_CONFIG[cfgIdx]
  const fmt = (n, o) => n != null ? new Intl.NumberFormat("en-US", o).format(n) : "—"
  const price = formatPrice(coin.current_price)
  const mcap = coin.market_cap ? `$${fmt(coin.market_cap, { notation: "compact", maximumFractionDigits: 2 })}` : "—"
  const vol = coin.volume_24h ? `$${fmt(coin.volume_24h, { notation: "compact", maximumFractionDigits: 2 })}` : "—"

  const volScore = Math.min(1, Math.abs(change) / 12)
  const liqScore = Math.min(1, ((coin.volume_24h ?? 0) / (coin.market_cap ?? 1)) * 6)
  const momScore = Math.max(0, (change + 12) / 24)
  const domScore = Math.min(1, (coin.market_cap ?? 0) / 1.3e12)

  // Mini orbit ring diagram
  const RingDiagram = () => (
    <svg width="64" height="64" viewBox="-32 -32 64 64" style={{ flexShrink: 0 }}>
      {ORBIT_CONFIG.map((c, i) => (
        <circle key={i} cx={0} cy={0} r={8 + i * 7} fill="none"
          stroke={i === cfgIdx ? c.ringColor : `${c.ringColor}35`}
          strokeWidth={i === cfgIdx ? 1.5 : 0.6} />
      ))}
      <circle cx={0} cy={0} r={2.5} fill="#00CFFF" opacity={0.9} />
      {/* Selected coin dot on its ring */}
      {(() => {
        const r = 8 + cfgIdx * 7
        return <circle cx={r} cy={0} r={2} fill={cfg.ringColor} />
      })()}
    </svg>
  )

  return (
    <motion.div
      key={coin.symbol}
      initial={{ opacity: 0, x: 20, scale: 0.93 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 16, scale: 0.93 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="absolute top-10 right-4 z-30 w-62 max-h-[88%] overflow-y-auto scrollbar-hide"
      style={{ width: 248, background: "#010b1b", border: `1.5px solid ${color}55`, borderRadius: "18px", boxShadow: `0 28px 72px rgba(0,0,0,0.99), 0 0 40px ${color}15, inset 0 1px 0 rgba(255,255,255,0.04)` }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="font-display font-extrabold text-white text-lg leading-none">{coin.name}</div>
            <div className="font-mono text-[9px] mt-1.5 flex items-center gap-2" style={{ color }}>
              <span className="w-2 h-2 rounded-full animate-pulse inline-block" style={{ background: color, boxShadow: `0 0 7px ${color}` }} />
              {coin.symbol} · Cryptocurrency
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-white text-xs transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
            ✕
          </button>
        </div>

        {/* Price */}
        <div className="font-display font-extrabold text-white tabular-nums leading-none" style={{ fontSize: "22px" }}>{price}</div>
        <div className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-full mt-2 mb-3"
          style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>
          {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)}% past 24 hours
        </div>

        {/* Orbit ring diagram + tier */}
        <div className="flex items-center gap-3 mb-4 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <RingDiagram />
          <div>
            <div className="font-mono text-[8px] text-slate-600 uppercase tracking-widest">Market Orbit</div>
            <div className="font-mono text-[11px] font-bold mt-0.5" style={{ color: cfg.ringColor }}>{cfg.tier}</div>
            <div className="font-mono text-[8px] text-slate-600 mt-1">Inner ring = largest market cap</div>
          </div>
        </div>

        {/* Genome bars */}
        <div className="space-y-2.5 mb-4">
          {[
            { label: "Volatility", val: volScore, tip: "How violently price swings" },
            { label: "Liquidity", val: liqScore, tip: "Volume ÷ market cap ratio" },
            { label: "Momentum", val: momScore, tip: "Directional price strength" },
            { label: "Dominance", val: domScore, tip: "Share of global crypto market" },
          ].map(({ label, val, tip }) => (
            <div key={label}>
              <div className="flex justify-between font-mono text-[8px] mb-1">
                <span className="text-slate-400">{label}</span>
                <span className="font-bold" style={{ color }}>{(val * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}60, ${color})` }}
                  initial={{ width: 0 }} animate={{ width: `${val * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
              </div>
              <div className="font-mono text-[7px] text-slate-700 mt-0.5">{tip}</div>
            </div>
          ))}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {[{ l: "Market Cap", v: mcap, s: "Total coins × price" }, { l: "24h Volume", v: vol, s: "USD traded today" }].map(({ l, v, s }) => (
            <div key={l} className="p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="font-mono text-[7px] text-slate-600 uppercase tracking-wide">{l}</div>
              <div className="font-mono text-sm text-white font-bold mt-0.5">{v}</div>
              <div className="font-mono text-[7px] text-slate-700 mt-0.5">{s}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 font-mono text-[7px] text-slate-700 text-center border-t pt-2.5" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          Click background to close · Scroll to zoom
        </div>
      </div>
    </motion.div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function GenomeSpace() {
  const cryptoData = useCryptoStore((s) => s.cryptoData)

  const ranked = useMemo(() =>
    [...(cryptoData ?? [])].sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0)),
    [cryptoData]
  )

  const ringCoins = useMemo(() => {
    const rings = []
    let offset = 0
    for (const count of COINS_PER_RING) {
      rings.push(ranked.slice(offset, offset + count))
      offset += count
    }
    return rings
  }, [ranked])

  // Which ring is a given symbol in?
  const ringOf = useCallback((symbol) =>
    ringCoins.findIndex(ring => ring.some(c => c.symbol === symbol)),
    [ringCoins]
  )

  const [selected, setSelected] = useState(null)   // coin object
  const [hovered, setHovered] = useState(null)   // symbol string

  const handleSelect = useCallback((coin) => {
    setSelected(prev => prev?.symbol === coin.symbol ? null : coin)
  }, [])
  const handleDeselect = useCallback(() => setSelected(null), [])
  const handleHover = useCallback((symbol) => setHovered(symbol), [])

  return (
    <div className="w-full h-full relative select-none overflow-hidden">

      {/* Scrolling ticker */}
      <PriceTicker coins={ranked.slice(0, 40)} />

      {/* 3D canvas */}
      <Canvas
        camera={{ position: [0, 2.8, 20], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
        onPointerMissed={handleDeselect}
        className="w-full h-full"
      >
        <Stars radius={150} depth={90} count={3000} factor={2.8} fade speed={0.45} />
        <ambientLight intensity={0.08} />
        <pointLight position={[0, 12, 0]} color="#00CFFF" intensity={1.4} />
        <pointLight position={[-14, -6, -10]} color="#7B2FBE" intensity={1.0} />
        <pointLight position={[14, 4, 8]} color="#00FF88" intensity={0.6} />

        <MarketCore />

        {ringCoins.map((coins, ri) => (
          <OrbitalRing
            key={ri}
            coins={coins}
            cfgIdx={ri}
            selectedSymbol={selected?.symbol}
            hoveredSymbol={hovered}
            onSelect={handleSelect}
            onHover={handleHover}
          />
        ))}

        <OrbitControls
          enablePan={false}
          enableZoom
          autoRotate={!selected}
          autoRotateSpeed={0.22}
          minDistance={7}
          maxDistance={34}
          dampingFactor={0.065}
          enableDamping
        />
      </Canvas>

      {/* Description */}
      <div className="absolute top-12 left-4 z-10 pointer-events-none">
        <p className="text-[8.5px] font-mono text-slate-500 leading-relaxed">
          <span className="font-bold" style={{ color: "#00CFFF" }}>MARKET ORBITS</span>
          {" "}— inner ring = biggest coins · outer = smaller caps
        </p>
      </div>

      {/* Legend */}
      <div className="absolute bottom-12 left-4 z-10 p-2.5 rounded-xl border"
        style={{ background: "rgba(1,11,27,0.94)", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="font-mono text-[7.5px] text-slate-600 uppercase tracking-widest mb-2">Market Cap Tiers</div>
        {ORBIT_CONFIG.map((cfg, i) => (
          <div key={i} className="flex items-center gap-2 mb-1.5 last:mb-0">
            <div className="w-5 shrink-0" style={{ height: "2px", background: cfg.ringColor, boxShadow: `0 0 4px ${cfg.ringColor}` }} />
            <span className="font-mono text-[8.5px] text-slate-400">{cfg.tier.split(" · ")[1]}</span>
          </div>
        ))}
        <div className="border-t mt-2 pt-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="font-mono text-[7.5px] text-slate-600 uppercase tracking-widest mb-1.5">24h Color</div>
          {[
            { c: "#00FF88", l: "Strong gain > +5%" },
            { c: "#00CFFF", l: "Mild gain 0–+5%" },
            { c: "#FF8C00", l: "Mild loss 0–−5%" },
            { c: "#FF3366", l: "Strong loss < −5%" },
          ].map(({ c, l }) => (
            <div key={l} className="flex items-center gap-2 mb-1 last:mb-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c, boxShadow: `0 0 5px ${c}` }} />
              <span className="font-mono text-[8.5px] text-slate-400">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <GenomePanel
            coin={selected}
            cfgIdx={ringOf(selected.symbol)}
            onClose={handleDeselect}
          />
        )}
      </AnimatePresence>

      {/* Hint */}
      <AnimatePresence>
        {!selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="font-mono text-[8.5px] text-slate-500 whitespace-nowrap px-3 py-1.5 rounded-full border"
              style={{ background: "rgba(1,11,27,0.88)", borderColor: "rgba(255,255,255,0.07)" }}>
              🖱 Scroll to zoom · Drag to tilt · Hover to highlight · Click to inspect
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
