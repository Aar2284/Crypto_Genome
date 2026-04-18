import pandas as pd
import psycopg2

INPUT_PATH = "../Storage/stream_output.csv"

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "crypto",
    "user": "admin",
    "password": "admin"
}

def load_data():
    return pd.read_csv(INPUT_PATH)

def write_to_postgres(df):
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # Create table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS crypto_stream (
            coin_symbol TEXT,
            timestamp TIMESTAMP
        );
    """)

    # Insert data
    for _, row in df.iterrows():
        cursor.execute(
            "INSERT INTO crypto_stream (coin_symbol, timestamp) VALUES (%s, %s)",
            (row["coin_symbol"], row["timestamp"])
        )

    conn.commit()
    cursor.close()
    conn.close()

def main():
    df = load_data()
    write_to_postgres(df)
    print("Data loaded into PostgreSQL!")

if __name__ == "__main__":
    main()