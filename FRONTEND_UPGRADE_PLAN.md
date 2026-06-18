# 🧬 Crypto Genome — Frontend Upgrade Plan

> Post-backend-upgrade frontend overhaul.  
> Every page rebuilt to surface **all** backend data — clean, smooth, never cluttered.

---

## Backend API Inventory (What We Have to Work With)

| Endpoint | Method | Data Available |
|---|---|---|
| `/api/v1/market/assets` | GET | All coins: price, 24h change, volume, market cap, pipeline status, data source, latency |
| `/api/v1/market/assets/{symbol}/history` | GET | Per-coin price+volume time-series (hourly) |
| `/api/v1/genome` | GET | All 21 genome metrics for every coin + cluster_id/label |
| `/api/v1/genome/{symbol}` | GET | Single coin full genome (21 metrics across 5 dimensions) |
| `/api/v1/genome/clusters` | GET | Cluster summary: per-cluster averages, count, labels |
| `/api/v1/history/{symbol}` | GET | Daily OHLCV candles (up to 10 years), date-range support |
| `/api/v1/history/{symbol}/summary` | GET | Coin history summary: row count, date range, latest close |
| `/api/v1/system/metrics` | GET | Active streams, events/sec, health, latency, last error |
| `/api/v1/health` | GET | System health check + DB connectivity |
| `/ws/live` | WebSocket | Real-time price ticks for all coins (5s interval) |
| `wss://stream.binance.com` | WebSocket (fallback) | Direct Binance live ticker when backend is offline |

---

## Current Frontend Gaps

- **Analytics page** uses `mockGenome` and `mockAssetHistory` — never hits real API
- **Dashboard** imports components that don't exist yet (`StatCard`, `CryptoTable`, `LoadingSpinner`, `PriceLineChart`)
- No dedicated **Coin Detail** page — can't deep-dive into a single asset
- **OHLCV history API** (`/api/v1/history/{symbol}`) is completely unused by frontend
- **Cluster data** from `/api/v1/genome/clusters` is fetched but never visualized
- **Pipeline status / data_source per coin** is in the API response but never shown
- No page-level transitions or smooth routing animations
- Asset selector in Analytics is hardcoded to 10 coins (`ASSETS` array)
- GenomeSpace 3D scatter exists but has no cluster coloring toggle connected to real data
- SystemMetrics page has a Grafana placeholder that does nothing

---

## Page-by-Page Upgrade Plan

---

### 1. 🏠 Dashboard (Home — `/`)

**Goal:** Command center feel. At a glance, see market pulse, top movers, pipeline health, and genome clusters — all from real data. Smooth, not crowded.

#### Section A — Hero Stats Row (4 cards)
| Card | Data Source | Display |
|---|---|---|
| BTC Price | `/market/assets` (find BTC) | Live price with sparkline mini-chart, subtle pulse animation |
| Total Market Volume | `/market/assets` (sum volume_24h) | Compact number (`$4.2B`) with trend arrow |
| Active Streams | `/system/metrics` | Count with health-dot (green/amber) |
| Genome Clusters | `/genome/clusters` (length) | Number of identified clusters with cluster names tooltip |

> **Polish:** Cards fade-in staggered (0.1s delay each). Skeleton loaders instead of spinners.

#### Section B — Two-Column Grid (50/50)

**Left: BTC/USD Price Action Chart**
- **Data:** `/history/BTC?days=30` → full OHLCV candles (NOT the old `/market/assets/BTC/history`)
- **Chart type:** Area chart with gradient fill (cyan → transparent)
- **Controls:** Time-range pills: `7D | 30D | 90D | 1Y` — each pill re-fetches from `/history/BTC?days=N`
- **Overlay:** Current price as floating badge, 24h change percentage

**Right: Live Assets Table**
- **Data:** `/market/assets` merged with `genomeData` (already done in store)
- **Columns:** Symbol, Name, Price, 24h%, Volume, Market Cap, Data Source badge, Cluster label pill
- **Sorting:** Clickable column headers
- **Search:** Quick filter input at top
- **Polish:** Row hover glow, price flash animation on WebSocket update, scroll independently

#### Section C — Genome Space (Full Width)
- **Data:** Already connected via store → `genomeData`
- **Upgrades:**
  - Connect the `colorMode` toggle (already in store: `"change"` vs `"cluster"`)
  - Show cluster labels as floating 3D text near cluster centroids
  - Info panel on sphere click: coin name + cluster + 5-dimension summary
  - Better legend overlay (which color = which cluster)

#### Section D — Cluster Overview Strip (NEW)
- **Data:** `/genome/clusters`
- **Layout:** Horizontal scroll of cluster cards (one per cluster)
- Each card shows: cluster label, coin count, avg volatility gauge, avg momentum gauge, top 3 coins in that cluster
- **Polish:** Card hover expands slightly, shows avg values as mini bar charts

---

### 2. 📊 Analytics (`/analytics`)

**Goal:** Deep per-asset genome intelligence. Replace ALL mock data with real API calls. Show every genome dimension meaningfully.

#### Section A — Asset Selector
- **REMOVE** hardcoded `ASSETS` array
- **Data:** `/market/assets` → dynamically build selector from all available coins
- **Display:** Scrollable pill bar with search filter, show cluster-colored dot next to each coin

#### Section B — Asset Summary Cards (4 cards)
- **Data:** `/market/assets` (find selected coin)
- Cards: Price, 24h Change, Volume 24h, Market Cap
- **Add:** Data source badge (Binance/KuCoin/etc.), pipeline status indicator

#### Section C — Price History (OHLCV Candlestick)
- **REPLACE** `mockAssetHistory` with real data from `/history/{symbol}?days=90`
- **Chart:** Real candlestick chart (green/red candles) with volume bars underneath
- **Controls:** `30D | 90D | 180D | 1Y | ALL` range selector
- **Overlay:** Moving average line (computed client-side from close prices), high/low markers

#### Section D — Genome Profile (Radar Chart)
- **REPLACE** `mockGenome` with real data from `/genome/{symbol}`
- **Map the 5 dimensions properly:**
  - Volatility = average of `volatility_baseline`, `volatility_skew`, `volatility_kurtosis`, `vol_of_vol` (normalized)
  - Correlation = average of `market_beta`, `btc_correlation`, `r_squared`, `downside_coupling`
  - Momentum = average of `trend_efficiency`, `autocorrelation`, `up_day_ratio`, `risk_adjusted_momentum`
  - Drawdown = average of `max_drawdown`, `avg_drawdown_depth`, `avg_drawdown_duration`, `recovery_speed_ratio`
  - Liquidity = average of `log_avg_volume`, `volume_stability_cv`, `vol_return_correlation`, `crisis_liquidity_retention`
- **Add:** Toggle to see raw 21-metric view (expandable detail panel below radar)

#### Section E — 21-Metric Genome Breakdown (NEW)
- **Data:** `/genome/{symbol}`
- **Layout:** 5 dimension groups, each with 4 metric cards
- Each card: metric name, value, mini explanation tooltip, colored bar showing where this coin sits vs. the cluster average
- **Not crowded:** Accordion/collapsible per dimension group, only one open at a time

#### Section F — Comparative Volume (Bottom Left)
- **Data:** `/market/assets` (all coins, sorted by volume)
- **Chart:** Horizontal bar chart, top 10 by volume, color-coded by cluster

#### Section G — Multi-Asset Genome Overlay (Bottom Right)
- **REPLACE** `genomeData.slice(0, 3)` with a multi-select picker
- Let user pick 2-4 coins → overlay their radar charts with different colors
- **Data:** `/genome/{symbol}` for each selected coin

---

### 3. ⚙️ Pipeline Monitor (`/pipeline`)

**Goal:** Operational intelligence. Show real data flow status, per-coin health, and real system metrics — not hardcoded logs.

#### Section A — Service Health Cards
- **Data:** `/system/metrics` + `/health`
- Keep existing `PipelineStatus` component but enhance with:
  - Health check ping (call `/health` every 30s, show response time)
  - Last error display if `last_error` is not null
  - Historical health sparkline (if metrics are fetched periodically, store last N in memory)

#### Section B — Pipeline Flow Diagram
- Keep existing stage visualization but enhance:
  - Each stage node shows a real metric (e.g., Ingest → active_streams, Compute → events_per_second)
  - Pulse animation speed scales with events_per_second value
  - Add a "last run" timestamp beneath each stage

#### Section C — Per-Coin Pipeline Status Table (NEW)
- **Data:** `/market/assets` — uses `pipeline_status`, `data_source`, `latency_ms`, `last_updated_at`
- **Columns:** Symbol, Pipeline Status (badge), Data Source (badge), Latency (ms with color: green <100, amber <500, red >500), Last Updated (relative time)
- **Sorting + Filtering:** Sort by latency to find slowest pipelines, filter by data source
- **Polish:** Rows with `pipeline_status !== "active"` get a subtle amber highlight

#### Section D — Ingestion Stats
- Keep existing stat cards, but pull all values from real `/system/metrics`
- **Add:** "Coins in DB" count derived from `/market/assets` length
- **Add:** "Genome Coverage" = coins with genome data / total coins percentage

#### Section E — Stream Logs
- **Currently:** Hardcoded `STREAM_LOGS` array
- **Upgrade:** Build a real log buffer from WebSocket messages — each time a price update comes in via WS, push to a log ring buffer (max 50 entries)
- Show actual coin symbols, actual prices, actual timestamps
- Color-code: green for successful updates, amber for coins with high latency

---

### 4. 🖥 System Metrics (`/metrics`)

**Goal:** Infrastructure dashboard. Real data everywhere. Remove the empty Grafana placeholder — replace with actual visualizations.

#### Section A — Quick Stats
- **Data:** `/system/metrics`
- Cards: System Health (badge), API Latency (ms), Active Streams, Events/Sec
- **Add:** Backend Uptime — ping `/health` and show response time, "Backend: Online / Offline" indicator

#### Section B — Service Tiles
- Keep FastAPI/PostgreSQL/Kafka/CPU tiles
- **Upgrade:** Each tile shows real status:
  - FastAPI: `system_health` from metrics + latency
  - PostgreSQL: total OHLCV row count from `/history/{symbol}/summary` for any coin
  - Kafka: events/sec from metrics
  - CPU/Memory: show active_streams count as proxy for load

#### Section C — Data Coverage Dashboard (REPLACES Grafana Placeholder)
- **Data:** `/genome/clusters` + `/market/assets` + `/genome`
- **Layout:** Three visual widgets:

  1. **Asset Coverage Donut Chart**
     - Segments: Coins with genome data vs. coins without
     - Center text: `85%` or whatever the coverage is
  
  2. **Data Source Distribution Bar Chart**
     - How many coins come from each `data_source` (binance, kucoin, gate, delisted, no_live_data)
     - Horizontal bars, one per source
  
  3. **Cluster Distribution Pie/Treemap**
     - Show how coins are distributed across GMM clusters
     - Each segment = one cluster, labeled with cluster_label, sized by count

#### Section D — Latency Heatmap (NEW)
- **Data:** `/market/assets` → `latency_ms` per coin
- **Visualization:** Grid of small colored squares (one per coin), color from green (low latency) to red (high latency)
- Hover: show coin symbol + exact latency
- Gives an at-a-glance view of system performance per pipeline

---

### 5. 🔬 Coin Detail Page (NEW — `/coin/:symbol`)

**Goal:** The ultimate deep-dive. Click any coin from any page → land here with everything we know about it.

#### Section A — Hero Header
- **Data:** `/market/assets` (find coin) + `/genome/{symbol}`
- Coin name, symbol, price, 24h change, volume, market cap
- Cluster label pill, data source badge, pipeline status
- Last updated timestamp

#### Section B — Full OHLCV Chart
- **Data:** `/history/{symbol}?days=365`
- Full interactive candlestick chart with volume overlay
- Time range controls: 30D | 90D | 180D | 1Y | MAX
- Shows highs/lows markers

#### Section C — History Summary Stats
- **Data:** `/history/{symbol}/summary`
- Total data points, earliest date, latest date, latest close price
- Shown as inline stat badges

#### Section D — Full Genome Card
- **Data:** `/genome/{symbol}` — all 21 metrics
- Radar chart (5 dimensions) at the top
- Below: expandable sections for each dimension (4 metrics each)
- Each metric: name, value, description tooltip, position relative to cluster average

#### Section E — Cluster Context
- **Data:** `/genome/clusters` (find this coin's cluster)
- Show: "This coin belongs to Cluster X — [cluster_label]"
- Show cluster averages vs. this coin's values as a comparison bar chart
- List other coins in the same cluster as clickable pills

---

## New Components Needed

| Component | Location | Purpose |
|---|---|---|
| `StatCard.jsx` | `components/ui/` | Reusable metric card with icon, value, trend, skeleton state |
| `CryptoTable.jsx` | `components/ui/` | Full-featured sortable, searchable table |
| `LoadingSpinner.jsx` | `components/ui/` | Animated loading indicator |
| `PriceLineChart.jsx` | `components/charts/` | Area/line chart for price series |
| `SkeletonLoader.jsx` | `components/ui/` | Shimmer placeholder for loading states |
| `CandlestickChart.jsx` | `components/charts/` | Real OHLCV candlestick chart |
| `ClusterCard.jsx` | `components/ui/` | Cluster summary card for dashboard strip |
| `DonutChart.jsx` | `components/charts/` | Coverage/distribution donut |
| `HeatmapGrid.jsx` | `components/charts/` | Latency heatmap visualization |
| `MetricBreakdown.jsx` | `components/ui/` | 21-metric genome expandable panel |
| `ComparisonBars.jsx` | `components/charts/` | Coin vs. cluster average bar comparison |
| `AssetPicker.jsx` | `components/ui/` | Dynamic searchable multi-select coin picker |
| `TimeRangeSelector.jsx` | `components/ui/` | Reusable 7D/30D/90D/1Y pill toggle |
| `DataSourceBadge.jsx` | `components/ui/` | Colored badge for binance/kucoin/gate/etc. |
| `Layout.jsx` (update) | `components/layout/` | Add page transition animations (framer-motion) |

---

## API Service Additions (`services/api.js`)

```javascript
// NEW — needed to power the upgrade
export const fetchOHLCVHistory = (symbol, days = 365, signal) =>
  api.get(`/api/v1/history/${symbol}?days=${days}`, { signal })

export const fetchOHLCVSummary = (symbol, signal) =>
  api.get(`/api/v1/history/${symbol}/summary`, { signal })

export const fetchGenomeSingle = (symbol, signal) =>
  api.get(`/api/v1/genome/${symbol}`, { signal })

export const fetchHealthCheck = (signal) =>
  api.get(`/api/v1/health`, { signal })
```

---

## Store Upgrades (`store/useCryptoStore.js`)

- **Add `ohlcvCache`** — keyed by `{symbol}_{days}`, caches fetched OHLCV data to avoid re-fetching
- **Add `selectedCoin`** — tracks which coin is being deep-dived into
- **Add `wsLogBuffer`** — ring buffer (max 50) of WebSocket update logs for Pipeline Monitor
- **Add `healthStatus`** — result of last `/health` ping with response time
- **Move slices** — the commented `slices/` imports exist but the directory doesn't. Either create proper slices or consolidate

---

## Routing Update (`App.jsx`)

```diff
 <Route index element={<Dashboard />} />
 <Route path="analytics" element={<Analytics />} />
 <Route path="pipeline" element={<PipelineMonitor />} />
 <Route path="metrics" element={<SystemMetrics />} />
+<Route path="coin/:symbol" element={<CoinDetail />} />
```

---

## Global Polish

| Enhancement | Detail |
|---|---|
| **Page transitions** | Wrap routes in `AnimatePresence` + `motion.div` with fade+slide |
| **Skeleton loading** | Replace all spinners with shimmer skeleton components that match card shapes |
| **Price flash** | On WS update, briefly flash the price cell green (up) or red (down) |
| **Smooth number transitions** | Animate number changes using `framer-motion` `animate` on value change |
| **Responsive breakpoints** | Ensure all grids degrade gracefully: 4-col → 2-col → 1-col |
| **Empty states** | Design proper "No data" illustrations instead of blank areas |
| **Tooltips** | Add info-circle tooltips to genome metrics explaining what each one means |
| **Navbar active state** | Highlight current page in navigation with animated underline |
| **Dark scrollbars** | Custom styled thin scrollbars matching the navy theme |

---

## Execution Order

| Phase | Scope | Why First |
|---|---|---|
| **Phase 1** | Create missing base components (`StatCard`, `CryptoTable`, `LoadingSpinner`, `PriceLineChart`, `SkeletonLoader`) + API additions | Dashboard is currently broken without these |
| **Phase 2** | Dashboard overhaul — wire to real APIs, add cluster strip, time-range controls, table search/sort | Home page = first impression |
| **Phase 3** | Analytics overhaul — kill all mock data, real OHLCV + genome, 21-metric breakdown, dynamic asset picker | Core differentiating page |
| **Phase 4** | Coin Detail page — new route + full per-coin deep-dive | Needed before linking from tables |
| **Phase 5** | Pipeline Monitor — real log buffer, per-coin status table, live health pings | Operational page |
| **Phase 6** | System Metrics — replace Grafana placeholder with real coverage/distribution/heatmap charts | Infrastructure page |
| **Phase 7** | Global polish — page transitions, skeleton loaders, price flash, responsive audit | Final spit-shine |

---

> **Guiding Principle:** Every API field gets a home on the frontend. Every chart uses real data.  
> Clean whitespace, consistent card patterns, and layered disclosure (summary → detail on click) prevents clutter.
