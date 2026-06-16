"""
routers/genome.py — Genome metrics API endpoints.
Exposes the 21-dimensional genome analysis per coin.
Step 5: cluster_id and cluster_label included in all responses.
        New /clusters endpoint returns per-cluster aggregate summary.
"""
from fastapi import APIRouter, HTTPException
from sqlalchemy import select, func, text
from database.session import AsyncSessionLocal
from models.genome import CoinGenome

router = APIRouter()


# ---------------------------------------------------------------------------
# Helper — build the full genome dict for a single CoinGenome row
# ---------------------------------------------------------------------------

def _row_to_dict(r: CoinGenome) -> dict:
    return {
        "symbol": r.symbol,
        # Cluster identity
        "cluster_id": r.cluster_id,
        "cluster_label": r.cluster_label,
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


# ---------------------------------------------------------------------------
# GET /api/v1/genome — all coins
# ---------------------------------------------------------------------------

@router.get("")
async def get_all_genome():
    """
    Returns genome metrics for all coins, ordered by symbol.
    Includes cluster_id and cluster_label populated by the GMM pipeline.
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(CoinGenome).order_by(CoinGenome.symbol))
        rows = result.scalars().all()

    return [_row_to_dict(r) for r in rows]


# ---------------------------------------------------------------------------
# GET /api/v1/genome/clusters — per-cluster aggregate summary
# ---------------------------------------------------------------------------

@router.get("/clusters")
async def get_cluster_summary():
    """
    Returns a summary of each GMM cluster with:
      - cluster_id, cluster_label, coin count
      - Average values of the 5 key genome dimensions

    Only clusters with at least one assigned coin are returned.
    Coins with no cluster_id (pipeline not yet run) are excluded.
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(
                CoinGenome.cluster_id,
                CoinGenome.cluster_label,
                func.count(CoinGenome.symbol).label("count"),
                # Dimension averages
                func.avg(CoinGenome.volatility_baseline).label("avg_volatility_baseline"),
                func.avg(CoinGenome.market_beta).label("avg_market_beta"),
                func.avg(CoinGenome.btc_correlation).label("avg_btc_correlation"),
                func.avg(CoinGenome.trend_efficiency).label("avg_trend_efficiency"),
                func.avg(CoinGenome.max_drawdown).label("avg_max_drawdown"),
                func.avg(CoinGenome.log_avg_volume).label("avg_log_volume"),
                func.avg(CoinGenome.risk_adjusted_momentum).label("avg_risk_adjusted_momentum"),
            )
            .where(CoinGenome.cluster_id.isnot(None))
            .group_by(CoinGenome.cluster_id, CoinGenome.cluster_label)
            .order_by(CoinGenome.cluster_id)
        )
        rows = result.all()

    def _round(v):
        return round(v, 4) if v is not None else None

    return [
        {
            "cluster_id": r.cluster_id,
            "cluster_label": r.cluster_label,
            "count": r.count,
            "avg_volatility_baseline": _round(r.avg_volatility_baseline),
            "avg_market_beta": _round(r.avg_market_beta),
            "avg_btc_correlation": _round(r.avg_btc_correlation),
            "avg_trend_efficiency": _round(r.avg_trend_efficiency),
            "avg_max_drawdown": _round(r.avg_max_drawdown),
            "avg_log_volume": _round(r.avg_log_volume),
            "avg_risk_adjusted_momentum": _round(r.avg_risk_adjusted_momentum),
        }
        for r in rows
    ]


# ---------------------------------------------------------------------------
# GET /api/v1/genome/{symbol} — single coin
# ---------------------------------------------------------------------------

@router.get("/{symbol}")
async def get_genome_by_symbol(symbol: str):
    """
    Returns full genome metrics for a single coin by symbol.
    Includes cluster_id and cluster_label.
    """
    symbol = symbol.upper()
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(CoinGenome).where(CoinGenome.symbol == symbol)
        )
        row = result.scalars().first()

    if not row:
        raise HTTPException(status_code=404, detail=f"Genome data not found for symbol: {symbol}")

    return _row_to_dict(row)
