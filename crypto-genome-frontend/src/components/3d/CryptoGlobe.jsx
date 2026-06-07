import { useRef, useMemo, useState, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Stars, Html, Line } from "@react-three/drei"
import { motion, AnimatePresence } from "framer-motion"
import useCryptoStore from "../../store/useCryptoStore.js"

// ── Genome coordinate computation ─────────────────────────────────────────────
// Positions each coin in 3D space based on its behavioral metrics.
// These are NOT shown anywhere else on the dashboard.

function computeGenome(coin, totalMarketCap) {
  const change    = coin.change_24h_pct ?? 0
  const vol24     = coin.volume_24h    ?? 0
  const mcap      = coin.market_cap    ?? 1e9

  // X: Volatility — how violently does this coin swing? (0 = calm, 1 = wild)
  const volatility = Math.min(1, Math.abs(change) / 10)

  // Y: Liquidity ratio — how actively traded vs its size? (volume/mcap)
  const liquidityRatio = Math.min(1, (vol24 / mcap) * 6)

  // Z: Momentum — is it trending up (+) or down (-)?
  const momentum = Math.max(-1, Math.min(1, change / 8))

  // Dominance — share of total market (used for node size)
  const dominance = totalMarketCap > 0 ? mcap / totalMarketCap : 0

  return {
    x: (volatility - 0.5) * 6,        // -3 to +3
    y: (liquidityRatio - 0.5) * 5,    // -2.5 to +2.5
    z: momentum * 3,                   // -3 to +3
    volatility,
    liquidityRatio,
    momentum: change,
    dominance,
    mcap,
  }
}

// Euclidean distance between two genome positions
function genomeDistance(a, b) {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2 +
    (a.z - b.z) ** 2
  )
}

function changeToColor(change) {
  if (change >  3) return "#00C896"
  if (change >  0) return "#00D4FF"
  if (change > -3) return "#FFD700"
  return "#FF4466"
}

// ── Single coin orb ────────────────────────────────────────────────────────────

function CoinOrb({ coin, genome, isSelected, isMajor, onSelect }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  const active = isSelected || hovered
  const color  = changeToColor(coin.change_24h_pct ?? 0)
  const radius = Math.max(0.06, Math.min(0.18, Math.log10(genome.mcap + 1) / 85))

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime
      const pulse = active
        ? 1 + Math.sin(t * 6) * 0.2
        : 1 + Math.sin(t * 1.5 + genome.x) * 0.05
      meshRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group position={[genome.x, genome.y, genome.z]}>
      {/* Invisible hit area — larger than visual */}
      <mesh
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={(e) => { e.stopPropagation(); onSelect(coin, genome) }}
      >
        <sphereGeometry args={[radius * 3, 6, 6]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Glow halo */}
      {active && (
        <mesh>
          <sphereGeometry args={[radius * 2.2, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.12} />
        </mesh>
      )}

      {/* Core orb */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 5 : isSelected ? 4 : 2}
        />
      </mesh>

      {/* Label — always for major coins, only on hover for others */}
      {(isMajor || active) && (
        <Html center distanceFactor={8} style={{ pointerEvents: "none" }} position={[0, radius * 4.5, 0]}>
          <div style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: active ? "10px" : "8px",
            fontWeight: "bold",
            color: active ? "#fff" : "rgba(200,215,230,0.65)",
            textShadow: `0 0 8px ${color}`,
            background: active ? "rgba(0,8,22,0.92)" : "transparent",
            border: active ? `1px solid ${color}60` : "none",
            borderRadius: "3px",
            padding: active ? "1px 4px" : "0",
            whiteSpace: "nowrap",
            transition: "all 0.12s",
            pointerEvents: "none",
            userSelect: "none",
          }}>
            {coin.symbol}
          </div>
        </Html>
      )}
    </group>
  )
}

// ── Connection lines (similar genome profiles) ─────────────────────────────────

function SimilarityLines({ coins, genomes, selectedSymbol }) {
  const lines = useMemo(() => {
    if (!selectedSymbol) {
      // Show a sparse global constellation — closest pairs across all coins
      const pairs = []
      for (let i = 0; i < Math.min(coins.length, 40); i++) {
        for (let j = i + 1; j < Math.min(coins.length, 40); j++) {
          const d = genomeDistance(genomes[i], genomes[j])
          if (d < 1.4) pairs.push({ i, j, d })
        }
      }
      return pairs
        .sort((a, b) => a.d - b.d)
        .slice(0, 45)
        .map(p => ({
          points: [
            [genomes[p.i].x, genomes[p.i].y, genomes[p.i].z],
            [genomes[p.j].x, genomes[p.j].y, genomes[p.j].z],
          ],
          opacity: 0.06 + (1.4 - p.d) * 0.06,
          color: "#00D4FF",
        }))
    }

    // Selected: show its 8 nearest genome neighbors
    const selIdx = coins.findIndex(c => c.symbol === selectedSymbol)
    if (selIdx === -1) return []
    const selGenome = genomes[selIdx]
    return coins
      .map((c, i) => ({ i, d: genomeDistance(selGenome, genomes[i]) }))
      .filter(x => x.i !== selIdx && x.d < 4)
      .sort((a, b) => a.d - b.d)
      .slice(0, 8)
      .map(x => ({
        points: [
          [selGenome.x, selGenome.y, selGenome.z],
          [genomes[x.i].x, genomes[x.i].y, genomes[x.i].z],
        ],
        opacity: Math.max(0.1, 0.5 - x.d * 0.1),
        color: changeToColor(coins[selIdx].change_24h_pct ?? 0),
      }))
  }, [coins, genomes, selectedSymbol])

  return (
    <>
      {lines.map((l, i) => (
        <Line
          key={i}
          points={l.points}
          color={l.color}
          lineWidth={0.6}
          transparent
          opacity={l.opacity}
        />
      ))}
    </>
  )
}

// ── Axis labels in 3D space ────────────────────────────────────────────────────

function AxisLabels() {
  const labels = [
    { pos: [3.8, 0, 0],  text: "HIGH VOLATILITY →",  color: "#FFD700" },
    { pos: [-3.8, 0, 0], text: "← LOW VOLATILITY",   color: "#64748b" },
    { pos: [0, 3.0, 0],  text: "▲ HIGH LIQUIDITY",   color: "#00C896" },
    { pos: [0, -3.0, 0], text: "▼ LOW LIQUIDITY",    color: "#64748b" },
    { pos: [0, 0, 3.5],  text: "● RISING",            color: "#00C896" },
    { pos: [0, 0, -3.5], text: "● FALLING",           color: "#FF4466" },
  ]
  return (
    <>
      {labels.map(({ pos, text, color }) => (
        <Html key={text} center position={pos} style={{ pointerEvents: "none" }}>
          <div style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "8px",
            color,
            opacity: 0.5,
            whiteSpace: "nowrap",
            userSelect: "none",
          }}>
            {text}
          </div>
        </Html>
      ))}
    </>
  )
}

// ── SVG mini radar (for detail panel) ─────────────────────────────────────────

function MiniRadar({ scores, labels, color }) {
  const n  = scores.length
  const cx = 55, cy = 55, r = 40
  const rings = [0.33, 0.66, 1.0]

  const pts = scores.map((v, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    return [cx + Math.cos(angle) * r * v, cy + Math.sin(angle) * r * v]
  })
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z"

  return (
    <svg width={110} height={110} viewBox="0 0 110 110">
      {rings.map(g => (
        <circle key={g} cx={cx} cy={cy} r={r * g} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      ))}
      {scores.map((_, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2
        return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(angle) * r} y2={cy + Math.sin(angle) * r} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      })}
      <path d={pathD} fill={color + "30"} stroke={color} strokeWidth="1.5" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={2.5} fill={color} />)}
      {labels.map((label, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2
        const lx = cx + Math.cos(angle) * (r + 13)
        const ly = cy + Math.sin(angle) * (r + 13)
        return (
          <text key={label} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="7" fill="rgba(148,163,184,0.75)" fontFamily="JetBrains Mono">
            {label}
          </text>
        )
      })}
    </svg>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────────

function GenomeDetailPanel({ coin, genome, similarCoins, onClose }) {
  if (!coin || !genome) return null

  const change  = coin.change_24h_pct ?? 0
  const color   = changeToColor(change)
  const isUp    = change >= 0
  const fmt     = (n, opts) => n != null ? new Intl.NumberFormat("en-US", opts).format(n) : "—"
  const price   = fmt(coin.current_price, { style: "currency", currency: "USD", minimumFractionDigits: coin.current_price < 1 ? 4 : 2 })

  // Radar scores: volatility, liquidity, momentum (0-1), dominance (scaled), activity
  const radarScores  = [
    genome.volatility,
    genome.liquidityRatio,
    Math.max(0, (genome.momentum + 10) / 20), // normalize to 0-1
    Math.min(1, genome.dominance * 30),
    Math.min(1, (coin.volume_24h ?? 0) / 5e10),
  ]
  const radarLabels = ["VOL", "LIQ", "MOM", "DOM", "ACT"]

  const bars = [
    { label: "Volatility",    value: genome.volatility,    desc: "How wildly price swings" },
    { label: "Liquidity",     value: genome.liquidityRatio, desc: "Volume relative to market size" },
    { label: "Momentum",      value: Math.max(0, (genome.momentum + 10) / 20), desc: isUp ? "Currently rising" : "Currently falling" },
    { label: "Mkt Dominance", value: Math.min(1, genome.dominance * 25), desc: "Share of global crypto market" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.18 }}
      className="absolute top-2 right-2 z-30 w-60"
      style={{ background: "#020b18", border: `1.5px solid ${color}45`, borderRadius: "14px", boxShadow: `0 12px 40px rgba(0,0,0,0.95), 0 0 24px ${color}18` }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="font-display font-bold text-white text-base">{coin.name}</div>
            <div className="font-mono text-[10px] flex items-center gap-1.5 mt-0.5" style={{ color }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color, display: "inline-block" }} />
              {coin.symbol}
            </div>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-slate-500 hover:text-white text-xs transition-colors">✕</button>
        </div>

        {/* Price */}
        <div className="font-display font-bold text-white text-xl tabular-nums">{price}</div>
        <div className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full mt-1 mb-4" style={{ background: `${color}18`, border: `1px solid ${color}38`, color }}>
          {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)}% 24h
        </div>

        {/* Genome Radar */}
        <div className="flex items-center gap-3 mb-3">
          <MiniRadar scores={radarScores} labels={radarLabels} color={color} />
          <div className="flex-1">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2">Genome Scores</div>
            {bars.map(({ label, value, desc }) => (
              <div key={label} className="mb-1.5">
                <div className="flex justify-between text-[8px] font-mono mb-0.5">
                  <span className="text-slate-400">{label}</span>
                  <span style={{ color }}>{(value * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: color }}
                    initial={{ width: 0 }} animate={{ width: `${value * 100}%` }} transition={{ duration: 0.4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Genome position */}
        <div className="rounded-lg p-2 mb-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-1.5">3D Genome Coords</div>
          <div className="grid grid-cols-3 gap-1 text-center">
            {[["X", "Volatility", genome.x], ["Y", "Liquidity", genome.y], ["Z", "Momentum", genome.z]].map(([ax, label, val]) => (
              <div key={ax}>
                <div className="text-[9px] font-mono font-bold text-slate-300">{Number(val).toFixed(2)}</div>
                <div className="text-[7px] font-mono text-slate-600">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Similar coins (genome neighbors) */}
        {similarCoins?.length > 0 && (
          <div>
            <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-1.5">Genomically Similar</div>
            <div className="flex flex-wrap gap-1">
              {similarCoins.map(s => (
                <span key={s.symbol} className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold"
                  style={{ background: `${changeToColor(s.change_24h_pct ?? 0)}15`, color: changeToColor(s.change_24h_pct ?? 0), border: `1px solid ${changeToColor(s.change_24h_pct ?? 0)}30` }}>
                  {s.symbol}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 text-[7px] font-mono text-slate-700 text-center border-t border-white/5 pt-2">
          Lines show coins with similar genome profiles
        </div>
      </div>
    </motion.div>
  )
}

// ── Scene ─────────────────────────────────────────────────────────────────────

function GenomeScene({ coins, genomes, selectedSymbol, onSelect }) {
  // Top 20 by market cap always show labels
  const majorSymbols = useMemo(() =>
    new Set([...coins].sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0)).slice(0, 18).map(c => c.symbol)),
    [coins]
  )

  return (
    <>
      <Stars radius={100} depth={60} count={2500} factor={3.5} fade speed={0.5} />
      <ambientLight intensity={0.15} />
      <pointLight position={[8, 8, 8]}  color="#00D4FF" intensity={1.2} />
      <pointLight position={[-8,-8,-8]} color="#7B2FBE" intensity={0.7} />
      <pointLight position={[0, 8, 0]}  color="#00C896" intensity={0.4} />

      <SimilarityLines coins={coins} genomes={genomes} selectedSymbol={selectedSymbol} />
      <AxisLabels />

      {coins.map((coin, i) => (
        <CoinOrb
          key={coin.symbol}
          coin={coin}
          genome={genomes[i]}
          isSelected={selectedSymbol === coin.symbol}
          isMajor={majorSymbols.has(coin.symbol)}
          onSelect={onSelect}
        />
      ))}
    </>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CryptoGlobe() {
  const cryptoData = useCryptoStore((s) => s.cryptoData)
  const coins      = useMemo(() => cryptoData ?? [], [cryptoData])

  // Compute genome coords once (memoized)
  const totalMarketCap = useMemo(() => coins.reduce((s, c) => s + (c.market_cap ?? 0), 0), [coins])
  const genomes        = useMemo(() => coins.map(c => computeGenome(c, totalMarketCap)), [coins, totalMarketCap])

  const [selected, setSelected] = useState(null)  // { coin, genome }

  const handleSelect = useCallback((coin, genome) => {
    setSelected(prev => prev?.coin.symbol === coin.symbol ? null : { coin, genome })
  }, [])
  const handleDeselect = useCallback(() => setSelected(null), [])

  // Compute similar coins for selected
  const similarCoins = useMemo(() => {
    if (!selected) return []
    const selIdx = coins.findIndex(c => c.symbol === selected.coin.symbol)
    if (selIdx === -1) return []
    return coins
      .map((c, i) => ({ c, d: genomeDistance(selected.genome, genomes[i]) }))
      .filter(x => x.c.symbol !== selected.coin.symbol && x.d < 2.5)
      .sort((a, b) => a.d - b.d)
      .slice(0, 6)
      .map(x => x.c)
  }, [selected, coins, genomes])

  return (
    <div className="w-full h-full relative select-none">

      {/* Description strip */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-2 pointer-events-none">
        <p className="text-[9.5px] font-mono text-slate-500 leading-relaxed">
          <span className="text-cyan-400 font-semibold">GENOME SPACE</span> — each coin's 3D position is its behavioral signature.
          <span className="text-amber-300"> X = volatility</span> ·
          <span className="text-emerald-400"> Y = liquidity</span> ·
          <span className="text-purple-400"> Z = momentum</span>.
          Lines connect coins with similar profiles. <span className="text-slate-400">Rotate · Click to analyze.</span>
        </p>
      </div>

      {/* 3D canvas */}
      <Canvas
        camera={{ position: [4, 3, 8], fov: 52 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
        onPointerMissed={handleDeselect}
        className="w-full h-full"
      >
        <GenomeScene
          coins={coins}
          genomes={genomes}
          selectedSymbol={selected?.coin.symbol}
          onSelect={handleSelect}
        />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          autoRotate={!selected}
          autoRotateSpeed={0.3}
          minDistance={4}
          maxDistance={18}
          dampingFactor={0.08}
          enableDamping
        />
      </Canvas>

      {/* Genome detail panel */}
      <AnimatePresence>
        {selected && (
          <GenomeDetailPanel
            coin={selected.coin}
            genome={selected.genome}
            similarCoins={similarCoins}
            onClose={handleDeselect}
          />
        )}
      </AnimatePresence>

      {/* Interaction hint */}
      <AnimatePresence>
        {!selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
          >
            <div className="rounded-full px-3 py-1 border text-[9px] font-mono text-slate-500 whitespace-nowrap"
              style={{ background: "rgba(2,11,24,0.8)", borderColor: "rgba(255,255,255,0.07)" }}>
              🖱 Drag to rotate · Scroll to zoom · Click any orb to analyze
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
