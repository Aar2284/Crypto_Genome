from sqlalchemy import Column, String, Float, Integer, DateTime, Index
from sqlalchemy.sql import func
from database.session import Base
from datetime import datetime

class Asset(Base):
    __tablename__ = "assets"

    # Indexed for fast lookups during streaming and dashboard renders
    asset_id = Column(String, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    
    current_price = Column(Float, nullable=False)
    change_24h_pct = Column(Float, nullable=True) # Nullable for incomplete pipelines
    volume_24h = Column(Float, nullable=True)
    market_cap = Column(Float, nullable=True)
    
    last_updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)
    pipeline_status = Column(String, default="active", nullable=False)
    latency_ms = Column(Integer, default=0, nullable=False)

class AssetHistory(Base):
    __tablename__ = "asset_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    asset_id = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=func.now(), index=True, nullable=False)
    
    price = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)

    # Composite index for time-series querying efficiency
    __table_args__ = (
        Index("ix_asset_history_asset_id_timestamp", "asset_id", "timestamp"),
    )
