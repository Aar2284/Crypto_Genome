export default function Badge({ label, type = "default" }) {
  const styles = {
    default: "bg-accent/10 text-accent border-accent/30",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    error:   "bg-red-500/10 text-red-400 border-red-500/30",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    live:    "bg-cyber/10 text-cyber border-cyber/30 animate-pulse-slow",
  }
  return (
    <span className={`px-2 py-0.5 text-xs font-mono rounded border ${styles[type] || styles.default}`}>
      {label}
    </span>
  )
}
