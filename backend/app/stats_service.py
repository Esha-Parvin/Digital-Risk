import asyncio
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from collections import deque

from app.models import User, Transaction, AuditLog

# In-memory storage for transaction processing times (last 1000)
processing_times = deque(maxlen=1000)

class StatsService:
    @staticmethod
    async def get_system_stats(db: AsyncSession) -> dict:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Fire all 5 scalar DB queries concurrently to avoid N+1 and sequential waiting
        total_users, total_txns, dupes, high_risk, today_txns = await asyncio.gather(
            db.scalar(select(func.count(User.id))),
            db.scalar(select(func.count(Transaction.id))),
            db.scalar(select(func.count(AuditLog.id)).where(AuditLog.action_type == "Duplicate Transaction Blocked")),
            db.scalar(select(func.count(User.id)).where(User.risk_score >= 60)),
            db.scalar(select(func.count(Transaction.id)).where(Transaction.timestamp >= today_start))
        )
        
        avg_time = sum(processing_times) / len(processing_times) if processing_times else 0.0

        return {
            "total_users": total_users or 0,
            "total_transactions": total_txns or 0,
            "duplicates_blocked": dupes or 0,
            "high_risk_users": high_risk or 0,
            "transactions_today": today_txns or 0,
            "average_processing_time_ms": round(avg_time, 2)
        }
