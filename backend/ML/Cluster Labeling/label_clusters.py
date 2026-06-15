# label_clusters.py - Upserts cluster_id and cluster_label into coin_genome table.
# Takes the cluster_df from cluster_genome.py and writes results back to Postgres.
# Also builds and returns a cluster summary (size + avg metrics per cluster).
#
# Standalone usage: ..\venv\Scripts\python.exe ML/Cluster\ Labeling/label_clusters.py

import os
import sys
import psycopg2
import pandas as pd

_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND = os.path.dirname(os.path.dirname(_HERE))
CLUSTERS_CSV = os.path.join(_BACKEND, "ML", "Clustering (GMM)", "genome_clusters.csv")

DB_CONFIG = {
    "host": os.getenv("PG_HOST", "localhost"),
    "database": os.getenv("PG_DB", "crypto_genome"),
    "user": os.getenv("PG_USER", "admin"),
    "password": os.getenv("PG_PASSWORD", "admin"),
    "port": os.getenv("PG_PORT", "5432"),
}


def label_and_write_clusters(cluster_df: pd.DataFrame, genome_df: pd.DataFrame) -> pd.DataFrame:
    """
    1. Upserts cluster_id and cluster_label into coin_genome for every coin.
    2. Builds and returns a cluster summary DataFrame.

    Args:
        cluster_df: DataFrame with [coin_symbol, cluster_id, cluster_label]
        genome_df:  Raw genome metrics DataFrame (for computing per-cluster averages)

    Returns:
        summary_df: DataFrame with [cluster_id, cluster_label, count, avg_* metrics]
    """
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    written = 0
    for _, row in cluster_df.iterrows():
        cur.execute(
            """
            UPDATE coin_genome
            SET cluster_id    = %s,
                cluster_label = %s
            WHERE symbol = %s
            """,
            (int(row["cluster_id"]), str(row["cluster_label"]), str(row["coin_symbol"])),
        )
        written += cur.rowcount

    conn.commit()
    conn.close()

    print(f"\n{'='*50}")
    print("CLUSTER LABELS WRITTEN TO DB")
    print(f"{'='*50}")
    print(f"  Rows updated: {written}")

    # Build cluster summary
    merged = cluster_df.merge(
        genome_df.rename(columns={"coin_symbol": "coin_symbol"}),
        on="coin_symbol",
        how="left",
    )
    numeric_cols = merged.select_dtypes(include="number").columns.tolist()
    summary = merged.groupby(["cluster_id", "cluster_label"]).agg(
        count=("coin_symbol", "count"),
        **{f"avg_{c}": (c, "mean") for c in numeric_cols if c != "cluster_id"},
    ).reset_index()

    print(f"\n  Cluster summary:")
    for _, r in summary.iterrows():
        print(f"    [{int(r['cluster_id'])}] {r['cluster_label']}: {int(r['count'])} coins")

    return summary


if __name__ == "__main__":
    if not os.path.exists(CLUSTERS_CSV):
        print(f"[ERROR] {CLUSTERS_CSV} not found.")
        print("Run ML/Clustering (GMM)/cluster_genome.py first.")
        sys.exit(1)

    cluster_df = pd.read_csv(CLUSTERS_CSV)
    print(f"[Standalone] Loaded {len(cluster_df)} cluster assignments")

    # Load genome metrics for summary computation
    computed_csv = os.path.join(_BACKEND, "ML", "coin_genome_computed.csv")
    if os.path.exists(computed_csv):
        genome_df = pd.read_csv(computed_csv)
    else:
        # Fallback: load master CSV
        master_csv = os.path.join(_BACKEND, "..", "datasets", "crypto_genome_master.csv")
        genome_df = pd.read_csv(master_csv).rename(columns={"coin_symbol": "coin_symbol"})

    summary = label_and_write_clusters(cluster_df, genome_df)

    out = os.path.join(_HERE, "cluster_summary.csv")
    summary.to_csv(out, index=False)
    print(f"  Saved:  {out}")