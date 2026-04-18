import json
import os
import pandas as pd
from kafka import KafkaConsumer

OUTPUT_PATH = "../Storage/stream_output.csv"


def create_consumer(topic: str):
    return KafkaConsumer(
        topic,
        bootstrap_servers="localhost:9092",
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        group_id="crypto-group",
        value_deserializer=lambda x: json.loads(x.decode("utf-8"))
    )


def initialize_storage():

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    
    if not os.path.exists(OUTPUT_PATH):
        df = pd.DataFrame(columns=[
            "coin_symbol",
            "timestamp"
        ])
        df.to_csv(OUTPUT_PATH, index=False)


def write_record(data):
    df = pd.DataFrame([{
        "coin_symbol": data["coin_symbol"],
        "timestamp": pd.Timestamp.now()
    }])
    df.to_csv(OUTPUT_PATH, mode="a", header=False, index=False)


def consume_data(consumer):
    print("Consumer + Storage started...\n")

    for message in consumer:
        data = message.value

        write_record(data)

        print(f"Stored: {data['coin_symbol']}")


def main():
    topic = "crypto_genome"

    initialize_storage()

    consumer = create_consumer(topic)
    consume_data(consumer)


if __name__ == "__main__":
    main()