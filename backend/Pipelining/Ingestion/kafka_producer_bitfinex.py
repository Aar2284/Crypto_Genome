"""
kafka_producer_bitfinex.py — Real-time Bitfinex WebSocket producer (fallback).
Used as redundancy fallback for LEO and BNT if Gate.io feed drops.
Uses Bitfinex Public WebSocket API v2.
No API key required — fully public.

Usage: python kafka_producer_bitfinex.py
Note: Only run this if Gate.io is down. Gate.io is the primary source for LEO/BNT.
"""
import json
import asyncio
import websockets
from kafka import KafkaProducer
from producer_config import KAFKA_BOOTSTRAP, KAFKA_TOPIC, BITFINEX_SYMBOLS

BITFINEX_WS_URL = "wss://api-pub.bitfinex.com/ws/2"


def create_producer() -> KafkaProducer:
    return KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        acks=1,
        retries=5,
    )


async def stream(producer: KafkaProducer) -> None:
    print("[Bitfinex] Connecting to: " + BITFINEX_WS_URL)
    print("[Bitfinex] Tracking {} symbols (fallback mode)".format(len(BITFINEX_SYMBOLS)))

    # Map chanId -> symbol (Bitfinex sends channel IDs, not symbol names in data)
    channel_map: dict[int, str] = {}  # chanId -> coin_symbol

    # Subscribe messages for each symbol
    subscribe_msgs = [
        {
            "event": "subscribe",
            "channel": "ticker",
            "symbol": pair,  # e.g. "tLEOUSD"
        }
        for pair in BITFINEX_SYMBOLS.keys()
    ]

    async for ws in websockets.connect(BITFINEX_WS_URL, ping_interval=20, ping_timeout=10):
        channel_map.clear()
        try:
            # Subscribe to all tickers
            for msg in subscribe_msgs:
                await ws.send(json.dumps(msg))

            async for raw in ws:
                data = json.loads(raw)

                # Handle subscription confirmation (event messages)
                if isinstance(data, dict):
                    event = data.get("event")
                    if event == "subscribed":
                        chan_id = data.get("chanId")
                        pair = data.get("symbol")  # e.g. "tLEOUSD"
                        if pair in BITFINEX_SYMBOLS:
                            channel_map[chan_id] = BITFINEX_SYMBOLS[pair]
                            print("[Bitfinex] Subscribed: {} -> chanId={}".format(pair, chan_id))
                    elif event == "error":
                        print("[Bitfinex] Subscription error: {}".format(data.get("msg")))
                    continue

                # Handle ticker data arrays: [chanId, [BID, BID_SIZE, ASK, ASK_SIZE, DAILY_CHG, DAILY_CHG_REL, LAST, VOLUME, HIGH, LOW]]
                if isinstance(data, list) and len(data) == 2:
                    chan_id = data[0]
                    payload = data[1]

                    # Skip heartbeat "hb" messages
                    if payload == "hb":
                        continue

                    coin = channel_map.get(chan_id)
                    if not coin or not isinstance(payload, list) or len(payload) < 10:
                        continue

                    last_price = float(payload[6])
                    daily_chg_rel = float(payload[5])  # Relative change (e.g. 0.0123 = 1.23%)
                    volume = float(payload[7])

                    change_pct = round(daily_chg_rel * 100, 4)

                    msg = {
                        "coin_symbol": coin,
                        "price": last_price,
                        "volume_24h": volume,
                        "change_24h_pct": change_pct,
                        "source": "bitfinex",
                    }

                    producer.send(KAFKA_TOPIC, value=msg)
                    print("[Bitfinex] {}: ${:.4f}  ({:+.2f}%)".format(coin, last_price, change_pct))

        except websockets.ConnectionClosed as e:
            print("[Bitfinex] Connection closed ({}), reconnecting...".format(e))
            channel_map.clear()
            await asyncio.sleep(3)
        except Exception as e:
            print("[Bitfinex] Error: {}".format(e))
            channel_map.clear()
            await asyncio.sleep(3)


def main() -> None:
    producer = create_producer()
    try:
        asyncio.run(stream(producer))
    except KeyboardInterrupt:
        print("[Bitfinex] Stopped by user.")
    finally:
        producer.flush()
        producer.close()


if __name__ == "__main__":
    main()
