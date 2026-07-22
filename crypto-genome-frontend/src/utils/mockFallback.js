import { mockAssets, mockSystemMetrics, mockGenome, mockAssetHistory } from "../utils/mockData.js"

// ── Normalize mock data to match the schema the store expects ──
// The store uses: symbol, name, current_price, change_24h_pct, volume_24h, market_cap
// mockAssets already uses these keys — just re-export

export const getMockCryptoData = () => mockAssets.map(a => ({
  asset_id: a.symbol,
  symbol: a.symbol,
  name: a.name,
  current_price: a.current_price,
  change_24h_pct: a.change_24h_pct,
  volume_24h: a.volume_24h,
  market_cap: a.market_cap,
  last_updated_at: a.last_updated,
}))

export const getMockMetrics = () => mockSystemMetrics

export const getMockBtcHistory = () => {
  const raw = mockAssetHistory?.BTC || []
  return raw.map(p => ({
    timestamp: p.timestamp,
    price: p.close ?? p.price,
    volume: p.volume,
  }))
}
