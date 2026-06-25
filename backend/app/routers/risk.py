from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import RiskAnalysisResponse
from app.risk_service import RiskAnalysisService

router = APIRouter()

@router.get("/risk-analysis/{user_id}", response_model=RiskAnalysisResponse)
async def get_risk_analysis(user_id: str, db: AsyncSession = Depends(get_db)):
    """
    Returns the real-time risk analysis for a user.

    The risk score is decayed automatically based on elapsed clean time
    before being returned, so the value is always fresh.
    """
    analysis = await RiskAnalysisService.get_analysis(db, user_id)
    
    if analysis is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return analysis
