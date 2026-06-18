export const createMarketDataSlice = (set) => ({
  cryptoData: [],
  btcHistory: [],
  loading: true,
  lastUpdated: null,
  refreshCount: 0,
  error: null,
  clearError: () => set({ error: null }),
  patchCryptoData: (updates = [], latency = 0) => set((state) => {
    const updateBySymbol = new Map(updates.map((update) => [update.symbol, update]))
    return {
      cryptoData: state.cryptoData.map((asset) => updateBySymbol.has(asset.symbol) ? { ...asset, ...updateBySymbol.get(asset.symbol) } : asset),
      wsLatency: latency,
      lastUpdated: new Date().toISOString(),
    }
  }),
})
