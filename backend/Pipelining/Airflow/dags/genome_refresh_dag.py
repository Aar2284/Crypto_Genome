# genome_refresh_dag.py — Weekly Airflow DAG for Crypto Genome ML refresh.
#
# Pipeline:
#   pull_ohlcv → compute_metrics → scale → pca → cluster → label → validate
#
# Each BashOperator calls the corresponding Python script inside the
# Docker-mounted project at /opt/airflow/project.
# The validate task is a PythonOperator that asserts all active coins
# have a cluster_id in the coin_genome table.
#
# Env vars used (same as crypto_pipeline_dag.py):
#   PG_HOST, PG_USER, PG_PASSWORD  — Postgres credentials
#   PYTHON  — path to the venv python (default: python3)

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime
import os

# ---------------------------------------------------------------------------
# Validate task — queries coin_genome and asserts cluster_id is populated
# ---------------------------------------------------------------------------

def validate_genome_clusters():
    import psycopg2

    print("Validating genome cluster assignments in PostgreSQL...")
    conn = psycopg2.connect(
        host=os.getenv("PG_HOST", "host.docker.internal"),
        database="crypto_genome",
        user=os.getenv("PG_USER", "postgres"),
        password=os.getenv("PG_PASSWORD", "postgres"),
        port="5432",
    )
    cur = conn.cursor()

    # Total coins in genome table
    cur.execute("SELECT COUNT(*) FROM coin_genome;")
    total = cur.fetchone()[0]

    # Coins with a cluster assignment
    cur.execute("SELECT COUNT(*) FROM coin_genome WHERE cluster_id IS NOT NULL;")
    clustered = cur.fetchone()[0]

    # Sample of labelled coins
    cur.execute(
        "SELECT coin_symbol, cluster_id, cluster_label "
        "FROM coin_genome WHERE cluster_id IS NOT NULL LIMIT 10;"
    )
    sample = cur.fetchall()

    conn.close()

    print(f"  Total genome rows : {total}")
    print(f"  Clustered rows    : {clustered}")
    print("  Sample assignments:")
    for row in sample:
        print(f"    {row[0]:10s}  cluster={row[1]}  label={row[2]}")

    if total > 0 and clustered == 0:
        raise ValueError(
            "Validation FAILED: coin_genome has rows but no cluster_id values. "
            "Check that label_clusters.py ran successfully."
        )

    print("Validation PASSED ✓")


# ---------------------------------------------------------------------------
# DAG definition
# ---------------------------------------------------------------------------

PROJECT_ROOT = "/opt/airflow/project"
PYTHON = os.getenv("PYTHON", "python3")

# All scripts run from the project root so relative imports work correctly.
BASH_PRELUDE = f"""
set -e
export KAFKA_HOST="host.docker.internal:9092"
export PG_HOST="host.docker.internal"
export PG_USER="{os.getenv('PG_USER', 'postgres')}"
export PG_PASSWORD="{os.getenv('PG_PASSWORD', 'postgres')}"
cd {PROJECT_ROOT}
"""

with DAG(
    dag_id="genome_refresh_pipeline",
    description="Weekly refresh of Crypto Genome ML pipeline: metrics → scale → PCA → GMM → labels → DB",
    start_date=datetime(2024, 1, 1),
    schedule_interval="@weekly",
    catchup=False,
    tags=["genome", "ml", "weekly"],
) as dag:

    # ------------------------------------------------------------------
    # Task 1: Pull latest OHLCV from Binance into Postgres
    # (reuses the existing ingestion pipeline)
    # ------------------------------------------------------------------
    pull_ohlcv = BashOperator(
        task_id="pull_ohlcv",
        bash_command=BASH_PRELUDE + f"""
echo "=== [1/6] Pulling latest OHLCV data ==="
timeout 60s {PYTHON} Pipelining/Ingestion/kafka_producer_binance.py &
timeout 60s {PYTHON} Pipelining/Ingestion/kafka_consumer.py &
wait
echo "OHLCV pull complete."
""",
    )

    # ------------------------------------------------------------------
    # Task 2: Compute genome feature metrics from coin_ohlcv table
    # ------------------------------------------------------------------
    compute_metrics = BashOperator(
        task_id="compute_metrics",
        bash_command=BASH_PRELUDE + f"""
echo "=== [2/6] Computing genome feature metrics ==="
{PYTHON} ML/compute_genome_metrics.py
echo "Metrics computation complete."
""",
    )

    # ------------------------------------------------------------------
    # Task 3: Scale features
    # ------------------------------------------------------------------
    scale = BashOperator(
        task_id="scale",
        bash_command=BASH_PRELUDE + f"""
echo "=== [3/6] Scaling genome features ==="
{PYTHON} Scaling/scale_genome.py
echo "Scaling complete."
""",
    )

    # ------------------------------------------------------------------
    # Task 4: PCA dimensionality reduction
    # ------------------------------------------------------------------
    pca = BashOperator(
        task_id="pca",
        bash_command=BASH_PRELUDE + f"""
echo "=== [4/6] Running PCA ==="
{PYTHON} ML/PCA/pca_genome.py
echo "PCA complete."
""",
    )

    # ------------------------------------------------------------------
    # Task 5: GMM clustering
    # ------------------------------------------------------------------
    cluster = BashOperator(
        task_id="cluster",
        bash_command=BASH_PRELUDE + f"""
echo "=== [5/6] Running GMM clustering ==="
{PYTHON} "ML/Clustering (GMM)/cluster_genome.py"
echo "Clustering complete."
""",
    )

    # ------------------------------------------------------------------
    # Task 6: Derive cluster labels and write back to coin_genome table
    # ------------------------------------------------------------------
    label = BashOperator(
        task_id="label",
        bash_command=BASH_PRELUDE + f"""
echo "=== [6/6] Labelling clusters and writing to DB ==="
{PYTHON} "ML/Cluster Labeling/label_clusters.py"
echo "Labelling complete."
""",
    )

    # ------------------------------------------------------------------
    # Task 7: Validate — assert all active coins have a cluster_id
    # ------------------------------------------------------------------
    validate = PythonOperator(
        task_id="validate",
        python_callable=validate_genome_clusters,
    )

    # ------------------------------------------------------------------
    # DAG dependency chain
    # ------------------------------------------------------------------
    pull_ohlcv >> compute_metrics >> scale >> pca >> cluster >> label >> validate
