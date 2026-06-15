"""
models/genome.py — SQLAlchemy model for crypto genome metrics.
21 float columns covering 5 genome dimensions derived from historical analysis.
One row per coin — updated by the genome refresh pipeline (upsert).
cluster_id and cluster_label are populated by the GMM clustering step.
"""
from sqlalchemy import Column, String, Float, Integer, DateTime, UniqueConstraint
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

    # ── Cluster Identity (populated by GMM pipeline) ───────────────────────────
    cluster_id = Column(Integer, nullable=True)
    cluster_label = Column(String, nullable=True)

    loaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
