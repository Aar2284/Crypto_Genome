"""
load_datasets.py — One-time loader for genome metrics + historical OHLCV data.
Reads from:
  - datasets/crypto_genome_master.csv  → coin_genome table (21 metrics per coin)
  - datasets/standardized_datasets/<SYMBOL>_Canonical.csv → coin_ohlcv table

Idempotent: skips coins/rows already loaded.
Expected runtime: 5–15 minutes for ~400K OHLCV rows.

Run from inside backend/ dir:
  ..\\venv\\Scripts\\python.exe load_datasets.py
"""
import asyncio
import csv
import os
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from database.session import engine, Base, AsyncSessionLocal
from models.genome import CoinGenome
from models.ohlcv import CoinOHLCV
from models.market import Asset, AssetHistory
from models.system import SystemMetric

# Paths (relative to backend/)
BASE_DIR = os.path.dirname(__file__)
DATASETS_DIR = os.path.join(BASE_DIR, "..", "datasets")
MASTER_CSV = os.path.join(DATASETS_DIR, "crypto_genome_master.csv")
OHLCV_DIR = os.path.join(DATASETS_DIR, "standardized_datasets")

# Benchmark symbols to skip
SKIP_SYMBOLS = {"USD", "VOLUME"}

# Genome column names (must match CoinGenome model)
GENOME_COLUMNS = [
    "volatility_baseline", "volatility_skew", "volatility_kurtosis", "vol_of_vol",
    "market_beta", "btc_correlation", "r_squared", "downside_coupling",
    "trend_efficiency", "autocorrelation", "up_day_ratio", "risk_adjusted_momentum",
    "max_drawdown", "avg_drawdown_depth", "avg_drawdown_duration", "recovery_speed_ratio",
    "log_avg_volume", "volume_stability_cv", "vol_return_correlation", "crisis_liquidity_retention",
]


def safe_float(val: str) -> float | None:
    """Convert string to float, return None if invalid."""
    try:
        return float(val) if val and val.strip() not in ("", "nan", "NaN", "None") else None
    except (ValueError, TypeError):
        return None


def safe_date(val: str) -> date | None:
    """Parse date string YYYY-MM-DD, return None if invalid."""
    try:
        return date.fromisoformat(val.strip()) if val and val.strip() else None
    except ValueError:
        return None


async def load_genome(session) -> tuple[int, int]:
    """Load genome metrics from master CSV using UPSERT. Returns (upserted, unchanged)."""
    print("\n[Genome] Upserting from crypto_genome_master.csv...")
    upserted = 0
    unchanged = 0

    with open(MASTER_CSV, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    for row in rows:
        symbol = row.get("coin_symbol", "").strip()
        if not symbol or symbol in SKIP_SYMBOLS:
            continue

        # Build values dict for all 20 metric columns
        vals = {col: safe_float(row.get(col, "")) for col in GENOME_COLUMNS}

        # UPSERT: insert or update all metric columns on conflict.
        # cluster_id and cluster_label are NOT touched here — they are
        # written exclusively by the GMM pipeline so they survive re-runs.
        await session.execute(
            text("""
                INSERT INTO coin_genome (
                    symbol,
                    volatility_baseline, volatility_skew, volatility_kurtosis, vol_of_vol,
                    market_beta, btc_correlation, r_squared, downside_coupling,
                    trend_efficiency, autocorrelation, up_day_ratio, risk_adjusted_momentum,
                    max_drawdown, avg_drawdown_depth, avg_drawdown_duration, recovery_speed_ratio,
                    log_avg_volume, volume_stability_cv, vol_return_correlation, crisis_liquidity_retention
                ) VALUES (
                    :symbol,
                    :volatility_baseline, :volatility_skew, :volatility_kurtosis, :vol_of_vol,
                    :market_beta, :btc_correlation, :r_squared, :downside_coupling,
                    :trend_efficiency, :autocorrelation, :up_day_ratio, :risk_adjusted_momentum,
                    :max_drawdown, :avg_drawdown_depth, :avg_drawdown_duration, :recovery_speed_ratio,
                    :log_avg_volume, :volume_stability_cv, :vol_return_correlation, :crisis_liquidity_retention
                )
                ON CONFLICT (symbol) DO UPDATE SET
                    volatility_baseline      = EXCLUDED.volatility_baseline,
                    volatility_skew          = EXCLUDED.volatility_skew,
                    volatility_kurtosis      = EXCLUDED.volatility_kurtosis,
                    vol_of_vol               = EXCLUDED.vol_of_vol,
                    market_beta              = EXCLUDED.market_beta,
                    btc_correlation          = EXCLUDED.btc_correlation,
                    r_squared                = EXCLUDED.r_squared,
                    downside_coupling        = EXCLUDED.downside_coupling,
                    trend_efficiency         = EXCLUDED.trend_efficiency,
                    autocorrelation          = EXCLUDED.autocorrelation,
                    up_day_ratio             = EXCLUDED.up_day_ratio,
                    risk_adjusted_momentum   = EXCLUDED.risk_adjusted_momentum,
                    max_drawdown             = EXCLUDED.max_drawdown,
                    avg_drawdown_depth       = EXCLUDED.avg_drawdown_depth,
                    avg_drawdown_duration    = EXCLUDED.avg_drawdown_duration,
                    recovery_speed_ratio     = EXCLUDED.recovery_speed_ratio,
                    log_avg_volume           = EXCLUDED.log_avg_volume,
                    volume_stability_cv      = EXCLUDED.volume_stability_cv,
                    vol_return_correlation   = EXCLUDED.vol_return_correlation,
                    crisis_liquidity_retention = EXCLUDED.crisis_liquidity_retention,
                    loaded_at                = now()
            """),
            {"symbol": symbol, **vals},
        )
        upserted += 1

    await session.commit()
    print(f"[Genome] Upserted: {upserted}  Skipped (benchmarks): {unchanged}")
    return upserted, unchanged


async def load_ohlcv(session) -> tuple[int, int]:
    """Load OHLCV data from standardized_datasets CSVs. Returns (loaded, skipped)."""
    print("\n[OHLCV] Scanning {} for CSV files...".format(OHLCV_DIR))

    if not os.path.isdir(OHLCV_DIR):
        print("[OHLCV] ERROR: Directory not found: " + OHLCV_DIR)
        return 0, 0

    csv_files = sorted([f for f in os.listdir(OHLCV_DIR) if f.endswith("_Canonical.csv")])
    print("[OHLCV] Found {} CSV files".format(len(csv_files)))

    total_loaded = 0
    total_skipped = 0

    for filename in csv_files:
        symbol = filename.replace("_Canonical.csv", "")
        if symbol in SKIP_SYMBOLS:
            continue

        filepath = os.path.join(OHLCV_DIR, filename)

        with open(filepath, newline="", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))

        if not rows:
            continue

        # Check how many rows already exist for this symbol
        result = await session.execute(
            text("SELECT COUNT(*) FROM coin_ohlcv WHERE symbol = :sym"),
            {"sym": symbol},
        )
        existing_count = result.scalar()

        if existing_count >= len(rows):
            total_skipped += len(rows)
            continue

        # Load rows using INSERT ... ON CONFLICT DO NOTHING for idempotency
        inserted = 0
        for row in rows:
            parsed_date = safe_date(row.get("date", ""))
            if not parsed_date:
                continue

            await session.execute(
                text("""
                    INSERT INTO coin_ohlcv (symbol, date, open, high, low, close, volume_coin, volume_usd)
                    VALUES (:sym, :dt, :open, :high, :low, :close, :vcoin, :vusd)
                    ON CONFLICT (symbol, date) DO NOTHING
                """),
                {
                    "sym": symbol,
                    "dt": parsed_date,
                    "open": safe_float(row.get("open", "")),
                    "high": safe_float(row.get("high", "")),
                    "low": safe_float(row.get("low", "")),
                    "close": safe_float(row.get("close", "")),
                    "vcoin": safe_float(row.get("volume_coin", "")),
                    "vusd": safe_float(row.get("volume_usd", "")),
                },
            )
            inserted += 1

        await session.commit()
        total_loaded += inserted
        print("[OHLCV] {}: {} rows inserted".format(symbol, inserted))

    print("\n[OHLCV] Total loaded: {}  Total skipped: {}".format(total_loaded, total_skipped))
    return total_loaded, total_skipped


async def main():
    print("=" * 60)
    print("Crypto Genome - Dataset Loader")
    print("=" * 60)

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Load genome metrics
        g_loaded, g_skipped = await load_genome(session)

        # Load OHLCV history
        o_loaded, o_skipped = await load_ohlcv(session)

    print("\n" + "=" * 60)
    print("Load complete!")
    print("  Genome rows: {} loaded, {} skipped".format(g_loaded, g_skipped))
    print("  OHLCV rows:  {} loaded, {} skipped".format(o_loaded, o_skipped))
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
