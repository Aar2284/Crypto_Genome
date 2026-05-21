from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from database.session import AsyncSessionLocal
from models.market import Asset
from sqlalchemy import func, select
import asyncio, json
from datetime import datetime

router = APIRouter()

@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # We must use AsyncSession in the loop
            async with AsyncSessionLocal() as db:
                try:
                    # Get latest row per coin
                    # Since SQLite doesn't support complex async joins nicely sometimes,
                    # let's just fetch everything and group in Python or use a simpler query.
                    # This is just mock data streaming.
                    result = await db.execute(select(Asset).order_by(Asset.symbol))
                    all_rows = result.scalars().all()
                    
                    latest_by_symbol = {}
                    for r in all_rows:
                        if r.symbol not in latest_by_symbol:
                            latest_by_symbol[r.symbol] = r
                            
                    payload = [
                        { "coin": r.name, "symbol": r.symbol,
                          "price": r.current_price, "change24h": r.change_24h_pct,
                          "volume": r.volume_24h,
                          "timestamp": r.last_updated_at.isoformat() if r.last_updated_at else None }
                        for r in latest_by_symbol.values()
                    ]
                    
                    # Ensure some payload always goes out even if DB empty
                    if not payload:
                        payload = [
                            { "coin": "Bitcoin", "symbol": "BTC", "price": 50000, "change24h": 2.5, "volume": 1000000, "timestamp": datetime.utcnow().isoformat() }
                        ]
                        
                    await websocket.send_json({
                        "type": "price_update",
                        "data": payload,
                        "server_time": datetime.utcnow().isoformat(),
                    })
                except Exception as e:
                    print(f"WS DB Error: {e}")
            await asyncio.sleep(5)  # push every 5 seconds
    except WebSocketDisconnect:
        pass  # client disconnected gracefully
