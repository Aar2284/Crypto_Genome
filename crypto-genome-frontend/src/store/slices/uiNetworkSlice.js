export const createUiNetworkSlice = (set) => ({
  wsStatus: "idle",
  wsLatency: 0,
  fallbackWs: null,
  setWsStatus: (wsStatus) => set({ wsStatus }),
})
