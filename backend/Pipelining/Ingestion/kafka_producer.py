import json
import asyncio
import websockets
from kafka import KafkaProducer

def create_producer():
    return KafkaProducer(
        bootstrap_servers="localhost:9092",
        value_serializer=lambda v: json.dumps(v).encode("utf-8")
    )

async def stream_binance_data(producer, topic):
    # Binance all mini tickers stream
    url = "wss://stream.binance.com:9443/ws/!miniTicker@arr"
    
    print(f"Connecting to Binance WebSocket: {url}")
    
    # Target symbols we want to track
    target_symbols = {"BTCUSDT": "BTC", "ETHUSDT": "ETH", "SOLUSDT": "SOL"}
    
    async for websocket in websockets.connect(url):
        try:
            async for message in websocket:
                data = json.loads(message)
                # data is a list of ticker objects: [{'s': 'BTCUSDT', 'c': '60000', 'v': '1200', 'p': '100'}, ...]
                # 's' = symbol, 'c' = close/current price, 'v' = volume, 'p' = price change 24h
                
                for item in data:
                    symbol = item.get("s")
                    if symbol in target_symbols:
                        coin_symbol = target_symbols[symbol]
                        
                        # Format message for consumer
                        msg = {
                            "coin_symbol": coin_symbol,
                            "price": float(item.get("c", 0)),
                            "volume": float(item.get("v", 0)),
                            # 'p' is absolute change, we might want percentage but we can just send 'p' or calculate later.
                            # Actually, miniTicker has 'c' (close) and 'o' (open), let's just send basic info
                        }
                        
                        producer.send(topic, value=msg)
                        print(f"Sent: {coin_symbol} -> {msg['price']}")
        except websockets.ConnectionClosed:
            print("Connection closed, reconnecting...")
            await asyncio.sleep(1)
        except Exception as e:
            print(f"Error: {e}")
            await asyncio.sleep(1)

def main():
    topic = "crypto_genome"
    producer = create_producer()
    
    try:
        asyncio.run(stream_binance_data(producer, topic))
    except KeyboardInterrupt:
        print("Stopping producer...")
    finally:
        producer.flush()
        producer.close()

if __name__ == "__main__":
    main()