// ── Assets ────────────────────────────────────────────────────────────────────
export const mockAssets = [
  { symbol: "BTC",  name: "Bitcoin",       current_price: 64230.50, change_24h_pct:  2.5,  volume_24h: 35_000_000_000, market_cap: 1_200_000_000_000, last_updated: new Date().toISOString() },
  { symbol: "ETH",  name: "Ethereum",      current_price:  3450.20, change_24h_pct:  4.1,  volume_24h: 18_000_000_000, market_cap:   400_000_000_000, last_updated: new Date().toISOString() },
  { symbol: "SOL",  name: "Solana",        current_price:   145.80, change_24h_pct: -1.2,  volume_24h:  3_000_000_000, market_cap:    65_000_000_000, last_updated: new Date().toISOString() },
  { symbol: "BNB",  name: "BNB",           current_price:   542.30, change_24h_pct:  0.9,  volume_24h:  2_100_000_000, market_cap:    80_000_000_000, last_updated: new Date().toISOString() },
  { symbol: "XRP",  name: "XRP",           current_price:     0.62, change_24h_pct:  3.2,  volume_24h:  1_800_000_000, market_cap:    34_000_000_000, last_updated: new Date().toISOString() },
  { symbol: "ADA",  name: "Cardano",       current_price:     0.45, change_24h_pct:  0.8,  volume_24h:    400_000_000, market_cap:    15_000_000_000, last_updated: new Date().toISOString() },
  { symbol: "AVAX", name: "Avalanche",     current_price:    38.40, change_24h_pct: -2.1,  volume_24h:    600_000_000, market_cap:    15_500_000_000, last_updated: new Date().toISOString() },
  { symbol: "DOT",  name: "Polkadot",      current_price:     6.80, change_24h_pct:  1.5,  volume_24h:    200_000_000, market_cap:     8_000_000_000, last_updated: new Date().toISOString() },
  { symbol: "LINK", name: "Chainlink",     current_price:    14.20, change_24h_pct:  5.3,  volume_24h:    900_000_000, market_cap:     8_400_000_000, last_updated: new Date().toISOString() },
  { symbol: "MATIC",name: "Polygon",       current_price:     0.85, change_24h_pct: -0.4,  volume_24h:    350_000_000, market_cap:     7_800_000_000, last_updated: new Date().toISOString() },
]

// ── System Metrics ────────────────────────────────────────────────────────────
export const mockSystemMetrics = {
  active_streams:    15,
  events_per_second: 4230,
  system_health:     "healthy",
  total_latency_ms:  45,
  last_error:        null,
}

// ── Genome Data ───────────────────────────────────────────────────────────────
export const mockGenome = [
  { symbol: "BTC",  dimension_1: 0.40, dimension_2: 1.00, dimension_3: 0.60, dimension_4: 0.30, dimension_5: 0.90 },
  { symbol: "ETH",  dimension_1: 0.60, dimension_2: 0.80, dimension_3: 0.70, dimension_4: 0.50, dimension_5: 0.80 },
  { symbol: "SOL",  dimension_1: 0.90, dimension_2: 0.50, dimension_3: 0.90, dimension_4: 0.80, dimension_5: 0.60 },
  { symbol: "BNB",  dimension_1: 0.35, dimension_2: 0.70, dimension_3: 0.55, dimension_4: 0.40, dimension_5: 0.75 },
  { symbol: "XRP",  dimension_1: 0.50, dimension_2: 0.60, dimension_3: 0.65, dimension_4: 0.55, dimension_5: 0.65 },
]

// ── OHLCV History Generator ───────────────────────────────────────────────────
function generateOHLCV(basePrice, days = 60) {
  const data = []
  let price = basePrice
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const open  = price
    const close = price * (1 + (Math.random() - 0.48) * 0.04)
    const high  = Math.max(open, close) * (1 + Math.random() * 0.015)
    const low   = Math.min(open, close) * (1 - Math.random() * 0.015)
    const volume = basePrice * (1_000 + Math.random() * 5_000)
    data.push({ timestamp: date.toISOString(), open, high, low, close, price: close, volume })
    price = close
  }
  return data
}

export const mockAssetHistory = {
  BTC:   generateOHLCV(64000),
  ETH:   generateOHLCV(3400),
  SOL:   generateOHLCV(140),
  BNB:   generateOHLCV(540),
  XRP:   generateOHLCV(0.60),
  ADA:   generateOHLCV(0.44),
  AVAX:  generateOHLCV(39),
  DOT:   generateOHLCV(6.7),
  LINK:  generateOHLCV(13.5),
  MATIC: generateOHLCV(0.86),
}
