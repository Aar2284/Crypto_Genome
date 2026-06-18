import { useSyncExternalStore } from "react"

// Reads CSS custom properties so charts/components get the right accent color per theme.
// Dark = #00D4FF (neon cyan), Light = #8B5CF6 (lavender)

function getSnapshot() {
  const s = getComputedStyle(document.documentElement)
  return {
    accent: s.getPropertyValue("--accent-hex").trim() || "#00D4FF",
    cyber:  s.getPropertyValue("--cyber-hex").trim()  || "#29F6A0",
    neon:   s.getPropertyValue("--neon-hex").trim()    || "#A855F7",
  }
}

let cache = getSnapshot()
const listeners = new Set()

// Watch for data-theme changes
const observer = new MutationObserver(() => {
  cache = getSnapshot()
  listeners.forEach(fn => fn())
})
if (typeof document !== "undefined") {
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
}

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export default function useThemeColor() {
  return useSyncExternalStore(subscribe, () => cache, () => cache)
}
