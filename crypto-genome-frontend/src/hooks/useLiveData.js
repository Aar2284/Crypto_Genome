import { useEffect } from "react"
import { liveStream, WS_STATES } from "../services/websocket.js"
import useCryptoStore from "../store/useCryptoStore.js"

export function useLiveData(enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const unsubscribeState = liveStream.onStateChange((state) => {
      useCryptoStore.getState().setWsStatus(state)

      // When WebSocket connects, backend is confirmed alive — fetch real HTTP data
      if (state === WS_STATES.CONNECTED) {
        useCryptoStore.getState().fetchAll(new AbortController().signal)
      }
    })

    const unsubscribeMessage = liveStream.onMessage((msg) => {
      useCryptoStore.getState().patchCryptoData(msg.data, msg.latency)
    })

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        liveStream.connect()
      } else {
        liveStream.disconnect()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

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
