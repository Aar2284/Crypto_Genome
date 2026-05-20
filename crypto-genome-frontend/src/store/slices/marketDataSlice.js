export const createMarketDataSlice = (set) => ({
  cryptoData: [],
  btcHistory: [],
  
  setCryptoData: (data) => set({ cryptoData: data }),
  setBtcHistory: (data) => set({ btcHistory: data }),
  
  // Incremental patching for WebSocket stream to prevent full array recreations
  patchCryptoData: (updates, latencyMs = 0) => set((state) => {
    // If no existing data, just set it
    if (state.cryptoData.length === 0) {
      // Normalize incoming data same as api.js to keep schema consistent
      const normalized = updates.map(item => ({
        ...item,
        asset_id: item.asset_id || String(item.id || item.symbol),
        name: item.name || item.coin,
        current_price: item.current_price !== undefined ? item.current_price : item.price,
        volume_24h: item.volume_24h !== undefined ? item.volume_24h : item.volume,
        change_24h_pct: item.change_24h_pct !== undefined ? item.change_24h_pct : item.change24h,
        last_updated_at: item.last_updated_at || item.timestamp
      }))
      return { 
        cryptoData: normalized,
        wsLatency: latencyMs,
        lastUpdated: new Date().toISOString()
      }
    }

    // Create a map of updates by symbol for O(1) lookup
    const updateMap = new Map(updates.map(u => [u.symbol, u]))
    let hasChanges = false
    
    // Patch existing array incrementally
    const newData = state.cryptoData.map(row => {
      const update = updateMap.get(row.symbol)
      if (!update) return row
      
      hasChanges = true
      // Preserve row reference if no actual value changed (deep equal check could go here if needed, 
      // but usually price always changes on a tick). We do shallow merge.
      return {
        ...row,
        current_price: update.price !== undefined ? update.price : row.current_price,
        change_24h_pct: update.change24h !== undefined ? update.change24h : row.change_24h_pct,
        volume_24h: update.volume !== undefined ? update.volume : row.volume_24h,
        last_updated_at: update.timestamp || row.last_updated_at
      }
    })

    // Optionally handle new coins added dynamically that weren't in the initial load
    // Not strictly required if the DB is static, but good practice.
    updates.forEach(u => {
      if (!state.cryptoData.find(r => r.symbol === u.symbol)) {
        hasChanges = true
        newData.push({
          ...u,
          asset_id: String(u.id || u.symbol),
          name: u.coin,
          current_price: u.price,
          volume_24h: u.volume,
          change_24h_pct: u.change24h,
          last_updated_at: u.timestamp
        })
      }
    })

    if (!hasChanges) return {} // No state mutation

    // Update BTC history seamlessly if BTC changed
    const btcUpdate = updateMap.get("BTC")
    let newBtcHistory = state.btcHistory
    if (btcUpdate && btcUpdate.price) {
      const now = new Date().toISOString()
      const newPoint = { timestamp: now, price: btcUpdate.price, volume: btcUpdate.volume }
      // Append and keep last 24 points to avoid unbounded growth
      newBtcHistory = [...state.btcHistory, newPoint].slice(-24)
    }

    return { 
      cryptoData: newData,
      btcHistory: newBtcHistory,
      wsLatency: latencyMs,
      lastUpdated: new Date().toISOString()
    }
  }),
})
