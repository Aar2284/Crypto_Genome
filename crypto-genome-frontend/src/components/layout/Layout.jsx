import { useCallback } from "react"
import { Outlet } from "react-router-dom"
import Navbar from "./Navbar.jsx"
import MarketTicker from "./MarketTicker.jsx"

export default function Layout() {
  const trackPointer = useCallback((event) => {
    const shell = event.currentTarget
    shell.style.setProperty("--pointer-x", `${event.clientX}px`)
    shell.style.setProperty("--pointer-y", `${event.clientY}px`)
  }, [])

  return (
    <div className="app-shell min-h-screen bg-navy-900 text-slate-100" onPointerMove={trackPointer}>
      <div className="market-watermark" aria-hidden="true" />
      <div className="pointer-aurora" aria-hidden="true" />
      <Navbar />
      <MarketTicker />
      <main className="market-grid relative overflow-hidden px-4 pb-10 pt-36 md:px-6">
        <div className="relative z-10"><Outlet /></div>
      </main>
    </div>
  )
}