"""
kafka_consumer.py — Unified Kafka consumer for all 4 exchange sources.
Consumes messages from the crypto_genome topic and writes to PostgreSQL.

Message format expected:
{
    "coin_symbol": "BTC",
    "price": 65000.0,
    "volume_24h": 12345678.9,
    "change_24h_pct": 1.23,
    "source": "binance"
}

Updates assets table (current snapshot) and inserts into asset_history (time-series).
Run from inside backend/ dir.
"""
import json
import psycopg2
import time
from datetime import datetime, timezone
from kafka import KafkaConsumer
from kafka.errors import NoBrokersAvailable

# Kafka settings
KAFKA_BOOTSTRAP = "localhost:9092"
KAFKA_TOPIC = "crypto_genome"


def create_consumer() -> KafkaConsumer:
    """Create Kafka consumer with retry logic."""
    retries = 0
    while True:
        try:
            consumer = KafkaConsumer(
                KAFKA_TOPIC,
                bootstrap_servers=KAFKA_BOOTSTRAP,
                auto_offset_reset="latest",
                enable_auto_commit=True,
                group_id="crypto-group",
                value_deserializer=lambda x: json.loads(x.decode("utf-8")),
            )
            print("[Consumer] Connected to Kafka: " + KAFKA_BOOTSTRAP)
            return consumer
        except NoBrokersAvailable:
            retries += 1
            print("[Consumer] Kafka not available, retry {}...".format(retries))
            time.sleep(3)


def get_db_connection() -> psycopg2.extensions.connection:
    return psycopg2.connect(
        host="localhost",
        database="crypto_genome",
        user="admin",
        password="admin",
        port="5432",
    )


def consume_data(consumer: KafkaConsumer) -> None:
    print("[Consumer] Starting... Waiting for messages from topic: " + KAFKA_TOPIC)

    conn = get_db_connection()
    conn.autocommit = True
    cursor = conn.cursor()
    processed = 0

    for message in consumer:
        data = message.value
        symbol = data.get("coin_symbol", "")
        price = float(data.get("price", 0))
        volume_24h = float(data.get("volume_24h", 0))
        change_24h_pct = float(data.get("change_24h_pct", 0))
        source = data.get("source", "unknown")
        timestamp = datetime.now(timezone.utc)

        if not symbol or price <= 0:
            continue

        try:
            # Reconnect if connection dropped
            if conn.closed:
                conn = get_db_connection()
                conn.autocommit = True
                cursor = conn.cursor()

            # Update current price snapshot in assets table
            cursor.execute(
                """
                UPDATE assets
                SET current_price = %s,
                    volume_24h = %s,
                    change_24h_pct = %s,
                    data_source = %s,
                    last_updated_at = %s,
                    pipeline_status = 'active'
                WHERE symbol = %s
                RETURNING asset_id
                """,
                (price, volume_24h, change_24h_pct, source, timestamp, symbol),
            )

            result = cursor.fetchone()

            if result:
                asset_id = result[0]
                # Insert time-series tick into asset_history
                cursor.execute(
                    """
                    INSERT INTO asset_history (asset_id, timestamp, price, volume)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (asset_id, timestamp, price, volume_24h),
                )
                processed += 1
                if processed % 100 == 0:
                    print("[Consumer] Processed {} ticks".format(processed))
            else:
                # Symbol not in DB — log but don't crash
                print("[Consumer] WARNING: symbol '{}' not found in assets table".format(symbol))

        except psycopg2.OperationalError as e:
            print("[Consumer] DB connection lost, reconnecting: {}".format(e))
            try:
                conn = get_db_connection()
                conn.autocommit = True
                cursor = conn.cursor()
            except Exception as re:
                print("[Consumer] Reconnect failed: {}".format(re))
        except Exception as e:
            print("[Consumer] DB Error for {}: {}".format(symbol, e))


def main() -> None:
    consumer = create_consumer()
    try:
        consume_data(consumer)
    except KeyboardInterrupt:
        print("[Consumer] Stopped by user.")
    finally:
        consumer.close()


if __name__ == "__main__":
    main()