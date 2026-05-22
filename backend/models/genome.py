"""
models/genome.py — SQLAlchemy model for crypto genome metrics.
21 float columns covering 5 genome dimensions derived from historical analysis.
One row per coin, updated at most once (static analytical data).
"""
from sqlalchemy import Column, String, Float, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from database.session import Base


class CoinGenome(Base):
    __tablename__ = "coin_genome"

    symbol = Column(String, primary_key=True, index=True, nullable=False)

    # ── Dimension 1: Volatility Profile ───────────────────────────────────────
    volatility_baseline = Column(Float, nullable=True)
    volatility_skew = Column(Float, nullable=True)
    volatility_kurtosis = Column(Float, nullable=True)
    vol_of_vol = Column(Float, nullable=True)

    # ── Dimension 2: Market Correlation & Beta ────────────────────────────────
    market_beta = Column(Float, nullable=True)
    btc_correlation = Column(Float, nullable=True)
    r_squared = Column(Float, nullable=True)
    downside_coupling = Column(Float, nullable=True)

    # ── Dimension 3: Momentum & Trend ─────────────────────────────────────────
    trend_efficiency = Column(Float, nullable=True)
    autocorrelation = Column(Float, nullable=True)
    up_day_ratio = Column(Float, nullable=True)
    risk_adjusted_momentum = Column(Float, nullable=True)

    # ── Dimension 4: Drawdown & Recovery ──────────────────────────────────────
    max_drawdown = Column(Float, nullable=True)
    avg_drawdown_depth = Column(Float, nullable=True)
    avg_drawdown_duration = Column(Float, nullable=True)
    recovery_speed_ratio = Column(Float, nullable=True)

    # ── Dimension 5: Liquidity & Volume ───────────────────────────────────────
    log_avg_volume = Column(Float, nullable=True)
    volume_stability_cv = Column(Float, nullable=True)
    vol_return_correlation = Column(Float, nullable=True)
    crisis_liquidity_retention = Column(Float, nullable=True)

    # ── Not in the 20 above — extra composite metric ──────────────────────────
    # (Some CSVs may include additional metrics; captured here as bonus)

    loaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
