import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

function Particles({ count = 3000 }) {
  const mesh = useRef()
  
  // Pre-allocate geometry buffer for performance (O(1) rendering cost)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 20  // x
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20  // y
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20  // z
    }
    return arr
  }, [count])

  useFrame((state) => {
    // Slow rotation of entire particle field; avoids expensive allocations
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.03
      mesh.current.rotation.x = state.clock.elapsedTime * 0.01
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count} array={positions} itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025} color="#00D4FF"
        transparent opacity={0.6}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  )
}

export default function ParticleField() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 75 }}
        dpr={[1, 2]} 
        gl={{ preserveDrawingBuffer: true, antialias: false }}
      >
        <Particles />
      </Canvas>
    </div>
  )
}
