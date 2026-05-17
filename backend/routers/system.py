from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from schemas.system import SystemMetricsResponse
from schemas.common import ErrorResponse
from services import pipeline_service

router = APIRouter()

@router.get(
    "/metrics", 
    response_model=SystemMetricsResponse,
    responses={500: {"model": ErrorResponse}}
)
async def get_system_metrics(db: AsyncSession = Depends(get_db)):
    """
    Fetches the latest pipeline and system health metrics.
    """
    try:
        metrics = await pipeline_service.get_latest_metrics(db)
        return metrics
    except Exception as e:
        raise Exception("Failed to fetch system metrics") from e
