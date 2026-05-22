"""
kafka_producer_binance.py — Real-time Binance WebSocket producer.
Subscribes to the all-mini-ticker stream (!miniTicker@arr) — a single connection
that broadcasts every symbol's 24h stats every ~1 second.
No API key required — fully public WebSocket.

Usage: python kafka_producer_binance.py
"""
import json
import asyncio
import websockets
from kafka import KafkaProducer
from producer_config import KAFKA_BOOTSTRAP, KAFKA_TOPIC, BINANCE_SYMBOLS

BINANCE_WS_URL = "wss://stream.binance.com:9443/ws/!miniTicker@arr"


def create_producer() -> KafkaProducer:
    return KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        acks=1,
        retries=5,
    )


async def stream(producer: KafkaProducer) -> None:
    print("[Binance] Connecting to: " + BINANCE_WS_URL)
    print("[Binance] Tracking {} symbols".format(len(BINANCE_SYMBOLS)))

    async for ws in websockets.connect(BINANCE_WS_URL, ping_interval=20, ping_timeout=10):
        try:
            async for raw in ws:
                tickers = json.loads(raw)
                for item in tickers:
                    symbol_pair = item.get("s")
                    if symbol_pair not in BINANCE_SYMBOLS:
                        continue

                    coin = BINANCE_SYMBOLS[symbol_pair]
                    open_price = float(item.get("o", 0))
                    close_price = float(item.get("c", 0))

                    # Calculate 24h change percent from open/close
                    change_pct = 0.0
                    if open_price > 0:
                        change_pct = round(((close_price - open_price) / open_price) * 100, 4)

                    msg = {
                        "coin_symbol": coin,
                        "price": close_price,
                        "volume_24h": float(item.get("q", 0)),  # 'q' = quote asset volume (USD)
                        "change_24h_pct": change_pct,
                        "source": "binance",
                    }

                    producer.send(KAFKA_TOPIC, value=msg)
                    print("[Binance] {}: ${:.4f}  ({:+.2f}%)".format(coin, close_price, change_pct))

        except websockets.ConnectionClosed as e:
            print("[Binance] Connection closed ({}), reconnecting...".format(e))
            await asyncio.sleep(2)
        except Exception as e:
            print("[Binance] Error: {}".format(e))
            await asyncio.sleep(2)


def main() -> None:
    producer = create_producer()
    try:
        asyncio.run(stream(producer))
    except KeyboardInterrupt:
        print("[Binance] Stopped by user.")
    finally:
        producer.flush()
        producer.close()


if __name__ == "__main__":
    main()
