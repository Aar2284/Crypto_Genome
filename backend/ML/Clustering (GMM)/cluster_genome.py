# cluster_genome.py - GMM clustering on PCA-reduced genome data (5 clusters).
# Accepts PCA DataFrame + raw genome metrics DataFrame from compute_genome_metrics.
# Labels clusters by comparing each cluster's average raw metric scores across
# the 5 genome dimensions -- whichever dimension is highest sets the label.
# Uses greedy assignment so all 5 labels are distinct (no duplicates).
# Persists trained GMM model to ML/model/gmm_model.pkl.
#
# Standalone usage: ..\venv\Scripts\python.exe "ML/Clustering (GMM)/cluster_genome.py"

import os
import sys
import numpy as np
import pandas as pd
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler
import joblib

_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND = os.path.dirname(os.path.dirname(_HERE))
MODEL_DIR = os.path.join(_BACKEND, "ML", "model")
GMM_MODEL_PATH = os.path.join(MODEL_DIR, "gmm_model.pkl")
PCA_CSV = os.path.join(_BACKEND, "ML", "PCA", "genome_pca.csv")
COMPUTED_CSV = os.path.join(_BACKEND, "ML", "coin_genome_computed.csv")

N_CLUSTERS = 5
RANDOM_STATE = 42

# Each genome dimension maps to a group of raw metric columns.
# The dimension with the highest absolute average z-score for a cluster wins.
DIMENSION_COLS = {
    "Volatility": [
        "volatility_baseline", "volatility_skew", "volatility_kurtosis", "vol_of_vol"
    ],
    "Dependence": [
        "market_beta", "btc_correlation", "r_squared", "downside_coupling"
    ],
    "Momentum": [
        "trend_efficiency", "autocorrelation", "up_day_ratio", "risk_adjusted_momentum"
    ],
    "Drawdown": [
        "max_drawdown", "avg_drawdown_depth", "avg_drawdown_duration", "recovery_speed_ratio"
    ],
    "Liquidity": [
        "log_avg_volume", "volume_stability_cv", "vol_return_correlation",
        "crisis_liquidity_retention"
    ],
}


def _assign_labels_from_raw(cluster_ids: np.ndarray, genome_df: pd.DataFrame) -> dict:
    """
    For each cluster, compute the average absolute z-score of each dimension group.
    Assigns labels greedily so all 5 dimension names are used exactly once.
    """
    metric_cols = [
        c for dim_cols in DIMENSION_COLS.values()
        for c in dim_cols if c in genome_df.columns
    ]
    raw = genome_df.set_index("coin_symbol")[metric_cols].fillna(0)
    z = pd.DataFrame(
        StandardScaler().fit_transform(raw),
        index=raw.index,
        columns=raw.columns,
    )

    # Compute per-cluster dimension scores
    scores = {}
    for cid in range(N_CLUSTERS):
        coin_syms = genome_df["coin_symbol"].values[cluster_ids == cid]
        cluster_z = z.loc[z.index.isin(coin_syms)]
        dim_scores = {}
        for dim, cols in DIMENSION_COLS.items():
            available = [c for c in cols if c in cluster_z.columns]
            dim_scores[dim] = float(cluster_z[available].abs().mean().mean()) if available else 0.0
        scores[cid] = dim_scores

    # Greedy: assign highest-scoring dim first, remove from pool to avoid duplicates
    available_labels = set(DIMENSION_COLS.keys())
    label_map = {}

    cluster_order = sorted(
        range(N_CLUSTERS),
        key=lambda c: max(scores[c].values()),
        reverse=True,
    )
    for cid in cluster_order:
        ranked = sorted(scores[cid].items(), key=lambda x: x[1], reverse=True)
        for dim, _ in ranked:
            if dim in available_labels:
                label_map[cid] = dim
                available_labels.discard(dim)
                break
        else:
            fallback = next(iter(available_labels or ["Mixed"]))
            label_map[cid] = fallback
            available_labels.discard(fallback)

    return label_map


def cluster_genome(pca_df: pd.DataFrame, genome_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Fits a GMM on PCA-reduced genome data, assigns cluster IDs and dimension labels.

    Args:
        pca_df:     DataFrame with [coin_symbol, PC1..PC5]
        genome_df:  Raw metrics DataFrame for label derivation. If None, reads
                    coin_genome_computed.csv.

    Returns:
        cluster_df: DataFrame with [coin_symbol, cluster_id, cluster_label]
    """
    os.makedirs(MODEL_DIR, exist_ok=True)

    if genome_df is None:
        if os.path.exists(COMPUTED_CSV):
            genome_df = pd.read_csv(COMPUTED_CSV)
        else:
            raise FileNotFoundError(
                f"genome_df not provided and {COMPUTED_CSV} not found. "
                "Run compute_genome_metrics.py first."
            )

    coin_ids = pca_df["coin_symbol"].reset_index(drop=True)
    pc_cols = [c for c in pca_df.columns if c.startswith("PC")]
    features = pca_df[pc_cols].reset_index(drop=True)

    gmm = GaussianMixture(
        n_components=N_CLUSTERS,
        covariance_type="full",
        random_state=RANDOM_STATE,
        n_init=5,
        max_iter=200,
    )
    gmm.fit(features)
    cluster_ids_arr = gmm.predict(features)

    # Align genome_df to coin ordering in pca_df
    genome_aligned = (
        genome_df.set_index("coin_symbol")
        .reindex(coin_ids)
        .reset_index()
        .rename(columns={"coin_symbol": "coin_symbol"})
    )
    label_map = _assign_labels_from_raw(cluster_ids_arr, genome_aligned)
    cluster_labels = [label_map[int(c)] for c in cluster_ids_arr]

    cluster_df = pd.DataFrame({
        "coin_symbol": coin_ids,
        "cluster_id": cluster_ids_arr,
        "cluster_label": cluster_labels,
    })

    joblib.dump(gmm, GMM_MODEL_PATH)

    print(f"\n{'='*50}")
    print("GMM CLUSTERING COMPLETE")
    print(f"{'='*50}")
    print(f"  Coins clustered: {len(cluster_df)}")
    print(f"  Saved model:     {GMM_MODEL_PATH}")
    print(f"\n  Cluster assignments:")
    for cid in sorted(cluster_df["cluster_id"].unique()):
        subset = cluster_df[cluster_df["cluster_id"] == cid]
        label = subset.iloc[0]["cluster_label"]
        coins = ", ".join(sorted(subset["coin_symbol"].tolist()))
        print(f"    [{cid}] {label} ({len(subset)} coins): {coins}")

    return cluster_df


if __name__ == "__main__":
    if not os.path.exists(PCA_CSV):
        print(f"[ERROR] {PCA_CSV} not found. Run ML/PCA/pca_genome.py first.")
        sys.exit(1)

    pca_df = pd.read_csv(PCA_CSV)
    genome_df = pd.read_csv(COMPUTED_CSV) if os.path.exists(COMPUTED_CSV) else None
    print(f"[Standalone] Loaded {len(pca_df)} rows from genome_pca.csv")
    cluster_df = cluster_genome(pca_df, genome_df)

    out = os.path.join(_HERE, "genome_clusters.csv")
    cluster_df.to_csv(out, index=False)
    print(f"  Saved: {out}")