import { NavLink } from "react-router-dom"
import { Activity, Database, GitBranch, LayoutDashboard, Bell, Moon, Sun } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import useCryptoStore from "../../store/useCryptoStore.js"

const navLinks = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/analytics", icon: Activity, label: "Analytics" },
  { to: "/pipeline", icon: GitBranch, label: "Pipeline" },
  { to: "/metrics", icon: Database, label: "Metrics" },
]

export default function Navbar() {
  const wsStatus = useCryptoStore((s) => s.wsStatus)
  const isLive = wsStatus === "connected"
  const [theme, setTheme] = useState(() => localStorage.getItem("crypto-genome-theme") || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem("crypto-genome-theme", theme)
  }, [theme])

  return (
    <motion.nav initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="market-nav fixed top-0 left-0 right-0 z-50 bg-navy-800/90 backdrop-blur-md border-b border-accent/20 px-4 md:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2"><div className="brand-mark w-6 h-6 md:w-8 md:h-8 rounded-full bg-accent/20 border border-accent animate-pulse-slow shrink-0" /><span className="font-display text-accent text-lg md:text-xl tracking-widest hidden sm:inline">CRYPTO<span className="text-cyber">GENOME</span></span></div>
      <div className="flex items-center gap-1 md:gap-2">{navLinks.map(({ to, icon: Icon, label }) => <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `market-link flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono transition-all duration-200 ${isActive ? "bg-accent/20 text-accent border border-accent/40" : "text-slate-400 hover:text-accent hover:bg-accent/10 border border-transparent"}`}><Icon size={16} /><span className="hidden md:inline">{label}</span></NavLink>)}</div>
      <div className="flex items-center gap-2 md:gap-3"><div className="flex items-center gap-1.5 shrink-0"><span className={`w-2 h-2 rounded-full ${isLive ? "bg-cyber animate-pulse" : "bg-amber-400"}`} /><span className={`text-[10px] md:text-xs font-mono hidden sm:inline ${isLive ? "text-cyber" : "text-amber-400"}`}>{isLive ? "LIVE" : "DEMO"}</span></div><button type="button" aria-label="Notifications" className="p-2 rounded-lg text-slate-400 hover:text-accent hover:bg-accent/10 transition-all duration-200 shrink-0"><Bell size={18} /></button><button type="button" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} className="theme-toggle p-2 rounded-lg text-slate-400 hover:text-accent hover:bg-accent/10 transition-all duration-200 shrink-0" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button></div>
    </motion.nav>
  )
}