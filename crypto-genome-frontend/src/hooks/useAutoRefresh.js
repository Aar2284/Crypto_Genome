import { useEffect, useRef, useState } from "react"

/**
 * Safely polls an async function.
 * Features: interval cleanup, tab visibility awareness, AbortController cancellation,
 * and prevents overlapping requests.
 */
export function useAutoRefresh(asyncFn, intervalMs = 30_000, enabled = true) {
  const savedFn = useRef(asyncFn)
  const abortControllerRef = useRef(null)
  const timeoutRef = useRef(null)
  const isFetchingRef = useRef(false)
  const [isVisible, setIsVisible] = useState(true)

  // Keep ref current so interval closure always calls latest fn
  useEffect(() => { savedFn.current = asyncFn }, [asyncFn])

  // Track tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible')
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  useEffect(() => {
    // If not enabled or tab is hidden, we pause polling
    if (!enabled || !isVisible) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      return
    }

    let isMounted = true

    const tick = async () => {
      if (!isMounted || isFetchingRef.current) return
      
      isFetchingRef.current = true
      
      // Setup cancellation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      try {
        await savedFn.current(abortControllerRef.current.signal)
      } catch (error) {
        // Errors are handled inside the function/store usually, but we catch to ensure we don't crash the loop
        console.warn("[useAutoRefresh] tick error:", error)
      } finally {
        isFetchingRef.current = false
        // Schedule next tick only after the previous one completes
        if (isMounted && enabled && isVisible) {
          timeoutRef.current = setTimeout(tick, intervalMs)
        }
      }
    }

    // Call immediately on mount
    tick()

    return () => {
      isMounted = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [intervalMs, enabled, isVisible])
}
