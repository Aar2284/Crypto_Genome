export const createUiNetworkSlice = (set) => ({
  loading: false,
  error: null,
  lastUpdated: null,
  refreshCount: 0,
  wsStatus: "idle",
  wsLatency: 0,
  
  setWsStatus: (status) => set({ wsStatus: status }),
  setWsLatency: (latency) => set({ wsLatency: latency }),
  
  setLoading: (isLoading) => set({ loading: isLoading }),
  setError: (errMessage) => set({ error: errMessage }),
  clearError: () => set({ error: null }),
  
  recordUpdate: () => set((state) => ({ 
    lastUpdated: new Date().toISOString(),
    refreshCount: state.refreshCount + 1,
    error: null // clear errors on successful update
  }))
})
