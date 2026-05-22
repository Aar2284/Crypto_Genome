import psycopg2

conn = psycopg2.connect(
    host='localhost',
    database='crypto_genome',
    user='admin',
    password='admin',
    port='5432'
)
cur = conn.cursor()

# Add the new data_source column if it doesn't exist
cur.execute("ALTER TABLE assets ADD COLUMN IF NOT EXISTS data_source VARCHAR DEFAULT 'binance'")
conn.commit()
print("data_source column added (or already existed)")

# Also verify existing rows
cur.execute("SELECT symbol, pipeline_status FROM assets LIMIT 5")
rows = cur.fetchall()
print("Existing assets sample:", rows)

conn.close()
