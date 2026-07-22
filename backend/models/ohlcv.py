"""
models/ohlcv.py — Daily OHLCV (Open/High/Low/Close/Volume) historical data.
One row per coin per date — enforced via UniqueConstraint.
Loaded once from standardized_datasets CSVs via load_datasets.py.
"""
from sqlalchemy import Column, String, Float, Date, Integer, UniqueConstraint, Index
from database.session import Base


class CoinOHLCV(Base):
    __tablename__ = "coin_ohlcv"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String, nullable=False, index=True)
    date = Column(Date, nullable=False)

    open = Column(Float, nullable=True)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    close = Column(Float, nullable=True)
    volume_coin = Column(Float, nullable=True)   # Volume in native coin units
    volume_usd = Column(Float, nullable=True)    # Volume in USD

    __table_args__ = (
        # Prevent duplicate rows for the same coin+date
        UniqueConstraint("symbol", "date", name="uq_ohlcv_symbol_date"),
        # Composite index for time-series range queries
        Index("ix_ohlcv_symbol_date", "symbol", "date"),
    )
