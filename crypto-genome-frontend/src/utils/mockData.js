export const mockAssets = [
  { symbol: "BTC", name: "Bitcoin", current_price: 64230.5, change_24h_pct: 2.5, volume_24h: 35000000000, market_cap: 1200000000000, last_updated: new Date().toISOString() },
  { symbol: "ETH", name: "Ethereum", current_price: 3450.2, change_24h_pct: 4.1, volume_24h: 18000000000, market_cap: 400000000000, last_updated: new Date().toISOString() },
  { symbol: "SOL", name: "Solana", current_price: 145.8, change_24h_pct: -1.2, volume_24h: 3000000000, market_cap: 65000000000, last_updated: new Date().toISOString() },
  { symbol: "ADA", name: "Cardano", current_price: 0.45, change_24h_pct: 0.8, volume_24h: 400000000, market_cap: 15000000000, last_updated: new Date().toISOString() },
  { symbol: "DOT", name: "Polkadot", current_price: 6.8, change_24h_pct: 1.5, volume_24h: 200000000, market_cap: 8000000000, last_updated: new Date().toISOString() },
]

export const mockSystemMetrics = {
  active_streams: 15,
  events_per_second: 4230,
  system_health: "healthy",
  total_latency_ms: 45,
  last_error: null
}

export const mockGenome = [
  { symbol: "BTC", volatility_score: 0.4, correlation_score: 1.0, momentum_score: 0.6, drawdown_risk: 0.3, liquidity_score: 0.9, dimension_1: 0.5, dimension_2: 0.4, dimension_3: 0.6, dimension_4: 0.7, dimension_5: 0.8 },
  { symbol: "ETH", volatility_score: 0.6, correlation_score: 0.8, momentum_score: 0.7, drawdown_risk: 0.5, liquidity_score: 0.8, dimension_1: 0.6, dimension_2: 0.7, dimension_3: 0.8, dimension_4: 0.5, dimension_5: 0.6 },
  { symbol: "SOL", volatility_score: 0.9, correlation_score: 0.5, momentum_score: 0.9, drawdown_risk: 0.8, liquidity_score: 0.6, dimension_1: 0.9, dimension_2: 0.8, dimension_3: 0.9, dimension_4: 0.4, dimension_5: 0.5 },
]

// Generating some mock history data for the charts
const generateHistory = (basePrice, days = 30) => {
  const data = []
  let price = basePrice
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    price = price * (1 + (Math.random() - 0.48) * 0.05)
    data.push({
      timestamp: date.toISOString(),
      price: price
    })
  }
  return data
}

export const mockAssetHistory = {
  BTC: generateHistory(64000),
  ETH: generateHistory(3400),
  SOL: generateHistory(140),
}
