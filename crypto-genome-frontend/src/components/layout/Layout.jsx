import { Outlet } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import Navbar from "./Navbar.jsx"
import ParticleField from "../3d/ParticleField.jsx"

export default function Layout() {
  return (
    <div className="min-h-screen bg-navy relative">
      {/* 3D particle background — behind everything */}
      <ParticleField />
      
      {/* UI layer — above particles */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        {/* Push content below fixed navbar (height = 60px) */}
        <main className="flex-1 pt-16 md:pt-20">
          <Outlet />
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0E1F3D",
            color: "#00D4FF",
            border: "1px solid #00D4FF44",
            fontFamily: "JetBrains Mono, monospace",
          }
        }}
      />
    </div>
  )
}
