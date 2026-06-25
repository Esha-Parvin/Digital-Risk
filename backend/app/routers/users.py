from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database import get_db
from app.schemas import UserSummaryResponse, RankingResponse
from app.models import User

router = APIRouter()

@router.get("/summary/{user_id}", response_model=UserSummaryResponse)
async def get_user_summary(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user

@router.get("/ranking", response_model=List[RankingResponse])
async def get_ranking(limit: int = 10, db: AsyncSession = Depends(get_db)):
    # Get top users ordered by score descending
    result = await db.execute(select(User).order_by(User.score.desc()).limit(limit))
    users = result.scalars().all()
    
    ranking = []
    for idx, user in enumerate(users):
        current_rank = idx + 1
        prev = user.previous_rank

        # Determine movement direction and magnitude
        if prev is None:
            # Brand-new user with no history yet
            movement = "same"
            change = 0
        elif current_rank < prev:
            movement = "up"
            change = prev - current_rank
        elif current_rank > prev:
            movement = "down"
            change = current_rank - prev
        else:
            movement = "same"
            change = 0

        ranking.append({
            "rank": current_rank,
            "user_id": user.id,
            "username": user.username,
            "score": user.score,
            "movement": movement,
            "change": change,
        })
        
    return ranking
