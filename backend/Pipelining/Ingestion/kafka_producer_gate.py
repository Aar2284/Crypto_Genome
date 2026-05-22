"""
kafka_producer_gate.py — Real-time Gate.io WebSocket producer.
Uses Gate.io v4 WebSocket API — subscribes to spot.tickers channel.
No API key required — public ticker channel.

Usage: python kafka_producer_gate.py
"""
import json
import asyncio
import time
import websockets
from kafka import KafkaProducer
from producer_config import KAFKA_BOOTSTRAP, KAFKA_TOPIC, GATE_SYMBOLS

GATE_WS_URL = "wss://api.gateio.ws/ws/v4/"


def create_producer() -> KafkaProducer:
    return KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        acks=1,
        retries=5,
    )


async def stream(producer: KafkaProducer) -> None:
    print("[Gate.io] Connecting to: " + GATE_WS_URL)
    print("[Gate.io] Tracking {} symbols".format(len(GATE_SYMBOLS)))

    # Subscribe message — Gate.io takes a list of currency pairs
    subscribe_msg = {
        "time": int(time.time()),
        "channel": "spot.tickers",
        "event": "subscribe",
        "payload": list(GATE_SYMBOLS.keys()),  # e.g. ["BNT_USDT", "ETN_USDT", ...]
    }

    async for ws in websockets.connect(GATE_WS_URL, ping_interval=30, ping_timeout=15):
        try:
            # Send subscription
            await ws.send(json.dumps(subscribe_msg))
            print("[Gate.io] Subscribed to {} pairs".format(len(GATE_SYMBOLS)))

            async for raw in ws:
                data = json.loads(raw)

                # Gate.io sends: {"time":..., "channel":"spot.tickers", "event":"update", "result":{...}}
                if data.get("event") != "update":
                    continue
                if data.get("channel") != "spot.tickers":
                    continue

                result = data.get("result", {})
                currency_pair = result.get("currency_pair")

                if currency_pair not in GATE_SYMBOLS:
                    continue

                coin = GATE_SYMBOLS[currency_pair]
                last_price = float(result.get("last", 0))

                # Gate.io provides change_percentage as a string like "2.34"
                change_pct_str = result.get("change_percentage", "0")
                try:
                    change_pct = round(float(change_pct_str), 4)
                except (ValueError, TypeError):
                    change_pct = 0.0

                # quote_volume = 24h volume in quote currency (USD-equivalent)
                volume_24h = float(result.get("quote_volume", 0))

                msg = {
                    "coin_symbol": coin,
                    "price": last_price,
                    "volume_24h": volume_24h,
                    "change_24h_pct": change_pct,
                    "source": "gate",
                }

                producer.send(KAFKA_TOPIC, value=msg)
                print("[Gate.io] {}: ${:.4f}  ({:+.2f}%)".format(coin, last_price, change_pct))

        except websockets.ConnectionClosed as e:
            print("[Gate.io] Connection closed ({}), reconnecting...".format(e))
            await asyncio.sleep(2)
        except Exception as e:
            print("[Gate.io] Error: {}".format(e))
            await asyncio.sleep(2)


def main() -> None:
    producer = create_producer()
    try:
        asyncio.run(stream(producer))
    except KeyboardInterrupt:
        print("[Gate.io] Stopped by user.")
    finally:
        producer.flush()
        producer.close()


if __name__ == "__main__":
    main()
