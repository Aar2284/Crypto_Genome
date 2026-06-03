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

  // Orchestrator Action for Fetching All Required Dashboard Data
  fetchAll: async (signal) => {
    const isInitialLoad = get().cryptoData.length === 0

    if (isInitialLoad) {
      // Pre-load mock data immediately so the dashboard is never blank
      set({
        cryptoData: getMockCryptoData(),
        metrics: getMockMetrics(),
        btcHistory: getMockBtcHistory(),
        loading: false,
        lastUpdated: new Date().toISOString(),
      })
    }

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
      }))
    } catch (err) {
      if (err.status === 499) return // Request was cancelled — ignore

      // Backend offline: silently keep mock data, don't show error in the UI
      console.warn("[API] Backend unavailable, showing mock data:", err.message)
      set((state) => ({
        loading: false,
        refreshCount: state.refreshCount + 1,
        // Keep whatever data we already have (mock or real)
      }))
    }
  },
}))

export default useCryptoStore
