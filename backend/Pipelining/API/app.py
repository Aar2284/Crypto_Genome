from flask import Flask, jsonify
import psycopg2

app = Flask(__name__)

import os

DB_CONFIG = {
    "host": os.getenv("PG_HOST", "localhost"),
    "port": 5432,
    "database": "crypto_genome",
    "user": os.getenv("PG_USER", "postgres"),
    "password": os.getenv("PG_PASSWORD", "postgres")
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG)


@app.route("/data", methods=["GET"])
def get_data():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM crypto_stream LIMIT 100;")
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    data = [
        {"coin_symbol": r[0], "timestamp": str(r[1])}
        for r in rows
    ]

    return jsonify(data)

@app.route("/")
def home():
    return {"message": "Crypto Genome API Running"}

if __name__ == "__main__":
    app.run(debug=True)