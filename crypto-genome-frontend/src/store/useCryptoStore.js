import { create } from "zustand"
import { fetchLatestCrypto, fetchMetrics, fetchPriceHistory, fetchGenomeData, fetchClusterSummary } from "../services/api.js"
import { createMarketDataSlice } from "./slices/marketDataSlice.js"
import { createMetricsSlice } from "./slices/metricsSlice.js"
import { createUiNetworkSlice } from "./slices/uiNetworkSlice.js"
import { getMockCryptoData, getMockMetrics, getMockBtcHistory } from "../utils/mockFallback.js"

const useCryptoStore = create((set, get) => ({
  ...createMarketDataSlice(set, get),
  ...createMetricsSlice(set, get),
  ...createUiNetworkSlice(set, get),

  backendReachable: false,

  // Genome / cluster data
  genomeData: {},        // keyed by symbol: { cluster_id, cluster_label, ...metrics }
  clusterSummary: [],    // array of { cluster_id, cluster_label, count, avg_... }
  colorMode: "change",   // "change" | "cluster"
  setColorMode: (mode) => set({ colorMode: mode }),

  // Called on startup — ONLY loads mock data, no network requests
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
    get().startLiveFallback()
  },

  startLiveFallback: () => {
    if (get().fallbackWs) return; // Prevent multiple connections
    console.log("[Client Fallback] Connecting directly to Binance Live Stream...")
    const ws = new WebSocket("wss://stream.binance.com:9443/ws/!miniTicker@arr")
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const updates = {}
      
      // Parse Binance miniTicker array
      data.forEach(item => {
        if (item.s.endsWith("USDT")) {
          const sym = item.s.replace("USDT", "")
          const open = parseFloat(item.o)
          const close = parseFloat(item.c)
          const change = open > 0 ? ((close - open) / open) * 100 : 0
          
          updates[sym] = {
            current_price: close,
            change_24h_pct: change,
            volume_24h: parseFloat(item.q) // Quote volume
          }
        }
      })

      // Batch update the zustand store
      set(state => {
        let updatedCount = 0
        const newData = state.cryptoData.map(coin => {
          if (updates[coin.symbol]) {
            updatedCount++
            return { ...coin, ...updates[coin.symbol] }
          }
          return coin
        })
        
        // Only trigger a re-render if we actually updated mapped coins
        if (updatedCount > 0) {
          return { cryptoData: newData, lastUpdated: new Date().toISOString() }
        }
        return state
      })
    }
    
    ws.onclose = () => {
      console.log("[Client Fallback] Connection lost. Reconnecting in 3s...")
      set({ fallbackWs: null })
      setTimeout(() => get().startLiveFallback(), 3000)
    }

    set({ fallbackWs: ws })
  },

  // Called only after WebSocket connects (backend confirmed alive)
  fetchAll: async (signal) => {
    get().clearError()
    try {
      const [cryptoData, metrics, btcHistory, genomeArray, clusterSummary] = await Promise.all([
        fetchLatestCrypto(signal),
        fetchMetrics(signal),
        fetchPriceHistory("BTC", 24, signal).catch(() => getMockBtcHistory()),
        fetchGenomeData(signal).catch(() => []),
        fetchClusterSummary(signal).catch(() => []),
      ])

      // Build genome lookup map keyed by symbol
      const genomeData = {}
      genomeArray.forEach(g => { genomeData[g.symbol] = g })

      // Merge cluster_id + cluster_label into each coin
      const enrichedData = cryptoData.map(coin => ({
        ...coin,
        cluster_id: genomeData[coin.symbol]?.cluster_id ?? null,
        cluster_label: genomeData[coin.symbol]?.cluster_label ?? null,
      }))

      set((state) => ({
        cryptoData: enrichedData,
        genomeData,
        clusterSummary,
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
