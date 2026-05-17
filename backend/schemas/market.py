from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

# Absolute backend/frontend contract source of truth for market data

class AssetBase(BaseModel):
    asset_id: str
    symbol: str
    name: str
    current_price: float
    change_24h_pct: Optional[float] = None
    volume_24h: Optional[float] = None
    market_cap: Optional[float] = None
    pipeline_status: str
    latency_ms: int

class AssetResponse(AssetBase):
    last_updated_at: datetime
    
    # Enables automatic mapping from SQLAlchemy models
    model_config = ConfigDict(from_attributes=True)

class AssetHistoryResponse(BaseModel):
    timestamp: datetime
    price: float
    volume: float

    model_config = ConfigDict(from_attributes=True)
