from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.system import SystemMetric

async def get_latest_metrics(db: AsyncSession):
    """
    Fetches the most recent system metrics payload.
    """
    query = select(SystemMetric).order_by(SystemMetric.recorded_at.desc()).limit(1)
    result = await db.execute(query)
    metric = result.scalars().first()
    
    # Return healthy fallback if db is empty on initial boot
    if not metric:
        return {
            "active_streams": 0,
            "events_per_second": 0,
            "system_health": "healthy",
            "total_latency_ms": 0,
            "last_error": None
        }
    return metric
