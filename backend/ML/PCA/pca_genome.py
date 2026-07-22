# pca_genome.py - Reduces genome dimensions using PCA (5 components).
# Accepts scaled DataFrame from scale_genome.py.
# Persists trained PCA model to ML/model/pca_model.pkl.
#
# Standalone usage: ..\venv\Scripts\python.exe ML/PCA/pca_genome.py

import os
import sys
import pandas as pd
from sklearn.decomposition import PCA
import joblib

_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND = os.path.dirname(os.path.dirname(_HERE))
MODEL_DIR = os.path.join(_BACKEND, "ML", "model")
PCA_MODEL_PATH = os.path.join(MODEL_DIR, "pca_model.pkl")
SCALED_CSV = os.path.join(_BACKEND, "Scaling", "crypto_genome_scaled.csv")

N_COMPONENTS = 5


def pca_genome(scaled_df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies PCA to the scaled genome DataFrame, reducing to N_COMPONENTS principal components.
    Fits and saves the PCA model to ML/model/pca_model.pkl.

    Args:
        scaled_df: Scaled DataFrame with [coin_symbol, ...metric cols...]

    Returns:
        pca_df: DataFrame with [coin_symbol, PC1, PC2, PC3, PC4, PC5]
    """
    os.makedirs(MODEL_DIR, exist_ok=True)

    coin_ids = scaled_df["coin_symbol"].reset_index(drop=True)
    features = scaled_df.drop(columns=["coin_symbol"]).reset_index(drop=True)

    pca = PCA(n_components=N_COMPONENTS, random_state=42)
    pca_result = pca.fit_transform(features)

    pca_df = pd.DataFrame(
        pca_result,
        columns=[f"PC{i+1}" for i in range(N_COMPONENTS)]
    )
    pca_df.insert(0, "coin_symbol", coin_ids)

    # Persist PCA model for scoring new coins consistently
    joblib.dump(pca, PCA_MODEL_PATH)

    print(f"\n{'='*50}")
    print("PCA COMPLETE")
    print(f"{'='*50}")
    print(f"  Shape:  {pca_df.shape}")
    variance = pca.explained_variance_ratio_
    for i, v in enumerate(variance):
        print(f"  PC{i+1}: {v*100:.1f}% variance explained")
    print(f"  Total:  {sum(variance)*100:.1f}% variance retained")
    print(f"  Saved:  {PCA_MODEL_PATH}")

    return pca_df


if __name__ == "__main__":
    if not os.path.exists(SCALED_CSV):
        print(f"[ERROR] {SCALED_CSV} not found.")
        print("Run Scaling/scale_genome.py first.")
        sys.exit(1)

    scaled_df = pd.read_csv(SCALED_CSV)
    print(f"[Standalone] Loaded {len(scaled_df)} rows from crypto_genome_scaled.csv")
    pca_df = pca_genome(scaled_df)

    out = os.path.join(_HERE, "genome_pca.csv")
    pca_df.to_csv(out, index=False)
    print(f"  Saved:  {out}")