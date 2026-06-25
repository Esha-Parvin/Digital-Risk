from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routers import transactions, users, risk, audit, stats
from app.database import engine, Base, AsyncSessionLocal
from app.audit_service import AuditService
from app.stats_service import processing_times
from fastapi.responses import JSONResponse
import json
import asyncio
import time

# Initialize limiter
limiter = Limiter(key_func=get_remote_address)

async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    # Attempt to extract user_id from the JSON body to log the rate limit event
    user_id = None
    try:
        body = await request.body()
        if body:
            data = json.loads(body)
            user_id = data.get("user_id")
    except Exception:
        pass
    
    if user_id:
        async with AsyncSessionLocal() as db:
            await AuditService.log_action(db, user_id, "Rate Limit Exceeded", f"Rate limit exceeded: {exc.detail}")
            await db.commit()
            
    return JSONResponse(
        {"detail": f"Rate limit exceeded: {exc.detail}"}, status_code=429
    )

app = FastAPI(title="Internship Task API", version="1.0.0")

@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    if request.url.path == "/transaction":
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        processing_times.append(elapsed_ms)
        return response
    return await call_next(request)

# Add state limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_handler)

# Setup CORS for local frontend testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router, tags=["Transactions"])
app.include_router(users.router, tags=["Users"])
app.include_router(risk.router, tags=["Risk Analysis"])
app.include_router(audit.router, tags=["Audit Trail"])
app.include_router(stats.router, tags=["System Analytics"])

@app.on_event("startup")
async def startup_event():
    # Drop and recreate all tables to sync schema changes.
    # In production, use alembic migrations instead.
    # This is acceptable here because this is a dev/assignment environment.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
def read_root():
    return {"message": "API is running. Go to /docs for Swagger UI"}
