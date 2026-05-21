import asyncio
from database.session import engine, Base
# Import all models to ensure they are registered with Base
from models.market import Asset
from models.system import SystemMetric
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from database.session import AsyncSessionLocal

async def init_db():
    print("Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("Seeding initial data...")
    async with AsyncSessionLocal() as session:
        # Check if empty
        metric = SystemMetric(
            active_streams=5,
            events_per_second=150,
            system_health="healthy",
            total_latency_ms=42,
            last_error=None
        )
        session.add(metric)
        
        coins = [
            {"coin": "Bitcoin", "symbol": "BTC", "price": 60000.0, "volume": 12000000, "change24h": 1.5, "cap": 1100000000},
            {"coin": "Ethereum", "symbol": "ETH", "price": 3000.0, "volume": 5000000, "change24h": -0.5, "cap": 300000000},
            {"coin": "Solana", "symbol": "SOL", "price": 100.0, "volume": 1000000, "change24h": 5.0, "cap": 45000000},
        ]
        
        for idx, c in enumerate(coins):
            asset = Asset(
                asset_id=str(idx+1),
                name=c["coin"],
                symbol=c["symbol"],
                current_price=c["price"],
                volume_24h=c["volume"],
                change_24h_pct=c["change24h"],
                market_cap=c["cap"],
                last_updated_at=datetime.now(timezone.utc)
            )
            session.add(asset)
            
        await session.commit()
    print("Database initialized successfully.")

if __name__ == "__main__":
    asyncio.run(init_db())
