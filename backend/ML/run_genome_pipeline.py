# run_genome_pipeline.py - End-to-end genome ML pipeline orchestrator.
# Chains: compute_metrics -> scale -> PCA -> GMM cluster -> label -> write to DB
#
# Usage: ..\venv\Scripts\python.exe ML/run_genome_pipeline.py

import os
import sys
import time
import importlib.util

# Ensure backend root is on path
_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND = os.path.dirname(_HERE)
sys.path.insert(0, _BACKEND)
sys.path.insert(0, _HERE)


def _load_module(name: str, filepath: str):
    """Load a Python module from an arbitrary file path (handles spaces/parens in dirs)."""
    spec = importlib.util.spec_from_file_location(name, filepath)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# Resolve step module paths
_compute  = _load_module("compute_genome_metrics",
                         os.path.join(_HERE, "compute_genome_metrics.py"))
_scale    = _load_module("scale_genome",
                         os.path.join(_BACKEND, "Scaling", "scale_genome.py"))
_pca      = _load_module("pca_genome",
                         os.path.join(_HERE, "PCA", "pca_genome.py"))
_cluster  = _load_module("cluster_genome",
                         os.path.join(_HERE, "Clustering (GMM)", "cluster_genome.py"))
_label    = _load_module("label_clusters",
                         os.path.join(_HERE, "Cluster Labeling", "label_clusters.py"))


def run_pipeline():
    t_start = time.time()

    print("\n" + "=" * 60)
    print(" CRYPTO GENOME - ML PIPELINE")
    print("=" * 60)
    print(" Steps: compute -> scale -> PCA -> cluster -> label -> DB write")
    print("=" * 60)

    # ── Step 1: Compute 20 genome metrics from OHLCV in Postgres ──────────────
    print("\n[1/5] Computing genome metrics from Postgres OHLCV...")
    t = time.time()
    genome_df = _compute.compute_all_genome_metrics()
    print(f"      Done in {time.time()-t:.1f}s - {len(genome_df)} coins")

    # ── Step 2: StandardScaler on all 20 metric columns ───────────────────────
    print("\n[2/5] Scaling features (StandardScaler -> scaler.pkl)...")
    t = time.time()
    scaled_df = _scale.scale_genome(genome_df)
    print(f"      Done in {time.time()-t:.1f}s")

    # Step 3: PCA - 20 dims -> 5 principal components
    print("\n[3/5] PCA reduction to 5 components (-> pca_model.pkl)...")
    t = time.time()
    pca_df = _pca.pca_genome(scaled_df)
    print(f"      Done in {time.time()-t:.1f}s")

    # Step 4: GMM - assign each coin to 1 of 5 clusters
    print("\n[4/5] GMM clustering (5 clusters -> gmm_model.pkl)...")
    t = time.time()
    cluster_df = _cluster.cluster_genome(pca_df, genome_df)
    print(f"      Done in {time.time()-t:.1f}s")

    # ── Step 5: Write cluster_id + cluster_label to coin_genome table ──────────
    print("\n[5/5] Writing cluster labels to Postgres coin_genome table...")
    t = time.time()
    summary = _label.label_and_write_clusters(cluster_df, genome_df)
    print(f"      Done in {time.time()-t:.1f}s")

    # ── Final summary ──────────────────────────────────────────────────────────
    total = time.time() - t_start
    print(f"\n{'='*60}")
    print(f" PIPELINE COMPLETE  ({total:.1f}s total)")
    print(f"{'='*60}")
    print(f"\n Cluster breakdown:")
    for _, row in summary.iterrows():
        print(f"   [{int(row['cluster_id'])}] {row['cluster_label']}: {int(row['count'])} coins")
    model_dir = os.path.join(_HERE, "model")
    print(f"\n Models saved to: {model_dir}")
    print(f"   scaler.pkl, pca_model.pkl, gmm_model.pkl")
    print(f"\n DB: cluster_id + cluster_label populated for {len(cluster_df)} coins")


if __name__ == "__main__":
    run_pipeline()
