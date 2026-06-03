import { useEffect, useRef } from "react"
import { liveStream, WS_STATES } from "../services/websocket.js"
import useCryptoStore from "../store/useCryptoStore.js"

export function useLiveData(enabled = true) {
  const reconnectToastShown = useRef(false)

  useEffect(() => {
    if (!enabled) return

    // Subscribe to state changes — update store, but stay quiet on failure
    const unsubscribeState = liveStream.onStateChange((state) => {
      useCryptoStore.getState().setWsStatus(state)
      // No toast on failure — the dashboard shows mock data so no user action needed
    })

    // Subscribe to messages and patch Zustand store incrementally
    const unsubscribeMessage = liveStream.onMessage((msg) => {
      useCryptoStore.getState().patchCryptoData(msg.data, msg.latency)
    })

    // Pause WebSocket when tab is hidden to save resources
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        liveStream.connect()
      } else {
        liveStream.disconnect()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Initial connect attempt
    if (document.visibilityState === "visible") {
      liveStream.connect()
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      unsubscribeState()
      unsubscribeMessage()
      liveStream.disconnect()
    }
  }, [enabled])
}
