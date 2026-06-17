import { create } from "zustand"
import { fetchLatestCrypto, fetchMetrics, fetchPriceHistory } from "../services/api.js"
import { createMarketDataSlice } from "./slices/marketDataSlice.js"
import { createMetricsSlice } from "./slices/metricsSlice.js"
import { createUiNetworkSlice } from "./slices/uiNetworkSlice.js"
import { getMockCryptoData, getMockMetrics, getMockBtcHistory } from "../utils/mockFallback.js"

const useCryptoStore = create((set, get) => ({
  ...createMarketDataSlice(set, get),
  ...createMetricsSlice(set, get),
  ...createUiNetworkSlice(set, get),

  backendReachable: false,

  // Called on startup ΓÇö ONLY loads mock data, no network requests
  // Real data is fetched only once the WebSocket confirms backend is alive
  initWithMockData: () => {
    set({
      cryptoData: getMockCryptoData(),
      metrics: getMockMetrics(),
      btcHistory: getMockBtcHistory(),
      loading: false,
      lastUpdated: new Date().toISOString(),
      backendReachable: false,
    })
  },

  // Called only after WebSocket connects (backend confirmed alive)
  fetchAll: async (signal) => {
    get().clearError()
    try {
      const [cryptoData, metrics, btcHistory] = await Promise.all([
        fetchLatestCrypto(signal),
        fetchMetrics(signal),
        fetchPriceHistory("BTC", 24, signal).catch(() => getMockBtcHistory()),
      ])

      set((state) => ({
        cryptoData,
        metrics,
        btcHistory,
        loading: false,
        lastUpdated: new Date().toISOString(),
        refreshCount: state.refreshCount + 1,
        error: null,
        backendReachable: true,
      }))
    } catch (err) {
      if (err.status === 499) return
      // Keep existing data (mock or last real), just mark unreachable
      set({ backendReachable: false, loading: false })
    }
  },
}))

export default useCryptoStore
