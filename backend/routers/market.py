from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database.session import get_db
from schemas.market import AssetResponse, AssetHistoryResponse
from schemas.common import ErrorResponse
from services import crypto_service

router = APIRouter()

@router.get(
    "/assets", 
    response_model=List[AssetResponse],
    responses={500: {"model": ErrorResponse}}
)
async def get_market_assets(
    sort_by: str = Query(None, description="Column to sort by (e.g. market_cap)"),
    order: str = Query("desc", description="Sort direction (asc or desc)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches all active assets. The router remains thin, delegating DB logic to the service layer.
    """
    try:
        assets = await crypto_service.get_all_assets(db, sort_by=sort_by, order=order)
        return assets
    except Exception as e:
        raise Exception("Database aggregation failed") from e

@router.get(
    "/assets/{symbol}/history", 
    response_model=List[AssetHistoryResponse],
    responses={500: {"model": ErrorResponse}}
)
async def get_asset_history(
    symbol: str,
    interval: str = Query("1h", description="Time interval (1h, 1d)"),
    limit: int = Query(24, description="Number of historical points"),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches historical chart data for an asset.
    """
    try:
        history = await crypto_service.get_asset_history(db, symbol=symbol, limit=limit)
        return history
    except Exception as e:
        raise Exception("Failed to fetch historical data") from e
