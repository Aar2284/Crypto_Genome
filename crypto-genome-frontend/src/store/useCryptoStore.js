import { create } from "zustand"
import { fetchLatestCrypto, fetchMetrics, fetchPriceHistory } from "../services/api.js"
import { createMarketDataSlice } from "./slices/marketDataSlice.js"
import { createMetricsSlice } from "./slices/metricsSlice.js"
import { createUiNetworkSlice } from "./slices/uiNetworkSlice.js"

const useCryptoStore = create((set, get) => ({
  ...createMarketDataSlice(set, get),
  ...createMetricsSlice(set, get),
  ...createUiNetworkSlice(set, get),

  // Orchestrator Action for Fetching All Required Dashboard Data
  fetchAll: async (signal) => {
    // Prevent overlapping loading UI flashes if already loading and this is a background refresh.
    // We only set loading to true if we don't have cryptoData yet (initial load)
    const isInitialLoad = get().cryptoData.length === 0
    if (isInitialLoad) {
      get().setLoading(true)
    }
    get().clearError()
    
    try {
      const [cryptoData, metrics, btcHistory] = await Promise.all([
        fetchLatestCrypto(signal),
        fetchMetrics(signal),
        fetchPriceHistory("BTC", 24, signal).catch(() => []) // Fallback gracefully if history fails
      ])
      
      // Update state without causing unnecessary remounts/flickers
      set((state) => {
        return {
          cryptoData,
          metrics,
          btcHistory,
          loading: false,
          lastUpdated: new Date().toISOString(),
          refreshCount: state.refreshCount + 1,
          error: null
        }
      })
    } catch (err) {
      if (err.status !== 499) { // 499 is our custom cancelled request status from api.js
        get().setError(err.message)
        get().setLoading(false)
      }
    }
  }
}))

export default useCryptoStore
