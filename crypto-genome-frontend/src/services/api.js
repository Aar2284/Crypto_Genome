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
    // Validate or normalize response shape if needed
    // Normalize CryptoRecord to match UI expectation where necessary
    // Backend schema: id, coin, symbol, price, volume, change24h, market_cap, timestamp
    // UI schema: asset_id, name, symbol, current_price, volume_24h, change_24h_pct, market_cap, last_updated_at
    if (Array.isArray(response.data)) {
      response.data = response.data.map(item => {
        if (item.coin && item.price !== undefined) {
          return {
            ...item,
            asset_id: String(item.id),
            name: item.coin,
            current_price: item.price,
            volume_24h: item.volume,
            change_24h_pct: item.change24h,
            last_updated_at: item.timestamp
          }
        }
        return item
      })
    }
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
  api.get("/api/latest", { signal })

export const fetchAllCrypto = (limit = 100, signal) => 
  api.get(`/api/crypto?limit=${limit}`, { signal })

export const fetchMetrics = (signal) => 
  api.get("/api/metrics", { signal })

export const fetchRowCount = (signal) => 
  api.get("/api/row-count", { signal })

export const fetchPriceHistory = (symbol, hours = 24, signal) =>
  api.get(`/api/history/${symbol}?hours=${hours}`, { signal })

export default api
