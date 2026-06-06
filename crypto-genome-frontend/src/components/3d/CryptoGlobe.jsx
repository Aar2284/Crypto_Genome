import { useRef, useMemo, useState, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Sphere, MeshDistortMaterial, Stars, Html } from "@react-three/drei"
import { motion, AnimatePresence } from "framer-motion"
import useCryptoStore from "../../store/useCryptoStore.js"

// ── Helpers ────────────────────────────────────────────────────────────────────

function symbolToPosition(index, total) {
  const phi = Math.acos(1 - (2 * (index + 0.5)) / total)
  const theta = Math.PI * (1 + Math.sqrt(5)) * index
  const r = 1.52
  return {
    pos: [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta),
    ],
    theta, // store theta so we can rotate globe to face it
  }
}

function changeToColor(change) {
  if (change > 3) return "#00C896"
  if (change > 0) return "#00D4FF"
  if (change > -3) return "#FFD700"
  return "#FF4466"
}

function mcapToScale(mcap) {
  if (!mcap) return 0.038
  return Math.max(0.03, Math.min(0.08, Math.log10(mcap) / 175))
}

// ── Single coin node ─────────────────────────────────────────────────────────

function CoinNode({ coin, index, total, isSelected, onSelect }) {
  const meshRef = useRef()
  const ringRef = useRef()
  const hitRef = useRef()
  const [hovered, setHovered] = useState(false)

  const { pos } = useMemo(() => symbolToPosition(index, total), [index, total])
  const color = useMemo(() => changeToColor(coin.change_24h_pct ?? 0), [coin.change_24h_pct])
  const scale = useMemo(() => mcapToScale(coin.market_cap), [coin.market_cap])
  const active = hovered || isSelected
  const chgStr = `${(coin.change_24h_pct ?? 0) >= 0 ? "+" : ""}${(coin.change_24h_pct ?? 0).toFixed(1)}%`

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) {
      const pulse = active ? 1 + Math.sin(t * 6) * 0.22 : 1 + Math.sin(t * 1.8 + index) * 0.07
      meshRef.current.scale.setScalar(pulse)
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * (active ? 2.5 : 0.4)
      ringRef.current.material.opacity = active ? 1 : 0.35
      ringRef.current.scale.setScalar(active ? 1 + Math.sin(t * 4) * 0.1 : 1)
    }
  })

  return (
    <group position={pos}>
      {/* Glow ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[scale * 2.4, scale * 0.45, 6, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>

      {/* Invisible large hit area — makes clicking easy */}
      <mesh
        ref={hitRef}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={(e) => { e.stopPropagation(); onSelect(coin, index) }}
      >
        <sphereGeometry args={[scale * 3, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Visible core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[scale, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 5 : 2} />
      </mesh>

      {/* Label — symbol + change always visible */}
      <Html center distanceFactor={6} style={{ pointerEvents: "none" }} position={[0, scale * 4.2, 0]}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", textAlign: "center", pointerEvents: "none", userSelect: "none", lineHeight: 1.3 }}>
          <div style={{
            fontSize: active ? "11px" : "9.5px",
            fontWeight: "bold",
            color: active ? "#fff" : "rgba(200,215,230,0.8)",
            textShadow: `0 0 10px ${color}`,
            background: active ? "rgba(0,8,22,0.92)" : "rgba(0,8,20,0.6)",
            border: `1px solid ${color}${active ? "80" : "38"}`,
            borderRadius: "4px",
            padding: "1px 5px",
            marginBottom: "2px",
            whiteSpace: "nowrap",
          }}>
            {coin.symbol}
          </div>
          <div style={{ fontSize: "8.5px", color, textShadow: `0 0 6px ${color}`, fontWeight: "700", whiteSpace: "nowrap" }}>
            {chgStr}
          </div>
        </div>
      </Html>
    </group>
  )
}

// ── Rotating group — auto-rotates to show selected coin ──────────────────────

function DataNodes({ coins, selectedIndex, onSelect, paused }) {
  const groupRef = useRef()
  const currentRot = useRef(0)

  // Compute the theta of the selected coin (XZ angle on globe surface)
  const targetTheta = useMemo(() => {
    if (selectedIndex === null || selectedIndex === undefined) return null
    const phi = Math.acos(1 - (2 * (selectedIndex + 0.5)) / coins.length)
    const theta = Math.PI * (1 + Math.sqrt(5)) * selectedIndex
    // To face camera (+z direction), we want globe rotY = -theta
    // Add PI so coin shows on the near hemisphere
    return -theta
  }, [selectedIndex, coins.length])

  useFrame(() => {
    if (!groupRef.current) return
    if (!paused) {
      // Free auto-rotate
      groupRef.current.rotation.y += 0.003
      currentRot.current = groupRef.current.rotation.y
    } else if (targetTheta !== null) {
      // Smoothly rotate to selected coin
      let current = groupRef.current.rotation.y
      let target = targetTheta
      // Find shortest angular path
      let diff = ((target - current) % (Math.PI * 2))
      if (diff > Math.PI) diff -= Math.PI * 2
      if (diff < -Math.PI) diff += Math.PI * 2
      groupRef.current.rotation.y += diff * 0.06
    }
  })

  return (
    <group ref={groupRef}>
      {coins.map((coin, i) => (
        <CoinNode
          key={coin.symbol}
          coin={coin}
          index={i}
          total={coins.length}
          isSelected={selectedIndex === i}
          onSelect={onSelect}
        />
      ))}
    </group>
  )
}

// ── Globe shell ───────────────────────────────────────────────────────────────

function GlobeShell() {
  const ringRef = useRef()
  useFrame((s) => {
    if (ringRef.current) ringRef.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 1.4) * 0.014)
  })
  return (
    <>
      <Stars radius={80} depth={50} count={3000} factor={4} fade speed={0.7} />
      <Sphere args={[1.4, 48, 48]}>
        <MeshDistortMaterial color="#00D4FF" wireframe distort={0.1} speed={1.2} opacity={0.22} transparent />
      </Sphere>
      <Sphere args={[1.33, 32, 32]}>
        <meshStandardMaterial color="#000d1e" emissive="#001530" emissiveIntensity={0.55} />
      </Sphere>
      <mesh ref={ringRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[1.85, 0.013, 8, 128]} />
        <meshStandardMaterial color="#00C896" emissive="#00C896" emissiveIntensity={3.2} />
      </mesh>
      <ambientLight intensity={0.22} />
      <pointLight position={[5, 5, 5]} color="#00D4FF" intensity={1.6} />
      <pointLight position={[-5, -5, -5]} color="#7B2FBE" intensity={0.9} />
    </>
  )
}

// ── Coin detail card (fully opaque) ──────────────────────────────────────────

function CoinDetailCard({ coin, onClose }) {
  if (!coin) return null
  const change = coin.change_24h_pct ?? 0
  const color = changeToColor(change)
  const isUp = change >= 0
  const fmt = (n, opts) => n != null ? new Intl.NumberFormat("en-US", opts).format(n) : "—"
  const price = fmt(coin.current_price, { style: "currency", currency: "USD", minimumFractionDigits: coin.current_price < 1 ? 4 : 2 })
  const mcap = coin.market_cap ? `$${fmt(coin.market_cap, { notation: "compact", maximumFractionDigits: 2 })}` : "—"
  const vol = coin.volume_24h ? `$${fmt(coin.volume_24h, { notation: "compact", maximumFractionDigits: 2 })}` : "—"
  const chgStr = `${isUp ? "+" : ""}${change.toFixed(2)}%`
  const dominance = coin.market_cap ? Math.min(100, (coin.market_cap / 2_800_000_000_000) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.2 }}
      className="absolute bottom-3 left-3 z-30 w-56"
      style={{
        // Fully opaque — no mix with globe
        background: "#030c1a",
        border: `1.5px solid ${color}55`,
        borderRadius: "14px",
        boxShadow: `0 8px 32px rgba(0,0,0,0.9), 0 0 20px ${color}22`,
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-display font-bold text-white text-base leading-tight">{coin.name}</div>
            <div className="font-mono text-[10px] mt-0.5 flex items-center gap-1.5" style={{ color }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: color }} />
              {coin.symbol} · Cryptocurrency
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-slate-500 hover:text-white transition-colors text-xs"
          >
            ✕
          </button>
        </div>

        {/* Price */}
        <div className="font-display font-bold text-white text-2xl mb-1 tabular-nums">{price}</div>
        <div
          className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full mb-4"
          style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
        >
          {isUp ? "▲" : "▼"} {chgStr} in last 24 hours
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: "Market Cap", value: mcap, sub: "Total coins × price" },
            { label: "24h Volume", value: vol, sub: "USD traded today" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">{label}</div>
              <div className="text-[12px] font-mono text-white mt-1 font-bold">{value}</div>
              <div className="text-[8px] font-mono text-slate-600 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* Market dominance bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] font-mono text-slate-500">Share of total crypto market</span>
            <span className="text-[10px] font-mono font-bold" style={{ color }}>{dominance.toFixed(1)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
              initial={{ width: 0 }}
              animate={{ width: `${dominance}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="mt-3 text-[8px] font-mono text-slate-700 text-center">
          Click anywhere on the globe to close
        </div>
      </div>
    </motion.div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CryptoGlobe() {
  const cryptoData = useCryptoStore((s) => s.cryptoData)
  const coins = useMemo(() => cryptoData ?? [], [cryptoData])

  const [selectedIdx, setSelectedIdx] = useState(null)
  const [paused, setPaused] = useState(false)
  const selectedCoin = selectedIdx !== null ? coins[selectedIdx] : null

  const handleSelect = useCallback((coin, index) => {
    if (selectedIdx === index) {
      setSelectedIdx(null)
      setPaused(false)
    } else {
      setSelectedIdx(index)
      setPaused(true)
    }
  }, [selectedIdx])

  const handleDeselect = useCallback(() => {
    setSelectedIdx(null)
    setPaused(false)
  }, [])

  const sorted = useMemo(() => [...coins].sort((a, b) => (b.change_24h_pct ?? 0) - (a.change_24h_pct ?? 0)), [coins])
  const topGainers = sorted.slice(0, 3)
  const topLosers = sorted.slice(-3).reverse()

  return (
    <div className="w-full h-full flex flex-col relative select-none overflow-hidden">

      {/* ── Plain-English description ── */}
      <div className="px-3 pt-2 pb-1 shrink-0">
        <p className="text-[10px] font-mono text-slate-500 leading-relaxed">
          Each <span className="text-cyan-400 font-semibold">glowing dot</span> = one tracked cryptocurrency.
          Color shows its 24h price movement — see the legend.
          <span className="text-slate-400"> Bigger dot = larger market size.</span>
        </p>
      </div>

      {/* ── Gainers / Losers (clickable) ── */}
      <div className="flex gap-2 px-3 pb-1.5 shrink-0">
        <div className="flex-1 rounded-lg px-2 py-1.5" style={{ background: "rgba(0,200,150,0.05)", border: "1px solid rgba(0,200,150,0.15)" }}>
          <div className="text-[8px] font-mono text-emerald-400/60 uppercase tracking-widest mb-1 font-semibold">▲ Top Gainers (24h)</div>
          {topGainers.map((c) => {
            const idx = coins.findIndex(x => x.symbol === c.symbol)
            return (
              <button key={c.symbol} onClick={() => handleSelect(c, idx)}
                className="w-full flex items-center justify-between hover:bg-white/5 rounded px-1 py-0.5 transition-colors">
                <span className="font-mono text-[9px] text-slate-200 font-bold">{c.symbol}</span>
                <span className="font-mono text-[9px] text-emerald-400 font-semibold">+{(c.change_24h_pct ?? 0).toFixed(1)}%</span>
              </button>
            )
          })}
        </div>
        <div className="flex-1 rounded-lg px-2 py-1.5" style={{ background: "rgba(255,68,102,0.05)", border: "1px solid rgba(255,68,102,0.15)" }}>
          <div className="text-[8px] font-mono text-rose-400/60 uppercase tracking-widest mb-1 font-semibold">▼ Top Losers (24h)</div>
          {topLosers.map((c) => {
            const idx = coins.findIndex(x => x.symbol === c.symbol)
            return (
              <button key={c.symbol} onClick={() => handleSelect(c, idx)}
                className="w-full flex items-center justify-between hover:bg-white/5 rounded px-1 py-0.5 transition-colors">
                <span className="font-mono text-[9px] text-slate-200 font-bold">{c.symbol}</span>
                <span className="font-mono text-[9px] text-rose-400 font-semibold">{(c.change_24h_pct ?? 0).toFixed(1)}%</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 3D Globe ── */}
      <div className="flex-1 relative min-h-0">
        <Canvas
          camera={{ position: [0, 0, 4.2], fov: 48 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
          onPointerMissed={handleDeselect}
        >
          <GlobeShell />
          {coins.length > 0 && (
            <DataNodes
              coins={coins}
              selectedIndex={selectedIdx}
              onSelect={handleSelect}
              paused={paused}
            />
          )}
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            autoRotate={false}   // we handle rotation manually in DataNodes
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.4}
          />
        </Canvas>

        {/* Coin detail card — fully opaque, left-aligned */}
        <AnimatePresence>
          {selectedCoin && (
            <CoinDetailCard coin={selectedCoin} onClose={handleDeselect} />
          )}
        </AnimatePresence>

        {/* Color legend — bottom right, readable size */}
        <div className="absolute bottom-2 right-2 z-20 rounded-xl p-3 border" style={{ background: "#030c1a", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 font-semibold">Color = 24h Change</div>
          {[
            { color: "#00C896", label: "Strong gain", sub: "> +3%" },
            { color: "#00D4FF", label: "Mild gain", sub: "0% to +3%" },
            { color: "#FFD700", label: "Mild loss", sub: "0% to −3%" },
            { color: "#FF4466", label: "Strong loss", sub: "below −3%" },
          ].map(({ color, label, sub }) => (
            <div key={label} className="flex items-center gap-2 mb-1.5 last:mb-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
              <div>
                <div className="font-mono text-[10px] text-slate-200 leading-none">{label}</div>
                <div className="font-mono text-[8px] text-slate-600 leading-none mt-0.5">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Interaction hint */}
        <AnimatePresence>
          {!selectedCoin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 rounded-full px-3 py-1 border pointer-events-none"
              style={{ background: "rgba(3,12,26,0.8)", borderColor: "rgba(255,255,255,0.07)" }}
            >
              <span className="text-[9px] font-mono text-slate-500 whitespace-nowrap">
                🖱 Drag to rotate · Click a dot or use the lists above for details
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
