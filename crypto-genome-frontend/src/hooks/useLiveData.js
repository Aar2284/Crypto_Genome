import { useEffect } from "react"
import toast from "react-hot-toast"
import { liveStream, WS_STATES } from "../services/websocket.js"
import useCryptoStore from "../store/useCryptoStore.js"

export function useLiveData(enabled = true) {
  useEffect(() => {
    if (!enabled) return

    let toastId = null

    // Subscribe to state changes for UI toasts and Zustand observability metrics
    const unsubscribeState = liveStream.onStateChange((state, attempts) => {
      useCryptoStore.getState().setWsStatus(state)
      
      if (state === WS_STATES.CONNECTED) {
        if (toastId) { toast.dismiss(toastId); toastId = null; }
        toast.success("Live data stream connected", { duration: 2000, id: "ws-connected" })
      } else if (state === WS_STATES.RECONNECTING) {
        if (!toastId) {
          toastId = toast.loading(`Connection lost. Reconnecting... (Attempt ${attempts})`, { id: "ws-reconnecting" })
        } else {
          toast.loading(`Connection lost. Reconnecting... (Attempt ${attempts})`, { id: toastId })
        }
      } else if (state === WS_STATES.FAILED) {
        if (toastId) { toast.dismiss(toastId); toastId = null; }
        toast.error("Stream connection failed permanently. Please refresh.", { duration: Infinity, id: "ws-failed" })
      }
    })

    // Subscribe to messages and patch Zustand store incrementally
    const unsubscribeMessage = liveStream.onMessage((msg) => {
      // Patch state incrementally (do not replace full array)
      useCryptoStore.getState().patchCryptoData(msg.data, msg.latency)
    })

    // Visibility change handling (pause when tab hidden to save resources)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        liveStream.connect()
      } else {
        liveStream.disconnect()
      }
    }
    
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Initial connect
    if (document.visibilityState === 'visible') {
      liveStream.connect()
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      unsubscribeState()
      unsubscribeMessage()
      liveStream.disconnect()
      if (toastId) toast.dismiss(toastId)
    }
  }, [enabled])
}
