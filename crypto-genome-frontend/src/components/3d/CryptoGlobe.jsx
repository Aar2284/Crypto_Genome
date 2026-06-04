import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Sphere, MeshDistortMaterial, Stars } from "@react-three/drei"
import * as THREE from "three"
import useCryptoStore from "../../store/useCryptoStore.js"

// Convert a coin's market cap rank + some deterministic hash to lat/lon on the globe
function symbolToPosition(symbol, index, total) {
  // Spread coins evenly using a golden-angle spiral across globe surface
  const phi = Math.acos(1 - (2 * (index + 0.5)) / total)
  const theta = Math.PI * (1 + Math.sqrt(5)) * index
  const r = 1.45 // slightly above globe surface
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ]
}

// Color for a coin based on 24h change
function changeToColor(change) {
  if (change > 3) return "#00C896"  // strong green
  if (change > 0) return "#00D4FF"  // cyber blue
  if (change > -3) return "#FFD700" // warning gold
  return "#FF4466"                   // red
}

function DataNodes({ coins }) {
  const groupRef = useRef()

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.003
  })

  return (
    <group ref={groupRef}>
      {coins.map((coin, i) => {
        const pos = symbolToPosition(coin.symbol, i, coins.length)
        const color = changeToColor(coin.change_24h_pct ?? 0)
        // Scale dot size by market cap (larger = bigger dot)
        const mcap = coin.market_cap ?? 1e9
        const scale = Math.max(0.018, Math.min(0.055, Math.log10(mcap) / 400))

        return (
          <mesh key={coin.symbol} position={pos}>
            <sphereGeometry args={[scale, 8, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={2}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function Globe({ coins }) {
  const ringRef = useRef()
  const globeRef = useRef()

  useFrame((state) => {
    if (ringRef.current) {
      const t = state.clock.elapsedTime
      ringRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.02)
    }
  })

  return (
    <>
      {/* Starfield */}
      <Stars radius={80} depth={50} count={4000} factor={4} fade speed={1} />

      {/* Wireframe globe shell */}
      <Sphere ref={globeRef} args={[1.4, 48, 48]}>
        <MeshDistortMaterial
          color="#00D4FF"
          wireframe
          distort={0.12}
          speed={1.5}
          opacity={0.35}
          transparent
        />
      </Sphere>

      {/* Glowing inner core */}
      <Sphere args={[1.33, 32, 32]}>
        <meshStandardMaterial
          color="#001428"
          emissive="#002244"
          emissiveIntensity={0.4}
        />
      </Sphere>

      {/* Saturn ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[1.82, 0.014, 8, 128]} />
        <meshStandardMaterial color="#00C896" emissive="#00C896" emissiveIntensity={2.5} />
      </mesh>

      {/* Data nodes — one dot per tracked coin */}
      {coins.length > 0 && <DataNodes coins={coins} />}

      {/* Lights */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]}  color="#00D4FF" intensity={1.5} />
      <pointLight position={[-5,-5,-5]} color="#7B2FBE" intensity={0.8} />
    </>
  )
}

export default function CryptoGlobe() {
  const cryptoData = useCryptoStore((s) => s.cryptoData)

  // Memoize so the node geometry only recalculates when data changes
  const coins = useMemo(() => cryptoData ?? [], [cryptoData])

  return (
    <div className="w-full h-full relative z-0">
      {/* Legend overlay */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> +3%+
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> 0–3%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 0 to -3%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> -3%+
        </span>
      </div>

      <div className="absolute bottom-2 right-2 z-10 text-[10px] font-mono text-slate-600">
        {coins.length} assets tracked
      </div>

      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
      >
        <Globe coins={coins} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.4}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  )
}
