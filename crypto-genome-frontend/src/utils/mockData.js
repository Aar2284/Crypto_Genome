export const MOCK_MARKET_DATA = [
  { 
    asset_id: "BTC", 
    symbol: "BTC",
    name: "Bitcoin",  
    current_price: 64230.50, 
    change_24h_pct: 2.4,  
    volume_24h: 32000000000, 
    market_cap: 1200000000000,
    last_updated_at: new Date(Date.now() - 1000).toISOString(),
    pipeline_status: "active",
    latency_ms: 45
  },
  { 
    asset_id: "ETH", 
    symbol: "ETH",
    name: "Ethereum", 
    current_price: 3450.20,  
    change_24h_pct: -1.2, 
    volume_24h: 15000000000, 
    market_cap: 400000000000,
    last_updated_at: new Date(Date.now() - 2000).toISOString(),
    pipeline_status: "active",
    latency_ms: 38
  },
  { 
    asset_id: "SOL", 
    symbol: "SOL",
    name: "Solana",   
    current_price: 145.80,   
    change_24h_pct: 5.6,  
    volume_24h: 3000000000,  
    market_cap: 65000000000,
    last_updated_at: new Date(Date.now() - 1500).toISOString(),
    pipeline_status: "active",
    latency_ms: 42
  },
  { 
    asset_id: "DOT", 
    symbol: "DOT",
    name: "Polkadot", 
    current_price: 7.20,     
    change_24h_pct: 0.8,  
    volume_24h: 250000000,   
    market_cap: 10000000000,
    last_updated_at: new Date(Date.now() - 5000).toISOString(),
    pipeline_status: "degraded",
    latency_ms: 150
  },
  { 
    asset_id: "LINK",
    symbol: "LINK",
    name: "Chainlink",
    current_price: 18.40,    
    change_24h_pct: -3.4, 
    volume_24h: 400000000,   
    market_cap: 11000000000,
    last_updated_at: new Date(Date.now() - 8000).toISOString(),
    pipeline_status: "active",
    latency_ms: 55
  },
  {
    asset_id: "NEW",
    symbol: "NEW",
    name: "New Protocol",
    current_price: 1.25,
    change_24h_pct: null, // Testing nullable fields as per backend contract
    volume_24h: null,
    market_cap: null,
    last_updated_at: new Date(Date.now() - 10000).toISOString(),
    pipeline_status: "syncing",
    latency_ms: 300
  }
]

export const MOCK_CHART_DATA = Array.from({ length: 24 }).map((_, i) => {
  const date = new Date()
  date.setHours(date.getHours() - (24 - i))
  // Reset minutes/seconds for clean hourly intervals
  date.setMinutes(0, 0, 0)
  
  return {
    timestamp: date.toISOString(),
    price: 60000 + Math.random() * 5000,
    volume: Math.random() * 1000000,
  }
})

export const MOCK_PIPELINE_METRICS = {
  active_streams: 14,
  events_per_second: 3450,
  system_health: "healthy", // "healthy" | "degraded" | "down"
  total_latency_ms: 42,
  last_error: null
}
