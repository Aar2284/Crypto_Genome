import json
import time
import pandas as pd
from kafka import KafkaProducer


def create_producer():
    return KafkaProducer(
        bootstrap_servers="localhost:9092",
        value_serializer=lambda v: json.dumps(v).encode("utf-8")
    )


def load_data(path: str) -> pd.DataFrame:
    return pd.read_csv(path)


def stream_data(producer, topic: str, df: pd.DataFrame):
    for _, row in df.iterrows():
        message = row.to_dict()
        producer.send(topic, value=message)
        print(f"Sent: {message['coin_symbol']}")
        time.sleep(0.1)  # simulate streaming


def main():
    topic = "crypto_genome"

    # IMPORTANT: adjust path
    data_path = "../../Scaling/crypto_genome_scaled.csv"

    df = load_data(data_path)
    producer = create_producer()

    stream_data(producer, topic, df)

    producer.flush()


if __name__ == "__main__":
    main()