import { NavLink } from "react-router-dom"
import { Activity, Database, GitBranch, LayoutDashboard, Bell } from "lucide-react"
import { motion } from "framer-motion"
import useCryptoStore from "../../store/useCryptoStore.js"

const navLinks = [
  { to: "/",         icon: LayoutDashboard, label: "Dashboard"  },
  { to: "/analytics",icon: Activity,        label: "Analytics"  },
  { to: "/pipeline", icon: GitBranch,       label: "Pipeline"   },
  { to: "/metrics",  icon: Database,        label: "Metrics"    },
]

export default function Navbar() {
  const wsStatus = useCryptoStore((s) => s.wsStatus)
  const isLive = wsStatus === "connected"

  return (
    <motion.nav
      initial={{ y: -80 }} animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50
                 bg-navy-800/90 backdrop-blur-md
                 border-b border-accent/20 px-4 md:px-6 py-3
                 flex items-center justify-between"
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-accent/20
                        border border-accent animate-pulse-slow shrink-0" />
        <span className="font-display text-accent text-lg md:text-xl tracking-widest hidden sm:inline">
          CRYPTO<span className="text-cyber">GENOME</span>
        </span>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-1 md:gap-2">
        {navLinks.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono
               transition-all duration-200
               ${isActive
                ? "bg-accent/20 text-accent border border-accent/40"
                : "text-slate-400 hover:text-accent hover:bg-accent/10 border border-transparent"
               }`
            }
          >
            <Icon size={16} />
            <span className="hidden md:inline">{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Right side — status indicator */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-2 h-2 rounded-full ${isLive ? "bg-cyber animate-pulse" : "bg-amber-400"}`} />
          <span className={`text-[10px] md:text-xs font-mono hidden sm:inline ${isLive ? "text-cyber" : "text-amber-400"}`}>
            {isLive ? "LIVE" : "DEMO"}
          </span>
        </div>
        <button className="p-2 rounded-lg text-slate-400
                           hover:text-accent hover:bg-accent/10
                           transition-all duration-200 shrink-0">
          <Bell size={18} />
        </button>
      </div>
    </motion.nav>
  )
}
