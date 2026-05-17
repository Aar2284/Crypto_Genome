import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Sphere, MeshDistortMaterial, Stars } from "@react-three/drei"

function Globe() {
  const globeRef = useRef()
  const ringRef  = useRef()

  useFrame((state) => {
    // Avoid re-allocating state; use refs directly
    if (globeRef.current) globeRef.current.rotation.y += 0.003
    if (ringRef.current) {
      const t = state.clock.elapsedTime
      ringRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.02)
    }
  })

  return (
    <>
      {/* Starfield background */}
      <Stars radius={80} depth={50} count={5000} factor={4} fade speed={1} />
      
      {/* Main globe */}
      <Sphere ref={globeRef} args={[1.4, 64, 64]}>
        <MeshDistortMaterial
          color="#00D4FF" wireframe
          distort={0.15} speed={2}
          opacity={0.5} transparent
        />
      </Sphere>
      
      {/* Glowing core */}
      <Sphere args={[1.35, 32, 32]}>
        <meshStandardMaterial
          color="#001F3F" emissive="#003366"
          emissiveIntensity={0.3}
        />
      </Sphere>
      
      {/* Rotating ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.2, 0, 0]}>
        {/* Pre-defined geometry prevents recreation on re-renders */}
        <torusGeometry args={[1.8, 0.015, 8, 128]} />
        <meshStandardMaterial color="#00C896" emissive="#00C896" emissiveIntensity={2} />
      </mesh>
      
      {/* Lights */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]}  color="#00D4FF" intensity={1.5} />
      <pointLight position={[-5,-5,-5]} color="#7B2FBE" intensity={0.8} />
    </>
  )
}

export default function CryptoGlobe() {
  return (
    <div className="w-full h-full relative z-0">
      <Canvas 
        camera={{ position: [0, 0, 4], fov: 50 }}
        dpr={[1, 2]} // Prevents GPU throttling on high-res displays
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <Globe />
        <OrbitControls
          enablePan={false} enableZoom={false}
          autoRotate autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  )
}
