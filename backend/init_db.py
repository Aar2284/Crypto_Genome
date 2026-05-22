"""
init_db.py — CSV-driven database initializer.
- Creates all tables (genome, ohlcv, assets, asset_history, system_metrics)
- Seeds all 93 coins from crypto_genome_master.csv
- Idempotent: per-symbol check, skips existing rows
- Sets pipeline_status = "delisted" for 9 delisted coins
- Sets pipeline_status = "no_live_data" for 3 coins with no confirmed exchange
- Sets pipeline_status = "active" for all other live coins
- Run from inside backend/ dir: ..\venv\Scripts\python.exe init_db.py
"""
import asyncio
import csv
import os
import sys
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(__file__))

from database.session import engine, Base, AsyncSessionLocal
from models.market import Asset, AssetHistory
from models.system import SystemMetric
from models.genome import CoinGenome
from models.ohlcv import CoinOHLCV

# Import source maps
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "Pipelining", "Ingestion"))
from producer_config import SOURCE_MAP, DELISTED_SYMBOLS, NO_LIVE_DATA_SYMBOLS, EXCLUDED_BENCHMARKS

# Path to master genome CSV (relative to backend/)
MASTER_CSV = os.path.join(os.path.dirname(__file__), "..", "datasets", "crypto_genome_master.csv")

# Fallback coin names for display (will be enriched later if needed)
COIN_NAMES: dict[str, str] = {
    "AAVE": "Aave", "AB": "AB", "ADA": "Cardano", "ADS": "Adshares",
    "AERGO": "Aergo", "AION": "Aion", "ALGO": "Algorand", "AMB": "Ambrosus",
    "APPC": "AppCoins", "ATOM": "Cosmos", "AVAX": "Avalanche", "BAT": "Basic Attention Token",
    "BEAM": "Beam", "BIX": "Bibox Token", "BNB": "BNB", "BNT": "Bancor",
    "BTC": "Bitcoin", "CMT": "CyberMiles", "COTI": "COTI", "CRO": "Cronos",
    "CVC": "Civic", "DAI": "Dai", "DASH": "Dash", "DBC": "DeepBrain Chain",
    "DCR": "Decred", "DENT": "Dent", "DGB": "DigiByte", "DOT": "Polkadot",
    "DRGN": "Dragonchain", "ELF": "aelf", "ENJ": "Enjin Coin", "ERG": "Ergo",
    "ETC": "Ethereum Classic", "ETH": "Ethereum", "ETN": "Electroneum",
    "EVX": "Everex", "FET": "Fetch.ai", "FIRO": "Firo", "FUN": "FunToken",
    "GNO": "Gnosis", "GT": "Gate Token", "HBAR": "Hedera", "HT": "Huobi Token",
    "ICP": "Internet Computer", "IOST": "IOST", "KCS": "KuCoin Token",
    "KDA": "Kadena", "KEY": "SelfKey", "LEO": "UNUS SED LEO", "LINK": "Chainlink",
    "LPT": "Livepeer", "LRC": "Loopring", "LTC": "Litecoin", "MANA": "Decentraland",
    "MED": "MediBloc", "NEAR": "NEAR Protocol", "NEO": "NEO", "NMR": "Numeraire",
    "OKB": "OKB", "ONGAS": "ONGAS", "OST": "OST", "POWR": "Power Ledger",
    "QNT": "Quant", "QRL": "Quantum Resistant Ledger", "REQ": "Request",
    "RNDR": "Render", "RVN": "Ravencoin", "SALT": "Salt Lending", "SC": "Siacoin",
    "SHIB": "Shiba Inu", "SNT": "Status", "SNX": "Synthetix", "SOL": "Solana",
    "STEEM": "Steem", "STRAX": "Stratis", "TEL": "Telcoin", "THETA": "Theta Network",
    "TRAC": "OriginTrail", "TRB": "Tellor", "TRX": "TRON", "UNI": "Uniswap",
    "VET": "VeChain", "VIBE": "VIBE", "VSYS": "V Systems", "WAVES": "Waves",
    "WAXP": "WAX", "WTC": "Waltonchain", "XLM": "Stellar", "XMR": "Monero",
    "XRP": "XRP", "ZEC": "Zcash", "ZIL": "Zilliqa", "ZRX": "0x",
}


async def init_db():
    print("=" * 60)
    print("Crypto Genome — Database Initializer")
    print("=" * 60)

    # 1. Create all tables
    print("\n[1/3] Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("  [OK] All tables created (or already exist)")
    
    # 2. Load master CSV
    print("\n[2/3] Loading coins from crypto_genome_master.csv...")
    if not os.path.exists(MASTER_CSV):
        print("  [ERR] CSV not found: " + MASTER_CSV)
        print("  Please run from inside backend/ directory.")
        return

    with open(MASTER_CSV, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    print("  Found {} rows in CSV".format(len(rows)))

    # 3. Seed assets table
    print("\n[3/3] Seeding assets table...")
    seeded = 0
    skipped = 0
    excluded = 0

    async with AsyncSessionLocal() as session:
        for idx, row in enumerate(rows):
            symbol = row["coin_symbol"].strip()

            # Skip statistical benchmarks (not actual coins)
            if symbol in EXCLUDED_BENCHMARKS:
                excluded += 1
                continue

            # Determine pipeline status
            if symbol in DELISTED_SYMBOLS:
                status = "delisted"
                source = "none"
            elif symbol in NO_LIVE_DATA_SYMBOLS:
                status = "no_live_data"
                source = "none"
            else:
                status = "active"
                source = SOURCE_MAP.get(symbol, "unknown")

            # Check if already seeded
            result = await session.execute(
                text("SELECT asset_id FROM assets WHERE symbol = :sym"),
                {"sym": symbol}
            )
            existing = result.fetchone()
            if existing:
                skipped += 1
                continue

            # Insert new asset (use symbol as asset_id for uniqueness)
            asset = Asset(
                asset_id=symbol,  # Use symbol as stable unique PK
                name=COIN_NAMES.get(symbol, symbol),
                symbol=symbol,
                current_price=0.0,        # Will be updated by consumer
                volume_24h=0.0,
                change_24h_pct=0.0,
                market_cap=None,
                pipeline_status=status,
                data_source=source,
                last_updated_at=datetime.now(timezone.utc),
            )
            session.add(asset)
            seeded += 1

        # Ensure system_metrics has at least one row
        metric_result = await session.execute(text("SELECT id FROM system_metrics LIMIT 1"))
        if not metric_result.fetchone():
            metric = SystemMetric(
                active_streams=0,
                events_per_second=0,
                system_health="initializing",
                total_latency_ms=0,
                last_error=None,
            )
            session.add(metric)

        await session.commit()

    print("  Seeded:   {} coins".format(seeded))
    print("  Skipped:  {} (already existed)".format(skipped))
    print("  Excluded: {} (USD/VOLUME benchmarks)".format(excluded))

    # Summary
    print("\n" + "=" * 60)
    print("Database initialized successfully!")
    print("Next step: Run load_datasets.py to load genome + OHLCV data")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(init_db())
