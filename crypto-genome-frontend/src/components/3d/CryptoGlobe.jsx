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
  return Math.max(0.028, Math.min(0.075, Math.log10(mcap) / 180))
}

// ── Single interactive coin node ──────────────────────────────────────────────

function CoinNode({ coin, index, total, isSelected, onSelect }) {
  const meshRef = useRef()
  const ringRef = useRef()
  const [hovered, setHovered] = useState(false)

  const pos   = useMemo(() => symbolToPosition(index, total), [index, total])
  const color = useMemo(() => changeToColor(coin.change_24h_pct ?? 0), [coin.change_24h_pct])
  const scale = useMemo(() => mcapToScale(coin.market_cap), [coin.market_cap])
  const active = hovered || isSelected
  const change = coin.change_24h_pct ?? 0
  const chgStr = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) {
      const pulse = active ? 1 + Math.sin(t * 5) * 0.18 : 1 + Math.sin(t * 2 + index) * 0.06
      meshRef.current.scale.setScalar(pulse)
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * (active ? 2 : 0.5)
      ringRef.current.material.opacity = active ? 0.9 : 0.4
    }
  })

  return (
    <group position={pos}>
      {/* Glow ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[scale * 2.2, scale * 0.4, 6, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>

      {/* Core dot */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); onSelect(coin) }}
      >
        <sphereGeometry args={[scale, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 4 : 2} />
      </mesh>

      {/* Always-visible label: SYMBOL + change% */}
      <Html center distanceFactor={6} style={{ pointerEvents: "none" }} position={[0, scale * 3.8, 0]}>
        <div style={{
          fontFamily: "JetBrains Mono, monospace",
          textAlign: "center",
          pointerEvents: "none",
          userSelect: "none",
          lineHeight: 1.3,
        }}>
          {/* Symbol */}
          <div style={{
            fontSize: active ? "11px" : "9px",
            fontWeight: "bold",
            color: active ? "#ffffff" : "rgba(200,210,220,0.75)",
            textShadow: `0 0 8px ${color}`,
            background: active ? "rgba(0,10,25,0.85)" : "rgba(0,8,20,0.55)",
            border: `1px solid ${color}${active ? "70" : "35"}`,
            borderRadius: "4px",
            padding: "1px 5px",
            marginBottom: "2px",
            whiteSpace: "nowrap",
            transition: "all 0.15s ease",
          }}>
            {coin.symbol}
          </div>
          {/* Change % — always visible */}
          <div style={{
            fontSize: "8px",
            color: color,
            textShadow: `0 0 6px ${color}`,
            fontWeight: "600",
            whiteSpace: "nowrap",
          }}>
            {chgStr}
          </div>
        </div>
      </Html>
    </group>
  )
}

// ── Rotating group ────────────────────────────────────────────────────────────

function DataNodes({ coins, selectedCoin, onSelect, paused }) {
  const groupRef = useRef()
  useFrame(() => {
    if (groupRef.current && !paused) groupRef.current.rotation.y += 0.003
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
        />
      ))}
    </group>
  )
}

// ── Globe shell ───────────────────────────────────────────────────────────────

function GlobeShell() {
  const ringRef = useRef()
  useFrame((state) => {
    if (ringRef.current)
      ringRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.015)
  })
  return (
    <>
      <Stars radius={80} depth={50} count={3000} factor={4} fade speed={0.8} />
      <Sphere args={[1.4, 48, 48]}>
        <MeshDistortMaterial color="#00D4FF" wireframe distort={0.1} speed={1.2} opacity={0.25} transparent />
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
    </>
  )
}

// ── Selected coin detail card ─────────────────────────────────────────────────

function CoinDetailCard({ coin, onClose }) {
  if (!coin) return null
  const change  = coin.change_24h_pct ?? 0
  const color   = changeToColor(change)
  const isUp    = change >= 0
  const fmt     = (n, opts) => n != null ? new Intl.NumberFormat("en-US", opts).format(n) : "—"
  const price   = fmt(coin.current_price, { style: "currency", currency: "USD", minimumFractionDigits: coin.current_price < 1 ? 4 : 2 })
  const mcap    = coin.market_cap  ? `$${fmt(coin.market_cap,  { notation: "compact", maximumFractionDigits: 2 })}` : "—"
  const vol     = coin.volume_24h  ? `$${fmt(coin.volume_24h,  { notation: "compact", maximumFractionDigits: 2 })}` : "—"
  const chgStr  = `${isUp ? "+" : ""}${change.toFixed(2)}%`
  const dominance = coin.market_cap ? Math.min(100, (coin.market_cap / 2_000_000_000_000) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="absolute bottom-3 left-3 z-20 w-52"
      style={{
        background: "rgba(0,10,25,0.93)",
        border: `1px solid ${color}45`,
        borderRadius: "12px",
        backdropFilter: "blur(14px)",
        boxShadow: `0 0 24px ${color}18`,
      }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="font-display font-bold text-white text-sm">{coin.name}</div>
            <div className="font-mono text-[10px]" style={{ color }}>{coin.symbol} · Cryptocurrency</div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 text-xs font-mono p-1">✕</button>
        </div>

        <div className="font-display font-bold text-white text-xl mb-1">{price}</div>
        <div
          className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full mb-3"
          style={{ background: `${color}18`, border: `1px solid ${color}35`, color }}
        >
          {isUp ? "▲" : "▼"} {chgStr} in the last 24 hours
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: "Total Market Cap", value: mcap,  tip: "Total coins × price" },
            { label: "24h Trade Volume", value: vol,   tip: "USD traded today" },
          ].map(({ label, value, tip }) => (
            <div key={label} className="bg-white/5 rounded-lg p-2">
              <div className="text-[8px] font-mono text-slate-500 uppercase tracking-wide">{label}</div>
              <div className="text-[11px] font-mono text-slate-200 mt-0.5 font-bold">{value}</div>
              <div className="text-[8px] font-mono text-slate-600 mt-0.5">{tip}</div>
            </div>
          ))}
        </div>

        {/* Dominance bar */}
        <div>
          <div className="flex justify-between text-[9px] font-mono text-slate-500 mb-1">
            <span>Market dominance (share of global crypto market)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${dominance}%` }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold" style={{ color }}>{dominance.toFixed(1)}%</span>
          </div>
        </div>

        <div className="mt-3 text-[8px] font-mono text-slate-600 text-center border-t border-white/5 pt-2">
          Click anywhere on the globe to close
        </div>
      </div>
    </motion.div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CryptoGlobe() {
  const cryptoData = useCryptoStore((s) => s.cryptoData)
  const coins      = useMemo(() => cryptoData ?? [], [cryptoData])
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

  const sorted      = useMemo(() => [...coins].sort((a, b) => (b.change_24h_pct ?? 0) - (a.change_24h_pct ?? 0)), [coins])
  const topGainers  = sorted.slice(0, 3)
  const topLosers   = sorted.slice(-3).reverse()

  return (
    <div className="w-full h-full flex flex-col relative select-none">

      {/* ── What is this? — plain-English context strip ── */}
      <div className="px-3 pt-2 pb-1 shrink-0">
        <p className="text-[10px] font-mono text-slate-500 leading-relaxed">
          Every <span className="text-cyan-400 font-semibold">glowing dot</span> is one cryptocurrency we track. 
          <span className="text-emerald-400 font-semibold"> Green = rising</span>, 
          <span className="text-rose-400 font-semibold"> red = falling</span> in the last 24 hours. 
          Bigger dot = larger market cap.{" "}
          <span className="text-slate-400">Tap any dot to learn more.</span>
        </p>
      </div>

      {/* ── Gainers / Losers bar ── */}
      <div className="flex justify-between px-3 pb-1.5 shrink-0 gap-2">
        <div className="flex-1 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-2 py-1.5">
          <div className="text-[8px] font-mono text-emerald-400/60 uppercase tracking-widest mb-1 font-semibold">▲ Top Gainers (24h)</div>
          <div className="flex flex-col gap-0.5">
            {topGainers.map(c => (
              <button key={c.symbol} onClick={() => { handleSelect(c) }}
                className="flex items-center justify-between hover:bg-white/5 rounded px-1 transition-colors">
                <span className="font-mono text-[9px] text-slate-300 font-bold">{c.symbol}</span>
                <span className="font-mono text-[9px] text-emerald-400">+{(c.change_24h_pct ?? 0).toFixed(1)}%</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-rose-500/5 border border-rose-500/15 rounded-lg px-2 py-1.5">
          <div className="text-[8px] font-mono text-rose-400/60 uppercase tracking-widest mb-1 font-semibold">▼ Top Losers (24h)</div>
          <div className="flex flex-col gap-0.5">
            {topLosers.map(c => (
              <button key={c.symbol} onClick={() => { handleSelect(c) }}
                className="flex items-center justify-between hover:bg-white/5 rounded px-1 transition-colors">
                <span className="font-mono text-[9px] text-slate-300 font-bold">{c.symbol}</span>
                <span className="font-mono text-[9px] text-rose-400">{(c.change_24h_pct ?? 0).toFixed(1)}%</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3D Globe ── */}
      <div className="flex-1 relative min-h-0">
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

        {/* Coin detail card */}
        <AnimatePresence>
          {selected && <CoinDetailCard coin={selected} onClose={handleDeselect} />}
        </AnimatePresence>

        {/* Color legend — bottom right */}
        <div className="absolute bottom-2 right-2 z-10 bg-black/40 backdrop-blur-sm rounded-lg p-2 border border-white/5">
          <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-1.5 font-semibold">Color = 24h change</div>
          {[
            { color: "#00C896", label: "Strong gain  (> +3%)" },
            { color: "#00D4FF", label: "Mild gain    (0 – +3%)" },
            { color: "#FFD700", label: "Mild loss    (0 – −3%)" },
            { color: "#FF4466", label: "Strong loss  (> −3%)" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 mb-1 last:mb-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
              <span className="font-mono text-[8px] text-slate-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Interaction hint */}
        <AnimatePresence>
          {!selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 border border-white/5"
            >
              <span className="text-[9px] font-mono text-slate-500 whitespace-nowrap">
                🖱 Drag to rotate · Click a dot for details
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
