"""
kafka_producer_kucoin.py — Real-time KuCoin WebSocket producer.
KuCoin requires a public token (no auth) obtained via:
  POST https://api.kucoin.com/api/v1/bullet-public
This returns a WebSocket endpoint URL + token for subscription.
No API key required — bullet-public endpoint is free and public.

Usage: python kafka_producer_kucoin.py
"""
import json
import asyncio
import uuid
import aiohttp
import websockets
from kafka import KafkaProducer
from producer_config import KAFKA_BOOTSTRAP, KAFKA_TOPIC, KUCOIN_SYMBOLS

KUCOIN_REST_URL = "https://api.kucoin.com/api/v1/bullet-public"


def create_producer() -> KafkaProducer:
    return KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        acks=1,
        retries=5,
    )


async def get_ws_token() -> tuple[str, str]:
    """Fetch WS endpoint URL and token from KuCoin public bullet API."""
    async with aiohttp.ClientSession() as session:
        async with session.post(KUCOIN_REST_URL) as resp:
            data = await resp.json()
            token = data["data"]["token"]
            server = data["data"]["instanceServers"][0]
            endpoint = server["endpoint"]
            ping_interval = server.get("pingInterval", 18000)  # ms
            return endpoint, token, ping_interval


async def stream(producer: KafkaProducer) -> None:
    print("[KuCoin] Fetching WebSocket token...")
    endpoint, token, ping_interval_ms = await get_ws_token()
    ws_url = "{}?token={}&connectId={}".format(endpoint, token, uuid.uuid4().hex)

    # Build subscription topic string for all symbols
    symbols_str = ",".join(KUCOIN_SYMBOLS.keys())
    subscribe_msg = {
        "id": uuid.uuid4().hex,
        "type": "subscribe",
        "topic": "/market/ticker:{}".format(symbols_str),
        "privateChannel": False,
        "response": True,
    }

    print("[KuCoin] Connecting to: {}...".format(endpoint))
    print("[KuCoin] Tracking {} symbols".format(len(KUCOIN_SYMBOLS)))

    while True:
        try:
            async with websockets.connect(ws_url, ping_interval=None) as ws:
                # Wait for welcome message
                welcome = json.loads(await ws.recv())
                print("[KuCoin] Connected: {}".format(welcome.get("type")))

                # Subscribe to ticker channel
                await ws.send(json.dumps(subscribe_msg))

                # Start ping task to keep connection alive
                async def ping_loop():
                    while True:
                        await asyncio.sleep(ping_interval_ms / 1000)
                        await ws.send(json.dumps({"id": uuid.uuid4().hex, "type": "ping"}))

                ping_task = asyncio.create_task(ping_loop())

                try:
                    async for raw in ws:
                        data = json.loads(raw)

                        # Skip non-message frames (pong, ack, etc.)
                        if data.get("type") != "message":
                            continue

                        subject = data.get("subject")  # e.g. "AERGO-USDT"
                        ticker = data.get("data", {})

                        if subject not in KUCOIN_SYMBOLS:
                            continue

                        coin = KUCOIN_SYMBOLS[subject]
                        price = float(ticker.get("price", 0))
                        change_pct = float(ticker.get("changeRate", 0)) * 100  # KuCoin gives ratio

                        msg = {
                            "coin_symbol": coin,
                            "price": price,
                            "volume_24h": float(ticker.get("volValue", 0)),  # Quote volume (USD)
                            "change_24h_pct": round(change_pct, 4),
                            "source": "kucoin",
                        }

                        producer.send(KAFKA_TOPIC, value=msg)
                        print("[KuCoin] {}: ${:.4f}  ({:+.2f}%)".format(coin, price, change_pct))
                finally:
                    ping_task.cancel()

        except websockets.ConnectionClosed as e:
            print("[KuCoin] Connection closed ({}), re-fetching token...".format(e))
            await asyncio.sleep(3)
            # Re-fetch token on reconnect (tokens expire after ~24h)
            try:
                endpoint, token, ping_interval_ms = await get_ws_token()
                ws_url = "{}?token={}&connectId={}".format(endpoint, token, uuid.uuid4().hex)
            except Exception as te:
                print("[KuCoin] Failed to refresh token: {}".format(te))
                await asyncio.sleep(5)
        except Exception as e:
            print("[KuCoin] Error: {}".format(e))
            await asyncio.sleep(3)


def main() -> None:
    producer = create_producer()
    try:
        asyncio.run(stream(producer))
    except KeyboardInterrupt:
        print("[KuCoin] Stopped by user.")
    finally:
        producer.flush()
        producer.close()


if __name__ == "__main__":
    main()
