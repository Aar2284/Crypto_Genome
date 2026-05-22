"""
routers/history.py — Historical OHLCV data API endpoints.
Serves daily candlestick data from the coin_ohlcv table.
"""
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, and_
from typing import Optional
from datetime import date, timedelta
from database.session import AsyncSessionLocal
from models.ohlcv import CoinOHLCV

router = APIRouter()


@router.get("/{symbol}")
async def get_ohlcv_history(
    symbol: str,
    days: int = Query(365, description="Number of days of history to return (default: 365, max: 3650)"),
    from_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD (overrides 'days')"),
    to_date: Optional[str] = Query(None, description="End date YYYY-MM-DD (default: today)"),
):
    """
    Returns daily OHLCV candlestick data for a coin.
    
    Examples:
    - GET /api/v1/history/BTC?days=90       → last 90 days
    - GET /api/v1/history/ETH?from_date=2023-01-01&to_date=2023-12-31
    """
    symbol = symbol.upper()
    days = min(days, 3650)  # Cap at 10 years

    # Resolve date range
    end_date = date.today()
    if to_date:
        try:
            end_date = date.fromisoformat(to_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid to_date format. Use YYYY-MM-DD")

    if from_date:
        try:
            start_date = date.fromisoformat(from_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid from_date format. Use YYYY-MM-DD")
    else:
        start_date = end_date - timedelta(days=days)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(CoinOHLCV)
            .where(
                and_(
                    CoinOHLCV.symbol == symbol,
                    CoinOHLCV.date >= start_date,
                    CoinOHLCV.date <= end_date,
                )
            )
            .order_by(CoinOHLCV.date.asc())
        )
        rows = result.scalars().all()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No OHLCV data found for {} between {} and {}".format(symbol, start_date, end_date),
        )

    return {
        "symbol": symbol,
        "from_date": start_date.isoformat(),
        "to_date": end_date.isoformat(),
        "count": len(rows),
        "data": [
            {
                "date": r.date.isoformat(),
                "open": r.open,
                "high": r.high,
                "low": r.low,
                "close": r.close,
                "volume_coin": r.volume_coin,
                "volume_usd": r.volume_usd,
            }
            for r in rows
        ],
    }


@router.get("/{symbol}/summary")
async def get_ohlcv_summary(symbol: str):
    """
    Returns summary stats for a coin's OHLCV history:
    total rows, date range available, latest close price.
    """
    symbol = symbol.upper()
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(CoinOHLCV)
            .where(CoinOHLCV.symbol == symbol)
            .order_by(CoinOHLCV.date.desc())
            .limit(1)
        )
        latest = result.scalars().first()

        count_result = await session.execute(
            select(CoinOHLCV.date)
            .where(CoinOHLCV.symbol == symbol)
            .order_by(CoinOHLCV.date.asc())
            .limit(1)
        )
        earliest = count_result.scalars().first()

        total_result = await session.execute(
            select(CoinOHLCV.id).where(CoinOHLCV.symbol == symbol)
        )
        total = len(total_result.scalars().all())

    if not latest:
        raise HTTPException(status_code=404, detail="No OHLCV history found for: " + symbol)

    return {
        "symbol": symbol,
        "total_rows": total,
        "earliest_date": earliest.isoformat() if earliest else None,
        "latest_date": latest.date.isoformat() if latest else None,
        "latest_close": latest.close if latest else None,
    }
