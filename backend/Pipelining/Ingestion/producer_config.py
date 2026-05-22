"""
producer_config.py — Single source of truth for all pipeline configuration.
All symbol-to-exchange mappings are defined here and imported by every producer.
No API keys required — all sources use public WebSocket endpoints.
"""

# ─── Kafka ────────────────────────────────────────────────────────────────────
KAFKA_BOOTSTRAP = "localhost:9092"
KAFKA_TOPIC = "crypto_genome"

# ─── Binance (~54 coins) ──────────────────────────────────────────────────────
# Uses: wss://stream.binance.com:9443/ws/!miniTicker@arr  (all tickers, no auth)
# Format: SYMBOLUSDT → coin_symbol
BINANCE_SYMBOLS: dict[str, str] = {
    "AAVEUSDT": "AAVE",
    "ADAUSDT": "ADA",
    "ALGOUSDT": "ALGO",
    "ATOMUSDT": "ATOM",
    "AVAXUSDT": "AVAX",
    "BATUSDT": "BAT",
    "BEAMUSDT": "BEAM",
    "BNBUSDT": "BNB",
    "BTCUSDT": "BTC",
    "COTIUSDT": "COTI",
    "CVCUSDT": "CVC",
    "DAIUSDT": "DAI",
    "DASHUSDT": "DASH",
    "DCRUSDT": "DCR",
    "DENTUSDT": "DENT",
    "DGBUSDT": "DGB",
    "DOTUSDT": "DOT",
    "ENJUSDT": "ENJ",
    "ETCUSDT": "ETC",
    "ETHUSDT": "ETH",
    "FETUSDT": "FET",
    "FUNUSDT": "FUN",
    "HBARUSDT": "HBAR",
    "ICPUSDT": "ICP",
    "IOSTUSDT": "IOST",
    "LINKUSDT": "LINK",
    "LPTUSDT": "LPT",
    "LRCUSDT": "LRC",
    "LTCUSDT": "LTC",
    "MANAUSDT": "MANA",
    "NEARUSDT": "NEAR",
    "NEOUSDT": "NEO",
    "OKBUSDT": "OKB",
    "QNTUSDT": "QNT",
    "REQUSDT": "REQ",
    "RNDRUSDT": "RNDR",
    "RVNUSDT": "RVN",
    "SCUSDT": "SC",
    "SHIBUSDT": "SHIB",
    "SNTUSDT": "SNT",
    "SNXUSDT": "SNX",
    "SOLUSDT": "SOL",
    "THETAUSDT": "THETA",
    "TRBUSDT": "TRB",
    "TRXUSDT": "TRX",
    "UNIUSDT": "UNI",
    "VETUSDT": "VET",
    "WAVESUSDT": "WAVES",
    "XLMUSDT": "XLM",
    "XMRUSDT": "XMR",
    "XRPUSDT": "XRP",
    "ZECUSDT": "ZEC",
    "ZILUSDT": "ZIL",
    "ZRXUSDT": "ZRX",
}

# ─── KuCoin (~19 coins) ───────────────────────────────────────────────────────
# Uses: wss://ws-api.kucoin.com  (token via POST /api/v1/bullet-public, no auth)
# Format: SYMBOL-USDT → coin_symbol
KUCOIN_SYMBOLS: dict[str, str] = {
    "AERGO-USDT": "AERGO",
    "ELF-USDT": "ELF",
    "WAXP-USDT": "WAXP",
    "KDA-USDT": "KDA",
    "KEY-USDT": "KEY",
    "NMR-USDT": "NMR",
    "POWR-USDT": "POWR",
    "QRL-USDT": "QRL",
    "STRAX-USDT": "STRAX",
    "TRAC-USDT": "TRAC",
    "VSYS-USDT": "VSYS",
    "WTC-USDT": "WTC",
    "KCS-USDT": "KCS",
    "GT-USDT": "GT",
    "MED-USDT": "MED",
    "STEEM-USDT": "STEEM",
    "SALT-USDT": "SALT",
    "DBC-USDT": "DBC",
    "ERG-USDT": "ERG",
}

# ─── Gate.io (~8 coins) ───────────────────────────────────────────────────────
# Uses: wss://api.gateio.ws/ws/v4/  (public, no auth)
# Format: SYMBOL_USDT → coin_symbol
GATE_SYMBOLS: dict[str, str] = {
    "BNT_USDT": "BNT",
    "ETN_USDT": "ETN",
    "FIRO_USDT": "FIRO",
    "GNO_USDT": "GNO",
    "HT_USDT": "HT",
    "LEO_USDT": "LEO",
    "AB_USDT": "AB",
    "ADS_USDT": "ADS",
}

# ─── Bitfinex (redundancy fallback) ───────────────────────────────────────────
# Uses: wss://api-pub.bitfinex.com/ws/2  (public, no auth)
# Only used as fallback if Gate.io feed drops for LEO or BNT
BITFINEX_SYMBOLS: dict[str, str] = {
    "tLEOUSD": "LEO",
    "tBNTUSD": "BNT",
}

# ─── Delisted coins (genome data only, no live feed) ─────────────────────────
DELISTED_SYMBOLS: set[str] = {
    "AION", "DRGN", "OST", "BIX", "CMT", "APPC", "VIBE", "EVX", "ONGAS",
}

# ─── Excluded benchmarks (not coins, skip entirely) ──────────────────────────
EXCLUDED_BENCHMARKS: set[str] = {"USD", "VOLUME"}

# ─── Coins with no live data (Gate.io confirmed but historically delisted) ────
# These exist in genome CSV but can't be verified live — mark as no_live_data
NO_LIVE_DATA_SYMBOLS: set[str] = {
    "AMB", "CRO", "TEL",  # Not confirmed on any of the 4 sources
}

# ─── Convenience: all live symbols across all sources ─────────────────────────
ALL_LIVE_SYMBOLS: set[str] = (
    set(BINANCE_SYMBOLS.values())
    | set(KUCOIN_SYMBOLS.values())
    | set(GATE_SYMBOLS.values())
)

# ─── Source label per coin (used by consumer to tag DB rows) ──────────────────
SOURCE_MAP: dict[str, str] = {}
for pair, sym in BINANCE_SYMBOLS.items():
    SOURCE_MAP[sym] = "binance"
for pair, sym in KUCOIN_SYMBOLS.items():
    SOURCE_MAP[sym] = "kucoin"
for pair, sym in GATE_SYMBOLS.items():
    SOURCE_MAP[sym] = "gate"
# Bitfinex is only fallback — Gate.io takes priority for LEO/BNT
