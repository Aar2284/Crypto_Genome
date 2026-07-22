# scale_genome.py - Scales genome metrics DataFrame using StandardScaler.
# Accepts a DataFrame from compute_genome_metrics.py (or reads coin_genome_computed.csv).
# Persists trained scaler to ML/model/scaler.pkl for consistent future scoring.
#
# Can be run standalone or imported as a function by run_genome_pipeline.py.
# Standalone usage: ..\venv\Scripts\python.exe Scaling/scale_genome.py

import os
import sys
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib

# Resolve paths relative to this file
_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND = os.path.dirname(_HERE)
MODEL_DIR = os.path.join(_BACKEND, "ML", "model")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")
COMPUTED_CSV = os.path.join(_BACKEND, "ML", "coin_genome_computed.csv")

GENOME_METRIC_COLS = [
    "volatility_baseline", "volatility_skew", "volatility_kurtosis", "vol_of_vol",
    "market_beta", "btc_correlation", "r_squared", "downside_coupling",
    "trend_efficiency", "autocorrelation", "up_day_ratio", "risk_adjusted_momentum",
    "max_drawdown", "avg_drawdown_depth", "avg_drawdown_duration", "recovery_speed_ratio",
    "log_avg_volume", "volume_stability_cv", "vol_return_correlation", "crisis_liquidity_retention",
]


def scale_genome(genome_df: pd.DataFrame) -> pd.DataFrame:
    """
    Scales genome metrics using StandardScaler. Fits a new scaler on the input
    data and saves it to ML/model/scaler.pkl.

    Args:
        genome_df: DataFrame with columns [coin_symbol, ...20 metric cols...]

    Returns:
        scaled_df: Same structure with metric values z-score normalised.
    """
    os.makedirs(MODEL_DIR, exist_ok=True)

    coin_ids = genome_df["coin_symbol"].reset_index(drop=True)

    # Only scale columns that exist in the data
    cols_to_scale = [c for c in GENOME_METRIC_COLS if c in genome_df.columns]
    features = genome_df[cols_to_scale].fillna(0).reset_index(drop=True)

    scaler = StandardScaler()
    scaled_arr = scaler.fit_transform(features)
    scaled_df = pd.DataFrame(scaled_arr, columns=cols_to_scale)
    scaled_df.insert(0, "coin_symbol", coin_ids)

    # Persist scaler for future use (scoring new coins without re-fitting)
    joblib.dump(scaler, SCALER_PATH)

    print(f"\n{'='*50}")
    print("SCALING COMPLETE")
    print(f"{'='*50}")
    print(f"  Shape:  {scaled_df.shape}")
    print(f"  Cols:   {len(cols_to_scale)} metrics scaled")
    print(f"  Saved:  {SCALER_PATH}")

    return scaled_df


if __name__ == "__main__":
    if not os.path.exists(COMPUTED_CSV):
        print(f"[ERROR] {COMPUTED_CSV} not found.")
        print("Run ML/compute_genome_metrics.py first.")
        sys.exit(1)

    genome_df = pd.read_csv(COMPUTED_CSV)
    print(f"[Standalone] Loaded {len(genome_df)} rows from coin_genome_computed.csv")
    scaled_df = scale_genome(genome_df)

    # Save for inspection (gitignored)
    out = os.path.join(_HERE, "crypto_genome_scaled.csv")
    scaled_df.to_csv(out, index=False)
    print(f"  Saved:  {out}")