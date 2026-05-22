"""
migrate_fix_asset_ids.py
One-time migration to fix old numeric asset_ids (BTC='1', ETH='2', SOL='3')
to use the symbol as the asset_id (BTC='BTC', etc.)
Also migrates asset_history references accordingly.
Run ONCE from backend/ dir.
"""
import psycopg2

conn = psycopg2.connect(
    host='localhost',
    database='crypto_genome',
    user='admin',
    password='admin',
    port='5432'
)
conn.autocommit = False
cur = conn.cursor()

# Find assets with numeric asset_ids
cur.execute("SELECT asset_id, symbol FROM assets WHERE asset_id ~ '^[0-9]+$'")
rows = cur.fetchall()
print("Assets with numeric IDs:", rows)

for old_id, symbol in rows:
    # Update asset_history references first (FK-like)
    cur.execute(
        "UPDATE asset_history SET asset_id = %s WHERE asset_id = %s",
        (symbol, old_id)
    )
    print("  Updated asset_history: {} -> {}".format(old_id, symbol))

    # Update assets PK (Postgres supports updating PK if no real FK constraint)
    cur.execute(
        "UPDATE assets SET asset_id = %s WHERE asset_id = %s",
        (symbol, old_id)
    )
    print("  Updated assets: {} -> {}".format(old_id, symbol))

conn.commit()
print("Migration complete!")
conn.close()
