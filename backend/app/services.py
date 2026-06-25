from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models import User, Transaction, RankingSnapshot
from app.schemas import TransactionCreate
from app.config import settings
from app.risk_service import RiskAnalysisService
from app.audit_service import AuditService
from sqlalchemy import func


async def snapshot_current_rankings(db: AsyncSession) -> None:
    """
    Snapshot ALL users' current ranks into User.previous_rank AND persist a
    historical row in ranking_snapshots.

    Called once per transaction, BEFORE the score is updated, so that:
      • previous_rank reflects the "before" state for every user
      • the leaderboard endpoint can diff current vs. previous_rank
    """
    result = await db.execute(select(User).order_by(User.score.desc()))
    all_users = result.scalars().all()

    for idx, user in enumerate(all_users):
        current_rank = idx + 1
        user.previous_rank = current_rank

        # Persist to the historical snapshot table for audit / analytics
        snapshot = RankingSnapshot(
            user_id=user.id,
            rank=current_rank,
            score_at_snapshot=user.score,
        )
        db.add(snapshot)


async def process_transaction(db: AsyncSession, trans_in: TransactionCreate) -> Transaction:
    # 1. Check if user exists, if not, create one on the fly for simplicity of testing
    user_result = await db.execute(select(User).where(User.id == trans_in.user_id))
    user = user_result.scalars().first()
    
    if not user:
        # Create dummy user if doesn't exist
        user = User(id=trans_in.user_id, username=f"User_{trans_in.user_id[:8]}")
        db.add(user)
        await db.flush() # flush to get user in db scope for foreign key
        
    # 2. Check Idempotency (prevent duplicate processing)
    # For robustness under high concurrency, we rely on the DB UNIQUE constraint on idempotency_key.
    
    new_trans = Transaction(
        user_id=trans_in.user_id,
        amount=trans_in.amount,
        idempotency_key=trans_in.idempotency_key
    )
    
    db.add(new_trans)
    is_duplicate = False
    
    try:
        await db.flush() # Attempt to insert transaction
    except IntegrityError as e:
        await db.rollback()

        # ── Risk Signal: duplicate attempt detected ──
        # Re-fetch user after rollback so we can update their risk score
        dup_user_result = await db.execute(select(User).where(User.id == trans_in.user_id))
        dup_user = dup_user_result.scalars().first()
        if dup_user:
            await AuditService.log_action(db, dup_user.id, "Duplicate Transaction Blocked", f"Blocked duplicate transaction for amount ${trans_in.amount:.2f}")
            await RiskAnalysisService.evaluate_transaction(
                db, dup_user, trans_in.amount, is_duplicate=True
            )
            await db.commit()

        # Fetch the existing transaction to return it
        existing = await db.execute(select(Transaction).where(Transaction.idempotency_key == trans_in.idempotency_key))
        existing_tx = existing.scalars().first()
        if existing_tx:
            return existing_tx
        raise HTTPException(status_code=400, detail="Transaction duplicate error")

    # ── 3. Snapshot current rankings BEFORE updating the score ──
    # This persists every user's rank into previous_rank so the
    # leaderboard can compute accurate movement for ALL users.
    await snapshot_current_rankings(db)

    # 4. Update User Summary & Ranking Logic
    # Using row-level locking (SELECT ... FOR UPDATE) for concurrency safety
    lock_result = await db.execute(select(User).where(User.id == user.id).with_for_update())
    locked_user = lock_result.scalars().first()

    locked_user.total_amount += trans_in.amount
    
    # Fair Ranking Logic: Only add points if amount is >= MIN_AMOUNT_FOR_POINTS
    if trans_in.amount >= settings.MIN_AMOUNT_FOR_POINTS:
        locked_user.transaction_count += 1
        
    # Score = total_amount + (valid_transaction_count * points_per_transaction)
    locked_user.score = locked_user.total_amount + (locked_user.transaction_count * settings.POINTS_PER_TRANSACTION)

    # Flush the score change so rank queries reflect the new value
    await db.flush()

    # ── 5. Detect rank changes for ALL affected users ──
    rank_after_result = await db.execute(select(User).order_by(User.score.desc()))
    all_users_after = rank_after_result.scalars().all()

    for idx, u in enumerate(all_users_after):
        new_rank = idx + 1
        old_rank = u.previous_rank
        if old_rank is not None and new_rank != old_rank:
            action_word = "improved" if new_rank < old_rank else "dropped"
            await AuditService.log_action(
                db, u.id, "Rank Changed",
                f"Rank {action_word} from #{old_rank} to #{new_rank}"
            )

    await AuditService.log_action(db, locked_user.id, "Transaction Created", f"Added transaction worth ${trans_in.amount:.2f}")

    # 6. ── Risk Analysis Engine ──
    # Evaluate all fraud signals for this transaction in the same DB transaction
    await RiskAnalysisService.evaluate_transaction(
        db, locked_user, trans_in.amount, is_duplicate=False
    )
    
    await db.commit()
    await db.refresh(new_trans)
    
    return new_trans

