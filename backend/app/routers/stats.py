from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import SystemStatsResponse
from app.stats_service import StatsService

router = APIRouter()

@router.get("/system-stats", response_model=SystemStatsResponse)
async def get_system_stats(db: AsyncSession = Depends(get_db)):
    """
    Retrieves system-wide analytics via concurrent scalar queries.
    """
    stats = await StatsService.get_system_stats(db)
    return stats
