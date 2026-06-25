from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.schemas import AuditLogResponse, ActivityFeedItem
from app.audit_service import AuditService

router = APIRouter()

@router.get("/audit-logs/{user_id}", response_model=List[AuditLogResponse])
async def get_audit_logs(user_id: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve the recent audit logs for a user.
    """
    logs = await AuditService.get_logs(db, user_id)
    return logs

@router.get("/activity-feed", response_model=List[ActivityFeedItem])
async def get_activity_feed(db: AsyncSession = Depends(get_db)):
    """
    Retrieve the system-wide live activity feed.
    """
    feed = await AuditService.get_system_activity(db)
    return feed
