"""
routers/genome.py — Genome metrics API endpoints.
Exposes the 21-dimensional genome analysis per coin.
"""
from fastapi import APIRouter, HTTPException
from sqlalchemy import select, text
from typing import Optional
from database.session import AsyncSessionLocal
from models.genome import CoinGenome

router = APIRouter()


@router.get("")
async def get_all_genome():
    """
    Returns genome metrics for all coins that have been loaded.
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(CoinGenome).order_by(CoinGenome.symbol))
        rows = result.scalars().all()

    return [
        {
            "symbol": r.symbol,
            # Dimension 1: Volatility Profile
            "volatility_baseline": r.volatility_baseline,
            "volatility_skew": r.volatility_skew,
            "volatility_kurtosis": r.volatility_kurtosis,
            "vol_of_vol": r.vol_of_vol,
            # Dimension 2: Market Correlation
            "market_beta": r.market_beta,
            "btc_correlation": r.btc_correlation,
            "r_squared": r.r_squared,
            "downside_coupling": r.downside_coupling,
            # Dimension 3: Momentum & Trend
            "trend_efficiency": r.trend_efficiency,
            "autocorrelation": r.autocorrelation,
            "up_day_ratio": r.up_day_ratio,
            "risk_adjusted_momentum": r.risk_adjusted_momentum,
            # Dimension 4: Drawdown & Recovery
            "max_drawdown": r.max_drawdown,
            "avg_drawdown_depth": r.avg_drawdown_depth,
            "avg_drawdown_duration": r.avg_drawdown_duration,
            "recovery_speed_ratio": r.recovery_speed_ratio,
            # Dimension 5: Liquidity & Volume
            "log_avg_volume": r.log_avg_volume,
            "volume_stability_cv": r.volume_stability_cv,
            "vol_return_correlation": r.vol_return_correlation,
            "crisis_liquidity_retention": r.crisis_liquidity_retention,
            "loaded_at": r.loaded_at.isoformat() if r.loaded_at else None,
        }
        for r in rows
    ]


@router.get("/{symbol}")
async def get_genome_by_symbol(symbol: str):
    """
    Returns genome metrics for a single coin by symbol.
    """
    symbol = symbol.upper()
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(CoinGenome).where(CoinGenome.symbol == symbol)
        )
        row = result.scalars().first()

    if not row:
        raise HTTPException(status_code=404, detail="Genome data not found for symbol: " + symbol)

    return {
        "symbol": row.symbol,
        "volatility_baseline": row.volatility_baseline,
        "volatility_skew": row.volatility_skew,
        "volatility_kurtosis": row.volatility_kurtosis,
        "vol_of_vol": row.vol_of_vol,
        "market_beta": row.market_beta,
        "btc_correlation": row.btc_correlation,
        "r_squared": row.r_squared,
        "downside_coupling": row.downside_coupling,
        "trend_efficiency": row.trend_efficiency,
        "autocorrelation": row.autocorrelation,
        "up_day_ratio": row.up_day_ratio,
        "risk_adjusted_momentum": row.risk_adjusted_momentum,
        "max_drawdown": row.max_drawdown,
        "avg_drawdown_depth": row.avg_drawdown_depth,
        "avg_drawdown_duration": row.avg_drawdown_duration,
        "recovery_speed_ratio": row.recovery_speed_ratio,
        "log_avg_volume": row.log_avg_volume,
        "volume_stability_cv": row.volume_stability_cv,
        "vol_return_correlation": row.vol_return_correlation,
        "crisis_liquidity_retention": row.crisis_liquidity_retention,
        "loaded_at": row.loaded_at.isoformat() if row.loaded_at else None,
    }
