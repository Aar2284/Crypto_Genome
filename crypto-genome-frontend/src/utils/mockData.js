// ── Price history generator ────────────────────────────────────────────────────
function generateOHLCV(basePrice, days = 60, volatility = 0.04) {
  const data = []
  let price = basePrice
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const open  = price
    const close = price * (1 + (Math.random() - 0.48) * volatility)
    const high  = Math.max(open, close) * (1 + Math.random() * 0.012)
    const low   = Math.min(open, close) * (1 - Math.random() * 0.012)
    const volume = basePrice * (800 + Math.random() * 4000)
    data.push({ timestamp: date.toISOString(), open, high, low, close, price: close, volume })
    price = close
  }
  return data
}

// ── 80+ assets ────────────────────────────────────────────────────────────────
export const mockAssets = [
  // Tier 1 — mega caps
  { symbol: "BTC",   name: "Bitcoin",       current_price: 64230.50, change_24h_pct:  2.5,  volume_24h: 35_000_000_000, market_cap: 1_260_000_000_000 },
  { symbol: "ETH",   name: "Ethereum",      current_price:  3450.20, change_24h_pct:  4.1,  volume_24h: 18_000_000_000, market_cap:   415_000_000_000 },
  { symbol: "BNB",   name: "BNB",           current_price:   542.30, change_24h_pct:  0.9,  volume_24h:  2_100_000_000, market_cap:    83_000_000_000 },
  { symbol: "SOL",   name: "Solana",        current_price:   145.80, change_24h_pct: -1.2,  volume_24h:  3_000_000_000, market_cap:    67_000_000_000 },
  { symbol: "XRP",   name: "XRP",           current_price:     0.62, change_24h_pct:  3.2,  volume_24h:  1_800_000_000, market_cap:    34_000_000_000 },
  // Tier 2
  { symbol: "DOGE",  name: "Dogecoin",      current_price:     0.14, change_24h_pct:  6.5,  volume_24h:  1_200_000_000, market_cap:    20_000_000_000 },
  { symbol: "ADA",   name: "Cardano",       current_price:     0.45, change_24h_pct:  0.8,  volume_24h:    400_000_000, market_cap:    15_800_000_000 },
  { symbol: "TRX",   name: "TRON",          current_price:     0.12, change_24h_pct:  1.1,  volume_24h:    580_000_000, market_cap:    10_500_000_000 },
  { symbol: "AVAX",  name: "Avalanche",     current_price:    38.40, change_24h_pct: -2.1,  volume_24h:    600_000_000, market_cap:    15_700_000_000 },
  { symbol: "SHIB",  name: "Shiba Inu",     current_price: 0.0000245,change_24h_pct:  8.2,  volume_24h:    700_000_000, market_cap:    14_400_000_000 },
  { symbol: "LINK",  name: "Chainlink",     current_price:    14.20, change_24h_pct:  5.3,  volume_24h:    900_000_000, market_cap:     8_500_000_000 },
  { symbol: "DOT",   name: "Polkadot",      current_price:     6.80, change_24h_pct:  1.5,  volume_24h:    200_000_000, market_cap:     8_100_000_000 },
  { symbol: "MATIC", name: "Polygon",       current_price:     0.85, change_24h_pct: -0.4,  volume_24h:    350_000_000, market_cap:     7_900_000_000 },
  { symbol: "UNI",   name: "Uniswap",       current_price:     7.40, change_24h_pct:  2.8,  volume_24h:    180_000_000, market_cap:     4_400_000_000 },
  { symbol: "ATOM",  name: "Cosmos",        current_price:     8.20, change_24h_pct: -0.9,  volume_24h:    150_000_000, market_cap:     3_200_000_000 },
  { symbol: "LTC",   name: "Litecoin",      current_price:    74.50, change_24h_pct:  1.2,  volume_24h:    300_000_000, market_cap:     5_500_000_000 },
  { symbol: "ICP",   name: "Internet Comp.",current_price:    12.60, change_24h_pct: -3.8,  volume_24h:     95_000_000, market_cap:     5_800_000_000 },
  { symbol: "APT",   name: "Aptos",         current_price:    10.20, change_24h_pct:  3.6,  volume_24h:    220_000_000, market_cap:     4_200_000_000 },
  { symbol: "ARB",   name: "Arbitrum",      current_price:     1.08, change_24h_pct:  1.9,  volume_24h:    280_000_000, market_cap:     3_700_000_000 },
  { symbol: "OP",    name: "Optimism",      current_price:     2.15, change_24h_pct:  2.4,  volume_24h:    160_000_000, market_cap:     2_800_000_000 },
  { symbol: "SUI",   name: "Sui",           current_price:     1.42, change_24h_pct:  7.1,  volume_24h:    310_000_000, market_cap:     3_900_000_000 },
  { symbol: "NEAR",  name: "NEAR Protocol", current_price:     5.80, change_24h_pct:  0.6,  volume_24h:    190_000_000, market_cap:     6_200_000_000 },
  { symbol: "FIL",   name: "Filecoin",      current_price:     5.20, change_24h_pct: -1.7,  volume_24h:    130_000_000, market_cap:     2_400_000_000 },
  { symbol: "IMX",   name: "Immutable X",   current_price:     2.10, change_24h_pct:  4.4,  volume_24h:    145_000_000, market_cap:     3_100_000_000 },
  { symbol: "INJ",   name: "Injective",     current_price:    28.40, change_24h_pct:  5.8,  volume_24h:    200_000_000, market_cap:     2_700_000_000 },
  { symbol: "SEI",   name: "Sei",           current_price:     0.54, change_24h_pct:  3.3,  volume_24h:    115_000_000, market_cap:     1_500_000_000 },
  { symbol: "STX",   name: "Stacks",        current_price:     2.60, change_24h_pct: -0.7,  volume_24h:     90_000_000, market_cap:     3_800_000_000 },
  { symbol: "MINA",  name: "Mina Protocol", current_price:     0.72, change_24h_pct:  1.8,  volume_24h:     55_000_000, market_cap:       940_000_000 },
  { symbol: "EGLD",  name: "MultiversX",    current_price:    38.20, change_24h_pct: -2.5,  volume_24h:     70_000_000, market_cap:     1_000_000_000 },
  { symbol: "KAS",   name: "Kaspa",         current_price:     0.14, change_24h_pct:  9.2,  volume_24h:    220_000_000, market_cap:     3_400_000_000 },
  { symbol: "VET",   name: "VeChain",       current_price:   0.0345, change_24h_pct:  0.4,  volume_24h:     80_000_000, market_cap:     2_500_000_000 },
  { symbol: "ALGO",  name: "Algorand",      current_price:    0.185, change_24h_pct: -1.1,  volume_24h:     55_000_000, market_cap:     1_500_000_000 },
  { symbol: "XLM",   name: "Stellar",       current_price:    0.115, change_24h_pct:  0.9,  volume_24h:     95_000_000, market_cap:     3_200_000_000 },
  { symbol: "XMR",   name: "Monero",        current_price:   148.00, change_24h_pct:  0.2,  volume_24h:     60_000_000, market_cap:     2_700_000_000 },
  { symbol: "RUNE",  name: "THORChain",     current_price:     5.10, change_24h_pct:  4.2,  volume_24h:    130_000_000, market_cap:     1_700_000_000 },
  { symbol: "FTM",   name: "Fantom",        current_price:    0.725, change_24h_pct: -0.8,  volume_24h:    100_000_000, market_cap:     2_040_000_000 },
  // DeFi
  { symbol: "AAVE",  name: "Aave",          current_price:    88.50, change_24h_pct:  3.1,  volume_24h:     95_000_000, market_cap:     1_300_000_000 },
  { symbol: "MKR",   name: "Maker",         current_price:  2250.00, change_24h_pct:  1.6,  volume_24h:     65_000_000, market_cap:     2_100_000_000 },
  { symbol: "CRV",   name: "Curve DAO",     current_price:    0.435, change_24h_pct: -4.2,  volume_24h:     80_000_000, market_cap:       595_000_000 },
  { symbol: "SNX",   name: "Synthetix",     current_price:     2.15, change_24h_pct: -1.5,  volume_24h:     35_000_000, market_cap:       730_000_000 },
  { symbol: "COMP",  name: "Compound",      current_price:    52.80, change_24h_pct:  2.2,  volume_24h:     28_000_000, market_cap:       500_000_000 },
  { symbol: "YFI",   name: "Yearn Finance", current_price:  8200.00, change_24h_pct:  0.5,  volume_24h:     22_000_000, market_cap:       300_000_000 },
  { symbol: "LDO",   name: "Lido DAO",      current_price:     1.78, change_24h_pct:  2.9,  volume_24h:    110_000_000, market_cap:     1_580_000_000 },
  { symbol: "RPL",   name: "Rocket Pool",   current_price:    16.50, change_24h_pct:  1.4,  volume_24h:     18_000_000, market_cap:       280_000_000 },
  { symbol: "CVX",   name: "Convex Finance",current_price:     3.20, change_24h_pct: -2.8,  volume_24h:     14_000_000, market_cap:       205_000_000 },
  { symbol: "BAL",   name: "Balancer",      current_price:     3.45, change_24h_pct: -1.2,  volume_24h:     22_000_000, market_cap:       185_000_000 },
  { symbol: "SUSHI", name: "SushiSwap",     current_price:     1.12, change_24h_pct:  0.8,  volume_24h:     32_000_000, market_cap:       150_000_000 },
  { symbol: "GRT",   name: "The Graph",     current_price:    0.175, change_24h_pct:  1.5,  volume_24h:     45_000_000, market_cap:       1_600_000_000 },
  { symbol: "ENS",   name: "Ethereum NS",   current_price:    13.40, change_24h_pct:  3.8,  volume_24h:     30_000_000, market_cap:       425_000_000 },
  // L2 / Infra
  { symbol: "PYTH",  name: "Pyth Network",  current_price:    0.385, change_24h_pct:  5.5,  volume_24h:    150_000_000, market_cap:     1_200_000_000 },
  { symbol: "JUP",   name: "Jupiter",       current_price:    0.885, change_24h_pct:  4.8,  volume_24h:    180_000_000, market_cap:     1_100_000_000 },
  { symbol: "RNDR",  name: "Render",        current_price:     7.20, change_24h_pct:  2.6,  volume_24h:    110_000_000, market_cap:     2_700_000_000 },
  { symbol: "STRK",  name: "Starknet",      current_price:    0.945, change_24h_pct: -3.1,  volume_24h:     95_000_000, market_cap:     1_050_000_000 },
  { symbol: "ZK",    name: "zkSync",        current_price:    0.155, change_24h_pct:  1.8,  volume_24h:     65_000_000, market_cap:       875_000_000 },
  // Gaming / NFT
  { symbol: "CHZ",   name: "Chiliz",        current_price:    0.088, change_24h_pct:  2.1,  volume_24h:     55_000_000, market_cap:       850_000_000 },
  { symbol: "SAND",  name: "The Sandbox",   current_price:    0.385, change_24h_pct: -1.8,  volume_24h:     65_000_000, market_cap:       900_000_000 },
  { symbol: "MANA",  name: "Decentraland",  current_price:    0.325, change_24h_pct: -0.6,  volume_24h:     42_000_000, market_cap:       590_000_000 },
  { symbol: "AXS",   name: "Axie Infinity", current_price:     6.80, change_24h_pct:  1.1,  volume_24h:     38_000_000, market_cap:       400_000_000 },
  { symbol: "GALA",  name: "Gala",          current_price:   0.0285, change_24h_pct:  3.5,  volume_24h:     55_000_000, market_cap:       820_000_000 },
  { symbol: "ENJ",   name: "Enjin Coin",    current_price:    0.192, change_24h_pct:  0.9,  volume_24h:     18_000_000, market_cap:       160_000_000 },
  // Meme
  { symbol: "WIF",   name: "dogwifhat",     current_price:     2.42, change_24h_pct: 12.4,  volume_24h:    480_000_000, market_cap:     2_400_000_000 },
  { symbol: "BONK",  name: "Bonk",          current_price: 0.0000286,change_24h_pct:  7.8,  volume_24h:    240_000_000, market_cap:     2_100_000_000 },
  { symbol: "PEPE",  name: "Pepe",          current_price: 0.0000126,change_24h_pct: -5.2,  volume_24h:    510_000_000, market_cap:     5_300_000_000 },
  { symbol: "FLOKI", name: "Floki",         current_price: 0.0001845,change_24h_pct:  4.6,  volume_24h:    140_000_000, market_cap:     1_760_000_000 },
  // Extra infra
  { symbol: "HBAR",  name: "Hedera",        current_price:   0.0985, change_24h_pct:  1.3,  volume_24h:     95_000_000, market_cap:     3_700_000_000 },
  { symbol: "FLOW",  name: "Flow",          current_price:    0.685, change_24h_pct: -2.0,  volume_24h:     28_000_000, market_cap:       980_000_000 },
  { symbol: "KAVA",  name: "Kava",          current_price:    0.625, change_24h_pct:  0.5,  volume_24h:     18_000_000, market_cap:       385_000_000 },
  { symbol: "IOTA",  name: "IOTA",          current_price:    0.215, change_24h_pct: -0.3,  volume_24h:     12_000_000, market_cap:       595_000_000 },
  { symbol: "ONE",   name: "Harmony",       current_price:   0.0125, change_24h_pct:  0.8,  volume_24h:     14_000_000, market_cap:       160_000_000 },
  { symbol: "ZIL",   name: "Zilliqa",       current_price:   0.0185, change_24h_pct:  1.6,  volume_24h:     22_000_000, market_cap:       275_000_000 },
  { symbol: "WAVES", name: "Waves",         current_price:     2.10, change_24h_pct: -1.4,  volume_24h:     15_000_000, market_cap:       212_000_000 },
  { symbol: "THETA", name: "Theta Network", current_price:     1.38, change_24h_pct:  2.2,  volume_24h:     35_000_000, market_cap:     1_380_000_000 },
  { symbol: "EOS",   name: "EOS",           current_price:    0.755, change_24h_pct: -0.6,  volume_24h:     45_000_000, market_cap:     1_060_000_000 },
  { symbol: "XTZ",   name: "Tezos",         current_price:    0.875, change_24h_pct:  1.0,  volume_24h:     18_000_000, market_cap:       775_000_000 },
  { symbol: "ROSE",  name: "Oasis Network", current_price:   0.0815, change_24h_pct:  3.4,  volume_24h:     30_000_000, market_cap:       340_000_000 },
  { symbol: "CELO",  name: "Celo",          current_price:    0.745, change_24h_pct:  0.7,  volume_24h:     22_000_000, market_cap:       370_000_000 },
  { symbol: "SKL",   name: "SKALE",         current_price:   0.0485, change_24h_pct:  2.5,  volume_24h:     18_000_000, market_cap:       250_000_000 },
  { symbol: "API3",  name: "API3",          current_price:     1.85, change_24h_pct: -1.8,  volume_24h:      8_000_000, market_cap:       110_000_000 },
  { symbol: "OCEAN", name: "Ocean Protocol",current_price:    0.805, change_24h_pct:  4.1,  volume_24h:     25_000_000, market_cap:       480_000_000 },
  { symbol: "BAND",  name: "Band Protocol", current_price:     1.42, change_24h_pct:  1.2,  volume_24h:     12_000_000, market_cap:       155_000_000 },
  { symbol: "GLM",   name: "Golem",         current_price:    0.355, change_24h_pct:  0.4,  volume_24h:      8_500_000, market_cap:       355_000_000 },
].map(a => ({ ...a, last_updated: new Date().toISOString() }))

// ── System metrics ──────────────────────────────────────────────────────────
export const mockSystemMetrics = {
  active_streams:    15,
  events_per_second: 4230,
  system_health:     "healthy",
  total_latency_ms:  45,
  last_error:        null,
}

// ── Genome data ─────────────────────────────────────────────────────────────
export const mockGenome = [
  { symbol: "BTC",  dimension_1: 0.40, dimension_2: 1.00, dimension_3: 0.60, dimension_4: 0.30, dimension_5: 0.90 },
  { symbol: "ETH",  dimension_1: 0.60, dimension_2: 0.80, dimension_3: 0.70, dimension_4: 0.50, dimension_5: 0.80 },
  { symbol: "SOL",  dimension_1: 0.90, dimension_2: 0.50, dimension_3: 0.90, dimension_4: 0.80, dimension_5: 0.60 },
  { symbol: "BNB",  dimension_1: 0.35, dimension_2: 0.70, dimension_3: 0.55, dimension_4: 0.40, dimension_5: 0.75 },
  { symbol: "XRP",  dimension_1: 0.50, dimension_2: 0.60, dimension_3: 0.65, dimension_4: 0.55, dimension_5: 0.65 },
]

// ── OHLCV history (for Analytics page) ─────────────────────────────────────
export const mockAssetHistory = {
  BTC:   generateOHLCV(64000,  60, 0.035),
  ETH:   generateOHLCV(3400,   60, 0.042),
  SOL:   generateOHLCV(140,    60, 0.058),
  BNB:   generateOHLCV(540,    60, 0.038),
  XRP:   generateOHLCV(0.60,   60, 0.055),
  ADA:   generateOHLCV(0.44,   60, 0.048),
  AVAX:  generateOHLCV(39,     60, 0.052),
  DOT:   generateOHLCV(6.7,    60, 0.050),
  LINK:  generateOHLCV(13.5,   60, 0.055),
  MATIC: generateOHLCV(0.86,   60, 0.050),
  DOGE:  generateOHLCV(0.13,   60, 0.070),
  SHIB:  generateOHLCV(0.0000225, 60, 0.085),
  WIF:   generateOHLCV(2.1,    60, 0.095),
  PEPE:  generateOHLCV(0.0000118, 60, 0.090),
}
