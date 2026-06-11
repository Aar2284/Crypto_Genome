import psycopg2

# Try crypto_genome DB with admin credentials (since the container uses admin/admin)
try:
    conn = psycopg2.connect(
        host="localhost", database="crypto_genome", user="admin", password="admin", port="5432"
    )
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    tables = [r[0] for r in cur.fetchall()]
    print("Tables in 'crypto_genome' DB:", tables)

    if "coin_ohlcv" in tables:
        cur.execute("SELECT COUNT(*) FROM coin_ohlcv")
        print("coin_ohlcv rows:", cur.fetchone()[0])
        cur.execute("SELECT COUNT(DISTINCT symbol) FROM coin_ohlcv")
        print("distinct symbols:", cur.fetchone()[0])
        cur.execute("SELECT symbol, COUNT(*) as cnt FROM coin_ohlcv GROUP BY symbol ORDER BY cnt DESC LIMIT 5")
        print("top 5 by rows:")
        for r in cur.fetchall():
            print(f"  {r[0]}: {r[1]} rows")
    else:
        print("coin_ohlcv table NOT FOUND — need to run init_db.py + load_datasets.py")

    if "coin_genome" in tables:
        cur.execute("SELECT COUNT(*) FROM coin_genome")
        print(f"\ncoin_genome rows: {cur.fetchone()[0]}")
    
    if "assets" in tables:
        cur.execute("SELECT COUNT(*) FROM assets")
        print(f"assets rows: {cur.fetchone()[0]}")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
