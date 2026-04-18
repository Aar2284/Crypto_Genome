import json
from kafka import KafkaConsumer


def create_consumer(topic: str):
    return KafkaConsumer(
        topic,
        bootstrap_servers="localhost:9092",
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        group_id="crypto-group",
        value_deserializer=lambda x: json.loads(x.decode("utf-8"))
    )


def consume_data(consumer):
    print("Consumer started...\n")

    for message in consumer:
        data = message.value
        print(data)


def main():
    topic = "crypto_genome"

    consumer = create_consumer(topic)
    consume_data(consumer)


if __name__ == "__main__":
    main()