# compute_genome_metrics.py - Feature-engineering script.
# Reads daily OHLCV rows directly from the coin_ohlcv table in Postgres
# and computes all 21 genome metrics per coin using pandas/numpy.
#
# Dimensions:
#   1. Volatility Profile (4 metrics)
#   2. Market Correlation and Beta (4 metrics)
#   3. Momentum and Trend (4 metrics)
#   4. Drawdown and Recovery (4 metrics)
#   5. Liquidity and Volume (4 metrics)
#
# Usage: ..\venv\Scripts\python.exe ML/compute_genome_metrics.py
import os
import sys
import numpy as np
import pandas as pd
from scipy import stats as sp_stats

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# ── Database connection ────────────────────────────────────────────────────────
DB_CONFIG = {
    "host": os.getenv("PG_HOST", "localhost"),
    "database": os.getenv("PG_DB", "crypto_genome"),
    "user": os.getenv("PG_USER", "admin"),
    "password": os.getenv("PG_PASSWORD", "admin"),
    "port": os.getenv("PG_PORT", "5432"),
}

MIN_ROWS = 30  # Minimum OHLCV rows required per coin


def load_ohlcv_from_db() -> pd.DataFrame:
    """Load all OHLCV data from Postgres into a single DataFrame."""
    from sqlalchemy import create_engine, text

    url = (
        f"postgresql+psycopg2://{DB_CONFIG['user']}:{DB_CONFIG['password']}"
        f"@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
    )
    engine = create_engine(url)
    query = text("""
        SELECT symbol, date, open, high, low, close, volume_usd
        FROM coin_ohlcv
        WHERE close IS NOT NULL AND close > 0
        ORDER BY symbol, date
    """)
    with engine.connect() as conn:
        df = pd.read_sql(query, conn)
    print(f"[DB] Loaded {len(df):,} OHLCV rows for {df['symbol'].nunique()} coins")
    return df


# ── Per-coin metric computation ────────────────────────────────────────────────

def compute_metrics_for_coin(coin_df: pd.DataFrame, btc_returns: pd.Series) -> dict:
    """
    Compute all 21 genome metrics for a single coin's OHLCV data.
    coin_df must be sorted by date and have columns: date, close, volume_usd.
    btc_returns is a date-indexed Series of BTC daily log returns.
    """
    close = coin_df["close"].values
    volume = coin_df["volume_usd"].fillna(0).values
    dates = coin_df["date"]

    # Daily log returns
    log_returns = np.diff(np.log(close))
    if len(log_returns) < MIN_ROWS:
        return None

    # ── Dimension 1: Volatility Profile ──────────────────────────────────────
    volatility_baseline = float(np.std(log_returns, ddof=1))
    volatility_skew = float(sp_stats.skew(log_returns))
    volatility_kurtosis = float(sp_stats.kurtosis(log_returns, fisher=True))

    # Vol-of-vol: std of rolling 20-day volatility
    ret_series = pd.Series(log_returns)
    rolling_vol = ret_series.rolling(window=20, min_periods=10).std()
    vol_of_vol = float(rolling_vol.std()) if rolling_vol.notna().sum() > 5 else 0.0

    # ── Dimension 2: Market Correlation & Beta ───────────────────────────────
    # Align coin returns with BTC returns by date
    coin_ret_series = pd.Series(log_returns, index=dates.iloc[1:].values)
    aligned = pd.DataFrame({"coin": coin_ret_series, "btc": btc_returns}).dropna()

    if len(aligned) >= 20:
        btc_corr = float(aligned["coin"].corr(aligned["btc"]))

        # OLS: coin = alpha + beta * btc
        x = aligned["btc"].values
        y = aligned["coin"].values
        slope, intercept, r_value, p_value, std_err = sp_stats.linregress(x, y)
        market_beta = float(slope)
        r_squared = float(r_value ** 2)

        # Downside coupling: beta computed only on days where BTC is negative
        down_mask = aligned["btc"] < 0
        if down_mask.sum() >= 10:
            dx = aligned.loc[down_mask, "btc"].values
            dy = aligned.loc[down_mask, "coin"].values
            ds, _, _, _, _ = sp_stats.linregress(dx, dy)
            downside_coupling = float(ds)
        else:
            downside_coupling = market_beta
    else:
        btc_corr = 0.0
        market_beta = 0.0
        r_squared = 0.0
        downside_coupling = 0.0

    # ── Dimension 3: Momentum & Trend ────────────────────────────────────────
    # Trend efficiency: net move / total path length
    net_move = close[-1] - close[0]
    total_path = np.sum(np.abs(np.diff(close)))
    trend_efficiency = float(net_move / total_path) if total_path > 0 else 0.0

    # Autocorrelation: lag-1
    if len(log_returns) > 2:
        autocorrelation = float(pd.Series(log_returns).autocorr(lag=1))
        if np.isnan(autocorrelation):
            autocorrelation = 0.0
    else:
        autocorrelation = 0.0

    # Up-day ratio
    up_day_ratio = float(np.mean(log_returns > 0))

    # Risk-adjusted momentum: cumulative return / volatility
    cumulative_return = float(np.sum(log_returns))
    risk_adjusted_momentum = float(cumulative_return / volatility_baseline) if volatility_baseline > 0 else 0.0

    # ── Dimension 4: Drawdown & Recovery ─────────────────────────────────────
    cummax = np.maximum.accumulate(close)
    drawdowns = (close - cummax) / cummax  # negative values

    max_drawdown = float(np.min(drawdowns))

    # Identify drawdown periods (contiguous stretches where drawdown < 0)
    in_drawdown = drawdowns < -0.001  # threshold to avoid noise
    dd_depths = []
    dd_durations = []
    recovery_durations = []

    i = 0
    while i < len(in_drawdown):
        if in_drawdown[i]:
            start = i
            # Find end of drawdown (recovery to peak or end of series)
            while i < len(in_drawdown) and in_drawdown[i]:
                i += 1
            end = i
            dd_depths.append(float(np.min(drawdowns[start:end])))
            dd_durations.append(end - start)

            # Recovery phase: how long until next new high
            recovery_start = end
            while i < len(in_drawdown) and not in_drawdown[i]:
                i += 1
            recovery_durations.append(i - recovery_start)
        else:
            i += 1

    avg_drawdown_depth = float(np.mean(dd_depths)) if dd_depths else 0.0
    avg_drawdown_duration = float(np.mean(dd_durations)) if dd_durations else 0.0

    # Recovery speed ratio: avg recovery time / avg drawdown time
    if dd_durations and recovery_durations and np.mean(dd_durations) > 0:
        recovery_speed_ratio = float(np.mean(recovery_durations) / np.mean(dd_durations))
    else:
        recovery_speed_ratio = 0.0

    # ── Dimension 5: Liquidity & Volume ──────────────────────────────────────
    positive_volume = volume[volume > 0]
    log_avg_volume = float(np.log10(np.mean(positive_volume))) if len(positive_volume) > 0 else 0.0

    # Volume stability (coefficient of variation)
    vol_mean = np.mean(positive_volume) if len(positive_volume) > 0 else 1.0
    vol_std = np.std(positive_volume) if len(positive_volume) > 0 else 0.0
    volume_stability_cv = float(vol_std / vol_mean) if vol_mean > 0 else 0.0

    # Volume-return correlation
    if len(volume) > len(log_returns):
        vol_for_corr = volume[1:]  # align with returns
    else:
        vol_for_corr = volume

    min_len = min(len(log_returns), len(vol_for_corr))
    if min_len > 10:
        vol_return_correlation = float(
            np.corrcoef(np.abs(log_returns[:min_len]), vol_for_corr[:min_len])[0, 1]
        )
        if np.isnan(vol_return_correlation):
            vol_return_correlation = 0.0
    else:
        vol_return_correlation = 0.0

    # Crisis liquidity retention: avg volume during worst 10% drawdown days / median volume
    if len(drawdowns) > 10 and len(positive_volume) > 0:
        threshold = np.percentile(drawdowns, 10)
        crisis_mask = drawdowns <= threshold
        crisis_vol = volume[crisis_mask]
        median_vol = np.median(positive_volume)
        if median_vol > 0 and len(crisis_vol) > 0:
            crisis_liquidity_retention = float(np.mean(crisis_vol) / median_vol)
        else:
            crisis_liquidity_retention = 0.0
    else:
        crisis_liquidity_retention = 0.0

    return {
        # Dimension 1
        "volatility_baseline": round(volatility_baseline, 10),
        "volatility_skew": round(volatility_skew, 10),
        "volatility_kurtosis": round(volatility_kurtosis, 10),
        "vol_of_vol": round(vol_of_vol, 10),
        # Dimension 2
        "market_beta": round(market_beta, 10),
        "btc_correlation": round(btc_corr, 10),
        "r_squared": round(r_squared, 10),
        "downside_coupling": round(downside_coupling, 10),
        # Dimension 3
        "trend_efficiency": round(trend_efficiency, 10),
        "autocorrelation": round(autocorrelation, 10),
        "up_day_ratio": round(up_day_ratio, 10),
        "risk_adjusted_momentum": round(risk_adjusted_momentum, 10),
        # Dimension 4
        "max_drawdown": round(max_drawdown, 10),
        "avg_drawdown_depth": round(avg_drawdown_depth, 10),
        "avg_drawdown_duration": round(avg_drawdown_duration, 10),
        "recovery_speed_ratio": round(recovery_speed_ratio, 10),
        # Dimension 5
        "log_avg_volume": round(log_avg_volume, 10),
        "volume_stability_cv": round(volume_stability_cv, 10),
        "vol_return_correlation": round(vol_return_correlation, 10),
        "crisis_liquidity_retention": round(crisis_liquidity_retention, 10),
    }


# ── Main pipeline ─────────────────────────────────────────────────────────────

def compute_all_genome_metrics() -> pd.DataFrame:
    """
    Main entry point: loads OHLCV from DB, computes all 21 metrics per coin.
    Returns a DataFrame with columns: [coin_symbol, ...21 metrics...]
    """
    # Load OHLCV
    ohlcv_df = load_ohlcv_from_db()

    # Prepare BTC returns as reference
    btc_df = ohlcv_df[ohlcv_df["symbol"] == "BTC"].sort_values("date")
    if len(btc_df) < MIN_ROWS:
        raise ValueError("BTC has fewer than {} OHLCV rows — cannot compute beta/correlation".format(MIN_ROWS))

    btc_close = btc_df["close"].values
    btc_log_returns = np.diff(np.log(btc_close))
    btc_returns = pd.Series(btc_log_returns, index=btc_df["date"].iloc[1:].values)

    # Compute per-coin
    symbols = ohlcv_df["symbol"].unique()
    results = []
    skipped = []

    for sym in sorted(symbols):
        coin_df = ohlcv_df[ohlcv_df["symbol"] == sym].sort_values("date").reset_index(drop=True)

        if len(coin_df) < MIN_ROWS:
            skipped.append(sym)
            continue

        metrics = compute_metrics_for_coin(coin_df, btc_returns)
        if metrics is None:
            skipped.append(sym)
            continue

        metrics["coin_symbol"] = sym
        results.append(metrics)

    genome_df = pd.DataFrame(results)

    # Reorder: coin_symbol first
    cols = ["coin_symbol"] + [c for c in genome_df.columns if c != "coin_symbol"]
    genome_df = genome_df[cols]

    print(f"\n{'='*60}")
    print(f"GENOME METRICS COMPUTED")
    print(f"{'='*60}")
    print(f"  Coins processed: {len(results)}")
    print(f"  Coins skipped (< {MIN_ROWS} rows): {len(skipped)}")
    if skipped:
        print(f"  Skipped symbols: {', '.join(skipped)}")
    print(f"  Dimensions: {genome_df.shape[1] - 1} metrics")

    # Sanity checks
    btc_row = genome_df[genome_df["coin_symbol"] == "BTC"]
    if not btc_row.empty:
        btc_beta = btc_row.iloc[0]["market_beta"]
        btc_corr = btc_row.iloc[0]["btc_correlation"]
        print(f"\n  [Sanity] BTC market_beta = {btc_beta:.4f} (expect ~1.0)")
        print(f"  [Sanity] BTC btc_correlation = {btc_corr:.4f} (expect ~1.0)")

    return genome_df


if __name__ == "__main__":
    df = compute_all_genome_metrics()

    # Save to CSV for inspection
    output_path = os.path.join(os.path.dirname(__file__), "coin_genome_computed.csv")
    df.to_csv(output_path, index=False)
    print(f"\n  Saved: {output_path}")

    # Print sample
    print(f"\n{'='*60}")
    print("SAMPLE OUTPUT (first 5 coins):")
    print(df.head().to_string(index=False))
