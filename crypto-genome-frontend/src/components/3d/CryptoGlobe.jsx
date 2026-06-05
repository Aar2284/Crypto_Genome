import { useRef, useMemo, useState, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Sphere, MeshDistortMaterial, Stars, Html } from "@react-three/drei"
import { motion, AnimatePresence } from "framer-motion"
import useCryptoStore from "../../store/useCryptoStore.js"

// ── Helpers ────────────────────────────────────────────────────────────────────

function symbolToPosition(index, total) {
  const phi   = Math.acos(1 - (2 * (index + 0.5)) / total)
  const theta = Math.PI * (1 + Math.sqrt(5)) * index
  const r = 1.52
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ]
}

function changeToColor(change) {
  if (change >  3) return "#00C896"
  if (change >  0) return "#00D4FF"
  if (change > -3) return "#FFD700"
  return "#FF4466"
}

function mcapToScale(mcap) {
  if (!mcap) return 0.035
  // BTC ~1.2T → 0.07, small caps → 0.028
  return Math.max(0.028, Math.min(0.075, Math.log10(mcap) / 180))
}

// ── Single interactive coin node ──────────────────────────────────────────────

function CoinNode({ coin, index, total, isSelected, onSelect, autoRotating }) {
  const meshRef  = useRef()
  const ringRef  = useRef()
  const [hovered, setHovered] = useState(false)

  const pos   = useMemo(() => symbolToPosition(index, total), [index, total])
  const color = useMemo(() => changeToColor(coin.change_24h_pct ?? 0), [coin.change_24h_pct])
  const scale = useMemo(() => mcapToScale(coin.market_cap), [coin.market_cap])

  const active = hovered || isSelected

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) {
      // Pulse size
      const pulse = active ? 1 + Math.sin(t * 5) * 0.18 : 1 + Math.sin(t * 2 + index) * 0.06
      meshRef.current.scale.setScalar(pulse)
    }
    if (ringRef.current) {
      // Spin glow ring when active
      ringRef.current.rotation.z = t * (active ? 2 : 0.5)
      ringRef.current.material.opacity = active ? 0.9 : 0.4
    }
  })

  return (
    <group position={pos}>
      {/* Outer glow ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[scale * 2.2, scale * 0.4, 6, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>

      {/* Core sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); onSelect(coin) }}
      >
        <sphereGeometry args={[scale, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 4 : 2}
        />
      </mesh>

      {/* Floating HTML label — always visible, bigger when active */}
      <Html
        center
        distanceFactor={6}
        style={{ pointerEvents: "none" }}
        position={[0, scale * 3.2, 0]}
      >
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: active ? "11px" : "9px",
            color: active ? color : "rgba(148,163,184,0.7)",
            background: active ? "rgba(0,10,25,0.85)" : "transparent",
            border: active ? `1px solid ${color}40` : "none",
            borderRadius: "4px",
            padding: active ? "2px 5px" : "0",
            whiteSpace: "nowrap",
            transition: "all 0.15s ease",
            textShadow: `0 0 8px ${color}`,
            userSelect: "none",
          }}
        >
          {coin.symbol}
        </div>
      </Html>
    </group>
  )
}

// ── Rotating group of all nodes ───────────────────────────────────────────────

function DataNodes({ coins, selectedCoin, onSelect, paused }) {
  const groupRef = useRef()

  useFrame(() => {
    if (groupRef.current && !paused) {
      groupRef.current.rotation.y += 0.003
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
          isSelected={selectedCoin?.symbol === coin.symbol}
          onSelect={onSelect}
          autoRotating={!paused}
        />
      ))}
    </group>
  )
}

// ── Globe shell + ring ────────────────────────────────────────────────────────

function GlobeShell() {
  const ringRef = useRef()

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.015)
    }
  })

  return (
    <>
      <Stars radius={80} depth={50} count={3500} factor={4} fade speed={0.8} />

      <Sphere args={[1.4, 48, 48]}>
        <MeshDistortMaterial
          color="#00D4FF" wireframe distort={0.1} speed={1.2}
          opacity={0.28} transparent
        />
      </Sphere>

      <Sphere args={[1.33, 32, 32]}>
        <meshStandardMaterial color="#000e20" emissive="#001833" emissiveIntensity={0.5} />
      </Sphere>

      <mesh ref={ringRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[1.85, 0.013, 8, 128]} />
        <meshStandardMaterial color="#00C896" emissive="#00C896" emissiveIntensity={3} />
      </mesh>

      <ambientLight intensity={0.25} />
      <pointLight position={[5, 5, 5]}  color="#00D4FF" intensity={1.5} />
      <pointLight position={[-5,-5,-5]} color="#7B2FBE" intensity={0.9} />
      <pointLight position={[0, 5, 0]}  color="#00C896" intensity={0.4} />
    </>
  )
}

// ── Coin info panel (DOM overlay) ─────────────────────────────────────────────

function CoinInfoPanel({ coin, onClose }) {
  if (!coin) return null
  const change   = coin.change_24h_pct ?? 0
  const color    = changeToColor(change)
  const isUp     = change >= 0

  const fmt = (n, opts) => n != null ? new Intl.NumberFormat("en-US", opts).format(n) : "—"
  const price  = fmt(coin.current_price, { style: "currency", currency: "USD", minimumFractionDigits: coin.current_price < 1 ? 4 : 2 })
  const mcap   = coin.market_cap   ? `$${fmt(coin.market_cap,   { notation: "compact", maximumFractionDigits: 2 })}` : "—"
  const vol    = coin.volume_24h   ? `$${fmt(coin.volume_24h,   { notation: "compact", maximumFractionDigits: 2 })}` : "—"
  const chgStr = `${isUp ? "+" : ""}${change.toFixed(2)}%`

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="absolute bottom-3 left-3 z-20 w-52"
      style={{
        background: "rgba(0, 10, 25, 0.92)",
        border: `1px solid ${color}40`,
        borderRadius: "12px",
        backdropFilter: "blur(12px)",
        boxShadow: `0 0 20px ${color}20`,
      }}
    >
      <div className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-display font-bold text-white text-base leading-tight">{coin.name}</div>
            <div className="font-mono text-[10px] mt-0.5" style={{ color }}>{coin.symbol}</div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-300 text-xs font-mono leading-none mt-0.5 p-1"
          >
            ✕
          </button>
        </div>

        {/* Price big */}
        <div className="font-display font-bold text-white text-xl mb-1">{price}</div>
        <div
          className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full mb-3"
          style={{ background: `${color}18`, border: `1px solid ${color}35`, color }}
        >
          {isUp ? "▲" : "▼"} {chgStr} 24h
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Market Cap", value: mcap },
            { label: "Volume 24h", value: vol },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/5 rounded-lg p-2">
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">{label}</div>
              <div className="text-[11px] font-mono text-slate-200 mt-0.5">{value}</div>
            </div>
          ))}
        </div>

        {/* Dominance bar */}
        {coin.market_cap && (
          <div className="mt-3">
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mb-1">
              <span>Market dominance</span>
              <span style={{ color }}>
                {((coin.market_cap / 2_000_000_000_000) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (coin.market_cap / 2_000_000_000_000) * 100)}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        <div className="mt-2 text-[9px] font-mono text-slate-600 text-center">Click globe to deselect</div>
      </div>
    </motion.div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────

const LEGEND = [
  { color: "#00C896", label: "+3%+",     desc: "Strong gain" },
  { color: "#00D4FF", label: "0 – 3%",   desc: "Mild gain" },
  { color: "#FFD700", label: "0 – –3%",  desc: "Mild loss" },
  { color: "#FF4466", label: "–3%+",     desc: "Strong loss" },
]

// ── Main export ───────────────────────────────────────────────────────────────

export default function CryptoGlobe() {
  const cryptoData    = useCryptoStore((s) => s.cryptoData)
  const coins         = useMemo(() => cryptoData ?? [], [cryptoData])
  const [selected, setSelected] = useState(null)
  const [paused,   setPaused]   = useState(false)

  const handleSelect = useCallback((coin) => {
    setSelected(prev => prev?.symbol === coin.symbol ? null : coin)
    setPaused(true)
  }, [])

  const handleDeselect = useCallback(() => {
    setSelected(null)
    setPaused(false)
  }, [])

  // Top gainers / losers for the mini leaderboard
  const sorted = useMemo(() =>
    [...coins].sort((a, b) => (b.change_24h_pct ?? 0) - (a.change_24h_pct ?? 0)),
    [coins]
  )
  const topGainers = sorted.slice(0, 3)
  const topLosers  = sorted.slice(-3).reverse()

  return (
    <div className="w-full h-full relative z-0 select-none">

      {/* ── Top bar: leaderboard strips ── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-start p-2 pointer-events-none">
        {/* Gainers */}
        <div className="flex flex-col gap-1">
          <div className="text-[8px] font-mono text-emerald-400/70 uppercase tracking-widest mb-0.5">▲ Top Gainers</div>
          {topGainers.map(c => (
            <div key={c.symbol} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="font-mono text-[9px] text-slate-300">{c.symbol}</span>
              <span className="font-mono text-[9px] text-emerald-400">+{(c.change_24h_pct ?? 0).toFixed(1)}%</span>
            </div>
          ))}
        </div>

        {/* Losers */}
        <div className="flex flex-col gap-1 items-end">
          <div className="text-[8px] font-mono text-rose-400/70 uppercase tracking-widest mb-0.5">▼ Top Losers</div>
          {topLosers.map(c => (
            <div key={c.symbol} className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] text-rose-400">{(c.change_24h_pct ?? 0).toFixed(1)}%</span>
              <span className="font-mono text-[9px] text-slate-300">{c.symbol}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* ── 3D Canvas ── */}
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 48 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
        onClick={handleDeselect}
      >
        <GlobeShell />
        {coins.length > 0 && (
          <DataNodes
            coins={coins}
            selectedCoin={selected}
            onSelect={handleSelect}
            paused={paused}
          />
        )}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate={!paused}
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.4}
        />
      </Canvas>

      {/* ── Coin info panel ── */}
      <AnimatePresence>
        {selected && (
          <CoinInfoPanel coin={selected} onClose={handleDeselect} />
        )}
      </AnimatePresence>

      {/* ── Legend (bottom right) ── */}
      <div className="absolute bottom-2 right-2 z-10 flex flex-col gap-1 bg-black/30 backdrop-blur-sm rounded-lg p-2 border border-white/5">
        <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">24h Change</div>
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
            <span className="font-mono text-[9px] text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Hint (center bottom, fades if selected) ── */}
      <AnimatePresence>
        {!selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 text-[9px] font-mono text-slate-600 whitespace-nowrap"
          >
            Click a node · Drag to rotate
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Asset count (top center) ── */}
      <div className="absolute top-1/2 left-2 -translate-y-1/2 z-10 text-[8px] font-mono text-slate-700 writing-mode-vertical pointer-events-none">
        {coins.length} assets
      </div>
    </div>
  )
}
