import json
import psycopg2
from datetime import datetime, timezone
from kafka import KafkaConsumer

def create_consumer(topic: str):
    return KafkaConsumer(
        topic,
        bootstrap_servers="localhost:9092",
        auto_offset_reset="latest",
        enable_auto_commit=True,
        group_id="crypto-group",
        value_deserializer=lambda x: json.loads(x.decode("utf-8"))
    )

def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        database="crypto_genome",
        user="postgres",
        password="postgres",
        port="5432"
    )

def consume_data(consumer):
    print("Consumer + Storage to PostgreSQL started...\n")
    
    conn = get_db_connection()
    conn.autocommit = True
    cursor = conn.cursor()

    for message in consumer:
        data = message.value
        symbol = data["coin_symbol"]
        price = data["price"]
        volume = data["volume"]
        timestamp = datetime.now(timezone.utc)

        try:
            # Update the current snapshot
            cursor.execute("""
                UPDATE assets 
                SET current_price = %s, volume_24h = %s, last_updated_at = %s
                WHERE symbol = %s
                RETURNING asset_id
            """, (price, volume, timestamp, symbol))
            
            result = cursor.fetchone()
            
            # Insert historical tick if asset exists
            if result:
                asset_id = result[0]
                cursor.execute("""
                    INSERT INTO asset_history (asset_id, timestamp, price, volume)
                    VALUES (%s, %s, %s, %s)
                """, (asset_id, timestamp, price, volume))
                
            print(f"Stored: {symbol} -> {price}")
        except Exception as e:
            print(f"DB Error: {e}")

def main():
    topic = "crypto_genome"
    consumer = create_consumer(topic)
    consume_data(consumer)

if __name__ == "__main__":
    main()