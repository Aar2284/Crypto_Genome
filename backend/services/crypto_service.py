from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.market import Asset, AssetHistory

async def get_all_assets(db: AsyncSession, sort_by: str = None, order: str = "desc"):
    """
    Fetches all active assets from the database.
    Aggregation logic and complex sorting occurs here, keeping the router thin.
    """
    query = select(Asset)
    
    if sort_by and hasattr(Asset, sort_by):
        column = getattr(Asset, sort_by)
        query = query.order_by(column.desc() if order == "desc" else column.asc())
        
    result = await db.execute(query)
    return result.scalars().all()

async def get_asset_history(db: AsyncSession, symbol: str, limit: int = 24):
    """
    Fetches historical data for a specific asset symbol.
    Prevents N+1 queries by leveraging targeted joins and bounded limits.
    """
    query = (
        select(AssetHistory)
        .join(Asset, AssetHistory.asset_id == Asset.asset_id)
        .where(Asset.symbol == symbol.upper())
        .order_by(AssetHistory.timestamp.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    # Reverse to return chronologically ascending data for the chart system
    return list(reversed(result.scalars().all()))
