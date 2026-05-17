import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float } from "@react-three/drei"

function Coin({ symbol = "₿", color = "#FFD700" }) {
  const coinRef = useRef()
  
  useFrame(() => { 
    if (coinRef.current) coinRef.current.rotation.y += 0.02 
  })
  
  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={coinRef}>
        {/* Cylinder = coin shape */}
        <cylinderGeometry args={[0.8, 0.8, 0.12, 64]} />
        <meshStandardMaterial
          color={color} metalness={0.9} roughness={0.1}
          emissive={color} emissiveIntensity={0.15}
        />
      </mesh>
      <ambientLight intensity={0.5} />
      <pointLight position={[2, 2, 2]} intensity={2} color={color} />
    </Float>
  )
}

export default function FloatingCoin({ symbol, color, size = 80 }) {
  return (
    <div style={{ width: size, height: size }} className="relative z-0">
      <Canvas 
        camera={{ position: [0, 0, 3], fov: 40 }}
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <Coin symbol={symbol} color={color} />
      </Canvas>
    </div>
  )
}
