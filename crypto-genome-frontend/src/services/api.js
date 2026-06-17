import axios from "axios"

// In development, Vite proxies /api → http://localhost:8000
// In production, set VITE_API_BASE_URL in .env.production
const BASE_URL = import.meta.env.VITE_API_BASE_URL || ""

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
})

// ── Request interceptor ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Inject auth token or timestamp headers if required later
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor ─────────────────────────────────
api.interceptors.response.use(
  (response) => {
    // Backend (Pydantic AssetResponse schema) already returns correct field names:
    // asset_id, name, symbol, current_price, volume_24h, change_24h_pct, market_cap, last_updated_at
    // No normalization needed — pass data through directly.
    return response.data
  },
  (error) => {
    let message = "An unknown error occurred"
    let status = 500

    if (axios.isCancel(error)) {
      message = "Request was cancelled"
      status = 499 // Client closed request
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      message = "Request timed out. The server took too long to respond."
      status = 408
    } else if (!error.response) {
      message = "Network error. The server may be offline or unreachable."
      status = 503
    } else {
      status = error.response.status
      message = error.response.data?.detail || error.message
    }

    const normalizedError = { message, status, original: error }
    console.error(`[API Error ${status}]`, message)
    
    // Never expose raw axios errors to the UI
    return Promise.reject(normalizedError)
  }
)

// ── Endpoints ─────────────────────────────────────────────
// Adding AbortSignal support for request cancellation

export const fetchLatestCrypto = (signal) => 
  api.get("/api/v1/market/assets", { signal })

export const fetchAllCrypto = (limit = 100, signal) => 
  api.get(`/api/v1/market/assets?limit=${limit}`, { signal })

export const fetchMetrics = (signal) => 
  api.get("/api/v1/system/metrics", { signal })

export const fetchRowCount = (signal) => 
  api.get("/api/v1/system/metrics", { signal })

export const fetchPriceHistory = (symbol, hours = 24, signal) =>
  api.get(`/api/v1/market/assets/${symbol}/history?limit=${hours}`, { signal })

export const fetchGenomeData = (signal) =>
  api.get("/api/v1/genome", { signal })

export const fetchClusterSummary = (signal) =>
  api.get("/api/v1/genome/clusters", { signal })

export default api
