import { Outlet } from "react-router-dom"
import Navbar from "./Navbar.jsx"
import Starfield from "./Starfield.jsx"

export default function Layout() {
  return (
    <div className="app-shell page-texture min-h-screen bg-navy-900 text-slate-100">
      <Starfield />
      <Navbar />
      <main className="market-grid relative overflow-hidden px-4 pb-8 pt-24 md:px-6">
        <div className="relative z-10"><Outlet /></div>
      </main>
    </div>
  )
}