from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    total_amount = Column(Float, default=0.0)
    transaction_count = Column(Integer, default=0)
    score = Column(Float, default=0.0, index=True) # Indexed for ranking
    previous_rank = Column(Integer, nullable=True, default=None) # Last known rank before most recent change
    risk_score = Column(Float, default=0.0) # 0 = safest, 100 = highest risk
    duplicate_attempts = Column(Integer, default=0) # Track duplicate request attempts
    last_risk_decay = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    transactions = relationship("Transaction", back_populates="user")
    risk_events = relationship("RiskEvent", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    ranking_snapshots = relationship("RankingSnapshot", back_populates="user")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    idempotency_key = Column(String, unique=True, index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="transactions")


class RiskEvent(Base):
    """
    Tracks individual risk-contributing events for audit trail and analysis.
    Each row is a single reason why the risk score was increased.
    """
    __tablename__ = "risk_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    event_type = Column(String, nullable=False) # e.g. "high_frequency", "duplicate_attempt", "micro_transaction", "repeated_amount"
    points_added = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="risk_events")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    action_type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="audit_logs")


class RankingSnapshot(Base):
    """
    Stores historical ranking snapshots for tracking rank movement over time.
    A new row is inserted for each user whenever a transaction triggers a rank recalculation.
    """
    __tablename__ = "ranking_snapshots"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    rank = Column(Integer, nullable=False)
    score_at_snapshot = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="ranking_snapshots")
