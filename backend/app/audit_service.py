from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import AuditLog

class AuditService:
    @staticmethod
    async def log_action(db: AsyncSession, user_id: str, action_type: str, description: str):
        """
        Logs a user action to the audit trail.
        Does not commit the transaction, expects the caller to commit.
        """
        if not user_id:
            return
        log = AuditLog(
            user_id=user_id,
            action_type=action_type,
            description=description
        )
        db.add(log)

    @staticmethod
    async def get_logs(db: AsyncSession, user_id: str, limit: int = 50):
        """
        Retrieves the most recent audit logs for a user.
        """
        result = await db.execute(
            select(AuditLog)
            .where(AuditLog.user_id == user_id)
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def get_system_activity(db: AsyncSession, limit: int = 20):
        """
        Retrieves the most recent system-wide audit logs, mapped to the new feed format.
        """
        from app.models import User
        
        result = await db.execute(
            select(AuditLog, User)
            .join(User, AuditLog.user_id == User.id)
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
        )
        
        feed = []
        for log, user in result.all():
            type_mapping = {
                "Transaction Created": "transaction",
                "Duplicate Transaction Blocked": "duplicate_blocked",
                "Risk Score Updated": "risk_alert",
                "Rank Changed": "rank_change"
            }
            feed_type = type_mapping.get(log.action_type, "other")
            
            if feed_type == "transaction":
                msg = f"User {user.username} created a transaction"
            elif feed_type == "duplicate_blocked":
                msg = f"Duplicate blocked for user {user.username}"
            elif feed_type == "risk_alert":
                msg = f"Risk alert triggered for user {user.username}"
            elif feed_type == "rank_change":
                msg = f"User {user.username} rank changed"
            else:
                msg = f"{log.action_type} - {user.username}"
                
            feed.append({
                "type": feed_type,
                "message": msg,
                "timestamp": log.timestamp
            })
            
        return feed
