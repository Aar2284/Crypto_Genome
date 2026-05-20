export const createUiNetworkSlice = (set) => ({
  loading: false,
  error: null,
  lastUpdated: null,
  refreshCount: 0,
  
  setLoading: (isLoading) => set({ loading: isLoading }),
  setError: (errMessage) => set({ error: errMessage }),
  clearError: () => set({ error: null }),
  
  recordUpdate: () => set((state) => ({ 
    lastUpdated: new Date().toISOString(),
    refreshCount: state.refreshCount + 1,
    error: null // clear errors on successful update
  }))
})
