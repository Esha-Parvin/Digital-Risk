from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime

class TransactionCreate(BaseModel):
    user_id: str = Field(..., description="ID of the user making the transaction")
    amount: float = Field(..., gt=0, description="Amount must be greater than 0")
    idempotency_key: str = Field(..., description="Unique key for preventing duplicate transactions")

class TransactionResponse(BaseModel):
    id: str
    user_id: str
    amount: float
    timestamp: datetime
    message: str = "Transaction processed successfully"

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str

class UserSummaryResponse(BaseModel):
    id: str
    username: str
    total_amount: float
    transaction_count: int
    score: float
    risk_score: float = 0.0

    class Config:
        from_attributes = True

class RankingResponse(BaseModel):
    rank: int
    user_id: str
    username: str
    score: float
    movement: str = "same"   # "up", "down", or "same"
    change: int = 0          # Number of positions moved (always >= 0)

class RiskAnalysisResponse(BaseModel):
    user_id: str
    risk_score: float
    risk_level: str  # "Low", "Medium", "High"
    confidence: float
    recommendation: str
    reasons: List[str]

class AuditLogResponse(BaseModel):
    action_type: str
    description: str
    timestamp: datetime

    class Config:
        from_attributes = True

class SystemStatsResponse(BaseModel):
    total_users: int
    total_transactions: int
    duplicates_blocked: int
    high_risk_users: int
    transactions_today: int
    average_processing_time_ms: float

class ActivityFeedItem(BaseModel):
    type: str
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True

