export const createMarketDataSlice = (set) => ({
  cryptoData: [],
  btcHistory: [],
  
  setCryptoData: (data) => set({ cryptoData: data }),
  setBtcHistory: (data) => set({ btcHistory: data }),
})
