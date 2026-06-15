# migrate_add_cluster_columns.py
# Adds cluster_id (INTEGER) and cluster_label (VARCHAR) to coin_genome table.
# Follows the same pattern as migrate_add_data_source.py — raw psycopg2, idempotent.
#
# Usage: ..\venv\Scripts\python.exe migrate_add_cluster_columns.py

import os
import psycopg2

conn = psycopg2.connect(
    host=os.getenv("PG_HOST", "localhost"),
    database=os.getenv("PG_DB", "crypto_genome"),
    user=os.getenv("PG_USER", "admin"),
    password=os.getenv("PG_PASSWORD", "admin"),
    port=os.getenv("PG_PORT", "5432"),
)
cur = conn.cursor()

# Add cluster_id column (integer, nullable — populated after GMM clustering)
cur.execute("ALTER TABLE coin_genome ADD COLUMN IF NOT EXISTS cluster_id INTEGER")
print("[OK] cluster_id column added (or already existed)")

# Add cluster_label column (varchar, nullable — human-readable cluster name)
cur.execute("ALTER TABLE coin_genome ADD COLUMN IF NOT EXISTS cluster_label VARCHAR")
print("[OK] cluster_label column added (or already existed)")

conn.commit()

# Verify the columns exist
cur.execute("""
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'coin_genome'
      AND column_name IN ('cluster_id', 'cluster_label')
    ORDER BY column_name
""")
rows = cur.fetchall()
print("\n[Verify] Cluster columns in coin_genome:")
for col_name, data_type in rows:
    print(f"  {col_name}: {data_type}")

# Show sample row to confirm structure
cur.execute("SELECT symbol, cluster_id, cluster_label FROM coin_genome LIMIT 3")
samples = cur.fetchall()
print("\n[Sample rows] (cluster columns will be NULL until GMM pipeline runs):")
for r in samples:
    print(f"  {r[0]}: cluster_id={r[1]}, cluster_label={r[2]}")

conn.close()
print("\nMigration complete.")
