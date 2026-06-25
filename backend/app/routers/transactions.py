from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import TransactionCreate, TransactionResponse
from app.services import process_transaction
from app.config import settings
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/transaction", response_model=TransactionResponse)
@limiter.limit(settings.RATE_LIMIT_TRANSACTION)
async def create_transaction(
    request: Request,
    trans_in: TransactionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Process a transaction. Handles concurrency and idempotency safely.
    """
    # Note: Rate limiting is applied in main.py via slowapi
    transaction = await process_transaction(db, trans_in)
    return transaction
